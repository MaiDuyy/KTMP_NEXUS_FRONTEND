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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                    <h2 className="text-base font-bold tracking-tight text-foreground">Quản lý vai trò</h2>
                    <p className="text-xs text-muted-foreground">
                        Định nghĩa và quản lý các vai trò trong hệ thống cùng các quyền tương ứng.
                    </p>
                </div>
                <Button size="sm" className="h-8 rounded-lg shadow-sm font-medium text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Tạo vai trò mới
                </Button>
            </div>

            {/* Role Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.isArray(roles) && roles.map((role) => (
                    <Card key={role.id} className={cn(
                        "rounded-xl border transition-all hover:shadow-md bg-card text-card-foreground shadow-sm relative overflow-hidden flex flex-col justify-between",
                        role.isSystem 
                            ? "border-blue-200/50 bg-blue-50/5 dark:border-blue-900/30 dark:bg-blue-950/5" 
                            : "border-border"
                    )}>
                        <CardHeader className="p-4 pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "p-1.5 rounded-lg flex items-center justify-center",
                                            role.isSystem 
                                                ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" 
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-foreground leading-none">{role.displayName}</CardTitle>
                                    </div>
                                    <code className="inline-block text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-mono leading-none tracking-wider">
                                        {role.name}
                                    </code>
                                </div>
                                <div className="flex items-center gap-1">
                                    {role.isSystem ? (
                                        <Badge variant="outline" className="h-5 gap-1 bg-background text-[10px] px-1.5 py-0 font-medium border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Lock className="w-2.5 h-2.5" />
                                            Hệ thống
                                        </Badge>
                                    ) : (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => openEditDialog(role)}
                                            >
                                                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <CardDescription className="text-xs line-clamp-2 min-h-[2rem] mt-2.5 text-muted-foreground leading-normal">
                                {role.description || 'Chưa có mô tả nào cho vai trò này.'}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0 space-y-3 mt-auto">
                            <div className="flex items-center justify-between text-xs py-1.5 border-y border-dashed border-border">
                                <span className="text-muted-foreground font-medium">Cấp độ quyền</span>
                                <Badge variant={role.level > 50 ? "default" : "secondary"} className="h-5 text-[10px] rounded-md px-1.5 py-0">
                                    Cấp {role.level}
                                </Badge>
                            </div>
                            
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quyền hạn</span>
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="h-auto p-0 text-xs font-semibold text-primary hover:no-underline hover:text-primary/80"
                                        onClick={() => setSelectedRoleForPermissions(role)}
                                    >
                                        Quản lý
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions && role.permissions.length > 0 ? (
                                        role.permissions.slice(0, 3).map(p => (
                                            <Badge key={p.id} variant="secondary" className="text-[9px] font-medium px-1.5 py-0.5 rounded-md border border-border bg-muted/50 text-foreground">
                                                {p.resource}:{p.action}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">Chưa gán quyền hạn nào</span>
                                    )}
                                    {role.permissions && role.permissions.length > 3 && (
                                        <Badge variant="secondary" className="text-[9px] font-medium px-1.5 py-0.5 rounded-md border border-border bg-muted/50 text-foreground">
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
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border p-4 bg-background">
                    <DialogHeader className="pb-2 border-b border-border">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Quyền hạn: {selectedRoleForPermissions?.displayName}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Chọn các quyền chi tiết cho phép đối với vai trò này.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto py-3 pr-1 my-2">
                        <div className="grid gap-4">
                            {/* Group permissions by resource */}
                            {Array.from(new Set(permissions.map(p => p.resource))).sort().map(resource => (
                                <div key={resource} className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <span className="shrink-0">{resource}</span>
                                        <div className="h-px flex-1 bg-border" />
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {permissions.filter(p => p.resource === resource).map(permission => {
                                            const isActive = selectedRoleForPermissions?.permissions?.some(p => p.id === permission.id);
                                            return (
                                                <div 
                                                    key={permission.id} 
                                                    className={cn(
                                                        "flex items-center space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40",
                                                        isActive 
                                                            ? "border-blue-200 bg-blue-50/10 dark:border-blue-900/30 dark:bg-blue-950/10" 
                                                            : "border-border bg-card"
                                                    )}
                                                    onClick={() => selectedRoleForPermissions && togglePermission(selectedRoleForPermissions, permission)}
                                                >
                                                    <Checkbox 
                                                        id={permission.id} 
                                                        checked={isActive}
                                                        className="rounded border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                        onCheckedChange={() => selectedRoleForPermissions && togglePermission(selectedRoleForPermissions, permission)}
                                                    />
                                                    <div className="grid gap-0.5 leading-none">
                                                        <label
                                                            htmlFor={permission.id}
                                                            className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                                                        >
                                                            {permission.action}
                                                        </label>
                                                        <p className="text-[10px] text-muted-foreground leading-normal">
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
                    
                    <DialogFooter className="mt-auto border-t border-border pt-3 flex justify-end">
                        <Button size="sm" className="h-8 text-xs rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setSelectedRoleForPermissions(null)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Role Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md rounded-xl border border-border p-4 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">Tạo vai trò mới</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Tạo vai trò tùy chỉnh với các quyền hạn và cấp độ cụ thể.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên hệ thống (Mã)</Label>
                                <Input
                                    id="name"
                                    placeholder="VD: moderator"
                                    value={name}
                                    className="h-8 rounded-lg text-xs"
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="level" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cấp độ quyền (0-100)</Label>
                                <Input
                                    id="level"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={level}
                                    className="h-8 rounded-lg text-xs"
                                    onChange={(e) => setLevel(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="displayName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên hiển thị</Label>
                            <Input
                                id="displayName"
                                placeholder="VD: Quản trị viên cộng đồng"
                                value={displayName}
                                className="h-8 rounded-lg text-xs"
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô tả</Label>
                            <Textarea
                                id="description"
                                placeholder="Mô tả mục đích của vai trò này..."
                                value={description}
                                className="rounded-lg text-xs min-h-[60px] py-1.5"
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-border bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setShowCreateDialog(false)}>
                            Hủy
                        </Button>
                        <Button size="sm" className="h-8 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCreate} disabled={!name || !displayName || isCreating}>
                            {isCreating && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                            Tạo vai trò
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
                <DialogContent className="max-w-md rounded-xl border border-border p-4 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">Sửa vai trò: {editingRole?.name}</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Cập nhật thông tin và cấp độ quyền lực cho vai trò này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="editDisplayName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên hiển thị</Label>
                            <Input
                                id="editDisplayName"
                                value={displayName}
                                className="h-8 rounded-lg text-xs"
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editLevel" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cấp độ quyền (0-100)</Label>
                            <Input
                                id="editLevel"
                                type="number"
                                min="0"
                                max="100"
                                value={level}
                                className="h-8 rounded-lg text-xs"
                                onChange={(e) => setLevel(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editDescription" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mô tả</Label>
                            <Textarea
                                id="editDescription"
                                value={description}
                                className="rounded-lg text-xs min-h-[60px] py-1.5"
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-border bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setEditingRole(null)}>
                            Hủy
                        </Button>
                        <Button size="sm" className="h-8 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleUpdate} disabled={!displayName || isUpdating}>
                            {isUpdating && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md rounded-xl border border-border p-4 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 text-base font-bold">Xác nhận xóa vai trò</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Hành động xóa vai trò này có ảnh hưởng trực tiếp đến người dùng hiện tại sở hữu vai trò đó.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="border border-rose-200 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg text-xs text-rose-800 dark:text-rose-300 my-2 leading-relaxed">
                        Bạn sắp xóa vai trò <strong>{selectedRole?.displayName}</strong>.
                        Hành động này <strong>không thể hoàn tác</strong>. Người dùng đang được gán vai trò này sẽ mất toàn bộ quyền hạn tương ứng ngay lập tức.
                    </div>
                    
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-border bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setShowDeleteDialog(false)}>
                            Hủy
                        </Button>
                        <Button size="sm" className="h-8 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-medium" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
