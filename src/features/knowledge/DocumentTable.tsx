'use client';

import { useState, useMemo } from 'react';
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
        className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    PROCESSING: {
        icon: Loader2,
        label: 'Đang xử lý',
        variant: 'outline' as const,
        className: 'border-blue-200 text-blue-600 bg-blue-50/50',
    },
    COMPLETED: {
        icon: CheckCircle2,
        label: 'Hoàn thành',
        variant: 'outline' as const,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    FAILED: {
        icon: XCircle,
        label: 'Thất bại',
        variant: 'outline' as const,
        className: 'bg-red-50 text-red-700 border-red-200',
    },
};

const fileTypeConfig: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: 'text-red-500' },
    docx: { icon: FileText, color: 'text-blue-500' },
    txt: { icon: FileIcon, color: 'text-slate-500' },
    csv: { icon: Database, color: 'text-emerald-500' },
};

export function DocumentTable({ onDocumentClick, className }: DocumentTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const { data: documents, isLoading, isFetching } = useGetDocumentsQuery();
    const [deleteDocument] = useDeleteDocumentMutation();

    const filteredDocs = useMemo(() => {
        if (!documents) return [];
        let filtered = documents;

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
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
    }, [documents, searchTerm, statusFilter]);

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
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background/50 focus:bg-background transition-all border-slate-200"
                        autoComplete="off"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v)}
                    >
                        <SelectTrigger className="w-[160px] bg-background/50 border-slate-200">
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
                        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full animate-in fade-in">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Đang đồng bộ
                        </div>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                {filteredDocs.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Không tìm thấy tài liệu nào"
                        description={searchTerm ? "Thử điều chỉnh bộ lọc tìm kiếm của bạn" : "Tải lên một tài liệu để cung cấp dữ liệu cho trợ lý AI của bạn"}
                    />
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="w-[40%] text-slate-900 font-semibold py-4">Tên tài liệu</TableHead>
                                <TableHead className="text-slate-900 font-semibold">Trạng thái</TableHead>
                                <TableHead className="text-slate-900 font-semibold">Kích thước</TableHead>
                                <TableHead className="text-slate-900 font-semibold">Khối (Chunks)</TableHead>
                                <TableHead className="text-right text-slate-900 font-semibold pr-6">Cập nhật</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDocs.map((doc) => {
                                const status = statusConfig[doc.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                const fileType = fileTypeConfig[doc.documentType.toLowerCase()] || fileTypeConfig.txt;
                                const FileTypeIcon = fileType.icon;

                                return (
                                    <TableRow
                                        key={doc.id}
                                        className="group cursor-pointer hover:bg-slate-50/80 transition-colors border-slate-100"
                                        onClick={() => handleDocClick(doc)}
                                    >
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors", fileType.color)}>
                                                    <FileTypeIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                                                            {doc.fileName}
                                                        </span>
                                                        {doc.securityClassification && doc.securityClassification !== 'PUBLIC' && (
                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-slate-50 text-slate-500 border-slate-200 uppercase tracking-tighter">
                                                                {doc.securityClassification}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                                        {doc.documentType}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "gap-1.5 px-2 py-0.5 font-medium border-transparent shadow-none",
                                                    status.className
                                                )}
                                            >
                                                <StatusIcon className={cn("w-3.5 h-3.5", doc.status === 'PROCESSING' && "animate-spin")} />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                                <Weight className="w-3 h-3 opacity-50" />
                                                {formatSize(doc.fileSize)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                                                <Database className="w-3 h-3 text-slate-400" />
                                                {doc.chunkCount > 0 ? doc.chunkCount : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-medium text-slate-900">
                                                        {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(doc.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                                                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Footer Info */}
            <div className="flex items-center justify-between px-2">
                <p className="text-xs text-slate-400 font-medium">
                    Tổng cộng: <span className="text-slate-900">{filteredDocs.length}</span> tài liệu
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Hệ thống ổn định
                </div>
            </div>
        </div>
    );
}
