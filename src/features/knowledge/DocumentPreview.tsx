'use client';

import { useState, useMemo, useEffect } from 'react';
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
    CheckCircle2,
    Hash,
    Maximize2,
    Tag,
    Info,
    Layers,
    Type,
    Clock,
    FileType2,
    BookOpen,
    List,
    ChevronDown,
    ChevronRight,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { MarkdownContent } from './MarkdownContent';

// =========================================================================
//  Markdown Parsing & Custom Element Rendering (Docling-Style)
// =========================================================================

/**
 * Splits the breadcrumb prefix from the core Markdown content.
 * e.g., "[Chương 1 > Phần 2]\n# Tiêu đề" => { breadcrumb: "Chương 1 > Phần 2", body: "# Tiêu đề" }
 */
function parseChunkText(text: string) {
    const lines = text.split('\n');
    if (lines.length > 0 && lines[0].startsWith('[') && lines[0].endsWith(']')) {
        const breadcrumb = lines[0].substring(1, lines[0].length - 1);
        const body = lines.slice(1).join('\n');
        return { breadcrumb, body };
    }
    return { breadcrumb: null, body: text };
}


// =========================================================================
//  Document Heading / Outline Tree Types & Parser
// =========================================================================

interface TreeNode {
    id: string;
    title: string;
    level: number;
    chunkIndex: number;
    children: TreeNode[];
}

/**
 * Parses markdown-style (# Heading) and breadcrumb patterns in document chunks
 * to reconstruct a beautiful collapsible Nested Tree Structure (H1 > H2 > H3)
 */
function parseDocumentTree(chunks: any[]): TreeNode[] {
    const root: TreeNode[] = [];
    const path: TreeNode[] = [];

    // Helper to detect correct heading level from title format
    const detectTitleLevel = (title: string, fallbackLevel: number): number => {
        const t = title.trim();
        // Numbered sections like "1. Giới thiệu", "1 Giới thiệu", "Chương I", "Phần 1" -> Level 2
        if (/^\d+\s+\S/.test(t) || /^\d+\.\s+\S/.test(t) || /^(Chương|Phần|Bài|Điều)\s+/i.test(t)) {
            return 2;
        }
        // Sub-sections like "2.1 Backend", "2.2. Frontend" -> Level 3
        if (/^\d+\.\d+\s+\S/.test(t) || /^\d+\.\d+\.\s+\S/.test(t)) {
            return 3;
        }
        // Deep sub-sections like "2.1.1 Core", "3.2.1. Feature" -> Level 4
        if (/^\d+\.\d+\.\d+\s+\S/.test(t) || /^\d+\.\d+\.\d+\.\s+\S/.test(t)) {
            return 4;
        }
        return fallbackLevel;
    };

    chunks.forEach((chunk) => {
        const text = chunk.text || '';
        const lines = text.split('\n');
        let foundHeading = false;

        for (const line of lines) {
            // Match markdown headers: e.g. "# Header 1", "## Header 2"
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const title = match[2].trim();
                const level = detectTitleLevel(title, match[1].length);

                // Traverse back up the path to find the parent node with a lower level
                while (path.length > 0 && path[path.length - 1].level >= level) {
                    path.pop();
                }

                // Check if a sibling node with this exact title and level already exists
                let existingNode: TreeNode | undefined;
                if (path.length === 0) {
                    existingNode = root.find(node => node.title.toLowerCase() === title.toLowerCase() && node.level === level);
                } else {
                    existingNode = path[path.length - 1].children.find(node => node.title.toLowerCase() === title.toLowerCase() && node.level === level);
                }

                if (existingNode) {
                    // Reuse the existing heading node
                    path.push(existingNode);
                } else {
                    // Create and push new heading node
                    const node: TreeNode = {
                        id: `heading-${chunk.chunkIndex}-${level}-${encodeURIComponent(title.substring(0, 20))}`,
                        title,
                        level,
                        chunkIndex: chunk.chunkIndex,
                        children: [],
                    };

                    if (path.length === 0) {
                        root.push(node);
                    } else {
                        path[path.length - 1].children.push(node);
                    }
                    path.push(node);
                }

                foundHeading = true;
            }
        }

        // Fallback: If no markdown heading exists in the text, use chunkTitle if it's descriptive
        if (!foundHeading) {
            const isGeneric = /^chunk\s+#?\d+$/i.test(chunk.chunkTitle || '');
            if (chunk.chunkTitle && !isGeneric) {
                const title = chunk.chunkTitle;
                
                // Skip if this fallback title is a duplicate of any active parent in the path
                const isDuplicate = path.some(p => p.title.toLowerCase() === title.toLowerCase());
                if (!isDuplicate) {
                    const level = detectTitleLevel(title, path.length > 0 ? path[path.length - 1].level + 1 : 1);

                    while (path.length > 0 && path[path.length - 1].level >= level) {
                        path.pop();
                    }

                    // Check if it already exists under parent/root
                    let existingNode: TreeNode | undefined;
                    if (path.length === 0) {
                        existingNode = root.find(node => node.title.toLowerCase() === title.toLowerCase() && node.level === level);
                    } else {
                        existingNode = path[path.length - 1].children.find(node => node.title.toLowerCase() === title.toLowerCase() && node.level === level);
                    }

                    if (existingNode) {
                        path.push(existingNode);
                    } else {
                        const node: TreeNode = {
                            id: `chunk-title-${chunk.chunkIndex}`,
                            title,
                            level,
                            chunkIndex: chunk.chunkIndex,
                            children: [],
                        };

                        if (path.length === 0) {
                            root.push(node);
                        } else {
                            path[path.length - 1].children.push(node);
                        }
                        path.push(node);
                    }
                }
            }
        }
    });

    // Final Fallback: If no headers were discovered (e.g., raw text or unformatted files),
    // represent each chunk as a flat leaf node so the tree isn't blank
    if (root.length === 0) {
        chunks.forEach((chunk) => {
            root.push({
                id: `chunk-node-${chunk.chunkIndex}`,
                title: chunk.chunkTitle || `Đoạn ${chunk.chunkIndex + 1}`,
                level: 1,
                chunkIndex: chunk.chunkIndex,
                children: [],
            });
        });
    }

    return root;
}

