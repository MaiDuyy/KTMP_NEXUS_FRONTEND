'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Activity as ActivityIcon,
    Search,
    Filter,
    RefreshCw,
    Download,
    User,
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Shield,
    Globe,
    Cpu,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useGetAuditLogsQuery, AuditLog, AuditFilters } from '@/src/redux/feature/auditApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACTION_COLORS: Record<string, string> = {
    'LOGIN': 'bg-blue-100 text-blue-600',
    'LOGOUT': 'bg-gray-100 text-gray-600',
    'CREATE': 'bg-green-100 text-green-600',
    'UPDATE': 'bg-yellow-100 text-yellow-600',
    'DELETE': 'bg-red-100 text-red-600',
    'INVITE': 'bg-purple-100 text-purple-600',
    'SUSPEND': 'bg-orange-100 text-orange-600',
};

const RESOURCE_ICONS: Record<string, any> = {
    'USER': User,
    'WORKSPACE': Globe,
    'CHANNEL': ActivityIcon,
    'ROLE': Shield,
    'SYSTEM': Cpu,
};

export function AuditLogsPage() {
    const [filters, setFilters] = useState<AuditFilters>({ limit: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);

    // Debounce search term to protect performance and reset page to 0
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page to 0 when resource or status filter changes
    useEffect(() => {
        setPage(0);
    }, [filters.status, filters.resource]);

    const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery({
        status: filters.status,
        resource: filters.resource,
        limit: size,
        page: page + 1, // backend page index is 1-based
        action: debouncedSearchTerm || undefined, // use debounced search term for action filtering
    });

    const logs = data?.items || [];
    const totalCount = data?.total || 0;

    // Edge Case 1: Auto-decrement page if the current page is empty after filters or actions
    useEffect(() => {
        if (logs.length === 0 && page > 0 && !isLoading) {
            setPage(prev => Math.max(0, prev - 1));
        }
    }, [logs.length, page, isLoading]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleExport = () => {
        if (logs.length === 0) return;
        
        const csvContent = [
            ['Time', 'User', 'Action', 'Resource', 'Status', 'IP', 'Details'].join(','),
            ...logs.map(log => [
                format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                log.userName || log.userId,
                log.action,
                log.resource,
                log.status,
                log.ipAddress || '-',
                JSON.stringify(log.details || {}).replace(/,/g, ';')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        toast.success('Audit logs exported successfully');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ActivityIcon className="w-8 h-8 text-primary" />
                        Nhật ký hoạt động (Audit Logs)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Theo dõi tất cả hoạt động hệ thống và thay đổi cấu hình
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Xuất CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm">
                <CardContent className="py-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo người dùng, hành động..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-xl"
                            />
                        </div>
                        <Select 
                            value={filters.status || 'all'} 
                            onValueChange={(val) => setFilters(prev => ({ ...prev, status: val === 'all' ? undefined : val }))}
                        >
                            <SelectTrigger className="w-[180px] h-10 rounded-xl">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="SUCCESS">Thành công</SelectItem>
                                <SelectItem value="FAILURE">Thất bại</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select 
                            value={filters.resource || 'all'} 
                            onValueChange={(val) => setFilters(prev => ({ ...prev, resource: val === 'all' ? undefined : val }))}
                        >
                            <SelectTrigger className="w-[180px] h-10 rounded-xl">
                                <SelectValue placeholder="Tài nguyên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả tài nguyên</SelectItem>
                                <SelectItem value="USER">Người dùng</SelectItem>
                                <SelectItem value="WORKSPACE">Workspace</SelectItem>
                                <SelectItem value="CHANNEL">Kênh</SelectItem>
                                <SelectItem value="ROLE">Vai trò</SelectItem>
                            </SelectContent>
                        </Select>
                    </form>
                </CardContent>
            </Card>

            {/* Activity List */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
                            <CardDescription>Chi tiết các sự kiện trong 30 ngày qua</CardDescription>
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3">
                            {totalCount} sự kiện
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <RefreshCw className="w-8 h-8 animate-spin text-primary/40" />
                            <p className="text-sm text-muted-foreground animate-pulse">Đang tải nhật ký...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground">
                            <ActivityIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="text-lg font-medium">Không tìm thấy hoạt động nào</p>
                            <p className="text-sm">Thử điều chỉnh bộ lọc hoặc tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {logs.map((log) => {
                                const ResourceIcon = RESOURCE_ICONS[log.resource] || ActivityIcon;
                                const actionColor = ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600';
                                
                                return (
                                    <div
                                        key={log.id}
                                        className="group flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-all duration-200"
                                    >
                                        <div className={cn("p-2.5 rounded-2xl shadow-sm ring-1 ring-slate-200/50", actionColor)}>
                                            <ResourceIcon className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-bold text-slate-900">
                                                    {log.userName || 'System'}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tight rounded-full", actionColor)}>
                                                    {log.action}
                                                </Badge>
                                                {log.status === 'FAILURE' && (
                                                    <Badge variant="destructive" className="text-[10px] rounded-full">FAILED</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                <span className="font-medium text-slate-900">{log.action}</span> {log.resource.toLowerCase()} 
                                                {log.resourceId && <span className="text-slate-400 text-xs ml-1 font-mono">({log.resourceId})</span>}
                                            </p>
                                            
                                            <div className="flex items-center gap-4 mt-3 text-[11px] font-medium text-slate-400">
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDistanceToNow(new Date(log.timestamp), {
                                                        addSuffix: true,
                                                        locale: vi,
                                                    })}
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md">IP: {log.ipAddress || 'Internal'}</span>
                                                {log.userAgent && <span className="hidden md:inline truncate max-w-[200px] px-2 py-0.5 bg-slate-100 rounded-md">{log.userAgent}</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                                    {log.userName ? getInitials(log.userName) : 'SYS'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full">Chi tiết</Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {data && (
                        <div className="p-4 bg-slate-50/50 border-t">
                            <WikiPagination
                                page={page}
                                size={size}
                                totalPages={Math.ceil(totalCount / size)}
                                totalElements={totalCount}
                                setPage={setPage}
                                setSize={setSize}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
