'use client';

import { useState, useMemo, useEffect } from 'react';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';
import { useGetDocumentsQuery, useDeleteDocumentMutation } from '@/src/redux/feature/knowledgeApi';
import type { Document } from '@/src/redux/feature/knowledgeApi';
import { toast } from "sonner";
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import {
    FileText,
    Search,
    Loader2,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    FileIcon,
    MoreHorizontal,
    Database,
    Calendar,
    Weight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface DocumentTableProps {
    onDocumentClick?: (doc: Document) => void;
    className?: string;
}

const statusConfig = {
    PENDING: {
        icon: Clock,
        label: 'Đang chờ',
        variant: 'outline' as const,
        className: 'bg-muted text-muted-foreground border-border',
    },
    PROCESSING: {
        icon: Loader2,
        label: 'Đang xử lý',
        variant: 'outline' as const,
        className: 'border-blue-200 text-blue-600 bg-blue-50/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    },
    COMPLETED: {
        icon: CheckCircle2,
        label: 'Hoàn thành',
        variant: 'outline' as const,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    },
    FAILED: {
        icon: XCircle,
        label: 'Thất bại',
        variant: 'outline' as const,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
    },
};

const fileTypeConfig: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: 'text-red-500' },
    docx: { icon: FileText, color: 'text-blue-500' },
    txt: { icon: FileIcon, color: 'text-muted-foreground' },
    csv: { icon: Database, color: 'text-emerald-500' },
};

