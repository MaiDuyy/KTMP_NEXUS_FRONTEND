'use client';

import { useState, useEffect } from 'react';
import { useGetChatByIdQuery } from '@/src/redux/feature/chatApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChatParticipant } from '@/src/type/chat.types';

interface MentionSelectorProps {
    chatId: string;
    onSelect: (user: ChatParticipant) => void;
    onClose: () => void;
}

export function MentionSelector({ chatId, onSelect, onClose }: MentionSelectorProps) {
    const { data: chatData, isLoading } = useGetChatByIdQuery(chatId);
    const [search, setSearch] = useState('');

    const participants = chatData?.chat?.participants || [];
    
    // Filter participants based on search
    const filteredParticipants = participants.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Command className="rounded-lg border shadow-md w-64 bg-background">
            <CommandInput 
                placeholder="Tìm thành viên..." 
                value={search}
                onValueChange={setSearch}
                autoFocus
            />
            <CommandList className="max-h-64 overflow-y-auto">
                <CommandEmpty>Không tìm thấy thành viên nào.</CommandEmpty>
                <CommandGroup heading="Thành viên">
                    {filteredParticipants.map((participant) => (
                        <CommandItem
                            key={participant.accountId}
                            onSelect={() => onSelect(participant)}
                            className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted"
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={participant.avatar} alt={participant.name} />
                                <AvatarFallback>{participant.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate">{participant.name}</span>
                        </CommandItem>
                    ))}
                    {/* Special mentions */}
                    <CommandItem
                        onSelect={() => onSelect({ accountId: 'here', name: 'here' } as any)}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted"
                    >
                        <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                            @
                        </div>
                        <span>@here (Thông báo cho người đang online)</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => onSelect({ accountId: 'channel', name: 'channel' } as any)}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted"
                    >
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            @
                        </div>
                        <span>@channel (Thông báo cho tất cả)</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
