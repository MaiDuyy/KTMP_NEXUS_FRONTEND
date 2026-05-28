import React, { useState } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { useLazySearchMessagesQuery } from '@/src/redux/feature/messageApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SearchMessagesPanelProps {
  chatId: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

export const SearchMessagesPanel: React.FC<SearchMessagesPanelProps> = ({
  chatId,
  onClose,
  onJumpToMessage
}) => {
  const [query, setQuery] = useState('');
  const [triggerSearch, { data, isFetching, error }] = useLazySearchMessagesQuery();

  const handleSearch = () => {
    if (!query.trim()) return;
    triggerSearch({ chatId, q: query.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const results = data?.messages || [];

  return (
    <div className="w-[350px] border-l border-slate-100 bg-white flex flex-col h-full animate-in slide-in-from-right duration-300 shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-blue-500" />
          <h2 className="font-bold text-slate-900">Tìm kiếm tin nhắn</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
          <X size={18} className="text-slate-500" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-50 shrink-0 flex gap-2 bg-slate-50/30">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập từ khóa cần tìm..."
            className="h-9 pr-8 text-xs rounded-[4px] border-slate-200 focus-visible:ring-blue-500 shadow-none bg-white"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Button 
          onClick={handleSearch}
          disabled={isFetching || !query.trim()}
          className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-[4px] shadow-none flex gap-1 shrink-0"
        >
          {isFetching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <>
              <Search size={13} />
              <span>Tìm</span>
            </>
          )}
        </Button>
      </div>

      {/* Results Area */}
      <ScrollArea className="flex-1 bg-white">
        <div className="p-4 space-y-4">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <p className="text-xs">Đang tìm kiếm...</p>
            </div>
          ) : error ? (
            <div className="text-center text-xs text-red-500 py-20 font-medium">
              Lỗi hệ thống khi tìm kiếm tin nhắn.
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search size={24} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">
                {query ? 'Không tìm thấy kết quả' : 'Bắt đầu tìm kiếm'}
              </p>
              <p className="text-[11px] mt-1 leading-normal">
                {query 
                  ? 'Thử tìm kiếm với từ khóa khác đơn giản hơn.' 
                  : 'Nhập từ khóa ở trên để tìm lại các tin nhắn cũ.'}
              </p>
            </div>
          ) : (
            results.map((msg) => (
              <div 
                key={msg.id} 
                className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                onClick={() => onJumpToMessage(msg.id)}
              >
                <div className="flex items-start gap-3 mb-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={getAvatarUrl(msg.sender?.avatar, msg.sender?.name) || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                      {msg.sender?.name ? msg.sender.name[0] : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {msg.sender?.name || 'Người dùng'}
                      </span>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">
                        {msg.time ? formatDistanceToNow(new Date(msg.time), { addSuffix: true, locale: vi }) : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pl-1.5 border-l-2 border-slate-200 ml-3.5 mb-2">
                  <p className="text-xs text-slate-700 leading-relaxed break-words line-clamp-3">
                    {msg.content}
                  </p>
                </div>

                <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-100/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 gap-1 p-0 px-2 rounded-[4px]"
                  >
                    Xem tin nhắn <ArrowRight size={10} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-50 bg-slate-50/50 shrink-0">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Tìm kiếm trong toàn bộ lịch sử trò chuyện của phòng này.
        </p>
      </div>
    </div>
  );
};
