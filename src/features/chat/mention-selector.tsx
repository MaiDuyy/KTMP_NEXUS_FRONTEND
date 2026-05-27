import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatParticipant } from '@/src/type/chat.types';
import { Hash, Users, AtSign } from 'lucide-react';

interface MentionSelectorProps {
  participants: ChatParticipant[];
  query: string;
  onSelect: (participant: ChatParticipant | { accountId: string; name: string; type: 'special' }) => void;
  onClose: () => void;
  currentUserId?: string;
  canUseBroadcast?: boolean;
}

export const MentionSelector: React.FC<MentionSelectorProps> = ({
  participants,
  query,
  onSelect,
  onClose,
  currentUserId,
  canUseBroadcast = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const specialOptions = canUseBroadcast ? [
    // { accountId: 'here', name: 'here', type: 'special' as const, description: 'Thông báo cho những người đang online' },
    { accountId: 'all', name: 'all', type: 'special' as const, description: 'Thông báo cho tất cả mọi người' },
    // { accountId: 'channel', name: 'channel', type: 'special' as const, description: 'Thông báo cho tất cả mọi người' },
    // { accountId: 'everyone', name: 'everyone', type: 'special' as const, description: 'Thông báo cho tất cả mọi người' },
  ] : [];

  const filteredParticipants = participants.filter((p) => {
    // Exclude current user
    if (currentUserId && p.accountId === currentUserId) return false;
    
    const name = p.name || p.account?.name || '';
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const filteredSpecial = specialOptions.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const allOptions = [...filteredSpecial, ...filteredParticipants];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allOptions.length) % allOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allOptions[selectedIndex]) {
          onSelect(allOptions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allOptions, selectedIndex, onSelect, onClose]);

  if (allOptions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[100] overflow-hidden">
      <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
        <AtSign size={14} className="text-slate-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhắc tên</span>
      </div>
      <div className="max-h-64 overflow-y-auto custom-scrollbar">
        {allOptions.map((option, index) => {
          const isSpecial = 'type' in option;
          const isSelected = index === selectedIndex;

          return (
            <div
              key={option.accountId}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => onSelect(option)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {isSpecial ? (
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  option.accountId === 'here' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {option.accountId === 'here' ? <Users size={16} /> : <Hash size={16} />}
                </div>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={option.avatar || undefined} />
                  <AvatarFallback>{(option.name || 'U')[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    @{isSpecial ? option.name : (option.name || option.account?.name || 'User')}
                  </span>
                  {isSpecial && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase">
                      Lệnh
                    </span>
                  )}
                </div>
                {isSpecial && (
                  <p className="text-[10px] text-slate-400 truncate">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
