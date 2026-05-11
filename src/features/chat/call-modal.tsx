"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  ControlBar
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import { useGetLiveKitTokenMutation } from "@/src/redux/feature/chatApi";
import { toast } from "sonner";

interface CallModalProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  isVideo: boolean;
  chatName?: string;
  isIncoming?: boolean;
}

export function CallModal({ chatId, isOpen, onClose, isVideo, chatName, isIncoming }: CallModalProps) {
  const [token, setToken] = useState<string>("");
  const [getToken, { isLoading }] = useGetLiveKitTokenMutation();
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  useEffect(() => {
    if (!isOpen || !chatId) {
      setToken("");
      return;
    }

    const fetchToken = async () => {
      try {
        const result = await getToken(chatId).unwrap();
        if (result.success && result.token) {
          setToken(result.token);
        } else {
          toast.error("Không thể lấy the LiveKit token");
          onClose(); // Failed
        }
      } catch (err: any) {
        console.error("Token err:", err);
        toast.error("Lỗi kết nối gọi điện");
        onClose();
      }
    };

    fetchToken();
  }, [isOpen, chatId, getToken, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] p-0 overflow-hidden bg-black border-none flex flex-col">
        {isLoading || !token ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
            <p>Đang kết nối tới {chatName || "cuộc gọi"}...</p>
          </div>
        ) : (
          <LiveKitRoom
            video={isVideo}
            audio={true}
            token={token}
            serverUrl={serverUrl}
            // Use the default LiveKit theme for the built-in styles
            data-lk-theme="default"
            style={{ height: '100%', flex: 1 }}
            onDisconnected={onClose}
          >
            {/* The Standard UI from LiveKit */}
            <VideoConference />
            {/* The RoomAudioRenderer takes care of track-bound audio! */}
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </DialogContent>
    </Dialog>
  );
}
