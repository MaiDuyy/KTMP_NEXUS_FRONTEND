'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Mic, Sparkles, Square, Volume2, X } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import type { Socket } from 'socket.io-client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMeetingVoice } from './useMeetingVoice';
import type { VoiceTurnState } from './types';

const STATE_LABELS: Record<VoiceTurnState, string> = {
  IDLE: 'Sẵn sàng',
  LISTENING: 'Đang nghe câu hỏi',
  FINALIZING_STT: 'Đang nhận diện giọng nói',
  THINKING: 'AI đang suy nghĩ',
  RESPONDING: 'Đang phát câu trả lời',
  COMPLETED: 'Đã hoàn tất',
  CANCELLING: 'Đang dừng',
  FAILED: 'Không thể hoàn tất',
  CANCELLED: 'Đã hủy',
};

export function MeetingVoicePanel(props: {
  socket: Socket | null;
  meetingSessionId: string;
  chatId: string;
  workspaceId: string | null | undefined;
  userId: string;
  userName: string;
}) {
  const voice = useMeetingVoice(props);
  const room = useRoomContext();
  const [canPlayAudio, setCanPlayAudio] = useState(room.canPlaybackAudio);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const update = () => setCanPlayAudio(room.canPlaybackAudio);
    room.on(RoomEvent.AudioPlaybackStatusChanged, update);
    update();
    return () => { room.off(RoomEvent.AudioPlaybackStatusChanged, update); };
  }, [room]);

  const buttonLabel = voice.canStop
    ? 'Dừng hỏi AI'
    : voice.state.starting
      ? 'Đang mở micro'
      : voice.state.locked
        ? voice.isOwner ? 'AI đang xử lý' : 'AI đang bận'
        : 'Hỏi AI';

  const handlePrimaryAction = () => {
    if (voice.canStop) void voice.stop();
    else if (voice.canStart) voice.start();
  };

  return (
    <TooltipProvider delayDuration={250}>
      <aside
        aria-label="AI Voice"
        className="flex max-h-[42%] min-h-0 w-full shrink-0 flex-col border-t border-white/10 bg-zinc-950 text-zinc-100 md:max-h-none md:w-80 md:border-l md:border-t-0"
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 pr-10">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
            <h2 className="truncate text-sm font-semibold">Nexus AI Voice</h2>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400" aria-live="polite">
            <span className={`h-2 w-2 rounded-full ${voice.state.locked ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            {voice.state.syncing ? 'Đồng bộ' : STATE_LABELS[voice.state.turnState]}
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" aria-live="polite">
          {voice.state.messages.map((message) => (
            <article
              key={message.id}
              className={`mb-3 border-l-2 pl-3 ${message.role === 'assistant' ? 'border-cyan-400' : 'border-emerald-400'}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-zinc-400">
                <span className="truncate">{message.role === 'assistant' ? 'Nexus AI' : message.speakerName}</span>
                {message.status === 'STREAMING' && <Loader2 className="h-3 w-3 animate-spin" aria-label="Đang cập nhật" />}
              </div>
              <p className="break-words text-sm leading-5 text-zinc-100">{message.displayText}</p>
            </article>
          ))}

          {voice.state.locked && voice.state.ownerName && (
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              {(voice.state.turnState !== 'LISTENING' || !voice.state.recording) && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
              )}
              <span className="break-words">
                {voice.state.ownerName}: {STATE_LABELS[voice.state.turnState]}
              </span>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          {voice.state.error && (
            <div className="mb-3 flex items-start gap-2 border-l-2 border-red-400 bg-red-950/30 px-3 py-2 text-xs text-red-100" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 break-words">{voice.state.error.message}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={voice.clearError}
                    className="grid h-6 w-6 shrink-0 place-items-center text-red-200 hover:text-white"
                    aria-label="Đóng lỗi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Đóng</TooltipContent>
              </Tooltip>
            </div>
          )}

          {voice.state.uploadProgress !== null && (
            <div className="mb-3 h-1.5 overflow-hidden rounded-sm bg-zinc-800" aria-label={`Đã tải ${voice.state.uploadProgress}%`}>
              <div className="h-full bg-cyan-400 transition-[width]" style={{ width: `${voice.state.uploadProgress}%` }} />
            </div>
          )}

          {(!canPlayAudio || audioError) && (
            <button
              type="button"
              onClick={() => void room.startAudio().then(() => setAudioError(false)).catch(() => setAudioError(true))}
              className="mb-2 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-amber-400/50 bg-amber-950/30 px-3 text-sm text-amber-100 hover:bg-amber-950/50"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              Bật âm thanh
            </button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!voice.canStart && !voice.canStop}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 ${
                  voice.canStop
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'
                }`}
              >
                {voice.state.starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : voice.canStop ? (
                  <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                ) : (
                  <Mic className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{buttonLabel}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {voice.canStop ? 'Kết thúc ghi câu hỏi' : voice.canStart ? 'Bắt đầu hỏi AI bằng giọng nói' : STATE_LABELS[voice.state.turnState]}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
