import React, { useState } from 'react';
import { Pin, ChevronRight, X, ChevronLeft, Hash, MessageSquare } from 'lucide-react';
import { PinnedMessage } from '@/src/type/chat.types';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PinnedBannerProps {
  pinnedMessages: PinnedMessage[];
  onOpenSidebar: () => void;
  onJumpToMessage: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  canUnpin?: boolean;
}

export const PinnedBanner: React.FC<PinnedBannerProps> = ({
  pinnedMessages,
  onOpenSidebar,
  onJumpToMessage,
  onUnpin,
  canUnpin = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const currentMessage = pinnedMessages[currentIndex];
  const total = pinnedMessages.length;

  const nextPinned = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevPinned = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div 
      className="h-12 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors z-20"
      onClick={onOpenSidebar}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-500 shrink-0">
          <Pin size={14} className="fill-current" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Tin nhắn đã ghim {total > 1 && `(${currentIndex + 1}/${total})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-600 truncate max-w-md font-medium">
              <span className="font-bold text-slate-800">{currentMessage.senderName}:</span> {currentMessage.content}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-4">
        {total > 1 && (
          <div className="flex items-center mr-2 border-r border-slate-200 pr-2 gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600"
              onClick={prevPinned}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600"
              onClick={nextPinned}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs font-bold text-slate-500 hover:text-blue-600 h-8 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onJumpToMessage(currentMessage.id);
          }}
        >
          Xem tin nhắn
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-slate-600"
          onClick={onOpenSidebar}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};
