'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useChatRoom, socketManager, MessageEvent } from '@/src/lib/socket';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, Reply, MoreHorizontal, Smile, Pin } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetMessagesQuery } from '@/src/redux/feature/messageApi';
import { Message } from '@/src/type/chat.types';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';

interface MessageListProps {
    chatId: string;
    className?: string;
    onReply?: (message: Message) => void;
    onReact?: (messageId: string, emoji: string) => void;
}

/**
 * Message list component with infinite scroll and realtime updates
 */
export function MessageList({ chatId, className, onReply, onReact }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    
    // Auth and Permissions
    const auth = useSelector((state: any) => state.auth);
    const hasAuditPerm = auth?.user?.permissions?.includes('CHAT.READ.ALL') || 
                         auth?.user?.roles?.some((r: any) => r.name === 'ADMIN' || r === 'ADMIN');
    
    // For this example, if they have audit permission, show banner
    const showAuditBanner = hasAuditPerm;

    // Subscribe to chat room
    useChatRoom(chatId);

    // Fetch initial messages
    const { data, isLoading, isFetching } = useGetMessagesQuery(
        { chatId, limit: 50 },
        { refetchOnMountOrArgChange: true }
    );

    // Update messages from query
    useEffect(() => {
        if (data?.messages) {
            setMessages(data.messages);
        }
    }, [data]);

    // Listen for realtime messages
    useEffect(() => {
        const unsubscribe = socketManager.onMessage((event: MessageEvent) => {
            if (event.chatId === chatId) {
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some((m) => m.id === event.id)) return prev;
                    return [...prev, event as unknown as Message];
                });
                // Scroll to bottom on new message
                scrollToBottom();
            }
        });

        return unsubscribe;
    }, [chatId]);

    const scrollToBottom = useCallback(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setShowScrollToBottom(!isNearBottom);
    };

    // Auto-scroll on initial load
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            scrollToBottom();
        }
    }, [isLoading, messages.length, scrollToBottom]);

    const formatMessageDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
        return format(date, 'dd/MM/yyyy HH:mm');
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = format(new Date(message.time), 'yyyy-MM-dd');
        if (!groups[date]) groups[date] = [];
        groups[date].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={cn('relative h-full flex flex-col', className)}>
            {/* Enterprise UX: Audited Access Banner */}
            {showAuditBanner && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-10 backdrop-blur-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                        AUDITED ACCESS: Your viewing of this direct message is being logged for compliance.
                    </span>
                </div>
            )}

            <ScrollArea
                ref={scrollRef}
                className="flex-1 h-full"
                onScroll={handleScroll}
            >
                <div className="p-4 space-y-6">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            {/* Date divider */}
                            <div className="flex items-center gap-4 my-4">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">
                                    {isToday(new Date(date))
                                        ? 'Today'
                                        : isYesterday(new Date(date))
                                            ? 'Yesterday'
                                            : format(new Date(date), 'MMMM d, yyyy')}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            {/* Messages */}
                            <div className="space-y-2">
                                {msgs.map((message, index) => {
                                    const showAvatar = index === 0 || msgs[index - 1]?.sender?.id !== message.sender?.id;

                                    return (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                'group flex gap-3 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors',
                                                message.isMe && 'flex-row-reverse'
                                            )}
                                        >
                                            {/* Avatar */}
                                            <div className="w-8 flex-shrink-0">
                                                {showAvatar && (
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(message.sender?.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className={cn('flex-1 min-w-0', message.isMe && 'text-right')}>
                                                {showAvatar && (
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-medium">
                                                            {message.sender?.name || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatMessageDate(message.time)}
                                                        </span>
                                                        {message.pin && (
                                                            <Pin className="w-3 h-3 text-amber-500" />
                                                        )}
                                                    </div>
                                                )}

                                                <p className="text-sm break-words">{message.content}</p>

                                                {/* Reactions */}
                                                {message.reactions && message.reactions.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {message.reactions.map((reaction) => (
                                                            <button
                                                                key={reaction.emoji}
                                                                onClick={() => onReact?.(message.id, reaction.emoji)}
                                                                className={cn(
                                                                    'text-xs px-1.5 py-0.5 rounded-full border',
                                                                    'bg-muted border-transparent'
                                                                )}
                                                            >
                                                                {reaction.emoji} {reaction.count}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions (visible on hover) */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => onReact?.(message.id, '👍')}
                                                >
                                                    <Smile className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => onReply?.(message)}
                                                >
                                                    <Reply className="w-3 h-3" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MoreHorizontal className="w-3 h-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Copy text</DropdownMenuItem>
                                                        <DropdownMenuItem>Pin message</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {isFetching && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Scroll to bottom button */}
            {showScrollToBottom && (
                <Button
                    size="icon"
                    className="absolute bottom-4 right-4 rounded-full shadow-lg"
                    onClick={scrollToBottom}
                >
                    <ArrowDown className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
