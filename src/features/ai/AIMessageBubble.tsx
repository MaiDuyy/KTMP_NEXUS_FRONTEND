'use client';

import { cn } from '@/lib/utils';
import { Bot, User, Bookmark, Copy, Check, AlertCircle, Zap } from 'lucide-react';
import { CitationList } from './CitationList';
import { Button } from '@/components/ui/button';
import type { Citation } from '@/src/redux/feature/aiApi';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIMessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    isStreaming?: boolean;
    timestamp?: string;
    onCitationClick?: (citation: Citation) => void;
    onSave?: () => void;
    className?: string;
    mode?: 'agent' | 'rag';
    error?: boolean;
}



function parseAIResponse(content: string) {
    try {
        const jsonStart = content.indexOf('{');
        if (jsonStart === -1) return null;

        const jsonEnd = content.lastIndexOf('}') + 1;
        if (jsonEnd <= jsonStart) return null;

        return JSON.parse(content.slice(jsonStart, jsonEnd));
    } catch {
        return null;
    }
}
export function AIMessageBubble({
    role,
    content,
    citations = [],
    isStreaming = false,
    timestamp,
    onCitationClick,
    onSave,
    className,
    mode,
    error,
}: AIMessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const isAssistant = role === 'assistant';
    const parsed = isAssistant ? parseAIResponse(content) : null;
    
    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasInsufficientSources = content.toLowerCase().includes('insufficient') ||
        (isAssistant && citations.length === 0 && !isStreaming && content.length > 0);

    return (
        <div
            className={cn(
                'group flex gap-4 w-full py-4 transition-all duration-300 ease-in-out',
                isAssistant ? 'flex-row' : 'flex-row-reverse',
                isAssistant ? 'hover:bg-slate-50/50' : '',
                className
            )}
        >
            {/* Avatar Section */}
            <div className="flex-shrink-0 flex flex-col items-center">
                <div
                    className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105',
                        isAssistant
                            ? mode === 'agent'
                                ? 'bg-gradient-to-tr from-orange-400 via-amber-400 to-yellow-300 text-white shadow-orange-100'
                                : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 text-white shadow-indigo-100'
                            : 'bg-white border border-slate-200 text-slate-600'
                    )}
                >
                    {isAssistant ? (
                        mode === 'agent' ? <Zap className="w-5 h-5 fill-current" /> : <Bot className="w-5 h-5" />
                    ) : (
                        <User className="w-5 h-5" />
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div
                className={cn(
                    'flex-1 flex flex-col min-w-0 max-w-[90%]',
                    isAssistant ? 'items-start' : 'items-end'
                )}
            >
                <div className="flex items-center gap-2 mb-1.5 px-1">
                     {isAssistant ? (
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-slate-900 tracking-tight">
                                 {mode === 'agent' ? 'AI Agent' : 'Trợ lý NEXUS'}
                             </span>
                             {mode && (
                                <span className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                                    mode === 'agent'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-indigo-50 text-indigo-700'
                                )}>
                                    {mode}
                                </span>
                             )}
                        </div>
                     ) : (
                        <span className="text-xs font-semibold text-slate-900 tracking-tight">Bạn</span>
                     )}
                     {timestamp && (
                        <span className="text-[10px] text-slate-400 font-medium">{timestamp}</span>
                     )}
                </div>

                {/* Message Body */}
                <div
                    className={cn(
                        'relative transition-all duration-300',
                        isAssistant
                            ? error
                                ? 'text-red-600 bg-red-50/50 p-4 rounded-2xl border border-red-100'
                                : 'text-slate-800 leading-relaxed'
                            : 'bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md shadow-slate-200 rounded-tr-none'
                    )}
                >
                    <div className={cn(
                        "prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded",
                        isAssistant && "text-slate-800",
                        !isAssistant && "prose-p:text-white prose-strong:text-white prose-headings:text-white"
                    )}>
                        {parsed ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p className="text-base font-medium text-slate-900 leading-snug">
                                    {parsed.summary}
                                </p>

                                <div className="space-y-2 pl-4 border-l-2 border-indigo-100">
                                    {parsed.details?.map((item: string, idx: number) => (
                                        <div key={idx} className="flex gap-2 text-slate-700">
                                            <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>

                                {parsed.sources?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-1">Tài liệu tham khảo</span>
                                        {parsed.sources.map((src: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600 font-medium">
                                                {src}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : isAssistant && isStreaming && content.trim().startsWith('{') ? (
                            <div className="space-y-4 py-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Đang tổng hợp câu trả lời</span>
                                </div>
                                {(() => {
                                    const match = content.match(/"summary":\s*"([^"]*)"/);
                                    const summary = match ? match[1] : content.match(/"summary":\s*"([^"]*)$/)?.[1];
                                    return summary ? (
                                        <p className="text-base font-medium text-slate-900 animate-in fade-in duration-700">
                                            {summary}<span className="inline-block w-1.5 h-5 bg-indigo-500 ml-1 animate-pulse align-middle"></span>
                                        </p>
                                    ) : null;
                                })()}
                            </div>
                        ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content + (isStreaming ? ' \u2588' : '')}
                            </ReactMarkdown>
                        )}
                    </div>

                    {/* Insufficient sources warning */}
                    {hasInsufficientSources && !isStreaming && (
                        <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p>Câu trả lời này dựa trên thông tin hạn chế từ các tài liệu nội bộ hiện có.</p>
                        </div>
                    )}

                    {/* Citations integrated into bubble area for assistant */}
                    {isAssistant && citations.length > 0 && !isStreaming && (
                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <CitationList
                                citations={citations}
                                onCitationClick={onCitationClick}
                            />
                        </div>
                    )}
                </div>

                {/* Bubble Actions */}
                {isAssistant && !isStreaming && content && (
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            onClick={handleCopy}
                            title="Sao chép tin nhắn"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>

                        {onSave && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                onClick={onSave}
                                title="Lưu vào ghi chú"
                            >
                                <Bookmark className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