// =========================================================================
//  Recursive TreeItem Component
// =========================================================================

interface TreeItemProps {
    node: TreeNode;
    activeChunkIndex: number | null;
    onSelectNode: (chunkIndex: number) => void;
}

function TreeItem({ node, activeChunkIndex, onSelectNode }: TreeItemProps) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activeChunkIndex === node.chunkIndex;

    return (
        <div className="space-y-1 select-none">
            <div
                className={cn(
                    "group flex items-center gap-1.5 py-1 px-2 rounded-[4px] cursor-pointer transition-all border border-transparent text-[11px]",
                    isActive
                        ? "bg-primary/10 text-primary border-primary/20 font-semibold shadow-sm"
                        : "hover:bg-slate-100/80 text-slate-600 hover:text-slate-900"
                )}
                style={{ paddingLeft: `${Math.max(1, node.level) * 12}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.chunkIndex);
                }}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                        className="p-0.5 rounded-[4px] hover:bg-slate-200 text-slate-400 group-hover:text-slate-600 transition-colors"
                    >
                        {isOpen ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                    </button>
                ) : (
                    <span className="w-3 h-3 flex items-center justify-center text-slate-300 group-hover:text-slate-400">
                        •
                    </span>
                )}
                <span className="truncate flex-1" title={node.title}>
                    {node.title}
                </span>
            </div>

            {hasChildren && isOpen && (
                <div className="space-y-1 animate-in fade-in duration-200">
                    {node.children.map((child) => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            activeChunkIndex={activeChunkIndex}
                            onSelectNode={onSelectNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// =========================================================================
//  Inline Text Deduplication Utility (Cleans duplicate lines/words)
// =========================================================================

/**
 * Deduplicates tandem consecutive duplicates inline (e.g. "Sentence. Sentence.")
 * and consecutive identical lines in document preview.
 */
function deduplicateInlineText(text: string): string {
    if (!text || text.length < 8) return text;

    // Normalizes spaces and characters for deduplication
    const cleanTandem = (str: string): string => {
        const len = str.length;
        const maxLen = Math.min(200, Math.floor(len / 2));
        for (let l = maxLen; l >= 6; l--) {
            for (let i = 0; i <= len - 2 * l; i++) {
                const sub1 = str.substring(i, i + l);
                const sub2 = str.substring(i + l, i + 2 * l);
                
                // Compare stripped, lowercase substrings to ignore spacing/casing differences
                const s1 = sub1.trim().toLowerCase();
                const s2 = sub2.trim().toLowerCase();
                
                if (s1 === s2 && s1.length > 3) {
                    const nextStr = str.substring(0, i) + str.substring(i + l);
                    return cleanTandem(nextStr);
                }
            }
        }
        return str;
    };

    // Clean line by line
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let prevLineClean = '';
    let isInCodeBlock = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        // Toggle code block state
        if (trimmed.startsWith('```')) {
            isInCodeBlock = !isInCodeBlock;
            processedLines.push(line);
            prevLineClean = ''; // Reset duplicate tracking on code boundaries
            continue;
        }

        // If inside code block, or line is a table row (contains '|'), preserve it exactly as-is
        const isTableRow = trimmed.includes('|');
        if (isInCodeBlock || isTableRow) {
            processedLines.push(line);
            prevLineClean = trimmed.toLowerCase();
            continue;
        }

        let prefix = '';
        let content = line;
        const matchHash = line.match(/^(#{1,6})\s+/);
        if (matchHash) {
            prefix = matchHash[1] + ' ';
            content = line.substring(matchHash[0].length);
        }
        
        let t = content.trim();
        t = cleanTandem(t);
        const tClean = t.trim().toLowerCase();
        
        if (tClean && prevLineClean && (tClean === prevLineClean || prevLineClean.includes(tClean) || tClean.includes(prevLineClean))) {
            continue;
        }

        processedLines.push(prefix + t);
        if (tClean) prevLineClean = tClean;
    }

    return processedLines.join('\n');
}

// =========================================================================
//  MAIN DOCUMENT PREVIEW COMPONENT
// =========================================================================

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
    const [sidebarTab, setSidebarTab] = useState<'tree' | 'flat'>('tree');
    const [viewMode, setViewMode] = useState<'full' | 'single' | 'continuous'>('full');

    const { data: doc, isLoading } = useGetDocumentByIdQuery(documentId);
    const { data: chunksData, isLoading: chunksLoading } = useGetDocumentChunksQuery(
        documentId,
        { skip: !showChunks }
    );

    const chunks = useMemo(() => {
        const rawChunks = chunksData?.chunks ?? [];
        if (!rawChunks.length) return [];
        return rawChunks.map((chunk: any) => ({
            ...chunk,
            text: deduplicateInlineText(chunk.text || ''),
            chunkTitle: deduplicateInlineText(chunk.chunkTitle || ''),
        }));
    }, [chunksData]);

    const activeChunk = useMemo(() => {
        if (!chunks.length) return null;
        if (selectedChunkIndex !== null) return chunks.find(c => c.chunkIndex === selectedChunkIndex) ?? null;
        return chunks[0] ?? null;
    }, [chunks, selectedChunkIndex]);

    const treeData = useMemo(() => {
        if (!chunks.length) return [];
        return parseDocumentTree(chunks);
    }, [chunks]);

    const parsedActiveChunk = useMemo(() => {
        if (!activeChunk) return { breadcrumb: null, body: "" };
        return parseChunkText(activeChunk.text);
    }, [activeChunk]);

    // Sync selected chunk with smooth scrolling when in Continuous Reading Mode
    const handleSelectChunk = (chunkIndex: number) => {
        setSelectedChunkIndex(chunkIndex);
        if (viewMode === 'continuous') {
            const element = document.getElementById(`doc-chunk-${chunkIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Add highlight blink effect
                element.classList.add('border-primary/60', 'ring-2', 'ring-primary/20', 'bg-primary/[0.02]');
                setTimeout(() => {
                    element.classList.remove('border-primary/60', 'ring-2', 'ring-primary/20', 'bg-primary/[0.02]');
                }, 2000);
            }
        }
    };

    // Auto scroll when switching to continuous mode
    useEffect(() => {
        if (viewMode === 'continuous' && selectedChunkIndex !== null) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`doc-chunk-${selectedChunkIndex}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [viewMode]);

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
                    <h3 className="font-semibold text-slate-900">Đang tải tài liệu</h3>
                    <p className="text-sm text-slate-500">Đang chuẩn bị bản xem trước...</p>
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <EmptyState
                icon={FileText}
                title="Không tìm thấy tài liệu"
                description="Tài liệu có thể đã bị xóa hoặc di chuyển. Vui lòng kiểm tra cơ sở dữ liệu tri thức của bạn."
                action={{ label: 'Quay lại cơ sở dữ liệu tri thức', onClick: () => router.push('/knowledge') }}
            />
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-slate-500 hover:text-slate-900 gap-1.5 pl-0 hover:bg-transparent text-xs"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Cơ sở dữ liệu tri thức
                </Button>
                
                <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] rounded-sm px-1.5 py-0">
                        {doc.documentType.toUpperCase()}
                    </Badge>
                    {doc.status === 'COMPLETED' && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 shadow-none text-[10px] rounded-sm px-1.5 py-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đã lập chỉ mục
                        </Badge>
                    )}
                </div>
            </div>

            {/* Document Title Section */}
          {/* Document Title Section */}
<div className="flex items-center gap-3">
    <h1 className="text-sm font-semibold tracking-tight text-slate-900 truncate max-w-sm">
        {doc.fileName}
    </h1>
    <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium text-slate-700"><Clock className="w-3 h-3" /> Đã thêm {format(new Date(doc.createdAt), 'dd/MM/yyyy')}</span>
        <Separator orientation="vertical" className="h-3" />
        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {doc.chunkCount} Đoạn</span>
        <Separator orientation="vertical" className="h-3" />
        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {formatSize(doc.fileSize)}</span>
    </div>
</div>

            {/* Main Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-stretch lg:h-[calc(100vh-10.5rem)] lg:min-h-[550px]">
                
                {/* Navigation Sidebar */}
                <aside className="lg:sticky lg:top-4 space-y-3 order-2 lg:order-1 flex flex-col lg:h-full lg:overflow-hidden">
                    <div className="space-y-2 flex-1 flex flex-col min-h-0 lg:overflow-hidden">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Cấu trúc tài liệu
                            </h2>
                            <span className="text-[9px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded-[3px]">
                                {chunks.length}
                            </span>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-[4px] border border-slate-200/60">
                            <button
                                onClick={() => setSidebarTab('tree')}
                                className={cn(
                                    "flex-1 py-1 px-2.5 rounded-[4px] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all",
                                    sidebarTab === 'tree'
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <BookOpen className="w-3 h-3" />
                                Mục lục
                            </button>
                            <button
                                onClick={() => setSidebarTab('flat')}
                                className={cn(
                                    "flex-1 py-1 px-2.5 rounded-[4px] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all",
                                    sidebarTab === 'flat'
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <List className="w-3 h-3" />
                                Đoạn dữ liệu
                            </button>
                        </div>

                        {/* Navigation Scroll Container */}
                        <ScrollArea className="flex-1 border border-slate-200 rounded-[4px] bg-slate-50/20 shadow-sm min-h-0">
                            {chunksLoading ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 gap-2 text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-[9px] font-bold uppercase tracking-tighter">Đang phân tích các đoạn</span>
                                </div>
                            ) : !chunks.length ? (
                                <div className="p-12 text-center space-y-3">
                                    <div className="w-10 h-10 bg-white rounded-[4px] flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                        <Hash className="w-5 h-5 text-slate-200" />
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        Đang lập chỉ mục...
                                    </p>
                                </div>
                            ) : sidebarTab === 'tree' ? (
                                // Nested collapsible outline view
                                <div className="p-2 space-y-0.5">
                                    {treeData.map((node) => (
                                        <TreeItem
                                            key={node.id}
                                            node={node}
                                            activeChunkIndex={activeChunk?.chunkIndex ?? null}
                                            onSelectNode={handleSelectChunk}
                                        />
                                    ))}
                                </div>
                            ) : (
                                // Flat technical chunk view
                                <div className="p-1 space-y-0.5">
                                    {chunks.map((chunk) => (
                                        <button
                                            key={chunk.chunkIndex}
                                            onClick={() => handleSelectChunk(chunk.chunkIndex)}
                                            className={cn(
                                                'w-full text-left px-3 py-2 rounded-[4px] transition-all group relative border border-transparent',
                                                activeChunk?.chunkIndex === chunk.chunkIndex 
                                                    ? 'bg-white border-slate-200 shadow-sm ring-1 ring-slate-100/50' 
                                                    : 'hover:bg-slate-100/80 text-slate-600'
                                            )}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold transition-colors shrink-0",
                                                    activeChunk?.chunkIndex === chunk.chunkIndex 
                                                        ? 'bg-primary text-white' 
                                                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                                                )}>
                                                    {chunk.chunkIndex + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={cn(
                                                        'text-[11px] font-semibold truncate transition-colors',
                                                        activeChunk?.chunkIndex === chunk.chunkIndex ? 'text-slate-900' : 'text-slate-700'
                                                    )}>
                                                        {chunk.chunkTitle || `Đoạn ${chunk.chunkIndex + 1}`}
                                                    </h3>
                                                    <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                                                        {chunk.text?.substring(0, 45)}...
                                                    </p>
                                                </div>
                                                {activeChunk?.chunkIndex === chunk.chunkIndex && (
                                                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse mt-1.5" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Metadata Card */}
                    <Card className="p-3.5 border-slate-200 shadow-none bg-slate-50 space-y-2.5 rounded-[4px]">
                        <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Info className="w-3 h-3" />
                            Thuộc tính kỹ thuật
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                    <FileType2 className="w-3 h-3" /> Định dạng
                                </span>
                                <span className="text-[11px] font-bold text-slate-900 uppercase font-mono">{doc.documentType}</span>
                            </div>
                            <Separator className="bg-slate-200/50" />
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                    <Type className="w-3 h-3" /> Tokenizer
                                </span>
                                <span className="text-[11px] font-bold text-slate-900 uppercase font-mono">Tiktoken/gpt-4</span>
                            </div>
                            <Separator className="bg-slate-200/50" />
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> ID Chủ sở hữu
                                </span>
                                <span className="text-[11px] font-bold text-slate-900 truncate max-w-[100px] font-mono">{doc.userId}</span>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Content Area */}
                <main className="order-1 lg:order-2 space-y-4 flex flex-col lg:h-full lg:overflow-hidden">
                    {/* View Mode Controls */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-[4px] border border-slate-200/60 w-fit ml-auto shrink-0">
                        <button
                            onClick={() => setViewMode('full')}
                            className={cn(
                                "py-1 px-2.5 rounded-[4px] text-[11px] font-semibold flex items-center gap-1 transition-all shadow-none",
                                viewMode === 'full'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <FileText className="w-3 h-3" />
                            Xem toàn văn
                        </button>
                        <button
                            onClick={() => setViewMode('single')}
                            className={cn(
                                "py-1 px-2.5 rounded-[4px] text-[11px] font-semibold flex items-center gap-1 transition-all shadow-none",
                                viewMode === 'single'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <Hash className="w-3 h-3" />
                            Xem từng đoạn
                        </button>
                        <button
                            onClick={() => setViewMode('continuous')}
                            className={cn(
                                "py-1 px-2.5 rounded-[4px] text-[11px] font-semibold flex items-center gap-1 transition-all shadow-none",
                                viewMode === 'continuous'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <Layers className="w-3 h-3" />
                            Phân đoạn RAG
                        </button>
                    </div>

                    {/* View Content Logic */}
                    {viewMode === 'full' ? (
                        <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 lg:h-full animate-in fade-in duration-500">
                            <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-[4px] flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-slate-900 leading-tight truncate">
                                            Toàn văn tài liệu
                                        </h2>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            Hiển thị nội dung đầy đủ liền mạch từ dữ liệu gốc
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 rounded-[4px] shrink-0 h-7 w-7 border border-slate-200">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </Button>
                            </header>
                            
                            <div className="flex-1 p-5 lg:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                <div className="max-w-3xl mx-auto">
                                    <div className="select-text selection:bg-primary/20">
                                        {doc.markdownContent ? (
                                            <MarkdownContent content={doc.markdownContent ?? ''}  />
                                        ) : (
                                            <div className="text-center py-12 text-slate-400 text-sm">
                                                Tài liệu này không có nội dung văn bản toàn văn hoặc đang được xử lý.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <footer className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400 shrink-0">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5">
                                        Dung lượng tệp <b className="text-slate-900">{formatSize(doc.fileSize)}</b>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        Số phân đoạn RAG <b className="text-slate-900">{doc.chunkCount}</b>
                                    </span>
                                </div>
                            </footer>
                        </div>
                    ) : viewMode === 'single' ? (
                        activeChunk ? (
                            <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 lg:h-full animate-in fade-in duration-500">
                                <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-[4px] flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                            <Hash className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            {parsedActiveChunk.breadcrumb && (
                                                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 bg-slate-100 px-1.5 py-0 rounded-[3px] w-fit border border-slate-200/50">
                                                    {parsedActiveChunk.breadcrumb}
                                                </div>
                                            )}
                                            <h2 className="text-xs font-bold text-slate-900 leading-tight truncate">
                                                {activeChunk.chunkTitle || `Đoạn ${activeChunk.chunkIndex + 1}`}
                                            </h2>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                {activeChunk.tokenCount} Tokens • {activeChunk.charCount} Ký tự
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 rounded-[4px] shrink-0 h-7 w-7 border border-slate-200">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </Button>
                                </header>
                                
                                <div className="flex-1 p-5 lg:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div className="max-w-3xl mx-auto">
                                        <div className="select-text selection:bg-primary/20">
                                            <MarkdownContent content={parsedActiveChunk.body} />
                                        </div>
                                    </div>
                                </div>

                                <footer className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            Index <b className="text-slate-900 bg-slate-200 px-1 py-0.5 rounded-[3px] font-mono">{activeChunk.chunkIndex}</b>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            Số từ <b className="text-slate-900">{activeChunk.text.split(/\s+/).length}</b>
                                        </span>
                                    </div>
                                    {activeChunk.similarity !== undefined && activeChunk.similarity > 0 && (
                                        <Badge variant="outline" className="text-[9px] bg-white border-slate-200 gap-1 text-slate-600 px-1.5 py-0.5 shadow-none hover:bg-white rounded-[3px]">
                                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                                            {(activeChunk.similarity * 100).toFixed(1)}% Độ liên quan
                                        </Badge>
                                    )}
                                </footer>
                            </div>
                        ) : (
                            <div className="aspect-video flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[4px] bg-slate-50/50 gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary/20 animate-spin" />
                                    <Layers className="w-5 h-5 text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đang khởi tạo bản xem trước</p>
                                    <p className="text-xs text-slate-300">Đang đồng bộ các đoạn dữ liệu...</p>
                                </div>
                            </div>
                        )
                    ) : (
                        // Continuous Document Reading Mode
                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent min-h-0 lg:h-full">
                            {chunks.map((chunk) => {
                                const isActive = activeChunk?.chunkIndex === chunk.chunkIndex;
                                const parsed = parseChunkText(chunk.text);
                                return (
                                    <div
                                        key={chunk.chunkIndex}
                                        id={`doc-chunk-${chunk.chunkIndex}`}
                                        className={cn(
                                            "bg-white border rounded-[4px] shadow-sm overflow-hidden flex flex-col transition-all duration-300 scroll-mt-4 cursor-pointer",
                                            isActive
                                                ? "border-primary/50 ring-1 ring-primary/5 shadow-sm"
                                                : "border-slate-200 hover:border-slate-300"
                                        )}
                                        onClick={() => setSelectedChunkIndex(chunk.chunkIndex)}
                                    >
                                        <header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
                                            <div className="flex-1 min-w-0">
                                                {parsed.breadcrumb && (
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-mono">
                                                        {parsed.breadcrumb}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold transition-all shrink-0",
                                                        isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {chunk.chunkIndex + 1}
                                                    </span>
                                                    <h3 className={cn(
                                                        "text-xs font-bold truncate max-w-[280px] sm:max-w-md",
                                                        isActive ? "text-slate-900" : "text-slate-700"
                                                    )}>
                                                        {chunk.chunkTitle || `Đoạn ${chunk.chunkIndex + 1}`}
                                                    </h3>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] text-slate-400 hover:bg-transparent shrink-0 rounded-[3px] py-0">
                                                {chunk.tokenCount} Tokens
                                            </Badge>
                                        </header>
                                        <div className="p-4 sm:p-5 select-text selection:bg-primary/20">
                                            <MarkdownContent content={parsed.body} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
}