export function DocumentTable({ onDocumentClick, className }: DocumentTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);

    const isSearchOrFilterActive = debouncedSearchTerm.trim() !== '' || (statusFilter && statusFilter !== 'ALL');
    const queryArg = isSearchOrFilterActive ? undefined : { page, size };
    const { data: documents, isLoading, isFetching } = useGetDocumentsQuery(queryArg);
    const [deleteDocument] = useDeleteDocumentMutation();

    // Debounce search term to protect performance and reset page to 0 immediately
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page to 0 when status filter changes
    useEffect(() => {
        setPage(0);
    }, [statusFilter]);

    const isPaged = documents && !Array.isArray(documents) && 'content' in documents;
    
    const filteredDocs = useMemo(() => {
        if (!documents) return [];
        let filtered = (isPaged ? (documents as any).content : (Array.isArray(documents) ? documents : [])) as Document[];

        if (debouncedSearchTerm) {
            const q = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(
                (d) => d.fileName.toLowerCase().includes(q)
            );
        }

        if (statusFilter && statusFilter !== 'ALL') {
            filtered = filtered.filter((d) => d.status === statusFilter);
        }

        // Sort by date descending
        return [...filtered].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [documents, debouncedSearchTerm, statusFilter, isPaged]);

    const paginatedDocs = useMemo(() => {
        if (!isSearchOrFilterActive) return filteredDocs;
        return filteredDocs.slice(page * size, (page + 1) * size);
    }, [filteredDocs, page, size, isSearchOrFilterActive]);

    const totalElements = useMemo(() => {
        if (!documents) return 0;
        if (isSearchOrFilterActive) {
            return filteredDocs.length;
        }
        return isPaged ? (documents as any).totalElements : (Array.isArray(documents) ? documents.length : 0);
    }, [documents, filteredDocs.length, isSearchOrFilterActive, isPaged]);

    const totalPages = useMemo(() => {
        if (!documents) return 0;
        if (isSearchOrFilterActive) {
            return Math.ceil(filteredDocs.length / size);
        }
        return isPaged ? (documents as any).totalPages : 1;
    }, [documents, filteredDocs.length, size, isSearchOrFilterActive, isPaged]);

    // Edge Case 1: Auto-decrement page if the current page is empty
    useEffect(() => {
        const maxPage = Math.max(0, totalPages - 1);
        if (page > maxPage && !isLoading) {
            setPage(maxPage);
        }
    }, [totalPages, page, isLoading]);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDocClick = (doc: Document) => {
        if (onDocumentClick) {
            onDocumentClick(doc);
        } else {
            router.push(`/knowledge/${doc.id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Database className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải cơ sở dữ liệu tri thức...</p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
                        autoComplete="off"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v)}
                    >
                        <SelectTrigger className="w-[160px] h-9 text-sm bg-background border-border">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả tài liệu</SelectItem>
                            <SelectItem value="PENDING">Đang chờ</SelectItem>
                            <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                            <SelectItem value="FAILED">Thất bại</SelectItem>
                        </SelectContent>
                    </Select>

                    {isFetching && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-primary bg-primary/10 rounded-full animate-in fade-in">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Đang đồng bộ
                        </div>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <Card className="rounded-lg border-border shadow-none overflow-hidden bg-card">
                {filteredDocs.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Không tìm thấy tài liệu nào"
                        description={searchTerm ? "Thử điều chỉnh bộ lọc tìm kiếm của bạn" : "Tải lên một tài liệu để cung cấp dữ liệu cho trợ lý AI của bạn"}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader className="bg-muted/40 border-b border-border">
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="w-[45%] text-muted-foreground font-semibold py-2.5 px-4 text-[11px] uppercase tracking-wider">Tên tài liệu</TableHead>
                                <TableHead className="text-muted-foreground font-semibold py-2.5 px-4 text-[11px] uppercase tracking-wider">Trạng thái</TableHead>
                                <TableHead className="text-muted-foreground font-semibold py-2.5 px-4 text-[11px] uppercase tracking-wider">Kích thước</TableHead>
                                <TableHead className="text-muted-foreground font-semibold py-2.5 px-4 text-[11px] uppercase tracking-wider">Chunks</TableHead>
                                <TableHead className="text-right text-muted-foreground font-semibold py-2.5 px-4 pr-6 text-[11px] uppercase tracking-wider">Cập nhật</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedDocs.map((doc) => {
                                const status = statusConfig[doc.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                const fileType = fileTypeConfig[doc.documentType.toLowerCase()] || fileTypeConfig.txt;
                                const FileTypeIcon = fileType.icon;

                                return (
                                    <TableRow
                                        key={doc.id}
                                        className="group cursor-pointer hover:bg-muted/40 transition-colors border-border/50 last:border-0"
                                        onClick={() => handleDocClick(doc)}
                                    >
                                        <TableCell className="py-2 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn("p-1.5 rounded-md bg-muted transition-colors", fileType.color)}>
                                                    <FileTypeIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground text-[13px] truncate group-hover:text-primary transition-colors">
                                                            {doc.fileName}
                                                        </span>
                                                        {doc.securityClassification && doc.securityClassification !== 'PUBLIC' && (
                                                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-muted text-muted-foreground border-border uppercase tracking-tighter rounded-sm">
                                                                {doc.securityClassification}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground font-mono mt-0.5">
                                                        {doc.documentType}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-4">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "gap-1 px-1.5 py-0.5 font-medium border-transparent shadow-none rounded-md text-[10px]",
                                                    status.className
                                                )}
                                            >
                                                <StatusIcon className={cn("w-3 h-3", doc.status === 'PROCESSING' && "animate-spin")} />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 px-4">
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                <Weight className="w-3 h-3 opacity-50" />
                                                {formatSize(doc.fileSize)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-4">
                                            <div className="flex items-center gap-1 text-foreground text-xs font-semibold">
                                                <Database className="w-3 h-3 text-muted-foreground" />
                                                {doc.chunkCount > 0 ? doc.chunkCount : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-2 px-4 pr-6">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-medium text-foreground">
                                                        {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground font-mono">
                                                        {format(new Date(doc.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md border border-border opacity-0 group-hover:opacity-100 transition-opacity bg-background hover:bg-muted"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
                                                            try {
                                                                await deleteDocument(doc.id.toString()).unwrap();
                                                                toast.success("Xóa tài liệu thành công");
                                                            } catch (error) {
                                                                toast.error("Lỗi khi xóa tài liệu");
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {totalElements > 0 && (
                <WikiPagination
                    page={page}
                    size={size}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    setPage={setPage}
                    setSize={setSize}
                />
            )}

            {/* Footer Info */}
            <div className="flex items-center justify-between px-1 mt-1">
                <p className="text-[11px] text-muted-foreground font-medium">
                    Tổng cộng: <span className="text-foreground font-semibold">{totalElements}</span> tài liệu
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Hệ thống ổn định
                </div>
            </div>
        </div>
    );
}
