'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    useGetDocumentChunksQuery,
    useGetDocumentStatsQuery,
    useSearchChunksMutation,
    DocumentChunk,
    ChunkSearchResult
} from '@/src/redux/feature/knowledgeApi';
import {
    Layers,
    Search,
    Cpu,
    FileText,
    Database,
    Sparkles,
    X,
    ChevronRight,
    Sliders,
    Copy,
    Check,
    Info,
    AlertCircle,
    Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '../knowledge';

interface ChunkInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: number;
    fileName: string;
}

export function ChunkInspectorModal({
    isOpen,
    onClose,
    documentId,
    fileName,
}: ChunkInspectorModalProps) {
    const [activeTab, setActiveTab] = useState<'inspector' | 'playground'>('inspector');
    const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);
    const [copiedChunkId, setCopiedChunkId] = useState<number | null>(null);

    // RAG Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [topK, setTopK] = useState<number>(5);
    const [minSimilarity, setMinSimilarity] = useState<number>(0.6);
    const [searchResults, setSearchResults] = useState<ChunkSearchResult[]>([]);
    const [selectedSearchResultIndex, setSelectedSearchResultIndex] = useState<number | null>(null);

    // Queries
    const { 
        data: chunksData, 
        isLoading: isChunksLoading, 
        error: chunksError 
    } = useGetDocumentChunksQuery(documentId.toString(), { skip: !isOpen || activeTab !== 'inspector' });

    const { 
        data: statsData, 
        isLoading: isStatsLoading 
    } = useGetDocumentStatsQuery(documentId.toString(), { skip: !isOpen || activeTab !== 'inspector' });

    const [searchChunks, { isLoading: isSearching }] = useSearchChunksMutation();

    const chunks = chunksData?.chunks || [];
    const selectedChunk = chunks.find(c => c.chunkIndex === selectedChunkIndex) || chunks[0];

    useEffect(() => {
        if (chunks.length > 0 && selectedChunkIndex >= chunks.length) {
            setSelectedChunkIndex(0);
        }
    }, [chunks, selectedChunkIndex]);

    const handleCopyText = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedChunkId(index);
        toast.success('Đã sao chép nội dung phân mảnh vào clipboard!');
        setTimeout(() => setCopiedChunkId(null), 2000);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast.error('Vui lòng nhập câu hỏi thử nghiệm');
            return;
        }

        try {
            const response = await searchChunks({
                query: searchQuery,
                topK,
                minSimilarity,
            }).unwrap();

            // Filter results for this document only, to maintain playground focus (or show all with highlighting)
            setSearchResults(response.chunks || []);
            setSelectedSearchResultIndex(response.chunks && response.chunks.length > 0 ? 0 : null);
            toast.success(`Tìm thấy ${response.totalResults} phân mảnh tương đồng!`);
        } catch (err: any) {
            console.error('Search error:', err);
            toast.error(err.data?.message || 'Có lỗi xảy ra khi truy vấn dữ liệu');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-7xl h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-background text-foreground border border-border shadow-lg rounded-xl">
                {/* Header */}
                <DialogHeader className="px-4 py-2.5 border-b border-border bg-slate-50/60 dark:bg-slate-900/40 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 shadow-sm">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-2">
                                Phân mảnh tri thức & RAG Playground
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-2xl truncate font-mono">
                                File: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{fileName}</span> (ID: {documentId})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="flex items-center bg-slate-100/60 dark:bg-slate-800/40 p-0.5 rounded-lg border border-border">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab('inspector')}
                                className={cn(
                                    "rounded-md px-3 py-0.5 h-7 text-[10px] font-bold gap-1.5 transition-all cursor-pointer",
                                    activeTab === 'inspector' 
                                        ? "bg-background text-foreground shadow-sm border border-border" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Database className="w-3 h-3 text-emerald-500" />
                                Chunk Inspector
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab('playground')}
                                className={cn(
                                    "rounded-md px-3 py-0.5 h-7 text-[10px] font-bold gap-1.5 transition-all cursor-pointer",
                                    activeTab === 'playground' 
                                        ? "bg-background text-foreground shadow-sm border border-border" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                RAG Playground
                            </Button>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose}
                            className="rounded-lg h-7 w-7 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-background">
                    {activeTab === 'inspector' ? (
                        /* ================== TAB 1: CHUNK INSPECTOR ================== */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Summary Stats Strip */}
                            <div className="px-4 py-2.5 border-b border-border bg-slate-50/20 dark:bg-slate-900/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
                                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                                        <Layers className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Tổng phân mảnh</p>
                                        <p className="text-base font-bold text-foreground mt-0.5">{statsData?.totalChunks ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
                                        <Cpu className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Tổng Vector Tokens</p>
                                        <p className="text-base font-bold text-foreground mt-0.5">
                                            {statsData?.totalTokens ? statsData.totalTokens.toLocaleString('vi-VN') : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Tổng ký tự</p>
                                        <p className="text-base font-bold text-foreground mt-0.5">
                                            {statsData?.totalCharacters ? statsData.totalCharacters.toLocaleString('vi-VN') : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
                                    <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/20">
                                        <Activity className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Tokens / chunk</p>
                                        <p className="text-base font-bold text-foreground mt-0.5">{statsData?.avgTokensPerChunk ?? '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Split View */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                                {/* Left Side: Chunks List */}
                                <div className="md:col-span-4 border-r border-border h-full flex flex-col bg-slate-50/10 dark:bg-slate-900/5">
                                    <div className="px-3 py-1.5 border-b border-border bg-slate-50/40 dark:bg-slate-900/20 text-[9px] text-muted-foreground font-bold uppercase tracking-wider flex items-center justify-between">
                                        <span>Danh sách Phân mảnh ({chunks.length})</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400">Auto-Chunked</span>
                                    </div>

                                    {isChunksLoading ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <Cpu className="w-6 h-6 animate-spin text-emerald-500/50" />
                                            <span className="text-xs font-semibold">Đang tải phân mảnh...</span>
                                        </div>
                                    ) : chunksError ? (
                                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-muted-foreground text-center gap-2">
                                            <AlertCircle className="w-8 h-8 text-rose-500 opacity-60" />
                                            <div>
                                                <p className="text-xs font-bold text-foreground">Không thể tải phân mảnh</p>
                                                <p className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">
                                                    Tài liệu có thể chưa được phân mảnh hoặc quá trình xử lý gặp lỗi. Vui lòng phê duyệt lại.
                                                </p>
                                            </div>
                                        </div>
                                    ) : chunks.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center p-6 gap-2">
                                            <Database className="w-7 h-7 opacity-20" />
                                            <p className="text-xs font-bold text-foreground">Tài liệu trống</p>
                                            <p className="text-[10px] text-muted-foreground max-w-[200px]">Hãy chạy chức năng "Phê duyệt & Cắt mảnh" trước.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                            {chunks.map((chunk) => {
                                                const isSelected = chunk.chunkIndex === selectedChunkIndex;
                                                return (
                                                    <button
                                                        key={chunk.chunkIndex}
                                                        onClick={() => setSelectedChunkIndex(chunk.chunkIndex)}
                                                        className={cn(
                                                            "w-full text-left p-2.5 transition-all flex flex-col gap-1 border-l-2 cursor-pointer",
                                                            isSelected 
                                                                ? "bg-slate-100 dark:bg-slate-800/60 border-l-emerald-500 text-foreground font-medium" 
                                                                : "border-l-transparent text-muted-foreground hover:bg-slate-50/60 dark:hover:bg-slate-850/20 hover:text-foreground"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="text-[9px] font-bold font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 border border-border text-muted-foreground">
                                                                # {chunk.chunkIndex + 1}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <Badge variant="outline" className="text-[8px] font-semibold border-border text-muted-foreground px-1 py-0 rounded-md">
                                                                    {chunk.tokenCount} tokens
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-bold leading-snug line-clamp-2 text-foreground">
                                                            {chunk.chunkTitle || 'Phân mảnh không tiêu đề'}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Chunk Content Viewer */}
                                <div className="md:col-span-8 h-full flex flex-col bg-slate-50/10 dark:bg-slate-900/5 overflow-hidden">
                                    {selectedChunk ? (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Chunk Toolbar */}
                                            <div className="px-4 py-2 border-b border-border bg-slate-50/30 dark:bg-slate-900/20 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                                    <span className="text-muted-foreground">Phân mảnh:</span>
                                                    <span className="text-foreground">{selectedChunk.chunkTitle || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCopyText(selectedChunk.text, selectedChunk.chunkIndex)}
                                                        className="rounded-lg border-border bg-background hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground h-7 text-[10px] px-2.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                    >
                                                        {copiedChunkId === selectedChunk.chunkIndex ? (
                                                            <>
                                                                <Check className="w-3 h-3 text-emerald-500" />
                                                                Đã sao chép
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3 h-3 text-muted-foreground" />
                                                                Sao chép nội dung
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Chunk Reading Space */}
                                            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                                <div className="bg-slate-50/30 dark:bg-slate-950/40 border border-border rounded-xl p-4 shadow-sm select-text selection:bg-primary/20">
                                                    <MarkdownContent content={selectedChunk.text} />
                                                </div>

                                                {/* Meta details footer */}
                                                <div className="mt-3 bg-slate-50/40 dark:bg-slate-900/20 border border-border rounded-xl p-3 flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        <Info className="w-3 h-3 text-muted-foreground" />
                                                        Thông tin vector embedding
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground font-mono mt-0.5">
                                                        <div>
                                                            <span className="text-[9px] text-muted-foreground block uppercase">Tokens:</span>
                                                            <span className="text-foreground font-bold">{selectedChunk.tokenCount} tokens</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-muted-foreground block uppercase">Số ký tự:</span>
                                                            <span className="text-foreground font-bold">{selectedChunk.charCount} ký tự</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-muted-foreground block uppercase">Database ID:</span>
                                                            <span className="text-emerald-650 dark:text-emerald-400 font-bold">chunk-{selectedChunk.id || 'new'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                            <Database className="w-10 h-10 opacity-15 mb-1.5" />
                                            <p className="text-xs font-semibold">Vui lòng chọn một phân mảnh từ danh sách</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ================== TAB 2: RAG PLAYGROUND ================== */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Search Options Panel */}
                            <div className="px-4 py-3 border-b border-border bg-slate-50/30 dark:bg-slate-900/20">
                                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                                    <div className="flex flex-wrap md:flex-nowrap gap-3 items-end">
                                        <div className="flex-1 min-w-[280px] space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                                                Thử nghiệm câu hỏi truy vấn (Semantic / RAG Query)
                                            </label>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Nhập câu hỏi thử nghiệm ngữ nghĩa với Vector DB... (ví dụ: các yêu cầu kỹ thuật là gì?)"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-8 h-8 bg-background border-border text-foreground rounded-lg text-xs focus-visible:ring-1 focus-visible:ring-emerald-500 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2.5 items-center">
                                            {/* Top K */}
                                            <div className="space-y-1 w-20">
                                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                                    <Sliders className="w-2.5 h-2.5 text-muted-foreground" /> Top K
                                                </label>
                                                <select
                                                    value={topK}
                                                    onChange={(e) => setTopK(Number(e.target.value))}
                                                    className="w-full h-8 bg-background border border-border rounded-lg px-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                                                >
                                                    <option value={3}>3 Chunks</option>
                                                    <option value={5}>5 Chunks</option>
                                                    <option value={7}>7 Chunks</option>
                                                    <option value={10}>10 Chunks</option>
                                                </select>
                                            </div>

                                            {/* Min Similarity */}
                                            <div className="space-y-1 w-28">
                                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                                                    Min Score ({Math.round(minSimilarity * 100)}%)
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0.3"
                                                    max="0.9"
                                                    step="0.05"
                                                    value={minSimilarity}
                                                    onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                                                    className="w-full h-8 accent-emerald-500 bg-transparent"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={isSearching}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 rounded-lg shadow-sm px-4 flex items-center gap-1.5 cursor-pointer text-xs"
                                            >
                                                {isSearching ? (
                                                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                                {isSearching ? 'Đang tìm...' : 'Vector Search'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Search Results Split Area */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                                {/* Left: Search Match Cards */}
                                <div className="md:col-span-5 border-r border-border h-full flex flex-col bg-slate-50/10 dark:bg-slate-900/5">
                                    <div className="px-3 py-1.5 border-b border-border bg-slate-50/40 dark:bg-slate-900/20 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                        Kết quả khớp tương đồng ({searchResults.length})
                                    </div>

                                    {isSearching ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <Cpu className="w-6 h-6 animate-spin text-emerald-500" />
                                            <span className="text-xs font-semibold">Đang tìm trên không gian Vector 1536...</span>
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center p-8 gap-2">
                                            <Search className="w-8 h-8 opacity-10" />
                                            <div>
                                                <p className="text-xs font-bold text-foreground">Chưa có kết quả truy vấn</p>
                                                <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1 mx-auto">
                                                    Hãy gõ một câu hỏi tiếng Việt và nhấn nút Vector Search ở trên để kiểm tra kết quả RAG.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                            {searchResults.map((result, idx) => {
                                                const isSelected = idx === selectedSearchResultIndex;
                                                const similarityPercentage = Math.round(result.similarity * 100);
                                                
                                                // Color determination based on score
                                                let badgeColor = 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
                                                if (result.similarity >= 0.8) {
                                                    badgeColor = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
                                                } else if (result.similarity >= 0.6) {
                                                    badgeColor = 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedSearchResultIndex(idx)}
                                                        className={cn(
                                                            "w-full text-left p-2.5 transition-all flex flex-col gap-1 border-l-2 cursor-pointer",
                                                            isSelected 
                                                                ? "bg-slate-100 dark:bg-slate-800/60 border-l-emerald-500 text-foreground" 
                                                                : "border-l-transparent text-muted-foreground hover:bg-slate-50/60 dark:hover:bg-slate-850/20 hover:text-foreground"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="text-[9px] font-bold font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                                                                Rank #{idx + 1}
                                                            </span>
                                                            <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider", badgeColor)}>
                                                                {similarityPercentage}% Match
                                                            </span>
                                                        </div>
                                                        
                                                        <p className="text-xs font-bold leading-snug line-clamp-2 text-foreground">
                                                            {result.chunkTitle || 'Phân mảnh không tiêu đề'}
                                                        </p>

                                                        <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                                                            <span className="truncate max-w-[140px]">{result.fileName}</span>
                                                            <span>Index: {result.chunkIndex}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Detailed Result Reader */}
                                <div className="md:col-span-7 h-full flex flex-col bg-slate-50/10 dark:bg-slate-900/5 overflow-hidden">
                                    {selectedSearchResultIndex !== null && searchResults[selectedSearchResultIndex] ? (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Result Header */}
                                            <div className="px-4 py-2 border-b border-border bg-slate-50/30 dark:bg-slate-900/20 flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                                    Chi tiết phân mảnh khớp:
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCopyText(searchResults[selectedSearchResultIndex].text, selectedSearchResultIndex)}
                                                    className="rounded-lg border-border bg-background hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground h-7 text-[10px] px-2.5 flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                >
                                                    {copiedChunkId === selectedSearchResultIndex ? (
                                                        <>
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                            Đã sao chép
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                                            Sao chép
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Result Body Text */}
                                            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                                <div className="bg-slate-50/30 dark:bg-slate-950/40 border border-border rounded-xl p-4 shadow-sm select-text selection:bg-primary/20">
                                                    <MarkdownContent content={searchResults[selectedSearchResultIndex].text} />
                                                </div>

                                                {/* Meta Details Info */}
                                                <div className="mt-3 bg-slate-50/40 dark:bg-slate-900/20 border border-border rounded-xl p-3 flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        <Info className="w-3 h-3 text-muted-foreground" />
                                                        Thông tin RAG Match
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-muted-foreground font-mono mt-0.5">
                                                        <div>
                                                            <span className="text-[9px] text-muted-foreground block uppercase">Nguồn tài liệu:</span>
                                                            <span className="text-foreground font-bold truncate block max-w-[160px]">
                                                                {searchResults[selectedSearchResultIndex].fileName}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-muted-foreground block uppercase">Cosine Similarity:</span>
                                                            <span className="text-emerald-600 dark:text-emerald-450 font-bold">
                                                                {searchResults[selectedSearchResultIndex].similarity.toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-muted-foreground block uppercase">Độ dài Token:</span>
                                                            <span className="text-foreground font-bold">
                                                                {searchResults[selectedSearchResultIndex].tokenCount} tokens
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                            <Sparkles className="w-10 h-10 opacity-15 mb-1.5" />
                                            <p className="text-xs font-semibold">Vui lòng thực hiện truy vấn và chọn một kết quả</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/20 px-2.5 py-1 rounded-md">
                        <Info className="w-3.5 h-3.5" />
                        <span>Mô hình nhúng (Embeddings): <b>text-embedding-004</b> của Google (1536 dimensions).</span>
                    </div>

                    <Button
                        onClick={onClose}
                        className="rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 h-7 text-xs px-3 border border-border cursor-pointer shadow-sm"
                    >
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
