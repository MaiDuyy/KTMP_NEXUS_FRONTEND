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
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
    PENDING: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    ACCEPTED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Accepted' },
    EXPIRED: { icon: AlertCircle, color: 'bg-gray-100 text-gray-600', label: 'Expired' },
    CANCELLED: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
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
    SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    WORKSPACE_OWNER: 'bg-amber-100 text-amber-700 border-amber-200',
    WORKSPACE_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
    WORKSPACE_MEMBER: 'bg-slate-100 text-slate-700 border-slate-200',
    WORKSPACE_GUEST: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function InvitationsTable() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const { data, isLoading } = useListInvitationsQuery(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
    );
    const [resendInvitation, { isLoading: isResending }] = useResendInvitationMutation();
    const [cancelInvitation, { isLoading: isCancelling }] = useCancelInvitationMutation();

    const invitations = data?.invitations || [];

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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-medium">Invitations</h3>
                    <Badge variant="secondary">{invitations.length}</Badge>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Invited By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invitations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No invitations found
                                </TableCell>
                            </TableRow>
                        ) : (
                            invitations.map((invitation) => {
                                const status = statusConfig[invitation.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                const StatusIcon = status.icon;
                                const isExpired = isPast(new Date(invitation.expiresAt));
                                const canAction = invitation.status === 'PENDING' && !isExpired;

                                return (
                                    <TableRow key={invitation.id}>
                                        <TableCell>
                                            <span className="font-medium">{invitation.email}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="outline"
                                                className={cn("font-medium", invitation.role && ROLE_COLORS[invitation.role] || "bg-slate-50 text-slate-600")}
                                            >
                                                {invitation.role ? (ROLE_LABELS[invitation.role] || invitation.role) : 'Default'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {invitation.inviterName || invitation.invitedBy}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn('text-xs', status.color)}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {invitation.status === 'ACCEPTED' ? (
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(invitation.acceptedAt!), 'MMM d, yyyy')}
                                                </span>
                                            ) : (
                                                <span className={cn(
                                                    'text-sm',
                                                    isExpired ? 'text-red-600' : 'text-muted-foreground'
                                                )}>
                                                    {isExpired
                                                        ? 'Expired'
                                                        : formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })
                                                    }
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {canAction && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleResend(invitation)}
                                                            disabled={isResending}
                                                        >
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            Resend
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setSelectedInvitation(invitation);
                                                                setShowCancelDialog(true);
                                                            }}
                                                        >
                                                            <X className="w-4 h-4 mr-2" />
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
