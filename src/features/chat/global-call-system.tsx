"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "@/src/services/socket.service";
import { useRealtimeChat } from "@/src/hooks/useRealtimeChat";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Phone, PhoneOff, Video, Loader2, LogOut, X } from "lucide-react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
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

      socket.emit("call:request", {
        chatId,
        targetUserId,
        isVideo,
        callType: callType || "private",
        callerAvatar: user?.avatar,
      });

      setCallData({
        roomName: "",
        chatId,
        callerName: chatName || "Cuộc gọi",
        callerAvatar: chatAvatar,
        callerId: user.id,
        isVideo,
        callType: callType || "private",
      });
      setCallState("ringing_out");

      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === "ringing_out") {
          console.log("[Call] Outgoing call timed out after 30s.");
          socket.emit("call:cancel", { roomName: "" });
          setEndReason("no_answer");
          setCallState("ended");
          toast.info("Không có phản hồi sau 30 giây.");
        }
      }, 30000);
    };

    window.addEventListener("open-call-modal", handleOutgoingCall);
    return () => window.removeEventListener("open-call-modal", handleOutgoingCall);
  }, [user]);

  // ── Listen for rejoin trigger ──
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
      setCallState("ringing_in");
    };

    window.addEventListener("call:rejoin", handleRejoin);
    return () => window.removeEventListener("call:rejoin", handleRejoin);
  }, []);

  // ── Auto-sync active call state on connect ──
  useEffect(() => {
    if (isConnected && user?.id) {
      console.log("[Call] ⚡ Connection established. Performing immediate active call sync...");
      socketService.checkActiveCall();
    }
  }, [isConnected, user?.id]);

  useEffect(() => {
    const onRinging = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (callStateRef.current === "ringing_out") {
        setCallData((prev) => prev ? { ...prev, roomName: data.roomName } : prev);
      }
    };

    const onIncomingCall = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log("[Call] 🔔 Incoming call signal RECEIVED at:", new Date().toLocaleTimeString(), data);

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

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      console.log("[Call] 📱 Updating state to ringing_in...");
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
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
    };

    const onDeclined = (e: Event) => {
      const data = (e as CustomEvent).detail;
      
      if (data.callType === "group") {
        toast.info(`${data.declinedByName} đã từ chối tham gia cuộc gọi.`);
        return;
      }

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

    const onEnded = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const reason = data.reason || "ended";
      const currentState = callStateRef.current;

      if (currentState === "idle") return;

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

    const onParticipantLeft = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (data.participantId === user.id) return;
      toast.info(`${data.participantName} đã rời cuộc gọi.`);

      // If a new host was promoted, update local callData initiator state
      if (data.newCallerId) {
        setCallData((prev) => prev ? {
          ...prev,
          callerId: data.newCallerId,
          callerName: data.newCallerName || prev.callerName,
        } : prev);

        if (data.newCallerId === user.id) {
          toast.success("Bạn đã được chuyển quyền Trưởng cuộc gọi.");
        } else {
          toast.info(`${data.newCallerName || "Thành viên khác"} đã trở thành Trưởng cuộc gọi mới.`);
        }
      }
    };

    const onParticipantJoined = (e: Event) => {
      const data = (e as CustomEvent).detail;
      toast.info(`${data.participantName} đã tham gia cuộc gọi.`);
    };

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

    const onBusy = (e: Event) => {
      const data = (e as CustomEvent).detail;
      toast.warning(data.message);
      setCallState("ended");
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
    };

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

    socket.emit("call:cancel", { roomName: callData.roomName, chatId: callData.chatId });
    setCallState("idle");
    setCallData(null);
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
  }, [callData]);

  const endCall = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !callData) return;

    socket.emit("call:ended", { roomName: callData.roomName });

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

  // ============= SHARED COMPONENTS =============

  const CallAvatar = ({ src, name, size = "lg", pulse = false }: { src?: string; name: string; size?: "lg" | "xl"; pulse?: boolean }) => {
    const sizeClasses = size === "xl" ? "w-28 h-28" : "w-24 h-24";
    const avatarUrl = getAvatarUrl(src, name);

    return (
      <div className={`relative ${sizeClasses} flex-shrink-0`}>
        {pulse && (
          <>
            <div className="absolute inset-[-8px] rounded-full bg-blue-500/10 animate-ping" />
            <div className="absolute inset-[-4px] rounded-full bg-blue-500/15 animate-pulse" />
          </>
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
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      >
        <div className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]"
          style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)" }}
        >
          {/* Animated top bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 animate-pulse" />

          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center pt-14 pb-10 px-8 gap-8">
            {/* Call type badge */}
            <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-medium">
              {callData.isVideo ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
              {callData.callType === "group" ? "Cuộc gọi nhóm" : callData.isVideo ? "Video" : "Thoại"}
            </div>

            <CallAvatar src={callData.callerAvatar} name={callData.callerName} size="xl" pulse />

            <div className="text-center space-y-1.5">
              <p className="text-sm text-blue-400 font-semibold tracking-widest uppercase animate-pulse">
                Cuộc gọi đến
              </p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{callData.callerName}</h3>
            </div>

            <div className="flex w-full gap-4 mt-2">
              <button
                id="call-decline-btn"
                onClick={declineCall}
                className="flex-1 h-14 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                <PhoneOff className="h-5 w-5" /> Từ chối
              </button>
              <button
                id="call-accept-btn"
                onClick={acceptCall}
                className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/30 text-sm"
              >
                <Phone className="h-5 w-5" /> {callData.callType === "group" ? "Tham gia" : "Trả lời"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── State: RINGING OUT (we are calling, waiting for answer) ──
  if (callState === "ringing_out") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      >
        <div className="relative w-full max-w-xs mx-4 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]"
          style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)" }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse" />

          <div className="relative flex flex-col items-center pt-14 pb-10 px-8 gap-6">
            <CallAvatar src={callData.callerAvatar} name={callData.callerName} size="xl" pulse />

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-white">{callData.callerName}</h3>
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm">
                <span className="animate-pulse">Đang đổ chuông</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>

            <button
              id="call-cancel-btn"
              onClick={cancelCall}
              className="mt-2 w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all hover:rotate-[135deg] shadow-xl shadow-red-500/30 active:scale-95"
              title="Hủy cuộc gọi"
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </button>
            <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase -mt-3">Nhấn để hủy</p>
          </div>
        </div>
      </div>
    );
  }

  // ── State: CONNECTING (accepted, waiting for token) ──
  if (callState === "connecting") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <Loader2 className="w-20 h-20 animate-spin text-blue-500 opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 animate-ping" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">Đang kết nối</p>
            <p className="text-sm text-slate-400 mt-1">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── State: IN CALL (LiveKit active) ──
  if (callState === "in_call" && callData.token && callData.serverUrl) {
    return (
      <div
        className="fixed inset-0 z-[9998] flex flex-col"
        style={{ background: "#020617" }}
      >
        {/* ── Top overlay bar ── */}
        <div className="absolute top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-3 pointer-events-none">
          {/* Live badge */}
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-widest uppercase">Live</span>
          </div>

          {/* Action buttons — right side */}
          {callData.callType === "group" && (
            <div className="pointer-events-auto flex items-center gap-2">
              {callData.callerId === user?.id && (
                <button
                  id="end-call-all-btn"
                  onClick={endCallForAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 backdrop-blur-md border border-red-500/50"
                >
                  <PhoneOff className="h-3.5 w-3.5" /> Kết thúc cho tất cả
                </button>
              )}
              <button
                id="leave-call-btn"
                onClick={endCall}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl transition-all border border-white/15 active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" /> Rời đi
              </button>
            </div>
          )}

          {/* Private call: just X button */}
          {callData.callType === "private" && (
            <button
              id="end-private-call-btn"
              onClick={endCall}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 backdrop-blur-md text-white text-xs font-bold rounded-xl transition-all border border-red-500/40 active:scale-95"
            >
              <PhoneOff className="h-3.5 w-3.5" /> Kết thúc
            </button>
          )}
        </div>

        {/* ── LiveKit Room — fills entire screen, padded on top so our buttons are always visible ── */}
        <div className="absolute inset-0 pt-14" style={{ minHeight: 0 }}>
          <LiveKitRoom
            video={callData.isVideo}
            audio={true}
            token={callData.token}
            serverUrl={callData.serverUrl}
            data-lk-theme="default"
            style={{ height: "100%", width: "100%" }}
            onDisconnected={endCall}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    );
  }

  // ── State: ENDED ──
  if (callState === "ended") {
    return null; // Toast already shown, cleanup via timeout
  }

  return null;
}
