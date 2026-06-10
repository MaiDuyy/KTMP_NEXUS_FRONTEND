'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, Send, Check, X, Users, MessageSquare } from 'lucide-react';
import { RootState } from '@/src/redux/store';
import { setForwardingMessage } from '@/src/redux/feature/workspaceSlice';
import { useGetChatsQuery, useGetOrCreatePrivateChatMutation } from '@/src/redux/feature/chatApi';
import { useSearchDirectoryQuery } from '@/src/redux/feature/userApi';
import { useForwardMessageMutation } from '@/src/redux/feature/messageApi';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { toast } from 'sonner';

export default function ForwardMessageModal() {
    const dispatch = useDispatch();
    const router = useRouter();
    
    // Global forwarding state
    const forwardingMessageId = useSelector((state: RootState) => state.workspace.forwardingMessageId);
    const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
    const isOpen = !!forwardingMessageId;

    // Search and UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Status map: { [targetChatId/userId]: 'idle' | 'sending' | 'sent' | 'error' }
    const [sendStatuses, setSendStatuses] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});

    // Keep track of chats we forwarded to, to display in the final toast
    const [forwardedChats, setForwardedChats] = useState<{ id: string; name: string }[]>([]);

    // API Hooks
    const { data: chatsData, isLoading: chatsLoading } = useGetChatsQuery(
        { type: 'all', workspaceId: currentWorkspaceId },
        { skip: !isOpen }
    );
    
    const { data: searchData, isLoading: searchLoading, isFetching: searchFetching } = useSearchDirectoryQuery(
        { searchTerm: debouncedSearch, workspaceId: currentWorkspaceId || undefined },
        { skip: !isOpen || debouncedSearch.trim().length < 2 }
    );

    const [getOrCreateChat, { isLoading: isCreatingChat }] = useGetOrCreatePrivateChatMutation();
    const [forwardMessage] = useForwardMessageMutation();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset local UI states when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setDebouncedSearch('');
            setSendStatuses({});
            setForwardedChats([]);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (forwardedChats.length > 0) {
            const count = forwardedChats.length;
            const lastChat = forwardedChats[count - 1];
            
            // Premium enterprise multi-forward success toast
            toast(`Đã chuyển tiếp tin nhắn thành công tới ${count} cuộc hội thoại.`, {
                action: {
                    label: "Xem hội thoại",
                    onClick: () => {
                        router.push(`/chat/${lastChat.id}`);
                    }
                },
                duration: 5000,
            });
        }
        dispatch(setForwardingMessage(null));
    };

    const handleSendForward = async (targetChatId: string, chatName: string) => {
        if (!forwardingMessageId) return;

        setSendStatuses(prev => ({ ...prev, [targetChatId]: 'sending' }));

        try {
            await forwardMessage({
                targetChatId,
                originalMessageId: forwardingMessageId
            }).unwrap();

            setSendStatuses(prev => ({ ...prev, [targetChatId]: 'sent' }));
            
            // Add to the list of successfully forwarded channels for final summary
            if (!forwardedChats.some(c => c.id === targetChatId)) {
                setForwardedChats(prev => [...prev, { id: targetChatId, name: chatName }]);
            }
        } catch (error) {
            console.error('Failed to forward message:', error);
            setSendStatuses(prev => ({ ...prev, [targetChatId]: 'error' }));
            toast.error(`Không thể chuyển tiếp tới ${chatName}`);
        }
    };

    const handleSendForwardToSearchUser = async (userId: string, userName: string) => {
        if (!forwardingMessageId) return;

        setSendStatuses(prev => ({ ...prev, [userId]: 'sending' }));

        try {
            // 1. Zero-latency get or create direct message chat room ID
            const chatResult = await getOrCreateChat({ partnerId: userId }).unwrap();
            const chatId = chatResult?.chat?.id;

            if (!chatId) {
                throw new Error("Could not create direct chat room");
            }

            // 2. Forward the original message ID down to backend single source of truth
            await forwardMessage({
                targetChatId: chatId,
                originalMessageId: forwardingMessageId
            }).unwrap();

            setSendStatuses(prev => ({ ...prev, [userId]: 'sent', [chatId]: 'sent' }));
            
            if (!forwardedChats.some(c => c.id === chatId)) {
                setForwardedChats(prev => [...prev, { id: chatId, name: userName }]);
            }
        } catch (error) {
            console.error('Failed to forward to directory user:', error);
            setSendStatuses(prev => ({ ...prev, [userId]: 'error' }));
            toast.error(`Không thể chuyển tiếp tới ${userName}`);
        }
    };

    const recentChats = chatsData?.chats || [];
    const searchUsers = searchData?.users || [];
    const showSearch = debouncedSearch.trim().length >= 2;
    const isLoading = chatsLoading || (showSearch && (searchLoading || searchFetching));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[440px] rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] p-0 shadow-2xl [&>button]:rounded-[2px] overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header & Sticky Search Bar */}
                <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/[0.04] shrink-0">
                    <DialogTitle className="text-sm font-bold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-200">
                        Chuyển tiếp tin nhắn
                    </DialogTitle>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                        <Input
                            placeholder="Tìm kiếm người hoặc nhóm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-8 h-9 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 font-mono transition-colors text-slate-850 dark:text-slate-150"
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-650 cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* List Container - Scrollable */}
                <div className="overflow-y-auto flex-1 custom-scrollbar p-1.5 min-h-[300px]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400 dark:text-zinc-550" />
                        </div>
                    )}

                    {!isLoading && showSearch && (
                        <div className="flex flex-col gap-0.5">
                            <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">
                                Kết quả tìm kiếm
                            </div>
                            {searchUsers.length > 0 ? (
                                searchUsers.map((user) => {
                                    const status = sendStatuses[user.id] || 'idle';
                                    return (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] border-b border-slate-100/50 dark:border-white/[0.03] last:border-0 rounded-[2px] transition-colors"
                                        >
                                            <Avatar className="h-8 w-8 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shrink-0">
                                                <AvatarImage className="object-cover" src={getAvatarUrl(user.avatar, user.name)} />
                                                <AvatarFallback className="rounded-[2px] bg-slate-250 dark:bg-zinc-800 text-slate-650 dark:text-zinc-400 font-mono text-[10px] font-bold">
                                                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 truncate">{user.email}</p>
                                            </div>
                                            
                                            {/* Forward button with loading state */}
                                            <Button
                                                size="sm"
                                                variant={status === 'sent' ? 'outline' : 'default'}
                                                onClick={() => handleSendForwardToSearchUser(user.id, user.name)}
                                                disabled={status === 'sending' || status === 'sent'}
                                                className={`h-7 px-3 text-xs font-mono font-bold transition-all rounded-[2px] ${
                                                    status === 'sent' 
                                                        ? 'border-emerald-500 text-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' 
                                                        : 'bg-blue-600 dark:bg-blue-700/90 text-white hover:bg-blue-700'
                                                }`}
                                            >
                                                {status === 'idle' && (
                                                    <span className="flex items-center gap-1"><Send size={10} /> Gửi</span>
                                                )}
                                                {status === 'sending' && (
                                                    <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Gửi...</span>
                                                )}
                                                {status === 'sent' && (
                                                    <span className="flex items-center gap-1"><Check size={10} /> Đã gửi</span>
                                                )}
                                                {status === 'error' && (
                                                    <span className="text-red-500">Lỗi</span>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-slate-400 dark:text-zinc-600 font-mono text-xs">
                                    Không tìm thấy thành viên phù hợp
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && !showSearch && (
                        <div className="flex flex-col gap-0.5">
                            <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">
                                Cuộc trò chuyện gần đây
                            </div>
                            {recentChats.length > 0 ? (
                                recentChats.map((chat) => {
                                    const status = sendStatuses[chat.id] || 'idle';
                                    const chatName = chat.name || "Hội thoại";
                                    return (
                                        <div
                                            key={chat.id}
                                            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] border-b border-slate-100/50 dark:border-white/[0.03] last:border-0 rounded-[2px] transition-colors"
                                        >
                                            <Avatar className="h-8 w-8 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shrink-0">
                                                <AvatarImage className="object-cover" src={getAvatarUrl(chat.avatar, chatName)} />
                                                <AvatarFallback className="rounded-[2px] bg-slate-250 dark:bg-zinc-800 text-slate-650 dark:text-zinc-400 font-mono text-[10px] font-bold">
                                                    {chat.isGroup ? <Users size={12} /> : <MessageSquare size={12} />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{chatName}</p>
                                                <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                                                    {chat.isGroup ? 'Nhóm trò chuyện' : 'Trò chuyện cá nhân'}
                                                </p>
                                            </div>
                                            
                                            {/* Forward button with loading state */}
                                            <Button
                                                size="sm"
                                                variant={status === 'sent' ? 'outline' : 'default'}
                                                onClick={() => handleSendForward(chat.id, chatName)}
                                                disabled={status === 'sending' || status === 'sent'}
                                                className={`h-7 px-3 text-xs font-mono font-bold transition-all rounded-[2px] ${
                                                    status === 'sent' 
                                                        ? 'border-emerald-500 text-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' 
                                                        : 'bg-blue-600 dark:bg-blue-700/90 text-white hover:bg-blue-700'
                                                }`}
                                            >
                                                {status === 'idle' && (
                                                    <span className="flex items-center gap-1"><Send size={10} /> Gửi</span>
                                                )}
                                                {status === 'sending' && (
                                                    <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Gửi...</span>
                                                )}
                                                {status === 'sent' && (
                                                    <span className="flex items-center gap-1"><Check size={10} /> Đã gửi</span>
                                                )}
                                                {status === 'error' && (
                                                    <span className="text-red-500">Lỗi</span>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-slate-400 dark:text-zinc-600 font-mono text-xs">
                                    Chưa có cuộc trò chuyện gần đây nào
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="p-3 bg-slate-50 dark:bg-[#111113]/40 border-t border-slate-100 dark:border-white/[0.04] flex justify-end gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        className="h-8 px-4 text-xs font-mono rounded-[2px] hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
