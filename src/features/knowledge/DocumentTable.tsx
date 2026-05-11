'use client';

import { useState, useMemo } from 'react';
import { useGetDocumentsQuery } from '@/src/redux/feature/knowledgeApi';
import type { Document } from '@/src/redux/feature/knowledgeApi';
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FileText,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface DocumentTableProps {
    onDocumentClick?: (doc: Document) => void;
    className?: string;
}

const statusIcon: Record<string, typeof Clock> = {
    PENDING: Clock,
    PROCESSING: Loader2,
    COMPLETED: CheckCircle,
    FAILED: XCircle,
};

const statusColor: Record<string, string> = {
    PENDING: 'text-amber-500',
    PROCESSING: 'text-blue-500',
    COMPLETED: 'text-green-500',
    FAILED: 'text-red-500',
};

const docTypeLabel: Record<string, string> = {
    pdf: 'PDF',
    docx: 'DOCX',
    txt: 'TXT',
};

/**
 * Document table for Spring Boot ai-knowledge documents.
 * Uses useGetSpringDocumentsQuery which calls the Spring /documents endpoint.
 */
export function DocumentTable({ onDocumentClick, className }: DocumentTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const { data: documents, isLoading, isFetching } = useGetDocumentsQuery();

    // Date formatter
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
    }), []);

    // Filter documents client-side (Spring returns all user docs)
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

        return filtered;
    }, [documents, searchTerm, statusFilter]);

    // Format file size
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
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-2 flex-1 min-w-[200px]">
                    <Input
                        placeholder="Search by filename…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                        autoComplete="off"
                    />
                </div>

                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v)}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loading overlay */}
            {isFetching && !isLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Refreshing…
                </div>
            )}

            {/* Table */}
            {filteredDocs.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No documents found"
                    description="Upload a document to get started with RAG knowledge base"
                />
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr className="text-left text-sm">
                                <th className="px-4 py-3 font-medium">File Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Size</th>
                                <th className="px-4 py-3 font-medium">Chunks</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredDocs.map((doc) => {
                                const StatusIcon = statusIcon[doc.status] || AlertCircle;
                                return (
                                    <tr
                                        key={doc.id}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors group focus-within:bg-slate-50 outline-none"
                                        onClick={() => handleDocClick(doc)}
                                        role="link"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDocClick(doc)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                                                <span className="font-medium truncate max-w-[300px] text-slate-900 border-b border-transparent group-hover:border-indigo-600">
                                                    {doc.fileName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 font-mono uppercase">
                                            {docTypeLabel[doc.documentType] || doc.documentType}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {formatSize(doc.fileSize)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                                            {doc.chunkCount > 0 ? doc.chunkCount : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon
                                                    className={cn(
                                                        'w-4 h-4',
                                                        statusColor[doc.status] || 'text-slate-400',
                                                        doc.status === 'PROCESSING' && 'animate-spin'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                <span className="text-sm font-medium capitalize">{doc.status.toLowerCase()}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 text-right font-medium">
                                            {dateFormatter.format(new Date(doc.createdAt))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary */}
            {filteredDocs.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    Showing {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
