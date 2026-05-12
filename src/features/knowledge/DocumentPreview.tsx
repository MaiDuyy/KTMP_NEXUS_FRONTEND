'use client';

import { useState, useMemo } from 'react';
import { useGetDocumentByIdQuery, useGetDocumentChunksQuery } from '@/src/redux/feature/knowledgeApi';
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    FileText,
    ChevronLeft,
    Loader2,
    Calendar,
    User,
    CheckCircle2,
    Hash,
    Maximize2,
    Tag,
    Info,
    Layers,
    Type,
    Clock,
    FileType2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface DocumentPreviewProps {
    documentId: string;
    showChunks?: boolean;
    className?: string;
}

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

    const chunks = chunksData?.chunks ?? [];

    const activeChunk = useMemo(() => {
        if (!chunks.length) return null;
        if (selectedChunkIndex !== null) return chunks.find(c => c.chunkIndex === selectedChunkIndex) ?? null;
        return chunks[0] ?? null;
    }, [chunks, selectedChunkIndex]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <FileText className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-slate-900">Retrieving Document</h3>
                    <p className="text-sm text-slate-500">Preparing high-fidelity preview...</p>
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <EmptyState
                icon={FileText}
                title="Document not found"
                description="The document may have been deleted or moved. Please check your knowledge base."
                action={{ label: 'Back to Knowledge Base', onClick: () => router.push('/knowledge') }}
            />
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-slate-500 hover:text-slate-900 gap-2 pl-0 hover:bg-transparent"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Knowledge Base
                </Button>
                
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        {doc.documentType.toUpperCase()}
                    </Badge>
                    {doc.status === 'COMPLETED' && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 shadow-none">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Indexed
                        </Badge>
                    )}
                </div>
            </div>

            {/* Document Title Section */}
            <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {doc.fileName}
                </h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5" />
                        Added on {format(new Date(doc.createdAt), 'MMMM d, yyyy')}
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {doc.chunkCount} Fragments
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        {formatSize(doc.fileSize)}
                    </span>
                </div>
            </div>

            {/* Main Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
                
                {/* Navigation Sidebar */}
                <aside className="lg:sticky lg:top-8 space-y-6 order-2 lg:order-1">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Document Structure
                            </h2>
                            <span className="text-[10px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded">
                                {chunks.length}
                            </span>
                        </div>

                        <ScrollArea className="h-[500px] border border-slate-200 rounded-xl bg-slate-50/30 shadow-inner">
                            {chunksLoading ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-slate-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Analyzing Chunks</span>
                                </div>
                            ) : !chunks.length ? (
                                <div className="p-12 text-center space-y-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                        <Hash className="w-6 h-6 text-slate-200" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Indexing in progress...
                                    </p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {chunks.map((chunk) => (
                                        <button
                                            key={chunk.chunkIndex}
                                            onClick={() => setSelectedChunkIndex(chunk.chunkIndex)}
                                            className={cn(
                                                'w-full text-left px-4 py-3 rounded-lg transition-all group relative border border-transparent',
                                                activeChunk?.chunkIndex === chunk.chunkIndex 
                                                    ? 'bg-white border-slate-200 shadow-sm ring-1 ring-slate-100' 
                                                    : 'hover:bg-slate-100/80 text-slate-600'
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors",
                                                    activeChunk?.chunkIndex === chunk.chunkIndex 
                                                        ? 'bg-primary text-white' 
                                                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                                                )}>
                                                    {chunk.chunkIndex + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={cn(
                                                        'text-xs font-semibold truncate transition-colors',
                                                        activeChunk?.chunkIndex === chunk.chunkIndex ? 'text-slate-900' : 'text-slate-700'
                                                    )}>
                                                        {chunk.chunkTitle || `Fragment ${chunk.chunkIndex + 1}`}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                                        {chunk.text?.substring(0, 45)}...
                                                    </p>
                                                </div>
                                                {activeChunk?.chunkIndex === chunk.chunkIndex && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Metadata Card */}
                    <Card className="p-5 border-slate-200 shadow-none bg-slate-50 space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Info className="w-3 h-3" />
                            Technical Properties
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 flex items-center gap-2">
                                    <FileType2 className="w-3 h-3" /> Format
                                </span>
                                <span className="text-xs font-bold text-slate-900 uppercase font-mono">{doc.documentType}</span>
                            </div>
                            <Separator className="bg-slate-200/50" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Tokenizer
                                </span>
                                <span className="text-xs font-bold text-slate-900 uppercase font-mono">Tiktoken/gpt-4</span>
                            </div>
                            <Separator className="bg-slate-200/50" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Owner ID
                                </span>
                                <span className="text-xs font-bold text-slate-900 truncate max-w-[120px] font-mono">{doc.userId}</span>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Content Detail Area */}
                <main className="order-1 lg:order-2 space-y-6">
                    {activeChunk ? (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Hash className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                                            {activeChunk.chunkTitle || `Fragment ${activeChunk.chunkIndex + 1}`}
                                        </h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            {activeChunk.tokenCount} Tokens • {activeChunk.charCount} Characters
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 rounded-full">
                                    <Maximize2 className="w-4 h-4" />
                                </Button>
                            </header>
                            
                            <div className="flex-1 p-10 lg:p-14 overflow-y-auto">
                                <div className="max-w-3xl mx-auto">
                                    <div className="text-slate-800 text-lg leading-[1.8] font-medium space-y-8 select-text selection:bg-primary/20">
                                        {activeChunk.text.split('\n\n').map((paragraph, i) => (
                                            <p key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-500 delay-75">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <footer className="px-10 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-tight text-slate-400">
                                <div className="flex items-center gap-6">
                                    <span className="flex items-center gap-2">
                                        Index <b className="text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded">{activeChunk.chunkIndex}</b>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        Word Count <b className="text-slate-900">{activeChunk.text.split(/\s+/).length}</b>
                                    </span>
                                </div>
                                {activeChunk.similarity !== undefined && activeChunk.similarity > 0 && (
                                    <Badge variant="outline" className="text-[10px] bg-white border-slate-200 gap-1.5 text-slate-600 px-2 py-0.5 shadow-none hover:bg-white">
                                        <Tag className="w-3 h-3" />
                                        {(activeChunk.similarity * 100).toFixed(1)}% Relevance
                                    </Badge>
                                )}
                            </footer>
                        </div>
                    ) : (
                        <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary/20 animate-spin" />
                                <Layers className="w-6 h-6 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Initializing Preview</p>
                                <p className="text-sm text-slate-300">Synchronizing data fragments...</p>
                            </div>
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
}
