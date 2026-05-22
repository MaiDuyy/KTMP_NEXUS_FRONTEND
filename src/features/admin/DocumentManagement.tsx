'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    useGetDocumentsQuery,
    useDeleteDocumentMutation,
    useApproveDocumentMutation,
    useUploadDocumentMutation,
    Document,
} from '@/src/redux/feature/knowledgeApi';
import { useCompileDocumentMutation } from '@/src/redux/feature/mrpApi';
import { MarkdownEditorModal } from '@/src/features/knowledge/MarkdownEditorModal';
import { ChunkInspectorModal } from './ChunkInspectorModal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileText,
    MoreHorizontal,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    Search,
    Filter,
    Download,
    FileUp,
    RefreshCw,
    Eye,
    Sparkles,
    Cpu,
    Database,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';

const statusConfig = {
    PENDING: { icon: Clock, color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250/30 dark:border-amber-900/30', label: 'Pending' },
    PREVIEW: { icon: Eye, color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-250/30 dark:border-indigo-900/30', label: 'Chờ duyệt' },
    PROCESSING: { icon: Loader2, color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-250/30 dark:border-blue-900/30', label: 'Processing' },
    COMPLETED: { icon: CheckCircle, color: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-250/30 dark:border-green-900/30', label: 'Completed' },
    FAILED: { icon: AlertCircle, color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-250/30 dark:border-rose-900/30', label: 'Failed' },
};

export function DocumentManagement() {
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce search term to protect performance and reset page to 0 immediately
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // If there is a search term, fetch all documents for complete search. Otherwise, fetch paginated page.
    const queryArg = debouncedSearchTerm.trim() ? undefined : { page, size };
    const { data, isLoading, refetch } = useGetDocumentsQuery(queryArg);

    const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
    const [approveDocument, { isLoading: isApproving }] = useApproveDocumentMutation();
    const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
    const [compileDocument, { isLoading: isCompiling }] = useCompileDocumentMutation();
    const [previewMode, setPreviewMode] = useState(true);
    const [parserMethod, setParserMethod] = useState<'gemini' | 'tika'>('gemini');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);
    const [chunkInspectorOpen, setChunkInspectorOpen] = useState(false);
    const [inspectingDoc, setInspectingDoc] = useState<Document | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStartMRP = async (id: number) => {
        try {
            await compileDocument({ documentId: id, workspaceId: 'default-workspace', autoApprove: false }).unwrap();
            toast.success('Kích hoạt quy trình biên soạn MRP thành công! Kế hoạch mới đang chờ duyệt.');
        } catch (error: any) {
            console.error('MRP compilation error:', error);
            toast.error(error.data?.message || 'Lỗi khi khởi chạy quy trình MRP compilation');
        }
    };

    // Parse response
    const isPaged = data && !Array.isArray(data) && 'content' in data;
    const allDocs = useMemo(() => {
        if (!data) return [];
        return isPaged ? (data as any).content : (Array.isArray(data) ? data : []);
    }, [data, isPaged]);

    const filteredDocuments = useMemo(() => {
        if (!debouncedSearchTerm.trim()) return allDocs;
        const q = debouncedSearchTerm.toLowerCase();
        return allDocs.filter(doc =>
            doc.fileName.toLowerCase().includes(q) ||
            doc.userId.toLowerCase().includes(q)
        );
    }, [allDocs, debouncedSearchTerm]);

    // Compute paginated subset and counts
    const totalElements = debouncedSearchTerm.trim() ? filteredDocuments.length : (isPaged ? (data as any).totalElements : allDocs.length);
    const totalPages = debouncedSearchTerm.trim() ? Math.ceil(filteredDocuments.length / size) : (isPaged ? (data as any).totalPages : 1);
    
    // Slice only if we fetched all documents (i.e. queryArg is undefined)
    const paginatedDocs = useMemo(() => {
        return debouncedSearchTerm.trim() 
            ? filteredDocuments.slice(page * size, (page + 1) * size)
            : filteredDocuments;
    }, [filteredDocuments, debouncedSearchTerm, page, size]);

    // Edge Case 1: Auto-decrement page if the current page becomes empty
    useEffect(() => {
        const maxPage = Math.max(0, totalPages - 1);
        if (page > maxPage && !isLoading) {
            setPage(maxPage);
        }
    }, [totalPages, page, isLoading]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(0);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteDocument(id.toString()).unwrap();
            toast.success('Document deleted successfully');
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await approveDocument(id.toString()).unwrap();
            toast.success('Document approved successfully');
        } catch (error) {
            toast.error('Failed to approve document');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadDocument({ formData, preview: previewMode, parser: parserMethod }).unwrap();
            toast.success(`Tải lên thành công: ${result.fileName}`);
            
            if (previewMode && result.markdownContent) {
                setEditingDoc({
                    id: result.documentId,
                    fileName: result.fileName,
                    status: result.status as any,
                    markdownContent: result.markdownContent,
                } as any);
                setEditorOpen(true);
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.data?.message || 'Lỗi khi tải lên tài liệu');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                <p className="text-xs text-muted-foreground animate-pulse font-medium">Đang tải danh sách tài liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.docx,.txt"
            />
            <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 p-2.5 rounded-xl border border-border">
                <div className="flex-1 min-w-[260px] relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-lg border-border shadow-sm focus-visible:ring-1 bg-background"
                    />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Segmented Control for Parser Selection */}
                    <div className="flex bg-slate-100/60 dark:bg-slate-800/40 p-0.5 rounded-lg border border-border">
                        <button
                            type="button"
                            onClick={() => setParserMethod('gemini')}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                                parserMethod === 'gemini' 
                                    ? "bg-background text-primary shadow-sm border border-border" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>Gemini AI</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setParserMethod('tika')}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                                parserMethod === 'tika' 
                                    ? "bg-background text-primary shadow-sm border border-border" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Cpu className="w-3 h-3 text-sky-500" />
                            <span>Tika Local</span>
                        </button>
                    </div>

                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground bg-background border border-border px-2.5 py-1 h-8 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/55 transition-all shadow-sm">
                        <input
                            type="checkbox"
                            checked={previewMode}
                            onChange={(e) => setPreviewMode(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary w-3 h-3 cursor-pointer"
                        />
                        <span>Xem trước & Duyệt</span>
                    </label>
                    <Button variant="outline" className="rounded-lg h-8 text-xs border-border px-3" onClick={() => refetch()}>
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button 
                        className="rounded-lg h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90" 
                        onClick={handleUploadClick}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <FileUp className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {isUploading ? 'Đang tải...' : 'Tải tài liệu'}
                    </Button>
                </div>
            </div>

            <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
                <CardContent className="p-0">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        <Table>
                        <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-border">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="font-bold text-xs text-foreground pl-4 py-2">Tài liệu</TableHead>
                                <TableHead className="font-bold text-xs text-foreground py-2">Kích thước</TableHead>
                                <TableHead className="font-bold text-xs text-foreground py-2">Phân loại</TableHead>
                                <TableHead className="font-bold text-xs text-foreground py-2">Trạng thái</TableHead>
                                <TableHead className="font-bold text-xs text-foreground py-2">Ngày tải</TableHead>
                                <TableHead className="w-[80px] pr-4 py-2"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-15" />
                                        <p className="text-xs font-semibold">Không tìm thấy tài liệu nào</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDocs.map((doc) => {
                                    const status = statusConfig[doc.status as keyof typeof statusConfig] || statusConfig.PREVIEW;
                                    const StatusIcon = status.icon;

                                    return (
                                        <TableRow key={doc.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors border-border group">
                                            <TableCell className="pl-4 py-1.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground leading-snug">{doc.fileName}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{doc.documentType}</span>
                                                            <span className="text-slate-300 dark:text-slate-700 text-[9px]">•</span>
                                                            <span className={cn(
                                                                "text-[8px] font-bold px-1 py-0.2 rounded uppercase tracking-wider border flex items-center gap-0.5",
                                                                doc.parserMethod === 'tika'
                                                                    ? "bg-sky-50 dark:bg-sky-950/20 text-sky-650 dark:text-sky-400 border-sky-100 dark:border-sky-900/30"
                                                                    : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30"
                                                            )}>
                                                                {doc.parserMethod === 'tika' ? (
                                                                    <>
                                                                        <Cpu className="w-2 h-2 text-sky-500" />
                                                                        Tika Local
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles className="w-2 h-2 text-indigo-500" />
                                                                        Gemini AI
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground py-1.5">
                                                {formatFileSize(doc.fileSize)}
                                            </TableCell>
                                            <TableCell className="py-1.5">
                                                <Badge variant="outline" className="rounded-md text-[9px] font-bold uppercase tracking-tight bg-slate-50 dark:bg-slate-800/40 border-border px-1.5 py-0.5">
                                                    {doc.securityClassification || 'INTERNAL'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-1.5">
                                                <Badge className={cn('rounded-md text-[9px] font-bold px-2 py-0.5 shadow-sm', status.color)}>
                                                    <StatusIcon className={cn("w-2.5 h-2.5 mr-1", doc.status === 'PROCESSING' && "animate-spin")} />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground font-medium py-1.5">
                                                {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="pr-4 py-1.5">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    {doc.status === 'PREVIEW' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingDoc(doc);
                                                                setEditorOpen(true);
                                                            }}
                                                            className="rounded-lg h-7 text-[10px] font-semibold text-primary hover:text-primary border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 mr-1" /> Duyệt & Lưu
                                                        </Button>
                                                    )}
                                                    {doc.status === 'COMPLETED' && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setInspectingDoc(doc);
                                                                    setChunkInspectorOpen(true);
                                                                }}
                                                                className="rounded-lg h-7 text-[10px] font-semibold text-muted-foreground hover:text-foreground border-border bg-background hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Database className="w-3 h-3 text-slate-500" /> Phân mảnh
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStartMRP(doc.id)}
                                                                disabled={isCompiling}
                                                                className="rounded-lg h-7 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Cpu className={cn("w-3 h-3", isCompiling && "animate-spin")} /> Biên soạn MRP
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-lg p-1 shadow-lg border-border bg-popover text-popover-foreground">
                                                            {doc.status === 'PREVIEW' && (
                                                                <DropdownMenuItem 
                                                                    onClick={() => {
                                                                        setEditingDoc(doc);
                                                                        setEditorOpen(true);
                                                                    }} 
                                                                    className="rounded-md text-xs gap-1.5 cursor-pointer text-indigo-650 dark:text-indigo-400 focus:text-indigo-650"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    Biên tập & Duyệt
                                                                </DropdownMenuItem>
                                                            )}
                                                            {doc.status === 'COMPLETED' && (
                                                                <>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => {
                                                                            setInspectingDoc(doc);
                                                                            setChunkInspectorOpen(true);
                                                                        }}
                                                                        className="rounded-md text-xs gap-1.5 cursor-pointer text-foreground font-semibold"
                                                                    >
                                                                        <Database className="w-3.5 h-3.5 text-muted-foreground" />
                                                                        Xem phân mảnh (Chunks)
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleStartMRP(doc.id)}
                                                                        disabled={isCompiling}
                                                                        className="rounded-md text-xs gap-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-450 font-semibold"
                                                                    >
                                                                        <Cpu className="w-3.5 h-3.5" />
                                                                        Khởi chạy biên soạn MRP
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {doc.status === 'PENDING' && (
                                                                <DropdownMenuItem onClick={() => handleApprove(doc.id)} className="rounded-md text-xs gap-1.5 cursor-pointer">
                                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                                    Duyệt tài liệu
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem className="rounded-md text-xs gap-1.5 cursor-pointer">
                                                                <Download className="w-3.5 h-3.5" />
                                                                Tải về
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(doc.id)}
                                                                className="text-rose-600 dark:text-rose-455 rounded-md text-xs gap-1.5 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Xóa
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <WikiPagination
                page={page}
                size={size}
                totalPages={totalPages}
                totalElements={totalElements}
                setPage={setPage}
                setSize={setSize}
            />

            <MarkdownEditorModal
                isOpen={editorOpen}
                onClose={() => {
                    setEditorOpen(false);
                    setEditingDoc(null);
                }}
                initialMarkdown={editingDoc?.markdownContent || ''}
                documentId={editingDoc?.id || 0}
                fileName={editingDoc?.fileName || ''}
                onSuccess={() => refetch()}
            />

            <ChunkInspectorModal
                isOpen={chunkInspectorOpen}
                onClose={() => {
                    setChunkInspectorOpen(false);
                    setInspectingDoc(null);
                }}
                documentId={inspectingDoc?.id || 0}
                fileName={inspectingDoc?.fileName || ''}
            />
        </div>
    );
}
