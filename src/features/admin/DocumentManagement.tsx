'use client';

import React, { useState, useRef } from 'react';
import {
    useGetDocumentsQuery,
    useDeleteDocumentMutation,
    useApproveDocumentMutation,
    useUploadDocumentMutation,
    Document,
} from '@/src/redux/feature/knowledgeApi';
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
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const statusConfig = {
    PENDING: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    PROCESSING: { icon: Loader2, color: 'bg-blue-100 text-blue-700', label: 'Processing' },
    COMPLETED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Completed' },
    FAILED: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Failed' },
};

export function DocumentManagement() {
    const { data: documents = [], isLoading, refetch } = useGetDocumentsQuery();
    const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
    const [approveDocument, { isLoading: isApproving }] = useApproveDocumentMutation();
    const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredDocuments = documents.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            const result = await uploadDocument(formData).unwrap();
            toast.success(`Tải lên thành công: ${result.fileName}`);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.data?.message || 'Lỗi khi tải lên tài liệu');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Đang tải danh sách tài liệu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.docx,.txt"
            />
            <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm tài liệu theo tên, người tải..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 rounded-xl border-none shadow-sm focus-visible:ring-1"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl h-10" onClick={() => refetch()}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button 
                        className="rounded-xl h-10 shadow-md" 
                        onClick={handleUploadClick}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <FileUp className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? 'Đang tải lên...' : 'Tải tài liệu mới'}
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold text-slate-700 pl-6">Tài liệu</TableHead>
                                <TableHead className="font-bold text-slate-700">Kích thước</TableHead>
                                <TableHead className="font-bold text-slate-700">Phân loại</TableHead>
                                <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
                                <TableHead className="font-bold text-slate-700">Ngày tải</TableHead>
                                <TableHead className="w-[80px] pr-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-lg font-medium">Không tìm thấy tài liệu nào</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocuments.map((doc) => {
                                    const status = statusConfig[doc.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                    const StatusIcon = status.icon;

                                    return (
                                        <TableRow key={doc.id} className="hover:bg-slate-50/30 transition-colors border-slate-100 group">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-tight">{doc.fileName}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">{doc.documentType}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-600">
                                                {formatFileSize(doc.fileSize)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-50">
                                                    {doc.securityClassification || 'INTERNAL'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn('rounded-full text-[10px] font-bold px-2.5 py-0.5 border-none shadow-sm', status.color)}>
                                                    <StatusIcon className={cn("w-3 h-3 mr-1.5", doc.status === 'PROCESSING' && "animate-spin")} />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-medium">
                                                {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-xl border-slate-100">
                                                        {doc.status === 'PENDING' && (
                                                            <DropdownMenuItem onClick={() => handleApprove(doc.id)} className="rounded-lg gap-2 cursor-pointer">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                Duyệt tài liệu
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                                            <Download className="w-4 h-4" />
                                                            Tải về
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="text-red-600 rounded-lg gap-2 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
