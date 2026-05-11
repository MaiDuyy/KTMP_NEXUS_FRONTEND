'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, User as UserIcon } from 'lucide-react';
import { useSearchDirectoryQuery } from '@/src/redux/feature/userApi';
import { useGetOrCreatePrivateChatMutation } from '@/src/redux/feature/chatApi';

interface DirectorySearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DirectorySearchModal({ open, onOpenChange }: DirectorySearchModalProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { data, isLoading, isFetching } = useSearchDirectoryQuery(debouncedSearch, {
        // skip: debouncedSearch.length < 2,
    });

    const [getOrCreateChat, { isLoading: isCreating }] = useGetOrCreatePrivateChatMutation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectUser = async (userId: string) => {
        try {
            const result = await getOrCreateChat({ partnerId: userId }).unwrap();
            onOpenChange(false);
            if (result?.chat?.id) {
                router.push(`/chat/${result.chat.id}`);
            }
        } catch (error) {
            console.error('Failed to create/get chat', error);
        }
    };

    const users = data?.users || [];
    const showLoading = isLoading || isFetching;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Company Directory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-[300px] rounded-md border p-2">
                        {showLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user.id)}
                                        disabled={isCreating}
                                        className="flex items-center gap-3 w-full p-2 hover:bg-muted rounded-md transition-colors text-left disabled:opacity-50"
                                    >
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={user.avatar || undefined} />
                                            <AvatarFallback>
                                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="text-sm font-medium leading-none truncate">{user.name}</h4>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : debouncedSearch.length >= 2 ? (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
                                <UserIcon className="h-8 w-8 opacity-20" />
                                <p className="text-sm">No employees found.</p>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
                                <Search className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Type at least 2 characters to search.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
