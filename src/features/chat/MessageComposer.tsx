'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { socketManager } from '@/src/lib/socket';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Paperclip,
    Send,
    Smile,
    AtSign,
    Sparkles,
    X,
    Image as ImageIcon,
    File as FileIcon,
    Loader2,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSendMessageMutation } from '@/src/redux/feature/messageApi';
import { MentionSelector } from './MentionSelector';

interface ReplyTo {
    id: string;
    content: string;
    senderName: string;
}

interface MessageComposerProps {
    chatId: string;
    replyTo?: ReplyTo | null;
    onCancelReply?: () => void;
    onAITrigger?: () => void;
    className?: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

/**
 * Message composer with attachments, emoji, mentions, and AI trigger
 */
export function MessageComposer({
    chatId,
    replyTo,
    onCancelReply,
    onAITrigger,
    className,
}: MessageComposerProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [showMentions, setShowMentions] = useState(false);
    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

    const handleSend = async () => {
        const trimmedContent = content.trim();
        if (!trimmedContent || isSending) return;

        try {
            await sendMessage({
                chatId,
                data: {
                    content: trimmedContent,
                    type: 'text',
                    replyToId: replyTo?.id,
                },
            }).unwrap();

            setContent('');
            setShowMentions(false);
            onCancelReply?.();
            textareaRef.current?.focus();

            // Stop typing indicator
            socketManager.sendTyping(chatId, false);
            setIsTyping(false);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === 'Escape' && showMentions) {
            setShowMentions(false);
        }
    };

    const handleContentChange = (value: string) => {
        const lastChar = value[value.length - 1];
        const prevChar = value[value.length - 2];

        // Trigger mentions when '@' is typed after space or at start
        if (lastChar === '@' && (!prevChar || prevChar === ' ')) {
            setShowMentions(true);
        } else if (showMentions && (lastChar === ' ' || value.length === 0)) {
            setShowMentions(false);
        }

        setContent(value);

        // Send typing indicator
        if (!isTyping) {
            setIsTyping(true);
            socketManager.sendTyping(chatId, true);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            socketManager.sendTyping(chatId, false);
            setIsTyping(false);
        }, 2000);
    };

    const handleMentionSelect = (user: any) => {
        const lastAtIndex = content.lastIndexOf('@');
        const beforeAt = content.substring(0, lastAtIndex);
        const mentionText = user.accountId === 'here' || user.accountId === 'channel' 
            ? `@${user.name} ` 
            : `@[${user.name}](${user.accountId}) `;
        
        setContent(beforeAt + mentionText);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const insertEmoji = (emoji: string) => {
        setContent((prev) => prev + emoji);
        textareaRef.current?.focus();
    };

    const handleAITrigger = () => {
        onAITrigger?.();
    };

    return (
        <div className={cn('border-t bg-background p-3', className)}>
            {/* Reply indicator */}
            {replyTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                        <span className="text-muted-foreground">Replying to </span>
                        <span className="font-medium">{replyTo.senderName}</span>
                        <p className="text-muted-foreground truncate">{replyTo.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Main composer */}
            <div className="flex items-end gap-2">
                {/* Attachment button */}
                <TooltipProvider>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Attach file</TooltipContent>
                            </Tooltip>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-48 p-2">
                            <div className="space-y-1">
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Photo/Video
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-2">
                                    <FileIcon className="w-4 h-4" />
                                    Document
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </TooltipProvider>

                {/* Text input */}
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="min-h-[44px] max-h-[200px] resize-none pr-24"
                        rows={1}
                    />

                    {/* Inline actions */}
                    <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
                        {/* Emoji picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Smile className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="end" className="w-auto p-2">
                                <div className="flex gap-1">
                                    {EMOJI_LIST.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => insertEmoji(emoji)}
                                            className="text-lg hover:bg-muted p-1 rounded"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Mention */}
                        <Popover open={showMentions} onOpenChange={setShowMentions}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <AtSign className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="start" className="w-auto p-0 border-none shadow-none">
                                <MentionSelector 
                                    chatId={chatId} 
                                    onSelect={handleMentionSelect} 
                                    onClose={() => setShowMentions(false)} 
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* AI Assistant trigger */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={handleAITrigger}
                            >
                                <Sparkles className="w-4 h-4 text-purple-500" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ask AI</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Send button */}
                <Button
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleSend}
                    disabled={!content.trim() || isSending}
                >
                    {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
