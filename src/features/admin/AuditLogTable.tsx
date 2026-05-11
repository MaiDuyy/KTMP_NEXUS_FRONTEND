'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socketManager } from '@/src/lib/socket';
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

const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-700',
    ACCESS: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-700',
    FAILURE: 'bg-red-100 text-red-700',
};

export function AuditLogTable() {
    const [filters, setFilters] = useState<AuditFilters>({ limit: 20 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const dispatch = useDispatch();
    const { data, isLoading } = useGetAuditLogsQuery(filters);

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

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    const handleActionFilter = (action: string) => {
        setFilters((prev: AuditFilters) => ({
            ...prev,
            action: action === 'all' ? undefined : action,
        }));
    };

    const handleResourceFilter = (resource: string) => {
        setFilters((prev: AuditFilters) => ({
            ...prev,
            resource: resource === 'all' ? undefined : resource,
        }));
    };

    const filteredLogs = logs.filter((log: AuditLog) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.action.toLowerCase().includes(query) ||
            log.resource.toLowerCase().includes(query) ||
            log.userName?.toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>
                <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Action</label>
                        <Select onValueChange={handleActionFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All actions</SelectItem>
                                <SelectItem value="CREATE">Create</SelectItem>
                                <SelectItem value="UPDATE">Update</SelectItem>
                                <SelectItem value="DELETE">Delete</SelectItem>
                                <SelectItem value="LOGIN">Login</SelectItem>
                                <SelectItem value="ACCESS">Access</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Resource</label>
                        <Select onValueChange={handleResourceFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="All resources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All resources</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="role">Role</SelectItem>
                                <SelectItem value="channel">Channel</SelectItem>
                                <SelectItem value="message">Message</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No audit logs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log: AuditLog) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                            {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{log.userName || log.userId}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn('text-xs', actionColors[log.action] || '')}
                                        >
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">{log.resource}</span>
                                        {log.resourceId && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                #{log.resourceId.slice(0, 8)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn('text-xs', statusColors[log.status] || '')}
                                        >
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data && data.total > 20 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredLogs.length} of {data.total} logs
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!filters.cursor}
                            onClick={() => setFilters((prev: AuditFilters) => ({ ...prev, cursor: undefined }))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!data.nextCursor}
                            onClick={() => setFilters((prev: AuditFilters) => ({ ...prev, cursor: data.nextCursor }))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground">Timestamp</label>
                                    <p className="font-medium">
                                        {format(new Date(selectedLog.timestamp), 'PPpp')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">User</label>
                                    <p className="font-medium">{selectedLog.userName || selectedLog.userId}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Action</label>
                                    <Badge className={actionColors[selectedLog.action]}>
                                        {selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Resource</label>
                                    <p className="font-medium">
                                        {selectedLog.resource}
                                        {selectedLog.resourceId && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({selectedLog.resourceId})
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Status</label>
                                    <Badge className={statusColors[selectedLog.status]}>
                                        {selectedLog.status}
                                    </Badge>
                                </div>
                            </div>

                            {selectedLog.details && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Details</label>
                                    <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.ipAddress && (
                                <div>
                                    <label className="text-xs text-muted-foreground">IP Address</label>
                                    <p className="font-medium font-mono">{selectedLog.ipAddress}</p>
                                </div>
                            )}

                            {selectedLog.userAgent && (
                                <div>
                                    <label className="text-xs text-muted-foreground">User Agent</label>
                                    <p className="text-sm text-muted-foreground">{selectedLog.userAgent}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
