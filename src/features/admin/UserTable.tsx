import { useState } from 'react';
import {
    useListUsersQuery,
    useDeleteUserMutation,
    useUpdateUserMutation,
    useSuspendUserMutation,
    useUnsuspendUserMutation,
    User,
    UserFilters,
    useUpdateUserQuotaMutation,
    useUpdateUserRoleMutation
} from '@/src/redux/feature/adminApi';
import { useGetRolesQuery } from '@/src/redux/feature/rbacApi';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Search,
    MoreHorizontal,
    UserPlus,
    Trash2,
    Edit,
    Shield,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Ban,
    UserCheck,
    Filter,
    Users,
    Building2,
    AlertTriangle,
    Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InviteDialog } from './InviteDialog';
import { UserEditDialog } from './UserEditDialog';
import { useRealtimeChat, useIsUserOnline } from '@/src/hooks/useRealtimeChat';
import { useAppSelector } from '@/src/redux/hooks';
import { getAvatarUrl } from '@/src/utils/image-utils';

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Quản trị viên cấp cao',
    ADMIN: 'Quản trị viên',
    WORKSPACE_MANAGER: 'Quản lý Workspace',
    EMPLOYEE: 'Nhân viên',
};

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    ADMIN: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    WORKSPACE_MANAGER: 'bg-orange-100 text-orange-700 border-orange-200',
    WORKSPACE_OWNER: 'bg-amber-100 text-amber-700 border-amber-200',
    WORKSPACE_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
    WORKSPACE_MEMBER: 'bg-slate-100 text-slate-700 border-slate-200',
    WORKSPACE_GUEST: 'bg-gray-100 text-gray-700 border-gray-200',
    EMPLOYEE: 'bg-green-100 text-green-700 border-green-200',
};

