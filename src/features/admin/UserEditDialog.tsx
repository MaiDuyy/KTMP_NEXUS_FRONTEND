'use client';

import { useState, useEffect } from 'react';
import {
    useUpdateUserMutation,
    useUpdateUserRoleMutation,
    User,
    UpdateUserRequest,
} from '@/src/redux/feature/adminApi';
import { useGetRolesQuery } from '@/src/redux/feature/rbacApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User as UserIcon } from 'lucide-react';

interface UserEditDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
}

export function UserEditDialog({
    user,
    open,
    onOpenChange,
    onSaved,
}: UserEditDialogProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [role, setRole] = useState('');
    const [error, setError] = useState('');

    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [updateUserRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
    const { data: rolesData } = useGetRolesQuery();

    const currentUserRoles = useSelector((state: RootState) => state.auth.roles) || [];
    const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setDepartment(user.department || '');
            setPosition(user.position || '');
            setIsActive(user.isActive);
            setRole(user.role || '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) return;
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        try {
            const data: UpdateUserRequest = {
                name: name.trim(),
                phone: phone.trim() || undefined,
                department: department.trim() || undefined,
                position: position.trim() || undefined,
                isActive,
            };
            await updateUser({ id: user.id, data }).unwrap();

            if (role !== user.role) {
                await updateUserRole({ userId: user.id, role }).unwrap();
            }

            onOpenChange(false);
            onSaved?.();
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to update user');
        }
    };

    const handleClose = () => {
        setError('');
        onOpenChange(false);
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
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        Edit User
                    </DialogTitle>
                    <DialogDescription>
                        Update user information and status
                    </DialogDescription>
                </DialogHeader>

                {user && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* User Avatar & Email */}
                        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full name"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+84 xxx xxx xxx"
                            />
                        </div>

                        {/* Department & Position */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g., Engineering"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Position</Label>
                                <Input
                                    id="position"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="e.g., Developer"
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(rolesData || []).filter(r => {
                                        if (isSuperAdmin) return true;
                                        return r.name !== 'SUPER_ADMIN';
                                    }).map((r) => (
                                        <SelectItem key={r.id} value={r.name}>
                                            {r.displayName || r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>Account Status</Label>
                                <p className="text-xs text-muted-foreground">
                                    Inactive users cannot access the system
                                </p>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={setIsActive}
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
                            <Button type="submit" disabled={isUpdatingUser || isUpdatingRole}>
                                {(isUpdatingUser || isUpdatingRole) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
