'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGetConversationMessagesQuery, useChatWithRagMutation } from '@/src/redux/feature/aiApi';
import type { ChatMessage, Citation } from '@/src/redux/feature/aiApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AIMessageBubble } from './AIMessageBubble';
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Send, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIMessageLocal {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    citations?: any[];
}

interface AIChatWindowProps {
    conversationId: number;
    className?: string;
}

export function AIChatWindow({ conversationId, className }: AIChatWindowProps) {
    const [messages, setMessages] = useState<AIMessageLocal[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollEndRef = useRef<HTMLDivElement>(null);

    const { data: history, isFetching } = useGetConversationMessagesQuery(conversationId);
    const [chatWithRag] = useChatWithRagMutation();

    useEffect(() => {
        if (history) {
            setMessages(history.map((m: ChatMessage) => ({
                id: m.id?.toString() || `hist-${Math.random()}`,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: m.createdAt || new Date().toISOString()
            })));
        }
    }, [history, conversationId]);

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    const handleSubmit = async () => {
        if (!input.trim() || isStreaming) return;

        const userMsgContent = input.trim();
        setInput('');

        setMessages(prev => [...prev, {
            id: `usr-${Date.now()}`,
            role: 'user',
            content: userMsgContent,
            timestamp: new Date().toISOString()
        }]);

        const streamingAssistantId = `ast-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: streamingAssistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString()
        }]);
        setIsStreaming(true);

        try {
            const response = await chatWithRag({ message: userMsgContent, conversationId }).unwrap();

            let resolvedContent = '';
            if (typeof response === 'string') {
                resolvedContent = (response as string)
                    .replace(/^data:\s*/gm, '')
                    .replace(/\[DONE\]/g, '')
                    .trim();
            } else if (response && (response as any).content !== undefined) {
                resolvedContent = (response as any).content;
            } else {
                resolvedContent = 'No response from AI';
            }

            setMessages(prev => prev.map(m =>
                m.id === streamingAssistantId ? { ...m, content: resolvedContent } : m
            ));
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => prev.map(m =>
                m.id === streamingAssistantId
                    ? { ...m, content: 'Đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại.' }
                    : m
            ));
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Citation click: CitationList <Link> handles primary navigation.
    // This callback is for optional side-effects (e.g., analytics).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleCitationClick = useCallback((_citation: Citation) => {
        // no-op: navigation delegated to CitationList <Link>
    }, []);

    if (isFetching && messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-primary/60" />
                <span className="text-sm font-medium">Tải lịch sử trò chuyện...</span>
            </div>
        );
    }

    return (
        <div className={cn('flex-1 flex flex-col min-h-0 h-full bg-background relative overflow-hidden', className)}>
            {/* Fade top */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

            {/* Chat History */}
            <ScrollArea className="flex-1 min-h-0 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto py-12 space-y-1">
                    {messages.length === 0 ? (
                        // ── Empty / Welcome State ──────────────────────────────
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-6">
                                <Sparkles className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                                Tôi có thể giúp gì cho bạn?
                            </h2>
                            <p className="text-muted-foreground max-w-md leading-relaxed mb-7 text-sm font-medium">
                                Tôi là Trợ lý AI Nội bộ của NEXUS. Tôi có thể giúp bạn tìm kiếm tài liệu công ty,
                                tóm tắt kiến thức hoặc trả lời các câu hỏi kỹ thuật.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {[
                                    'Tìm kiếm chính sách nhân sự',
                                    'Tóm tắt dự án mới nhất',
                                    'Hướng dẫn kỹ thuật',
                                ].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className={cn(
                                            'px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer',
                                            'bg-card border border-border text-foreground',
                                            'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
                                            'transition-colors duration-150'
                                        )}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1 pb-32">
                            {messages.map((message) => (
                                <AIMessageBubble
                                    key={message.id}
                                    role={message.role}
                                    content={message.content}
                                    citations={message.citations}
                                    isStreaming={isStreaming && message.id.startsWith('ast-') && message === messages[messages.length - 1]}
                                    timestamp={new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    onCitationClick={handleCitationClick}
                                />
                            ))}
                            <div ref={scrollEndRef} className="h-1" />
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* ── Input Bar ─────────────────────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-2 z-20 pointer-events-none bg-gradient-to-t from-background via-background/95 to-transparent">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    <div
                        className={cn(
                            'relative flex items-end gap-2',
                            'bg-card border border-border rounded-xl shadow-sm',
                            'ring-0 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/60',
                            'transition-all duration-200 overflow-hidden'
                        )}
                    >
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Hỏi Trợ lý NEXUS về tri thức nội bộ..."
                            className={cn(
                                'min-h-[52px] max-h-44 flex-1 bg-transparent border-0',
                                'focus-visible:ring-0 focus-visible:ring-offset-0',
                                'py-3.5 pl-4 pr-2 text-sm font-medium',
                                'placeholder:text-muted-foreground resize-none custom-scrollbar'
                            )}
                            disabled={isStreaming}
                        />

                        <div className="flex items-center pb-2 pr-2">
                            <Button
                                onClick={isStreaming ? () => setIsStreaming(false) : handleSubmit}
                                disabled={!input.trim() && !isStreaming}
                                size="icon"
                                className={cn(
                                    'h-9 w-9 rounded-lg shrink-0 transition-all duration-200',
                                    isStreaming
                                        ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                                        : 'bg-primary hover:bg-primary/90 text-primary-foreground',
                                    'disabled:opacity-40'
                                )}
                            >
                                {isStreaming ? (
                                    <StopCircle className="w-4 h-4" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium tracking-wide">
                        Trợ lý Tri thức Nội bộ · AI có thể mắc sai sót
                    </p>
                </div>
            </div>
        </div>
    );
}