function UserRow({ user, isOnline, currentUser, onEdit, onRole, onQuota, onSuspend, onUnsuspend, onDelete }: any) {
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <TableRow className="hover:bg-slate-50/50 transition-colors">
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={getAvatarUrl(user.avatar, user.name)} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {user.role ? (
                    <Badge
                        variant="outline"
                        className={cn("font-medium", ROLE_COLORS[user.role] || "bg-slate-50 text-slate-600")}
                    >
                        {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                ) : (
                    <span className="text-sm text-slate-400">-</span>
                )}
            </TableCell>
            <TableCell>
                <Badge
                    variant="outline"
                    className={cn(
                        "font-medium px-2.5 py-0.5 rounded-full",
                        user.isActive && !user.isSuspended
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                    )}
                >
                    {user.isSuspended ? 'Đã đình chỉ' : user.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">
                        {isOnline ? 'Đang trực tuyến' : user.lastSeen
                            ? `Truy cập lần cuối ${format(new Date(user.lastSeen), 'HH:mm dd/MM')}`
                            : 'Chưa từng truy cập'
                        }
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <span className="text-sm text-slate-500 font-medium">
                    {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                </span>
            </TableCell>
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa hồ sơ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRole(user)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Quản lý vai trò
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onQuota(user)}>
                            <Building2 className="w-4 h-4 mr-2" />
                            Quản lý định mức
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isSuspended ? (
                            <DropdownMenuItem onClick={() => onUnsuspend(user)}>
                                <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                                Kích hoạt lại
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => onSuspend(user)}>
                                <Ban className="w-4 h-4 mr-2 text-amber-600" />
                                Tạm đình chỉ
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDelete(user)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa người dùng
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}

interface UserTableProps {
    onInviteUser?: () => void;
    onEditUser?: (user: User) => void;
}

export function UserTable({ onInviteUser, onEditUser }: UserTableProps) {
    const { onlineUsers } = useRealtimeChat();
    const currentUser = useAppSelector((state) => state.auth.user);
    const [filters, setFilters] = useState<UserFilters>({ limit: 10 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendCategory, setSuspendCategory] = useState('POLICY_VIOLATION');
    const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
    const [unsuspendReason, setUnsuspendReason] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showQuotaDialog, setShowQuotaDialog] = useState(false);
    const [quotaValue, setQuotaValue] = useState(10);

    const [deleteMode, setDeleteMode] = useState<'anonymize' | 'hard'>('anonymize');
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

    const { data: usersData, isLoading, isFetching } = useListUsersQuery({
        ...filters,
        search: searchQuery || undefined,
    });
    const { data: rolesData } = useGetRolesQuery();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [updateUserRole, { isLoading: isAssigning }] = useUpdateUserRoleMutation();
    const [suspendUser, { isLoading: isSuspending }] = useSuspendUserMutation();
    const [unsuspendUser, { isLoading: isUpdating }] = useUnsuspendUserMutation();
    const [updateQuota, { isLoading: isUpdatingQuota }] = useUpdateUserQuotaMutation();

    const users = usersData?.items || [];
    const roles = Array.isArray(rolesData) ? rolesData : (rolesData as any)?.roles || [];

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setFilters(prev => ({ ...prev, cursor: undefined }));
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        if (deleteConfirmEmail !== selectedUser.email) {
            toast.error('Email xác nhận không chính xác');
            return;
        }

        try {
            await deleteUser({ 
                id: selectedUser.id, 
                anonymize: deleteMode === 'anonymize' 
            }).unwrap();
            toast.success(deleteMode === 'anonymize' ? 'Vô danh hóa người dùng thành công' : 'Xóa người dùng vĩnh viễn thành công');
            setShowDeleteDialog(false);
            setSelectedUser(null);
            setDeleteConfirmEmail('');
        } catch (error) {
            toast.error('Thao tác xóa thất bại');
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) return;

        // Tìm tên vai trò từ ID đã chọn
        const roleToAssign = roles.find((r: any) => r.id === selectedRole);
        if (!roleToAssign) {
            toast.error('Không tìm thấy thông tin vai trò');
            return;
        }

        try {
            await updateUserRole({
                userId: selectedUser.id,
                role: roleToAssign.name
            }).unwrap();
            toast.success('Gán vai trò thành công');
            setShowRoleDialog(false);
            setSelectedUser(null);
            setSelectedRole('');
        } catch (error) {
            toast.error('Gán vai trò thất bại');
        }
    };

    const handleSuspend = async () => {
        if (!selectedUser || !suspendReason) return;
        try {
            const finalReason = `[${suspendCategory}] ${suspendReason}`;
            await suspendUser({ id: selectedUser.id, reason: finalReason }).unwrap();
            toast.success('Đã tạm đình chỉ người dùng');
            setShowSuspendDialog(false);
            setSelectedUser(null);
            setSuspendReason('');
        } catch (error) {
            toast.error('Tạm đình chỉ người dùng thất bại');
        }
    };

    const handleUnsuspend = async () => {
        if (!selectedUser || !unsuspendReason) return;
        try {
            await unsuspendUser({ id: selectedUser.id, reason: unsuspendReason }).unwrap();
            toast.success('Kích hoạt lại người dùng thành công');
            setShowUnsuspendDialog(false);
            setSelectedUser(null);
            setUnsuspendReason('');
        } catch (error) {
            toast.error('Kích hoạt lại người dùng thất bại');
        }
    };

    const handleUpdateQuota = async () => {
        if (!selectedUser) return;
        try {
            await updateQuota({
                userId: selectedUser.id,
                maxWorkspaces: quotaValue
            }).unwrap();
            toast.success('Cập nhật định mức người dùng thành công');
            setShowQuotaDialog(false);
            setSelectedUser(null);
        } catch (error) {
            toast.error('Cập nhật định mức người dùng thất bại');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
            {/* Header & Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm người dùng..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9 h-10"
                        />
                    </div>
                    <Select
                        value={filters.role || 'all'}
                        onValueChange={(val) => setFilters(prev => ({ ...prev, role: val === 'all' ? undefined : val }))}
                    >
                        <SelectTrigger className="w-[150px] h-10">
                            <Filter className="w-3.5 h-3.5 mr-2" />
                            <SelectValue placeholder="Vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả vai trò</SelectItem>
                            {roles.map((r: any) => (
                                <SelectItem key={r.id} value={r.name}>{r.displayName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setShowInviteDialog(true)} className="h-10">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Mời người dùng
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Người dùng</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Hoạt động</TableHead>
                            <TableHead>Ngày tham gia</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="w-8 h-8 opacity-20" />
                                        <p>Không tìm thấy người dùng nào khớp với tìm kiếm</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    isOnline={onlineUsers.has(user.id)}
                                    currentUser={currentUser}
                                    onEdit={(u: any) => {
                                        setSelectedUser(u);
                                        setShowEditDialog(true);
                                        onEditUser?.(u);
                                    }}
                                    onRole={(u : any) => { setSelectedUser(u); setShowRoleDialog(true); }}
                                    onQuota={(u : any) => { setSelectedUser(u); setQuotaValue(10); setShowQuotaDialog(true); }}
                                    onSuspend={(u : any) => { setSelectedUser(u); setShowSuspendDialog(true); }}
                                    onUnsuspend={(u :any) => { setSelectedUser(u); setShowUnsuspendDialog(true); }}
                                    onDelete={(u: any) => { setSelectedUser(u); setShowDeleteDialog(true); }}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {usersData && usersData.total > 10 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground font-medium">
                        Hiển thị <span className="text-slate-900">{users.length}</span> trong số <span className="text-slate-900">{usersData.total}</span> người dùng
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={!filters.cursor}
                            onClick={() => setFilters(prev => ({ ...prev, cursor: undefined }))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={!usersData.nextCursor}
                            onClick={() => setFilters(prev => ({ ...prev, cursor: usersData.nextCursor }))}
                        >
                            Sau
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={(open) => {
                setShowDeleteDialog(open);
                if (!open) setDeleteConfirmEmail('');
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Xóa tài khoản người dùng
                        </DialogTitle>
                        <DialogDescription>
                            Hành động này có tác động lớn đến dữ liệu hệ thống. Vui lòng chọn phương thức xử lý.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        <RadioGroup value={deleteMode} onValueChange={(val: any) => setDeleteMode(val)} className="space-y-3">
                            <div className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                deleteMode === 'anonymize' ? "bg-slate-50 border-slate-200" : "border-transparent"
                            )}>
                                <RadioGroupItem value="anonymize" id="anonymize" className="mt-1" />
                                <Label htmlFor="anonymize" className="flex-1 cursor-pointer">
                                    <span className="block font-semibold text-slate-900">Vô danh hóa (Khuyên dùng)</span>
                                    <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Giữ lại các tin nhắn và dữ liệu workspace nhưng thay thế thông tin cá nhân bằng "Deleted User". Đảm bảo tính toàn vẹn của các cuộc hội thoại cũ.
                                    </span>
                                </Label>
                            </div>

                            <div className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                deleteMode === 'hard' ? "bg-red-50 border-red-200" : "border-transparent"
                            )}>
                                <RadioGroupItem value="hard" id="hard" className="mt-1" />
                                <Label htmlFor="hard" className="flex-1 cursor-pointer">
                                    <span className="block font-semibold text-red-700">Xóa vĩnh viễn</span>
                                    <span className="block text-xs text-red-600/70 mt-1 leading-relaxed">
                                        Xóa bỏ hoàn toàn mọi dữ liệu liên quan. Có thể gây ra lỗi hiển thị trong các cuộc hội thoại nhóm hoặc workspace mà người dùng này từng tham gia.
                                    </span>
                                </Label>
                            </div>
                        </RadioGroup>

                        <div className="space-y-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
                                <Info className="w-4 h-4" />
                                Xác nhận danh tính người dùng
                            </div>
                            <p className="text-xs text-amber-700">
                                Nhập chính xác email <strong>{selectedUser?.email}</strong> để xác nhận.
                            </p>
                            <Input
                                placeholder="Nhập email để xác nhận..."
                                value={deleteConfirmEmail}
                                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={isDeleting || deleteConfirmEmail !== selectedUser?.email}
                            className="min-w-[120px]"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Dialog */}
            <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <Ban className="w-5 h-5" />
                            Đình chỉ tài khoản
                        </DialogTitle>
                        <DialogDescription>
                            Người dùng sẽ bị đăng xuất ngay lập tức và không thể truy cập hệ thống cho đến khi được mở khóa.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Lý do đình chỉ</Label>
                            <Select value={suspendCategory} onValueChange={setSuspendCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục lý do" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="POLICY_VIOLATION">Vi phạm điều khoản sử dụng</SelectItem>
                                    <SelectItem value="SECURITY_RISK">Rủi ro bảo mật / Nghi ngờ xâm nhập</SelectItem>
                                    <SelectItem value="INAPPROPRIATE_BEHAVIOR">Hành vi không phù hợp</SelectItem>
                                    <SelectItem value="REQUESTED_BY_MANAGER">Yêu cầu từ cấp quản lý</SelectItem>
                                    <SelectItem value="OTHER">Lý do khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Chi tiết lý do (Bắt buộc)</Label>
                            <Textarea
                                placeholder="Mô tả chi tiết để phục vụ việc đối soát sau này..."
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                className="min-h-[100px] resize-none"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                * Lý do này sẽ được lưu vào lịch sử audit và có thể hiển thị cho người dùng.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSuspend}
                            disabled={!suspendReason || suspendReason.length < 5 || isSuspending}
                            className="bg-amber-600 hover:bg-amber-700 border-none"
                        >
                            {isSuspending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xác nhận đình chỉ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unsuspend Dialog */}
            <Dialog open={showUnsuspendDialog} onOpenChange={setShowUnsuspendDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <UserCheck className="w-5 h-5" />
                            Mở đình chỉ tài khoản
                        </DialogTitle>
                        <DialogDescription>
                            Người dùng này sẽ có thể đăng nhập lại và tham gia các hoạt động như bình thường.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg space-y-1">
                            <p className="text-xs font-semibold text-green-800">Thông tin đình chỉ trước đó:</p>
                            <p className="text-xs text-green-700 italic">"{selectedUser?.suspendReason || 'Không có dữ liệu'}"</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Lý do mở khóa (Bắt buộc)</Label>
                            <Textarea
                                placeholder="Nhập lý do cho việc khôi phục tài khoản này..."
                                value={unsuspendReason}
                                onChange={(e) => setUnsuspendReason(e.target.value)}
                                className="min-h-[100px] resize-none border-green-200 focus-visible:ring-green-500"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowUnsuspendDialog(false);
                            setUnsuspendReason('');
                        }}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUnsuspend}
                            disabled={!unsuspendReason || unsuspendReason.length < 5 || isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        >
                            {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Khôi phục tài khoản
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Change Role Dialog */}
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật vai trò người dùng</DialogTitle>
                        <DialogDescription>
                            Gán một vai trò bảo mật mới cho <strong>{selectedUser?.name}</strong>.
                            Thay đổi sẽ có hiệu lực trong phiên làm việc tiếp theo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="Chọn một vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role: any) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleAssignRole}
                            className="bg-primary"
                            disabled={!selectedRole || isAssigning}
                        >
                            {isAssigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cập nhật quyền hạn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quota Dialog */}
            <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quản lý giới hạn Workspace</DialogTitle>
                        <DialogDescription>
                            Thiết lập số lượng Workspace tối đa mà <strong>{selectedUser?.name}</strong> có thể tạo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Giới hạn số lượng (Workspaces)</label>
                            <Input
                                type="number"
                                value={quotaValue}
                                onChange={(e) => setQuotaValue(parseInt(e.target.value))}
                                min={1}
                                max={100}
                                className="h-11"
                            />
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                            <Building2 className="w-5 h-5 text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Giới hạn này sẽ ghi đè lên giới hạn mặc định của hệ thống hoặc của tổ chức (nếu có).
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateQuota}
                            disabled={isUpdatingQuota}
                        >
                            {isUpdatingQuota && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cập nhật Quota
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invite Dialog */}
            <InviteDialog
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
            />

            {/* Edit Dialog */}
            <UserEditDialog
                user={selectedUser}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />
        </div>
    );
}

