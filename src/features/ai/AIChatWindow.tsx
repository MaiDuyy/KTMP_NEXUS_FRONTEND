'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGetConversationMessagesQuery, useChatWithRagMutation } from '@/src/redux/feature/aiApi';
import type { ChatMessage } from '@/src/redux/feature/aiApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AIMessageBubble } from './AIMessageBubble';
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Send, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();
    const [messages, setMessages] = useState<AIMessageLocal[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversation history natively from Spring Boot DB
    const { data: history, isFetching } = useGetConversationMessagesQuery(conversationId);
    // const [searchChunks] = useSearchChunksMutation();
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

    // Auto-scroll to bottom
    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    const handleSubmit = async () => {
        if (!input.trim() || isStreaming) return;

        const userMsgContent = input.trim();
        setInput('');

        // 1. Optimistic UI Append (User)
        setMessages(prev => [...prev, {
            id: `usr-${Date.now()}`,
            role: 'user',
            content: userMsgContent,
            timestamp: new Date().toISOString()
        }]);

        // 2. Initialize Empty Assistant Bubble
        const streamingAssistantId = `ast-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: streamingAssistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString()
        }]);
        setIsStreaming(true);

        // 3a. Parallel: Fetch explicitly cited chunks so the UI can render Citation Cards
        // searchChunks({ query: userMsgContent, topK: 3 }).unwrap().then((searchRes) => {
        //     const mappedCitations = searchRes.chunks.map(c => ({
        //         documentId: c.documentId.toString(),
        //         title: c.fileName + (c.chunkTitle ? ` > ${c.chunkTitle}` : ''),
        //         classification: 'Internal Document',
        //         sourceType: 'knowledge-base',
        //         relevanceScore: Math.round(c.similarity * 100),
        //         chunk: c.text
        //     }));

        //     // Attach citations to the assistant message
        //     setMessages(prev => prev.map(m =>
        //         m.id === streamingAssistantId ? { ...m, citations: mappedCitations } : m
        //     ));
        // }).catch(err => console.error("Citation Fetch Error:", err));

        try {
            // 3b. Use standard RTK Query mutation to trigger RAG chat block
            const response = await chatWithRag({ message: userMsgContent, conversationId }).unwrap();

            // Re-map actual content back
            let resolvedContent = '';
            if (typeof response === 'string') {
                // Backward compatibility: strip SSE framing more aggressively
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
                m.id === streamingAssistantId
                    ? { ...m, content: resolvedContent }
                    : m
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

    const handleCitationClick = useCallback((citation: any) => {
        if (citation?.documentId) router.push(`/knowledge/${citation.documentId}`);
    }, [router]);

    if (isFetching && messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Tải lịch sử trò chuyện...</span>
            </div>
        );
    }

    return (
        <div className={cn('flex-1 flex flex-col min-h-0 h-full bg-[#fdfdfd] relative overflow-hidden', className)}>
            {/* Header / Backdrop Blur Effect for Top */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />

            {/* Chat History Area */}
            <ScrollArea className="flex-1 min-h-0 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto py-12 space-y-2">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-700">
                            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100 mb-8 transform -rotate-6">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                                Tôi có thể giúp gì cho bạn hôm nay?
                            </h2>
                            <p className="text-slate-500 max-w-md leading-relaxed mb-8 font-medium">
                                Tôi là Trợ lý AI Nội bộ của NEXUS. Tôi có thể giúp bạn tìm kiếm tài liệu công ty, tóm tắt kiến thức hoặc trả lời các câu hỏi kỹ thuật.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    'Tìm kiếm chính sách nhân sự',
                                    'Tóm tắt dự án mới nhất',
                                    'Hướng dẫn kỹ thuật'
                                ].map(suggestion => (
                                    <button 
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all duration-200 shadow-sm"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 pb-32">
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

            {/* Input Area - Floating & Centered */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    <div className="relative group">
                        {/* Glow effect on hover */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-500" />
                        
                        <div className="relative bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden transition-all duration-300 group-focus-within:border-indigo-300 group-focus-within:shadow-indigo-100">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi Trợ lý NEXUS về tri thức nội bộ..."
                                className="min-h-[60px] max-h-48 w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-4 pl-5 pr-14 text-base font-medium placeholder:text-slate-400 resize-none custom-scrollbar"
                                disabled={isStreaming}
                            />
                            
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <Button
                                    onClick={isStreaming ? () => setIsStreaming(false) : handleSubmit}
                                    disabled={!input.trim() && !isStreaming}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-xl transition-all duration-300 shadow-sm",
                                        isStreaming 
                                            ? "bg-slate-900 hover:bg-slate-800 text-white" 
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white scale-100 active:scale-95"
                                    )}
                                >
                                    {isStreaming ? (
                                        <StopCircle className="w-5 h-5" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 text-center mt-3 font-semibold tracking-wide uppercase">
                        Trợ lý Tri thức Nội bộ ΓÇó AI có thể mắc sai sót
                    </p>
                </div>
            </div>
        </div>
    );
}
