'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetConversationsQuery, useCreateConversationMutation, useDeleteConversationMutation } from '@/src/redux/feature/aiApi';
import { AIChatWindow } from '@/src/features/ai';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Loader2, Trash2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatTitle = (title: string) => {
    if (!title) return '';
    let clean = title;

    // 1. Handle JSON
    if (clean.startsWith('{')) {
        try {
            const parsed = JSON.parse(clean);
            clean = parsed.summary || clean;
        } catch { /* skip */ }
    }

    // 2. Handle label-style string: "summary: Title, details: ..."
    const lower = clean.toLowerCase();
    if (lower.includes('summary:')) {
        const start = lower.indexOf('summary:') + 8;
        let end = lower.indexOf('details:');
        if (end === -1) end = lower.indexOf(', details:');
        if (end === -1) end = clean.length;
        if (end > start) clean = clean.substring(start, end);
    }

    // 3. Final cleanup
    return clean.replace(/[{}"\\[\]]|summary:|details:|sources:/g, '').trim().replace(/,$/, '').trim();
};

// ─── Sidebar width bounds ────────────────────────────────────────────────────
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 340;
const SIDEBAR_DEFAULT = 248;

export default function AIPage() {
    const { data: conversations, isLoading } = useGetConversationsQuery();
    const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();
    const [deleteConversation] = useDeleteConversationMutation();

    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleCreate = async () => {
        try {
            const newConv = await createConversation({ title: 'Cuộc hội thoại mới', chatId: 'standalone' }).unwrap();
            setActiveConvId(newConv.id);
        } catch (error) {
            console.error('Failed to create conversation', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await deleteConversation(id).unwrap();
            if (activeConvId === id) setActiveConvId(null);
        } catch (error) {
            console.error('Failed to delete conversation', error);
        }
    };

    // ─── Sidebar resize ──────────────────────────────────────────────────────
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            if (newWidth > SIDEBAR_MIN && newWidth < SIDEBAR_MAX) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'h-[calc(100vh-4rem)] flex min-w-0 overflow-hidden bg-background relative',
                isResizing && 'select-none cursor-col-resize'
            )}
        >
            {/* ── Conversations Sidebar ────────────────────────────────────── */}
            <aside
                className="border-r border-border bg-card flex flex-col min-w-0 shrink-0 relative"
                style={{ width: `${sidebarWidth}px` }}
            >
                {/* Header: New conversation */}
                <div className="px-3 py-2.5 border-b border-border shrink-0">
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating}
                        size="sm"
                        className={cn(
                            'w-full h-8 gap-1.5 text-xs font-semibold rounded-md',
                            'bg-primary hover:bg-primary/90 text-primary-foreground'
                        )}
                    >
                        {isCreating
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Plus className="w-3.5 h-3.5" />
                        }
                        Cuộc trò chuyện mới
                    </Button>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="px-2 py-2 space-y-0.5">
                        {/* Section Label */}
                        <div className="px-2 pb-1.5 pt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none">
                            Gần đây
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-[11px]">Đang tải...</span>
                            </div>
                        ) : conversations?.length === 0 ? (
                            <div className="py-8 px-3 text-center">
                                <MessageSquare className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Chưa có cuộc trò chuyện nào.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-px">
                                {conversations?.map((conv) => {
                                    const isActive = activeConvId === conv.id;
                                    return (
                                        <li key={conv.id}>
                                            <button
                                                onClick={() => setActiveConvId(conv.id)}
                                                title={formatTitle(conv.title) || 'Cuộc trò chuyện'}
                                                className={cn(
                                                    'w-full flex items-center justify-between pl-2 pr-1 py-1.5 rounded-md text-left',
                                                    'transition-colors duration-150 cursor-pointer group',
                                                    isActive
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'text-foreground hover:bg-muted'
                                                )}
                                            >
                                                {/* Icon + Title */}
                                                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                                    <MessageSquare className={cn(
                                                        'w-3.5 h-3.5 shrink-0 transition-colors',
                                                        isActive ? 'text-primary' : 'text-muted-foreground'
                                                    )} />
                                                    <span className={cn(
                                                        'truncate text-[12px] font-medium leading-none',
                                                        isActive ? 'text-primary' : 'text-foreground'
                                                    )}>
                                                        {formatTitle(conv.title) || 'Cuộc trò chuyện'}
                                                    </span>
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'h-5 w-5 flex items-center justify-center rounded shrink-0 ml-1',
                                                        'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                                                        'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                                    )}
                                                    onClick={(e) => handleDelete(e, conv.id)}
                                                    aria-label="Xóa cuộc trò chuyện"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </ScrollArea>

                {/* Resize Handle */}
                <div
                    className={cn(
                        'absolute top-0 right-0 w-0.5 h-full z-30 cursor-col-resize',
                        'hover:bg-primary/40 transition-colors duration-150',
                        isResizing && 'bg-primary/60'
                    )}
                    onMouseDown={startResizing}
                />
            </aside>

            {/* ── AI Chat Area ─────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
                {activeConvId ? (
                    <AIChatWindow conversationId={activeConvId} />
                ) : (
                    /* Empty / Welcome */
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 animate-in fade-in duration-500">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bot className="w-7 h-7 text-primary" />
                        </div>
                        <div className="text-center space-y-1.5 max-w-xs">
                            <h2 className="text-base font-semibold text-foreground tracking-tight">
                                Trung tâm AI Doanh nghiệp
                            </h2>
                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                                Chọn một cuộc trò chuyện từ thanh bên hoặc bắt đầu cuộc trò chuyện mới với Trợ lý AI.
                            </p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating}
                            size="sm"
                            className="h-8 px-4 text-xs font-semibold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                        >
                            {isCreating
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Plus className="w-3.5 h-3.5" />
                            }
                            Bắt đầu trò chuyện mới
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
