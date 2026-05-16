"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "@/src/services/socket.service";
import { useRealtimeChat } from "@/src/hooks/useRealtimeChat";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Phone, PhoneOff, Video, Loader2, LogOut } from "lucide-react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import useRingtone from "@/src/hooks/useRingTone";
import { getAvatarUrl } from "@/src/utils/image-utils";

// ============= CALL STATE MACHINE =============
type CallState =
  | "idle"         // No call in progress
  | "ringing_out"  // We are calling someone, waiting for answer
  | "ringing_in"   // Someone is calling us
  | "connecting"   // Call accepted, waiting for LiveKit token
  | "in_call"      // Active call with LiveKit
  | "ended";       // Call just ended, show summary briefly

interface CallData {
  roomName: string;
  chatId: string;
  callerName: string;
  callerId: string;
  callerAvatar?: string;
  isVideo: boolean;
  callType: "private" | "group";
  // LiveKit info (received after accept)
  token?: string;
  serverUrl?: string;
}

export function GlobalCallSystem() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callData, setCallData] = useState<CallData | null>(null);
  const [endReason, setEndReason] = useState<string>("");
  const callStateRef = useRef<CallState>("idle");

  const user = useSelector((state: any) => state.auth?.user);
  const { isConnected } = useRealtimeChat();
  const { playRingtone, stopRingtone } = useRingtone('/musics/ring.mp3');
  const { playRingtone: playStopSound } = useRingtone('/musics/stop.mp3', false);
  const outgoingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // ── Handle Ringtone & Stop Sound ──
  useEffect(() => {
    if (callState === "ringing_in" || callState === "ringing_out") {
      playRingtone();
    } else if (callState === "ended") {
      stopRingtone();
      playStopSound();
    } else {
      stopRingtone();
    }
  }, [callState, playRingtone, stopRingtone, playStopSound]);

  useEffect(() => {
    if (callState === "ended") {
      const timer = setTimeout(() => {
        setCallState("idle");
        setCallData(null);
        setEndReason("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // ── Listen for outgoing call trigger (from ModernChatArea buttons) ──
  useEffect(() => {
    const handleOutgoingCall = (e: Event) => {
      const { chatId, isVideo, chatName, chatAvatar, targetUserId, callType } = (e as CustomEvent).detail;

      if (callStateRef.current !== "idle") {
        toast.error("Bạn đang trong cuộc gọi khác.");
        return;
      }

      const socket = socketService.getSocket();
      if (!socket || !user) return;

      // Emit call:request to server
      socket.emit("call:request", {
        chatId,
        targetUserId,
        isVideo,
        callType: callType || "private",
        callerAvatar: user?.avatar, // Send our avatar to the other side
      });

      setCallData({
        roomName: "", // Will be set when server responds with call:ringing
        chatId,
        callerName: chatName || "Cuộc gọi",
        callerAvatar: chatAvatar,
        callerId: user.id,
        isVideo,
        callType: callType || "private",
      });
      setCallState("ringing_out");

      // Set a 30s timeout for outgoing calls (Ringing Timeout)
      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === "ringing_out") {
          console.log("[Call] Outgoing call timed out after 30s.");
          socket.emit("call:cancel", { roomName: "" }); // roomName might not be set yet if server was slow
          setEndReason("no_answer");
          setCallState("ended");
          toast.info("Không có phản hồi sau 30 giây.");
        }
      }, 30000);
    };

    window.addEventListener("open-call-modal", handleOutgoingCall);
    return () => window.removeEventListener("open-call-modal", handleOutgoingCall);
  }, [user]);

  // ── Listen for rejoin trigger (from "Tham gia lại" button) ──
  useEffect(() => {
    const handleRejoin = (e: Event) => {
      const data = (e as CustomEvent).detail;
      
      if (callStateRef.current !== "idle") {
        toast.error("Bạn đang trong cuộc gọi khác.");
        return;
      }

      setCallData({
        roomName: data.roomName,
        chatId: data.chatId,
        callerId: data.callerId || "",
        callerName: data.callerName || "Cuộc gọi",
        callerAvatar: data.chatAvatar || data.avatar,
        isVideo: data.isVideo,
        callType: "group",
      });
      // Move to ringing_in state to show the "Accept/Join" dialog
      setCallState("ringing_in");
    };

    window.addEventListener("call:rejoin", handleRejoin);
    return () => window.removeEventListener("call:rejoin", handleRejoin);
  }, []);

  // ── Auto-sync active call state on connect ──
  // This handles the "Golden 30s" window when User B comes back online
  useEffect(() => {
    if (isConnected && user?.id) {
      console.log("[Call] ⚡ Connection established. Performing immediate active call sync...");
      socketService.checkActiveCall();
    }
  }, [isConnected, user?.id]);

  useEffect(() => {
    // Server confirms our call is ringing at the other end
    const onRinging = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (callStateRef.current === "ringing_out") {
        setCallData((prev) => prev ? { ...prev, roomName: data.roomName } : prev);
      }
    };

    // Someone is calling US
    const onIncomingCall = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log("[Call] 🔔 Incoming call signal RECEIVED at:", new Date().toLocaleTimeString(), data);
      
      // Robust ID check
      if (String(data.callerId) === String(user.id)) {
        console.log("[Call] Ignoring incoming call from ourselves.");
        return; 
      }

      if (callStateRef.current !== "idle") {
        console.log("[Call] 🚫 Busy, auto-declining. Current state:", callStateRef.current);
        const socket = socketService.getSocket();
        if (socket) socket.emit("call:declined", { roomName: data.roomName });
        return;
      }

      // Vibrate if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      console.log("[Call] 📱 Updating state to ringing_in...");
      // Set data and state in one go (React batching)
      setCallData({
        roomName: data.roomName,
        chatId: data.chatId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        isVideo: data.isVideo,
        callType: data.callType || "private",
      });
      setCallState("ringing_in");
    };

    // Server sends LiveKit tokens after accept (for both caller and callee)
    const onStartInfo = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log("[Call] Received call:start_info, connecting to LiveKit...");
      setCallData((prev) => prev ? {
        ...prev,
        token: data.token,
        serverUrl: data.serverUrl,
        roomName: data.roomName,
        isVideo: data.isVideo,
      } : prev);
      setCallState("in_call");
      // Clear timeout when connected
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
    };

    // Callee declined our call
    const onDeclined = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (callStateRef.current === "ringing_out") {
        toast.info(`${data.declinedByName} đã từ chối cuộc gọi.`);
        setEndReason("declined");
        setCallState("ended");
        if (outgoingTimeoutRef.current) {
          clearTimeout(outgoingTimeoutRef.current);
          outgoingTimeoutRef.current = null;
        }
      }
    };

    // Call ended (by other party, timeout, disconnect, cancel)
    const onEnded = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const reason = data.reason || "ended";
      const currentState = callStateRef.current;

      if (currentState === "idle") return;

      // GHOST RINGING: If we are still ringing out, ignore "offline" or "no_answer" from server.
      if (currentState === "ringing_out" && (reason === "offline" || reason === "no_answer" || reason === "missed")) {
        console.log(`[Call] Ignoring server ${reason} signal to maintain Ghost Ringing.`);
        return;
      }

      let message = "";
      switch (reason) {
        case "no_answer": message = "Không có ai trả lời."; break;
        case "missed": message = "Cuộc gọi nhỡ."; break;
        case "cancelled": message = "Cuộc gọi đã bị hủy."; break;
        case "disconnected": message = `${data.endedByName || "Người gọi"} đã mất kết nối.`; break;
        case "room_empty": message = "Phòng gọi đã trống."; break;
        case "ended_by_initiator": message = `${data.endedByName || "Trưởng cuộc gọi"} đã kết thúc cuộc gọi cho tất cả mọi người.`; break;
        default:
          if (data.duration) {
            const mins = Math.floor(data.duration / 60);
            const secs = data.duration % 60;
            message = `Cuộc gọi kết thúc. Thời lượng: ${mins}:${secs.toString().padStart(2, "0")}`;
          } else {
            message = "Cuộc gọi đã kết thúc.";
          }
      }

      toast.info(message);
      setEndReason(reason);
      setCallState("ended");
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
    };

    // Group call: someone left
    const onParticipantLeft = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (data.participantId === user.id) return;
      toast.info(`${data.participantName} đã rời cuộc gọi.`);
    };

    // Group call: someone joined
    const onParticipantJoined = (e: Event) => {
      const data = (e as CustomEvent).detail;
      toast.info(`${data.participantName} đã tham gia cuộc gọi.`);
    };

    // Error from server (offline, busy, etc)
    const onError = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log(`[Call] Received error:`, data);
      
      const isOfflineError = ["offline", "user_not_found", "recipient_offline", "not_online"].includes(data.reason);
      if (isOfflineError || (data.message && data.message.includes("trực tuyến"))) {
        console.log(`[Call] Suppressing offline error to maintain Ghost Ringing.`);
        return; 
      }

      toast.error(data.message || "Lỗi cuộc gọi");
      if (callStateRef.current !== "idle") {
        setCallState("ended");
        if (outgoingTimeoutRef.current) {
          clearTimeout(outgoingTimeoutRef.current);
          outgoingTimeoutRef.current = null;
        }
      }
    };

    // Busy signal
    const onBusy = (e: Event) => {
      const data = (e as CustomEvent).detail;
      toast.warning(data.message);
      setCallState("ended");
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
    };

    // Server sends active call data for synchronization
    const onActiveSync = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log("[Call] ⚡ Active call state SYNC received at:", new Date().toLocaleTimeString(), data);
      
      if (!data || !data.roomName) {
        console.log("[Call] Sync received but no active session found.");
        return;
      }

      if (callStateRef.current !== "idle") {
        console.log("[Call] Sync ignored because client is already busy.");
        return;
      }

      // Vibrate if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      console.log("[Call] 📱 Restoring incoming call from sync data...");
      setCallData({
        roomName: data.roomName,
        chatId: data.chatId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        isVideo: data.isVideo,
        callType: data.callType || "private",
      });
      setCallState("ringing_in");
    };

    window.addEventListener("call:ringing", onRinging);
    window.addEventListener("call:incoming", onIncomingCall);
    window.addEventListener("call:active_sync", onActiveSync);
    window.addEventListener("call:start_info", onStartInfo);
    window.addEventListener("call:declined", onDeclined);
    window.addEventListener("call:ended", onEnded);
    window.addEventListener("call:participant_left", onParticipantLeft);
    window.addEventListener("call:participant_joined", onParticipantJoined);
    window.addEventListener("call:error", onError);
    window.addEventListener("call:busy", onBusy);

    return () => {
      console.log("[Call] Cleaning up global event listeners...");
      window.removeEventListener("call:ringing", onRinging);
      window.removeEventListener("call:incoming", onIncomingCall);
      window.removeEventListener("call:active_sync", onActiveSync);
      window.removeEventListener("call:start_info", onStartInfo);
      window.removeEventListener("call:declined", onDeclined);
      window.removeEventListener("call:ended", onEnded);
      window.removeEventListener("call:participant_left", onParticipantLeft);
      window.removeEventListener("call:participant_joined", onParticipantJoined);
      window.removeEventListener("call:error", onError);
      window.removeEventListener("call:busy", onBusy);
    };
  }, [user?.id]);

  // ── Actions ──

  const acceptCall = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !callData) return;

    socket.emit("call:accepted", { roomName: callData.roomName });
    setCallState("connecting");
  }, [callData]);

  const declineCall = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !callData) return;

    socket.emit("call:declined", { roomName: callData.roomName });
    setCallState("idle");
    setCallData(null);
  }, [callData]);

  const cancelCall = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !callData) return;

    // Even if roomName is empty, we emit cancel with chatId so server can identify if needed,
    // and reset local state immediately.
    socket.emit("call:cancel", { roomName: callData.roomName, chatId: callData.chatId });
    setCallState("idle");
    setCallData(null);
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
  }, [callData]);

  /**
   * End/Leave call:
   * - Private: emits call:ended → server terminates the entire call for both
   * - Group: emits call:ended → server removes this user from room, room stays alive
   */
  const endCall = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !callData) return;

    socket.emit("call:ended", { roomName: callData.roomName });

    // For private calls: we get call:ended back from server → state machine handles it
    // For group calls: we just leave, so reset locally immediately
    if (callData.callType === "group") {
      toast.info("Bạn đã rời cuộc gọi nhóm.");
      setCallState("idle");
      setCallData(null);
    } else {
      setEndReason("ended");
      setCallState("ended");
    }
  }, [callData]);

  const endCallForAll = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !callData) return;

    if (window.confirm("Bạn có chắc chắn muốn kết thúc cuộc gọi này cho tất cả mọi người không?")) {
      socket.emit("call:ended", { roomName: callData.roomName, forceAll: true });
      toast.info("Bạn đã kết thúc cuộc gọi cho tất cả mọi người.");
      setCallState("idle");
      setCallData(null);
    }
  }, [callData]);

  // ============= RENDER COMPONENTS =============

  const CallAvatar = ({ src, name, size = "lg", pulse = false }: { src?: string; name: string; size?: "lg" | "xl"; pulse?: boolean }) => {
    const sizeClasses = size === "xl" ? "w-28 h-28" : "w-24 h-24";
    const avatarUrl = getAvatarUrl(src, name);
    
    return (
      <div className={`relative ${sizeClasses}`}>
        {pulse && (
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
        )}
        <div className="relative w-full h-full rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center">
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>
    );
  };

  // ============= MAIN RENDER =============

  // ── State: IDLE ──
  if (callState === "idle" || !callData) return null;

  // ── State: RINGING IN (someone calling us) ──
  if (callState === "ringing_in") {
    console.log("[Call] 🖼️ Rendering Incoming Call Modal...");
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl text-white border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 overflow-hidden z-[9999]">
          <div className="flex flex-col items-center pt-12 pb-10 px-8 gap-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 animate-pulse" />
            
            <CallAvatar src={callData.callerAvatar} name={callData.callerName} size="xl" pulse />

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">{callData.callerName}</h3>
              <p className="text-blue-400 font-medium flex items-center justify-center gap-2">
                {callData.isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                {callData.callType === "group" ? "Cuộc gọi nhóm" : "Cuộc gọi đến"}
              </p>
            </div>

            <div className="flex w-full gap-4 mt-4">
              <button
                onClick={declineCall}
                className="flex-1 h-14 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneOff className="h-5 w-5" /> Từ chối
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
              >
                <Phone className="h-5 w-5" /> {callData.callType === "group" ? "Tham gia" : "Trả lời"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── State: RINGING OUT (we are calling, waiting for answer) ──
  if (callState === "ringing_out") {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-sm bg-slate-900/95 backdrop-blur-xl text-white border-white/10 shadow-2xl p-0 overflow-hidden">
          <div className="flex flex-col items-center pt-12 pb-10 gap-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse" />
            
            <CallAvatar src={callData.callerAvatar} name={callData.callerName} size="xl" pulse />

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold">{callData.callerName}</h3>
              <p className="text-slate-400 text-sm animate-pulse">Đang đổ chuông...</p>
            </div>

            <button
              onClick={cancelCall}
              className="mt-4 w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:rotate-90 shadow-xl shadow-red-500/20"
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </button>
            <p className="text-xs text-slate-500 font-medium tracking-wide">NHẤN ĐỂ HỦY</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── State: CONNECTING (accepted, waiting for token) ──
  if (callState === "connecting") {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-sm bg-slate-900/90 backdrop-blur-md text-white border-white/10">
          <div className="flex flex-col items-center py-12 gap-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">Đang kết nối</p>
              <p className="text-sm text-slate-400">Vui lòng chờ trong giây lát...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── State: IN CALL (LiveKit active) ──
  if (callState === "in_call" && callData.token && callData.serverUrl) {
    return (
      <Dialog open onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="max-w-[98vw] w-full h-[96vh] p-0 overflow-hidden bg-slate-950 border-none flex flex-col rounded-3xl shadow-2xl">
          {/* Header overlay for Group Call actions */}
          <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
             <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-tight uppercase">Live</span>
             </div>
          </div>

          {callData.callType === "group" && (
            <div className="absolute top-4 right-14 z-50 flex items-center gap-2">
              {/* Only the initiator can see "End for all" */}
              {callData.callerId === user?.id && (
                <button
                  onClick={endCallForAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95"
                >
                  <PhoneOff className="h-4 w-4" /> Kết thúc cho tất cả
                </button>
              )}
              
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-sm font-bold rounded-xl transition-all border border-white/10 active:scale-95"
              >
                <LogOut className="h-4 w-4" /> Rời đi
              </button>
            </div>
          )}
          
          <div className="flex-1 relative">
            <LiveKitRoom
              video={callData.isVideo}
              audio={true}
              token={callData.token}
              serverUrl={callData.serverUrl}
              data-lk-theme="default"
              style={{ height: "100%", flex: 1 }}
              onDisconnected={endCall}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── State: ENDED (brief display) ──
  if (callState === "ended") {
    return null; // Toast already shown, cleanup via timeout
  }

  return null;
}
