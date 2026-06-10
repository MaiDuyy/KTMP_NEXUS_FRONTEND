'use client';

import { useState } from 'react';
import {
    useListInvitationsQuery,
    useResendInvitationMutation,
    useCancelInvitationMutation,
    Invitation,
} from '@/src/redux/feature/adminApi';
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
import { Input } from '@/components/ui/input';
import { WikiPagination } from '@/app/wiki/components/WikiPagination';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    MoreHorizontal,
    Loader2,
    Mail,
    RefreshCw,
    X,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const statusConfig = {
    PENDING: { icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/30', label: 'Pending' },
    ACCEPTED: { icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900/30', label: 'Accepted' },
    EXPIRED: { icon: AlertCircle, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/30', label: 'Expired' },
    CANCELLED: { icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30', label: 'Cancelled' },
};

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    WORKSPACE_OWNER: 'Workspace Owner',
    WORKSPACE_ADMIN: 'Workspace Admin',
    WORKSPACE_MEMBER: 'Workspace Member',
    WORKSPACE_GUEST: 'Workspace Guest',
};

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30',
    ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30',
    WORKSPACE_OWNER: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
    WORKSPACE_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    WORKSPACE_MEMBER: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50',
    WORKSPACE_GUEST: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50',
};

export function InvitationsTable() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(0); // Reset to page 0 on search changes
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data, isLoading } = useListInvitationsQuery(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
    );
    const [resendInvitation, { isLoading: isResending }] = useResendInvitationMutation();
    const [cancelInvitation, { isLoading: isCancelling }] = useCancelInvitationMutation();

    const invitations = data?.invitations || [];

    // Filter invitations on client-side
    const filteredInvitations = invitations.filter((inv) => {
        if (!debouncedSearchQuery) return true;
        return inv.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });

    // Slice invitations for active page
    const paginatedInvitations = filteredInvitations.slice(page * size, (page + 1) * size);

    // Auto-decrement page if current page becomes empty
    useEffect(() => {
        if (paginatedInvitations.length === 0 && page > 0 && !isLoading) {
            setPage((prev) => Math.max(0, prev - 1));
        }
    }, [paginatedInvitations.length, page, isLoading]);

    const handleResend = async (invitation: Invitation) => {
        try {
            await resendInvitation(invitation.id).unwrap();
        } catch (error) {
            console.error('Failed to resend invitation:', error);
        }
    };

    const handleCancel = async () => {
        if (!selectedInvitation) return;
        try {
            await cancelInvitation(selectedInvitation.id).unwrap();
            setShowCancelDialog(false);
            setSelectedInvitation(null);
        } catch (error) {
            console.error('Failed to cancel invitation:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Invitations</h3>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-md font-semibold">{filteredInvitations.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-48">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-7 h-8 text-xs rounded-lg bg-background border border-border"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
                        <SelectTrigger className="w-32 h-8 text-xs rounded-lg">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border">
                            <SelectItem value="all" className="text-xs">All Status</SelectItem>
                            <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                            <SelectItem value="ACCEPTED" className="text-xs">Accepted</SelectItem>
                            <SelectItem value="EXPIRED" className="text-xs">Expired</SelectItem>
                            <SelectItem value="CANCELLED" className="text-xs">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-border">
                        <TableRow>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Role</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Invited By</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                            <TableHead className="h-8 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Expires</TableHead>
                            <TableHead className="w-[50px] h-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInvitations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                    No invitations found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedInvitations.map((invitation) => {
                                const status = statusConfig[invitation.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                const isExpired = isPast(new Date(invitation.expiresAt));
                                const canAction = invitation.status === 'PENDING' && !isExpired;

                                return (
                                    <TableRow key={invitation.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors border-b border-border">
                                        <TableCell className="py-2">
                                            <span className="font-semibold text-xs text-foreground">{invitation.email}</span>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Badge 
                                                variant="outline"
                                                className={cn("font-medium text-[10px] py-0 px-1.5 rounded-md", invitation.role && ROLE_COLORS[invitation.role] || "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}
                                            >
                                                {invitation.role ? (ROLE_LABELS[invitation.role] || invitation.role) : 'Default'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                {invitation.inviterName || invitation.invitedBy}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Badge variant="outline" className={cn('text-[9px] font-extrabold uppercase py-0 px-1.5 rounded-md flex items-center w-fit', status.color)}>
                                                <StatusIcon className="w-2.5 h-2.5 mr-1" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {invitation.status === 'ACCEPTED' ? (
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                    {format(new Date(invitation.acceptedAt!), 'MMM d, yyyy')}
                                                </span>
                                            ) : (
                                                <span className={cn(
                                                    'text-[10px] font-medium',
                                                    isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                                                )}>
                                                    {isExpired
                                                        ? 'Expired'
                                                        : formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })
                                                    }
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {canAction && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-card border border-border">
                                                        <DropdownMenuItem
                                                            onClick={() => handleResend(invitation)}
                                                            disabled={isResending}
                                                            className="text-xs cursor-pointer py-1.5"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                                            Resend
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 dark:text-red-400 cursor-pointer py-1.5"
                                                            onClick={() => {
                                                                setSelectedInvitation(invitation);
                                                                setShowCancelDialog(true);
                                                            }}
                                                        >
                                                            <X className="w-3.5 h-3.5 mr-2" />
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {filteredInvitations.length > 0 && (
                <WikiPagination
                    page={page}
                    size={size}
                    totalPages={Math.ceil(filteredInvitations.length / size)}
                    totalElements={filteredInvitations.length}
                    setPage={setPage}
                    setSize={setSize}
                />
            )}

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Invitation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel the invitation to{' '}
                            <strong>{selectedInvitation?.email}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Keep
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={isCancelling}
                        >
                            {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cancel Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
