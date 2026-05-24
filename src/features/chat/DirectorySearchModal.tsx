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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, User as UserIcon, X } from 'lucide-react';
import { useSearchDirectoryQuery } from '@/src/redux/feature/userApi';
import { useGetOrCreatePrivateChatMutation } from '@/src/redux/feature/chatApi';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';

interface DirectorySearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DirectorySearchModal({ open, onOpenChange }: DirectorySearchModalProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
    const { data, isLoading, isFetching } = useSearchDirectoryQuery(
        { searchTerm: debouncedSearch, workspaceId: currentWorkspaceId || undefined }
    );
    const [getOrCreateChat, { isLoading: isCreating }] = useGetOrCreatePrivateChatMutation();

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectUser = async (userId: string) => {
        try {
            const result = await getOrCreateChat({ partnerId: userId }).unwrap();
            onOpenChange(false);
            if (result?.chat?.id) router.push(`/chat/${result.chat.id}`);
        } catch {}
    };

    const users = data?.users || [];
    const showLoading = isLoading || isFetching;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[4px] p-0 overflow-hidden">
                {/* Header with search input */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
                    <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        Tìm kiếm thành viên
                    </DialogTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-8 h-8 text-sm border-slate-200 focus:border-blue-500 rounded-[4px]"
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="overflow-y-auto max-h-[320px] no-scrollbar">
                    {showLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                    ) : users.length > 0 ? (
                        <div>
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user.id)}
                                    disabled={isCreating}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left disabled:opacity-50 border-b border-slate-100/80 dark:border-white/[0.03] last:border-0 cursor-pointer"
                                >
                                    <Avatar className="h-8 w-8 rounded-[4px] border border-slate-200/80 shrink-0">
                                        <AvatarImage src={getAvatarUrl(user.avatar, user.name)} />
                                        <AvatarFallback className="text-[10px] font-bold rounded-[4px]">
                                            {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                    </div>
                                    {isCreating && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-slate-400 gap-2">
                            {debouncedSearch.length >= 2 ? (
                                <>
                                    <UserIcon className="h-7 w-7 text-slate-200 dark:text-slate-700" />
                                    <p className="text-xs">Không tìm thấy thành viên nào.</p>
                                </>
                            ) : (
                                <>
                                    <Search className="h-7 w-7 text-slate-200 dark:text-slate-700" />
                                    <p className="text-xs">Nhập ít nhất 2 ký tự để tìm kiếm.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
