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
      const { chatId, isVideo, chatName, targetUserId, callType } = (e as CustomEvent).detail;

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
      });

      setCallData({
        roomName: "", // Will be set when server responds with call:ringing
        chatId,
        callerName: chatName || "Cuộc gọi",
        callerId: user.id,
        isVideo,
        callType: callType || "private",
      });
      setCallState("ringing_out");
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
        isVideo: data.isVideo,
        callType: "group",
      });
      // Move to ringing_in state to show the "Accept/Join" dialog
      setCallState("ringing_in");
    };

    window.addEventListener("call:rejoin", handleRejoin);
    return () => window.removeEventListener("call:rejoin", handleRejoin);
  }, []);

  // ── Listen for all WS call events ──
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !user?.id) return;

    // Server confirms our call is ringing at the other end
    const onRinging = (data: { roomName: string; chatId: string }) => {
      if (callStateRef.current === "ringing_out") {
        setCallData((prev) => prev ? { ...prev, roomName: data.roomName } : prev);
      }
    };

    // Someone is calling US
    const onIncomingCall = (data: any) => {
      if (data.callerId === user.id) return; // Ignore our own calls

      if (callStateRef.current !== "idle") {
        // We're busy - auto-decline
        socket.emit("call:declined", { roomName: data.roomName });
        return;
      }

      setCallData({
        roomName: data.roomName,
        chatId: data.chatId,
        callerId: data.callerId,
        callerName: data.callerName,
        isVideo: data.isVideo,
        callType: data.callType || "private",
      });
      setCallState("ringing_in");

    };

    // Server sends LiveKit tokens after accept (for both caller and callee)
    const onStartInfo = (data: { token: string; serverUrl: string; roomName: string; isVideo: boolean; chatId: string }) => {
      console.log("[Call] Received call:start_info, connecting to LiveKit...");
      setCallData((prev) => prev ? {
        ...prev,
        token: data.token,
        serverUrl: data.serverUrl,
        roomName: data.roomName,
        isVideo: data.isVideo,
      } : prev);
      setCallState("in_call");
    };

    // Callee declined our call
    const onDeclined = (data: { roomName: string; declinedByName: string }) => {
      if (callStateRef.current === "ringing_out") {
        toast.info(`${data.declinedByName} đã từ chối cuộc gọi.`);
        setEndReason("declined");
        setCallState("ended");
      }
    };

    // Call ended (by other party, timeout, disconnect, cancel)
    // For PRIVATE calls: this means the call is over for everyone
    // For GROUP calls: this only fires when room is completely empty or missed
    const onEnded = (data: { roomName: string; reason?: string; endedByName?: string; duration?: number }) => {
      const reason = data.reason || "ended";
      const currentState = callStateRef.current;

      if (currentState === "idle") return;

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
    };

    // Group call: someone left (not us — server sends this to others in the chat)
    const onParticipantLeft = (data: { roomName: string; participantName: string; participantId: string }) => {
      if (data.participantId === user.id) return;
      toast.info(`${data.participantName} đã rời cuộc gọi.`);
    };

    // Group call: someone joined
    const onParticipantJoined = (data: { roomName: string; participantName: string; participantCount: number }) => {
      toast.info(`${data.participantName} đã tham gia cuộc gọi.`);
    };

    // Error from server (offline, busy, etc)
    const onError = (data: { reason: string; message: string }) => {
      toast.error(data.message);
      if (callStateRef.current !== "idle") {
        setCallState("ended");
      }
    };

    // Busy signal
    const onBusy = (data: { message: string }) => {
      toast.warning(data.message);
      setCallState("ended");
    };

    socket.on("call:ringing", onRinging);
    socket.on("call:incoming", onIncomingCall);
    socket.on("call:start_info", onStartInfo);
    socket.on("call:declined", onDeclined);
    socket.on("call:ended", onEnded);
    socket.on("call:participant_left", onParticipantLeft);
    socket.on("call:participant_joined", onParticipantJoined);
    socket.on("call:error", onError);
    socket.on("call:busy", onBusy);

    return () => {
      socket.off("call:ringing", onRinging);
      socket.off("call:incoming", onIncomingCall);
      socket.off("call:start_info", onStartInfo);
      socket.off("call:declined", onDeclined);
      socket.off("call:ended", onEnded);
      socket.off("call:participant_left", onParticipantLeft);
      socket.off("call:participant_joined", onParticipantJoined);
      socket.off("call:error", onError);
      socket.off("call:busy", onBusy);
    };
  }, [user?.id, isConnected]);

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

    socket.emit("call:cancel", { roomName: callData.roomName });
    setCallState("idle");
    setCallData(null);
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

  // ============= RENDER =============

  // ── State: IDLE ──
  if (callState === "idle" || !callData) return null;

  // ── State: RINGING IN (someone calling us) ──
  if (callState === "ringing_in") {
    return (
      <AlertDialog open>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {callData.isVideo ? <Video className="h-5 w-5 text-blue-500" /> : <Phone className="h-5 w-5 text-emerald-500" />}
              {callData.callType === "group" ? "Cuộc gọi nhóm đến" : "Cuộc gọi đến"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <span className="font-semibold text-slate-900">{callData.callerName}</span>{" "}
              {callData.callType === "group"
                ? `đã bắt đầu cuộc gọi nhóm (${callData.isVideo ? "Video" : "Thoại"}).`
                : `đang gọi cho bạn (${callData.isVideo ? "Video" : "Thoại"}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel
              onClick={declineCall}
              className="bg-red-500 text-white hover:bg-red-600 border-none flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" /> Từ chối
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={acceptCall}
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            >
              <Phone className="h-4 w-4" /> {callData.callType === "group" ? "Tham gia" : "Trả lời"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // ── State: RINGING OUT (we are calling, waiting for answer) ──
  if (callState === "ringing_out") {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-sm bg-slate-900 text-white border-none">
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
              {callData.isVideo ? <Video className="h-10 w-10 text-blue-400" /> : <Phone className="h-10 w-10 text-blue-400" />}
            </div>
            <p className="text-lg font-semibold">{callData.callerName}</p>
            <p className="text-sm text-slate-400">Đang đổ chuông...</p>
            <button
              onClick={cancelCall}
              className="mt-4 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
            <p className="text-xs text-slate-500">Nhấn để hủy</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── State: CONNECTING (accepted, waiting for token) ──
  if (callState === "connecting") {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-sm bg-slate-900 text-white border-none">
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Đang kết nối cuộc gọi...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── State: IN CALL (LiveKit active) ──
  if (callState === "in_call" && callData.token && callData.serverUrl) {
    return (
      <Dialog open onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="max-w-[95vw] w-full h-[92vh] p-0 overflow-hidden bg-black border-none flex flex-col">
          {/* Group call: show "Leave" button instead of "End for all" */}
          {callData.callType === "group" && (
            <div className="absolute top-3 right-14 z-50 flex items-center gap-2">
              {/* Only the initiator can see "End for all" */}
              {callData.callerId === user?.id && (
                <button
                  onClick={endCallForAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors shadow-lg"
                  title="Kết thúc cuộc gọi cho tất cả mọi người"
                >
                  <PhoneOff className="h-4 w-4" /> Kết thúc cho tất cả
                </button>
              )}
              
              <button
                onClick={endCall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/90 hover:bg-slate-800 text-white text-sm rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" /> Rời đi
              </button>
            </div>
          )}
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
