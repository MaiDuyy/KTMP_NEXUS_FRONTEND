'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetConversationsQuery, useCreateConversationMutation, useDeleteConversationMutation } from '@/src/redux/feature/aiApi';
import { AIChatWindow } from '@/src/features/ai';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Loader2, Trash2 } from 'lucide-react';
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
        
        if (end > start) {
            clean = clean.substring(start, end);
        }
    }
    
    // 3. Final cleanup
    return clean.replace(/[{}\"\\[\\]]|summary:|details:|sources:/g, '').trim().replace(/,$/, '').trim();
};

export default function AIPage() {
    const { data: conversations, isLoading } = useGetConversationsQuery();
    const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();
    const [deleteConversation] = useDeleteConversationMutation();
    
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(320);
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

    // Sidebar resize logic
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            if (newWidth > 200 && newWidth < 600) {
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
        <div ref={containerRef} className="h-[calc(100vh-4rem)] flex min-w-0 overflow-hidden bg-slate-50 relative">
            {/* Conversations Sidebar */}
            <aside 
                className="border-r bg-white flex flex-col min-w-0 shrink-0 relative transition-colors duration-200"
                style={{ width: `${sidebarWidth}px` }}
            >
                <div className="p-4 border-b">
                    <Button 
                        onClick={handleCreate} 
                        disabled={isCreating} 
                        className="w-full gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Cuộc trò chuyện mới
                    </Button>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-3 space-y-4">
                        <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Trò chuyện gần đây
                        </div>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin mb-2" />
                                <span className="text-xs">Đang tải...</span>
                            </div>
                        ) : conversations?.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                Chưa có cuộc trò chuyện nào.
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {conversations?.map((conv) => (
                                    <li key={conv.id}>
                                        <button
                                            onClick={() => setActiveConvId(conv.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all group",
                                                activeConvId === conv.id 
                                                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100" 
                                                    : "hover:bg-slate-50 text-slate-600 border border-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                    activeConvId === conv.id ? "bg-white" : "bg-slate-100 group-hover:bg-white"
                                                )}>
                                                    <MessageSquare className={cn(
                                                        "w-4 h-4",
                                                        activeConvId === conv.id ? "text-indigo-600" : "text-slate-400"
                                                    )} />
                                                </div>
                                                <span className="truncate">{formatTitle(conv.title)}</span>
                                            </div>
                                            <Button
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                onClick={(e) => handleDelete(e, conv.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </ScrollArea>

                {/* Resize Handle */}
                <div 
                    className={cn(
                        "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 transition-colors z-30",
                        isResizing && "bg-indigo-500 w-0.5"
                    )}
                    onMouseDown={startResizing}
                />
            </aside>

            {/* AI Chat Window */}
            <main className="flex-1 flex flex-col min-w-0 bg-white relative shadow-inner">
                {activeConvId ? (
                    <AIChatWindow conversationId={activeConvId} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto text-center space-y-6 animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-2 shadow-sm border border-slate-100">
                            <MessageSquare className="w-10 h-10 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Trung tâm AI Doanh nghiệp</h2>
                            <p className="text-sm leading-relaxed font-medium">Chọn một cuộc trò chuyện từ thanh bên để bắt đầu làm việc với Trợ lý AI về các tài liệu và tri thức nội bộ.</p>
                        </div>
                        <Button 
                            onClick={handleCreate}
                            variant="outline"
                            className="rounded-xl px-6 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                        >
                            Bắt đầu trò chuyện mới
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
