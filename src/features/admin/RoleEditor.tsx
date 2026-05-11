// source/chat-fontend/src/features/admin/RoleEditor.tsx
'use client';

import { useState } from 'react';
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetAllPermissionsQuery,
    useAssignPermissionsToRoleMutation,
    useRemovePermissionsFromRoleMutation,
    Role,
    Permission,
} from '@/src/redux/feature/rbacApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Loader2,
    Lock,
    Check,
    Settings2,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export function RoleEditor() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState(0);

    const { data: roles = [], isLoading } = useGetRolesQuery();
    const { data: permissions = [] } = useGetAllPermissionsQuery();
    
    const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
    const [assignPermissions] = useAssignPermissionsToRoleMutation();
    const [removePermissions] = useRemovePermissionsFromRoleMutation();

    const handleCreate = async () => {
        try {
            await createRole({
                name: name.toLowerCase().replace(/\s+/g, '_'),
                displayName,
                description: description || undefined,
                level,
            }).unwrap();
            resetForm();
            setShowCreateDialog(false);
            toast.success('Role created successfully');
        } catch (error) {
            console.error('Failed to create role:', error);
            toast.error('Failed to create role');
        }
    };

    const handleUpdate = async () => {
        if (!editingRole) return;
        try {
            await updateRole({
                id: editingRole.id,
                data: {
                    displayName,
                    description: description || undefined,
                    level,
                },
            }).unwrap();
            resetForm();
            setEditingRole(null);
            toast.success('Role updated successfully');
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update role');
        }
    };

    const handleDelete = async () => {
        if (!selectedRole) return;
        try {
            await deleteRole(selectedRole.id).unwrap();
            setShowDeleteDialog(false);
            setSelectedRole(null);
            toast.success('Role deleted successfully');
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error('Failed to delete role');
        }
    };

    const togglePermission = async (role: Role, permission: Permission) => {
        const hasPermission = role.permissions?.some(p => p.id === permission.id);
        
        try {
            if (hasPermission) {
                await removePermissions({
                    roleId: role.id,
                    data: { permissionIds: [permission.id] }
                }).unwrap();
            } else {
                await assignPermissions({
                    roleId: role.id,
                    data: { permissionIds: [permission.id] }
                }).unwrap();
            }
            toast.success('Permissions updated');
        } catch (error) {
            toast.error('Failed to update permissions');
        }
    };

    const resetForm = () => {
        setName('');
        setDisplayName('');
        setDescription('');
        setLevel(0);
    };

    const openEditDialog = (role: Role) => {
        setEditingRole(role);
        setDisplayName(role.displayName);
        setDescription(role.description || '');
        setLevel(role.level);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Define and manage system roles and their associated permissions.
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Role
                </Button>
            </div>

            {/* Role Cards */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.isArray(roles) && roles.map((role) => (
                    <Card key={role.id} className={cn(
                        "relative overflow-hidden transition-all hover:shadow-lg border-2",
                        role.isSystem ? "border-blue-100 bg-blue-50/20" : "border-border"
                    )}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            role.isSystem ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-lg">{role.displayName}</CardTitle>
                                    </div>
                                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-mono">
                                        {role.name}
                                    </code>
                                </div>
                                <div className="flex items-center gap-1">
                                    {role.isSystem ? (
                                        <Badge variant="outline" className="h-6 gap-1 bg-white">
                                            <Lock className="w-3 h-3" />
                                            System
                                        </Badge>
                                    ) : (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-white"
                                                onClick={() => openEditDialog(role)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-50 text-red-600"
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-2">
                                {role.description || 'No description provided for this role.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm py-2 border-y border-dashed">
                                <span className="text-muted-foreground font-medium">Power Level</span>
                                <Badge variant={role.level > 50 ? "default" : "secondary"}>
                                    Level {role.level}
                                </Badge>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Permissions</span>
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="h-auto p-0 text-xs"
                                        onClick={() => setSelectedRoleForPermissions(role)}
                                    >
                                        Manage
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {role.permissions && role.permissions.length > 0 ? (
                                        role.permissions.slice(0, 3).map(p => (
                                            <Badge key={p.id} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                                                {p.resource}:{p.action}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">No permissions assigned</span>
                                    )}
                                    {role.permissions && role.permissions.length > 3 && (
                                        <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                                            +{role.permissions.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Manage Permissions Dialog */}
            <Dialog open={!!selectedRoleForPermissions} onOpenChange={() => setSelectedRoleForPermissions(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-blue-600" />
                            Permissions: {selectedRoleForPermissions?.displayName}
                        </DialogTitle>
                        <DialogDescription>
                            Select the granular permissions allowed for this role.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto py-4 pr-2">
                        <div className="grid gap-6">
                            {/* Group permissions by resource */}
                            {Array.from(new Set(permissions.map(p => p.resource))).sort().map(resource => (
                                <div key={resource} className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <div className="h-px flex-1 bg-border" />
                                        {resource}
                                        <div className="h-px flex-1 bg-border" />
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {permissions.filter(p => p.resource === resource).map(permission => {
                                            const isActive = selectedRoleForPermissions?.permissions?.some(p => p.id === permission.id);
                                            return (
                                                <div 
                                                    key={permission.id} 
                                                    className={cn(
                                                        "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
                                                        isActive ? "border-blue-200 bg-blue-50/30" : "border-border"
                                                    )}
                                                    onClick={() => selectedRoleForPermissions && togglePermission(selectedRoleForPermissions, permission)}
                                                >
                                                    <Checkbox 
                                                        id={permission.id} 
                                                        checked={isActive}
                                                        onCheckedChange={() => selectedRoleForPermissions && togglePermission(selectedRoleForPermissions, permission)}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={permission.id}
                                                            className="text-sm font-medium leading-none cursor-pointer"
                                                        >
                                                            {permission.action}
                                                        </label>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {permission.description || `Can ${permission.action} ${resource}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-4 border-t pt-4">
                        <Button onClick={() => setSelectedRoleForPermissions(null)}>
                            Close Management
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Role Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>
                            Create a custom role with specific permissions and power level.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">System Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., moderator"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Power Level (0-100)</Label>
                                <Input
                                    id="level"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={level}
                                    onChange={(e) => setLevel(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                placeholder="e.g., Community Moderator"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this role is for..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={!name || !displayName || isCreating}>
                            {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
                        <DialogDescription>
                            Update the visual identity and power level of this role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editDisplayName">Display Name</Label>
                            <Input
                                id="editDisplayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editLevel">Power Level (0-100)</Label>
                            <Input
                                id="editLevel"
                                type="number"
                                min="0"
                                max="100"
                                value={level}
                                onChange={(e) => setLevel(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editDescription">Description</Label>
                            <Textarea
                                id="editDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingRole(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={!displayName || isUpdating}>
                            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Danger: Delete Role</DialogTitle>
                        <DialogDescription>
                            You are about to delete <strong>{selectedRole?.displayName}</strong>. 
                            This action is permanent. Users assigned to this role will lose their permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            I understand, delete role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
