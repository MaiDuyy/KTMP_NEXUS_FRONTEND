'use client';

import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/src/redux/feature/auditApi';
import type { AuditLog, AuditFilters } from '@/src/redux/feature/auditApi';
import { AuditFiltersBar } from './AuditFiltersBar';
import { EmptyState } from '@/components/enterprise/EmptyState';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Info,
    AlertTriangle,
    User,
    Clock,
    Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AuditLogTableProps {
    className?: string;
}

const criticalActions = ['READ_DM', 'DELETE_USER', 'ROLE_ASSIGN', 'ACL_CHANGE'];

/**
 * Audit log table with filters and detail view
 */
export function AuditLogTable({ className }: AuditLogTableProps) {
    const [filters, setFilters] = useState<AuditFilters>({ limit: 50 });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const { data, isLoading, isFetching } = useGetAuditLogsQuery(filters);

    const handleFiltersChange = (newFilters: Partial<AuditFilters>) => {
        setFilters({ ...newFilters, cursor: undefined, limit: 50 });
    };

    const handleNextPage = () => {
        if (data?.nextCursor) {
            setFilters((prev) => ({ ...prev, cursor: data.nextCursor }));
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
            <AuditFiltersBar filters={filters} onFiltersChange={handleFiltersChange} />

            {/* Table */}
            {!data?.items.length ? (
                <EmptyState
                    icon={Shield}
                    title="No audit logs found"
                    description="Try adjusting your filters or check back later"
                />
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr className="text-left text-sm">
                                <th className="px-4 py-3 font-medium w-[180px]">Timestamp</th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Action</th>
                                <th className="px-4 py-3 font-medium">Resource</th>
                                <th className="px-4 py-3 font-medium w-[100px]">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.items.map((log) => {
                                const isCritical = criticalActions.includes(log.action);
                                return (
                                    <tr
                                        key={log.id}
                                        className={cn(
                                            'hover:bg-muted/50 transition-colors',
                                            isCritical && 'bg-amber-50/50 dark:bg-amber-900/10'
                                        )}
                                    >
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    {log.userName || log.userId.slice(0, 8)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {isCritical && (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span
                                                    className={cn(
                                                        'text-sm font-mono',
                                                        isCritical && 'text-amber-700 dark:text-amber-400'
                                                    )}
                                                >
                                                    {log.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="font-mono text-muted-foreground">
                                                {log.resource}
                                                {log.resourceId && (
                                                    <span className="text-xs">:{log.resourceId.slice(0, 8)}</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <Info className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {data && (data.items.length > 0 || data.nextCursor) && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Showing {data.items.length} of {data.total} logs
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!filters.cursor}
                            onClick={() => setFilters((prev) => ({ ...prev, cursor: undefined }))}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            First
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!data.nextCursor || isFetching}
                            onClick={handleNextPage}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground mb-1">User</div>
                                    <div className="font-medium">{selectedLog.userName || selectedLog.userId}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">Action</div>
                                    <div className="font-mono">{selectedLog.action}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">Resource</div>
                                    <div className="font-mono">{selectedLog.resource}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">Resource ID</div>
                                    <div className="font-mono text-xs">{selectedLog.resourceId || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1">Timestamp</div>
                                    <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground mb-1 flex items-center gap-1">
                                        <Monitor className="w-3 h-3" />
                                        IP Address
                                    </div>
                                    <div className="font-mono">{selectedLog.ipAddress || 'N/A'}</div>
                                </div>
                            </div>

                            {selectedLog.data && (
                                <div>
                                    <div className="text-muted-foreground mb-1 text-sm">Additional Data</div>
                                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                                        {JSON.stringify(selectedLog.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
