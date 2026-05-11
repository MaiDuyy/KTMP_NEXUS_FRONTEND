'use client';

import { useState } from 'react';
import { useInviteUserMutation } from '@/src/redux/feature/adminApi';
import { useGetRolesQuery } from '@/src/redux/feature/rbacApi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, UserPlus } from 'lucide-react';

import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';

interface InviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [department, setDepartment] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { data: rolesData } = useGetRolesQuery();
    const [inviteUser, { isLoading }] = useInviteUserMutation();

    const currentUserRoles = useSelector((state: RootState) => state.auth.roles) || [];
    const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');
    const isWorkspaceAdmin = currentUserRoles.includes('WORKSPACE_ADMIN') || currentUserRoles.includes('WORKSPACE_OWNER');

    const roles = (rolesData || []).filter(r => {
        if (isSuperAdmin) return true;
        if (isWorkspaceAdmin) {
            // Workspace Admin can invite ADMIN, MEMBER or GUEST
            return ['ADMIN', 'WORKSPACE_MEMBER', 'WORKSPACE_GUEST'].includes(r.name);
        }
        return false;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Email is required');
            return;
        }

        try {
            await inviteUser({
                email,
                role: role || undefined,
                department: department || undefined,
                message: message || undefined,
            }).unwrap();

            // Reset form and close
            setEmail('');
            setRole('');
            setDepartment('');
            setMessage('');
            onOpenChange(false);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to send invitation');
        }
    };

    const handleClose = () => {
        setEmail('');
        setRole('');
        setDepartment('');
        setMessage('');
        setError('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Invite New User
                    </DialogTitle>
                    <DialogDescription>
                        Send an invitation email to add a new team member.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Initial Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.name}>
                                        <div>
                                            <span>{r.displayName}</span>
                                            {r.description && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    - {r.description}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            placeholder="e.g., Engineering, Marketing"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                        />
                    </div>

                    {/* Personal Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Personal Message (optional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Add a personal message to the invitation email..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
