'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { socketManager } from '@/src/lib/socket';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';
import { auditApi } from '@/src/redux/feature/auditApi';
import {
    useGetAuditLogsQuery,
    AuditLog,
    AuditFilters,
} from '@/src/redux/feature/auditApi';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Download,
    Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// High-Density Dark Mode Resilient Badges mapping (compliance with Purple Ban)
const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30',
    UPDATE: 'bg-blue-100/80 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30',
    DELETE: 'bg-red-100/80 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30',
    LOGIN: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30', // Purple Ban: changed from purple to indigo
    LOGOUT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
    ACCESS: 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30',
};

const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100/80 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30',
    FAILURE: 'bg-red-100/80 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30',
};

export function AuditLogTable() {
    const [filters, setFilters] = useState<AuditFilters>({ limit: 20 });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const dispatch = useDispatch();

    // Debounce search term to protect performance and reset page to 0 immediately
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const queryFilters = useMemo<AuditFilters>(() => {
        return {
            page: page + 1, // backend is 1-based
            limit: size,
            action: filters.action,
            resource: filters.resource,
        };
    }, [page, size, filters.action, filters.resource]);

    const { data, isLoading } = useGetAuditLogsQuery(queryFilters);

    useEffect(() => {
        // Listen for real-time audit log events
        const unsubscribe = socketManager.onAuditLog((newLog) => {
            console.log('[Audit] New log received:', newLog);
            // Invalidate the cache to trigger a refetch
            dispatch(auditApi.util.invalidateTags(['AuditLogs']));
        });

        return () => unsubscribe();
    }, [dispatch]);

    const logs = data?.items || [];
    const totalElements = data?.total || 0;
    const totalPages = Math.ceil(totalElements / size);

    // Auto-decrement page if the current page becomes empty
    useEffect(() => {
        const maxPage = Math.max(0, totalPages - 1);
        if (page > maxPage && !isLoading) {
            setPage(maxPage);
        }
    }, [totalPages, page, isLoading]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    const handleActionFilter = (action: string) => {
        setFilters((prev: AuditFilters) => ({
            ...prev,
            action: action === 'all' ? undefined : action,
        }));
        setPage(0);
    };

    const handleResourceFilter = (resource: string) => {
        setFilters((prev: AuditFilters) => ({
            ...prev,
            resource: resource === 'all' ? undefined : resource,
        }));
        setPage(0);
    };

    const filteredLogs = useMemo(() => {
        if (!debouncedSearchQuery) return logs;
        const query = debouncedSearchQuery.toLowerCase();
        return logs.filter((log: AuditLog) => {
            return (
                log.action.toLowerCase().includes(query) ||
                log.resource.toLowerCase().includes(query) ||
                (log.userName && log.userName.toLowerCase().includes(query)) ||
                (log.userId && log.userId.toLowerCase().includes(query))
            );
        });
    }, [logs, debouncedSearchQuery]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
                <p className="text-[11px] text-muted-foreground animate-pulse">Đang tải nhật ký hệ thống...</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm nhật ký..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8 h-8 text-xs rounded-lg bg-transparent border-border focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn("h-8 text-xs rounded-lg px-2.5 border-border bg-secondary/30", showFilters && "bg-secondary text-primary")}
                    >
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        Bộ lọc
                    </Button>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg px-2.5 border-border bg-secondary/30">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Xuất CSV
                </Button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="flex flex-wrap gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-border/50">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Hành động</label>
                        <Select onValueChange={handleActionFilter}>
                            <SelectTrigger className="w-36 h-8 text-xs rounded-lg border-border">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="all">Tất cả hành động</SelectItem>
                                <SelectItem value="CREATE">Tạo mới (Create)</SelectItem>
                                <SelectItem value="UPDATE">Cập nhật (Update)</SelectItem>
                                <SelectItem value="DELETE">Xóa (Delete)</SelectItem>
                                <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                                <SelectItem value="ACCESS">Truy cập</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Tài nguyên</label>
                        <Select onValueChange={handleResourceFilter}>
                            <SelectTrigger className="w-36 h-8 text-xs rounded-lg border-border">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                                <SelectItem value="all">Tất cả tài nguyên</SelectItem>
                                <SelectItem value="user">Thành viên (User)</SelectItem>
                                <SelectItem value="role">Vai trò (Role)</SelectItem>
                                <SelectItem value="channel">Kênh chat (Channel)</SelectItem>
                                <SelectItem value="message">Tin nhắn (Message)</SelectItem>
                                <SelectItem value="document">Tài liệu (Document)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/40 dark:bg-slate-900/10 border-b border-border">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[160px]">Thời gian</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Người thực hiện</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[100px]">Hành động</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto">Tài nguyên</TableHead>
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground py-2 px-3 h-auto w-[100px]">Trạng thái</TableHead>
                            <TableHead className="w-[48px] py-2 px-3 h-auto"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                    Không có nhật ký hoạt động nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log: AuditLog) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 border-b border-border/50 last:border-0">
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                            {log.userName || log.userId}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <Badge
                                            variant="secondary"
                                            className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold border shadow-none', actionColors[log.action] || '')}
                                        >
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{log.resource}</span>
                                        {log.resourceId && (
                                            <span className="text-[10px] text-muted-foreground font-mono ml-1">
                                                #{log.resourceId.slice(0, 8)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <Badge
                                            variant="secondary"
                                            className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold border shadow-none', statusColors[log.status] || '')}
                                        >
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && (
                <WikiPagination
                    page={page}
                    size={size}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    setPage={setPage}
                    setSize={setSize}
                />
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="rounded-xl max-w-xl border-border bg-card text-xs">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-border pb-2">
                            Chi tiết nhật ký hoạt động
                        </DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Thời gian</label>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                        {format(new Date(selectedLog.timestamp), 'dd MMMM yyyy, HH:mm:ss')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Người thực hiện</label>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                        {selectedLog.userName || selectedLog.userId}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Hành động</label>
                                    <div className="mt-0.5">
                                        <Badge className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold border shadow-none', actionColors[selectedLog.action] || '')}>
                                            {selectedLog.action}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Tài nguyên tác động</label>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                        {selectedLog.resource}
                                        {selectedLog.resourceId && (
                                            <span className="text-[10px] text-muted-foreground font-mono ml-1">
                                                ({selectedLog.resourceId})
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Trạng thái</label>
                                    <div className="mt-0.5">
                                        <Badge className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold border shadow-none', statusColors[selectedLog.status] || '')}>
                                            {selectedLog.status}
                                        </Badge>
                                    </div>
                                </div>
                                {selectedLog.ipAddress && (
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Địa chỉ IP</label>
                                        <p className="font-mono text-slate-800 dark:text-slate-350 font-semibold mt-0.5">{selectedLog.ipAddress}</p>
                                    </div>
                                )}
                            </div>

                            {selectedLog.details && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Dữ liệu chi tiết (JSON)</label>
                                    <pre className="p-2.5 bg-slate-950 dark:bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-auto max-h-40 border border-slate-800">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.userAgent && (
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">User Agent (Trình duyệt)</label>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{selectedLog.userAgent}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
