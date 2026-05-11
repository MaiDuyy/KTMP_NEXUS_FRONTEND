'use client';

import { useState, useMemo } from 'react';
import { useGetDocumentByIdQuery, useGetDocumentChunksQuery } from '@/src/redux/feature/knowledgeApi';
import type { DocumentChunk } from '@/src/redux/feature/knowledgeApi';
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    FileText,
    ChevronLeft,
    Loader2,
    Calendar,
    User,
    CheckCircle,
    Hash,
    Maximize2,
    Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface DocumentPreviewProps {
    documentId: string;
    showChunks?: boolean;
    className?: string;
}

/**
 * Document preview component with Master-Detail layout.
 * Uses Spring Boot document and chunk endpoints.
 * Chunk shape: { chunkIndex, chunkTitle, text, tokenCount, charCount, similarity }
 */
export function DocumentPreview({
    documentId,
    showChunks = true,
    className,
}: DocumentPreviewProps) {
    const router = useRouter();
    const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);

    const { data: doc, isLoading } = useGetDocumentByIdQuery(documentId);
    const { data: chunksData, isLoading: chunksLoading } = useGetDocumentChunksQuery(
        documentId,
        { skip: !showChunks }
    );

    // Extract chunks from Spring response shape
    const chunks = chunksData?.chunks ?? [];

    const dateFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
    }), []);

    // Get the selected chunk content
    const activeChunk = useMemo(() => {
        if (!chunks.length) return null;
        if (selectedChunkIndex !== null) return chunks.find(c => c.chunkIndex === selectedChunkIndex) ?? null;
        return chunks[0] ?? null;
    }, [chunks, selectedChunkIndex]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12" aria-live="polite">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground motion-reduce:animate-[spin_3s_linear_infinite]" />
            </div>
        );
    }

    if (!doc) {
        return (
            <EmptyState
                icon={FileText}
                title="Document not found"
                description="The document may have been deleted or you don't have access"
                action={{ label: 'Go Back', onClick: () => router.back() }}
            />
        );
    }

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={cn('space-y-6 min-w-0', className)}>
            {/* Header */}
            <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mt-1 hover:bg-muted"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-wrap-balance">
                            {doc.fileName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                {doc.documentType.toUpperCase()}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span className="text-xs text-slate-500">
                                {formatSize(doc.fileSize)}
                            </span>
                            {doc.status === 'COMPLETED' && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                        Indexed ({doc.chunkCount} chunks)
                                    </span>
                                </>
                            )}
                            {doc.status === 'FAILED' && doc.errorMessage && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span className="text-xs text-red-500 font-medium">
                                        Error: {doc.errorMessage}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Layout Grid: Master (Sidebar) & Detail (Content) */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] gap-6 xl:gap-8 items-start min-w-0">
                
                {/* Master Sidebar - Chunk Navigation */}
                <aside className="lg:sticky lg:top-6 space-y-4 order-2 lg:order-1 min-w-0 w-full overflow-hidden">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                            Structure
                        </h2>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                            {chunks.length} CHUNKS
                        </span>
                    </div>

                    <ScrollArea className="h-[calc(100vh-320px)] border rounded-xl bg-white shadow-sm overflow-hidden">
                        {chunksLoading ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground gap-3">
                                <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                                <span className="text-xs">Processing chunks…</span>
                            </div>
                        ) : !chunks.length ? (
                            <div className="p-8 text-center space-y-2">
                                <Hash className="w-8 h-8 mx-auto text-slate-200" aria-hidden="true" />
                                <p className="text-xs text-slate-400">
                                    No chunks available yet.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {chunks.map((chunk, index) => (
                                    <button
                                        key={chunk.chunkIndex}
                                        onClick={() => setSelectedChunkIndex(chunk.chunkIndex)}
                                        className={cn(
                                            'w-full text-left p-4 transition-all group relative',
                                            'hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset outline-none',
                                            activeChunk?.chunkIndex === chunk.chunkIndex 
                                                ? 'bg-indigo-50/50 border-r-4 border-indigo-600' 
                                                : 'border-r-4 border-transparent'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <span className="text-[10px] font-mono text-slate-400 block">
                                                    #{String(chunk.chunkIndex + 1).padStart(3, '0')}
                                                </span>
                                                <h3 className={cn(
                                                    'text-sm font-medium truncate',
                                                    activeChunk?.chunkIndex === chunk.chunkIndex ? 'text-indigo-900' : 'text-slate-700 group-hover:text-slate-900'
                                                )}>
                                                    {chunk.chunkTitle || `Fragment ${chunk.chunkIndex + 1}`}
                                                </h3>
                                                <p className="text-xs text-slate-400 line-clamp-1">
                                                    {chunk.text?.substring(0, 60)}…
                                                </p>
                                            </div>
                                            <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">
                                                {chunk.tokenCount}t
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Meta-Card in Sidebar */}
                    <div className="p-5 bg-slate-900 text-slate-200 rounded-xl space-y-4 shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText className="w-12 h-12" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="space-y-1">
                                <div className="text-[9px] uppercase tracking-tighter text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" aria-hidden="true" />
                                    Created
                                </div>
                                <div className="text-xs font-medium">
                                    {dateFormatter.format(new Date(doc.createdAt))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[9px] uppercase tracking-tighter text-slate-400 flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" aria-hidden="true" />
                                    User ID
                                </div>
                                <div className="text-xs font-medium truncate">{doc.userId}</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Detail Area - Main Content Display */}
                <main className="order-1 lg:order-2 space-y-6 min-w-0 w-full overflow-hidden">
                    {activeChunk ? (
                        <article className="bg-white border rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                        <Hash className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                            {activeChunk.chunkTitle || "Content Fragment"}
                                        </h2>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                            Chunk #{activeChunk.chunkIndex + 1} • {activeChunk.tokenCount} tokens • {activeChunk.charCount} chars
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200">
                                    <Maximize2 className="w-4 h-4 text-slate-400" />
                                </Button>
                            </div>
                            
                            <div className="flex-1 p-8 lg:p-12 leading-relaxed prose prose-slate max-w-none">
                                <div className="text-slate-800 text-lg font-reading space-y-6 break-words">
                                    {activeChunk.text.split('\n\n').map((paragraph, i) => (
                                        <p key={i} className="mb-6 last:mb-0">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <footer className="px-8 py-4 bg-slate-50 border-t flex items-center justify-between text-[11px] text-slate-400">
                                <div className="flex items-center gap-4">
                                    <span>Chunk Index: <b className="text-slate-600">{activeChunk.chunkIndex}</b></span>
                                    <span>Tokens: <b className="text-slate-600">{activeChunk.tokenCount}</b></span>
                                </div>
                                {activeChunk.similarity !== undefined && activeChunk.similarity > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-3 h-3" />
                                        <span>Similarity: <b className="text-slate-600">{(activeChunk.similarity * 100).toFixed(1)}%</b></span>
                                    </div>
                                )}
                            </footer>
                        </article>
                    ) : (
                        <div className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-slate-300 gap-4">
                            <Loader2 className="w-12 h-12 animate-spin-slow opacity-20" />
                            <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Reading Area…</p>
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
}
