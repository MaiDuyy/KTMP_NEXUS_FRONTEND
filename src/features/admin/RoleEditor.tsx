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
            toast.success('Tạo vai trò thành công');
        } catch (error) {
            console.error('Failed to create role:', error);
            toast.error('Tạo vai trò thất bại');
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
            toast.success('Cập nhật vai trò thành công');
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Cập nhật vai trò thất bại');
        }
    };

    const handleDelete = async () => {
        if (!selectedRole) return;
        try {
            await deleteRole(selectedRole.id).unwrap();
            setShowDeleteDialog(false);
            setSelectedRole(null);
            toast.success('Xóa vai trò thành công');
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error('Xóa vai trò thất bại');
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
            toast.success('Cập nhật quyền hạn thành công');
        } catch (error) {
            toast.error('Cập nhật quyền hạn thất bại');
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
                    <h2 className="text-2xl font-bold tracking-tight">Quản lý vai trò</h2>
                    <p className="text-sm text-muted-foreground">
                        Định nghĩa và quản lý các vai trò trong hệ thống cùng các quyền tương ứng.
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo vai trò mới
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
                                            Hệ thống
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
                                {role.description || 'Chưa có mô tả nào cho vai trò này.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm py-2 border-y border-dashed">
                                <span className="text-muted-foreground font-medium">Cấp độ quyền</span>
                                <Badge variant={role.level > 50 ? "default" : "secondary"}>
                                    Cấp {role.level}
                                </Badge>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Quyền hạn</span>
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="h-auto p-0 text-xs"
                                        onClick={() => setSelectedRoleForPermissions(role)}
                                    >
                                        Quản lý
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
                                        <span className="text-[10px] text-muted-foreground italic">Chưa gán quyền hạn nào</span>
                                    )}
                                    {role.permissions && role.permissions.length > 3 && (
                                        <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                                            +{role.permissions.length - 3} quyền khác
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
                            Quyền hạn: {selectedRoleForPermissions?.displayName}
                        </DialogTitle>
                        <DialogDescription>
                            Chọn các quyền chi tiết cho phép đối với vai trò này.
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
                                                            {permission.description || `Có thể ${permission.action} ${resource}`}
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
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Role Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo vai trò mới</DialogTitle>
                        <DialogDescription>
                            Tạo vai trò tùy chỉnh với các quyền hạn và cấp độ cụ thể.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên hệ thống (Mã)</Label>
                                <Input
                                    id="name"
                                    placeholder="VD: moderator"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Cấp độ quyền (0-100)</Label>
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
                            <Label htmlFor="displayName">Tên hiển thị</Label>
                            <Input
                                id="displayName"
                                placeholder="VD: Quản trị viên cộng đồng"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                placeholder="Mô tả mục đích của vai trò này..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleCreate} disabled={!name || !displayName || isCreating}>
                            {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tạo vai trò
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sửa vai trò: {editingRole?.name}</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin và cấp độ quyền lực cho vai trò này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editDisplayName">Tên hiển thị</Label>
                            <Input
                                id="editDisplayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editLevel">Cấp độ quyền (0-100)</Label>
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
                            <Label htmlFor="editDescription">Mô tả</Label>
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
                            Hủy
                        </Button>
                        <Button onClick={handleUpdate} disabled={!displayName || isUpdating}>
                            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Nguy hiểm: Xóa vai trò</DialogTitle>
                        <DialogDescription>
                            Bạn sắp xóa <strong>{selectedRole?.displayName}</strong>. 
                            Hành động này không thể hoàn tác. Người dùng có vai trò này sẽ mất các quyền tương ứng.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tôi hiểu, tiến hành xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
