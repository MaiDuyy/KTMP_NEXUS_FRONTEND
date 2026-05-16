import React from 'react';
import { Pin, X, ArrowRight, MessageSquare, User, Calendar, Trash2 } from 'lucide-react';
import { PinnedMessage } from '@/src/type/chat.types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAvatarUrl } from '@/src/utils/image-utils';

interface PinnedMessagesPanelProps {
  pinnedMessages: PinnedMessage[];
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  canUnpin?: boolean;
}

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({
  pinnedMessages,
  onClose,
  onJumpToMessage,
  onUnpin,
  canUnpin = false
}) => {
  return (
    <div className="w-[350px] border-l border-slate-100 bg-white flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Pin size={18} className="text-blue-500 fill-current" />
          <h2 className="font-bold text-slate-900">Tin nhắn đã ghim</h2>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
            {pinnedMessages.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
          <X size={18} className="text-slate-500" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Pin size={24} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">Chưa có tin nhắn nào được ghim</p>
              <p className="text-[11px] mt-1">Tin nhắn quan trọng sẽ xuất hiện ở đây để mọi người dễ dàng tìm thấy.</p>
            </div>
          ) : (
            pinnedMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer relative"
                onClick={() => onJumpToMessage(msg.id)}
              >
                <div className="flex items-start gap-3 mb-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={getAvatarUrl(msg.senderAvatar, msg.senderName) || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                      {msg.senderName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(msg.pinnedAt), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                       <User size={10} /> {msg.pinnedByName} đã ghim
                    </div>
                  </div>
                </div>

                <div className="pl-1 border-l-2 border-blue-200 ml-3.5 mb-3">
                    <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                        {msg.content}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 gap-1 p-0 px-2"
                  >
                    Xem chi tiết <ArrowRight size={10} />
                  </Button>
                  
                  {canUnpin && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUnpin(msg.id);
                        }}
                    >
                        <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Tối đa ghim được 50 tin nhắn.<br/>Ghim những tin nhắn chứa thông tin quan trọng hoặc quy tắc nhóm.
        </p>
      </div>
    </div>
  );
};
