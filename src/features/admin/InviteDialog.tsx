'use client';

import { useState } from 'react';
import { useInviteUserMutation, useProvisionUserMutation } from '@/src/redux/feature/adminApi';
import { useGetRolesQuery } from '@/src/redux/feature/rbacApi';
import { useListDepartmentsQuery, useGetDepartmentQuery } from '@/src/redux/feature/departmentApi';
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
import { Loader2, Mail, UserPlus, ShieldCheck, UserCheck, Sparkles, Building2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { toast } from 'sonner';

interface InviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
    // Flow Mode: 'C' = Email Invitation (Flow C), 'A' = Direct Provisioning (Flow A)
    const [flowMode, setFlowMode] = useState<'A' | 'C'>('C');
    
    // Form fields
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState('none');
    const [departmentRole, setDepartmentRole] = useState<'HEAD' | 'MANAGER' | 'MEMBER' | 'GUEST'>('MEMBER');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // API hooks
    const { data: rolesData } = useGetRolesQuery();
    const { data: departmentsData } = useListDepartmentsQuery(undefined, { skip: !open });
    
    const [inviteUser, { isLoading: isInvitingUser }] = useInviteUserMutation();
    const [provisionUser, { isLoading: isProvisioning }] = useProvisionUserMutation();

    const departments = departmentsData || [];

    // Fetch selected department details to check if HEAD already exists
    const { data: selectedDeptData, isFetching: isFetchingDept } = useGetDepartmentQuery(
        selectedDepartmentId,
        { skip: selectedDepartmentId === 'none' }
    );
    const deptHasHead = (selectedDeptData?.members ?? []).some(m => m.role === 'HEAD');

    const currentUserRoles = useSelector((state: RootState) => state.auth.roles) || [];
    const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');
    const isWorkspaceAdmin = currentUserRoles.includes('WORKSPACE_ADMIN') || currentUserRoles.includes('WORKSPACE_OWNER');

    const roles = (rolesData || []).filter(r => {
        if (isSuperAdmin) return true;
        if (isWorkspaceAdmin) {
            // Workspace Admin can invite ADMIN, WORKSPACE_MANAGER, EMPLOYEE
            return ['ADMIN', 'WORKSPACE_MANAGER', 'EMPLOYEE'].includes(r.name);
        }
        return r.name === 'EMPLOYEE';
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailClean = email.trim().toLowerCase();
        if (!emailClean) {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }

        const departmentId = selectedDepartmentId === 'none' ? undefined : selectedDepartmentId;

        if (flowMode === 'A') {
            // Flow A: Direct Provisioning (Cấp tài khoản trực tiếp)
            const nameClean = name.trim();
            if (!nameClean) {
                setError('Họ và tên là bắt buộc đối với cấp tài khoản trực tiếp');
                return;
            }
            if (!role) {
                setError('Vui lòng chọn vai trò hệ thống');
                return;
            }

            try {
                await provisionUser({
                    email: emailClean,
                    name: nameClean,
                    role: role,
                    departmentId: departmentId,
                    departmentRole: departmentId ? departmentRole : undefined
                }).unwrap();

                toast.success(`Đã cấp tài khoản trực tiếp và gửi mail chào mừng tới ${emailClean}`);
                handleClose();
            } catch (err: unknown) {
                const error = err as { data?: { message?: string } };
                setError(error?.data?.message || 'Cấp tài khoản trực tiếp thất bại');
            }
        } else {
            // Flow C: Email Invitation (Always using general inviteUser system invitation with department selection)
            try {
                await inviteUser({
                    email: emailClean,
                    role: role || undefined,
                    department: departmentId,
                    departmentRole: departmentId ? departmentRole : undefined,
                    message: message || undefined,
                }).unwrap();
                
                if (departmentId) {
                    toast.success(`Đã gửi thư mời tham gia phòng ban và hệ thống tới ${emailClean}`);
                } else {
                    toast.success(`Đã gửi thư mời tham gia hệ thống tới ${emailClean}`);
                }
                handleClose();
            } catch (err: unknown) {
                const error = err as { data?: { message?: string } };
                setError(error?.data?.message || 'Gửi thư mời thất bại');
            }
        }
    };

    const handleClose = () => {
        setEmail('');
        setName('');
        setRole('EMPLOYEE');
        setSelectedDepartmentId('none');
        setDepartmentRole('MEMBER');
        setMessage('');
        setError('');
        onOpenChange(false);
    };

    const isLoading = isInvitingUser || isProvisioning;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl bg-white dark:bg-slate-950">
                {/* Visual Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/60 dark:bg-slate-900/40">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-slate-150">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                        Quản lý Thêm Nhân sự Mới
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                        Bổ sung nhân sự mới vào hệ thống thông qua Cấp tài khoản trực tiếp hoặc gửi thư mời.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Flow Mode Switcher Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                        <button
                            type="button"
                            onClick={() => {
                                setFlowMode('C');
                                setError('');
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                flowMode === 'C'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                            }`}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Gửi Thư mời (Flow C)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFlowMode('A');
                                setError('');
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                flowMode === 'A'
                                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Cấp Tài khoản (Flow A)
                        </button>
                    </div>

                    {/* Flow Mode Description Callout */}
                    <div className={`p-3 rounded-lg border text-[11px] leading-relaxed font-medium transition-all ${
                        flowMode === 'A'
                            ? 'bg-amber-500/5 border-amber-500/25 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-500/5 border-blue-500/25 text-blue-750 dark:text-blue-450'
                    }`}>
                        {flowMode === 'A' ? (
                            <div className="flex gap-2">
                                <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                                <p><strong>Cấp tài khoản trực tiếp:</strong> Tài khoản được khởi tạo lập tức với quyền hoạt động, hệ thống gửi email kích hoạt chứa liên kết thiết lập mật khẩu.</p>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                                <p><strong>Mời qua Email:</strong> Hệ thống gửi email chứa liên kết bảo mật có thời hạn 48 giờ để nhân viên tự tạo tài khoản và điền thông tin cá nhân.</p>
                            </div>
                        )}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Địa chỉ Email *</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="nhanvien@congty.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-blue-550"
                            />
                        </div>
                    </div>

                    {/* Full Name Input (Only for Flow A) */}
                    {flowMode === 'A' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Label htmlFor="invite-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Họ và tên nhân viên *</Label>
                            <Input
                                id="invite-name"
                                placeholder="Nguyễn Văn A"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-blue-550"
                            />
                        </div>
                    )}

                    {/* Role Select */}
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vai trò Hệ thống</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 cursor-pointer">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                    <SelectValue placeholder="Chọn vai trò hệ thống" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.name} className="cursor-pointer text-xs py-2">
                                        <div>
                                            <span className="font-semibold">{r.displayName}</span>
                                            {r.description && (
                                                <span className="ml-2 text-[10px] text-slate-400">
                                                    - {r.description}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Department Select (For both flows!) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="invite-department" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phòng ban liên kết</Label>
                        <Select value={selectedDepartmentId} onValueChange={(val) => {
                            setSelectedDepartmentId(val);
                            // Reset dept role to safe default when changing department
                            setDepartmentRole('MEMBER');
                        }}>
                            <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 cursor-pointer">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                    <SelectValue placeholder="Chọn phòng ban (tùy chọn)" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                <SelectItem value="none" className="cursor-pointer text-xs">
                                    <span className="text-slate-400 italic">Không phân phòng ban</span>
                                </SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id} className="cursor-pointer text-xs">
                                        <span className="font-semibold">{d.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Department Role Select — chỉ hiện khi đã chọn phòng ban */}
                    {selectedDepartmentId !== 'none' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Label htmlFor="invite-dept-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Vai trò trong Phòng ban <span className="text-red-500">*</span>
                            </Label>

                            {/* HEAD already exists hint */}
                            {deptHasHead && (
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/8 border border-amber-500/20 px-2.5 py-1.5 rounded-md font-semibold">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    Phòng ban này đã có Trưởng phòng — vai trò HEAD không khả dụng.
                                </div>
                            )}

                            <Select
                                value={departmentRole}
                                onValueChange={(v) => setDepartmentRole(v as typeof departmentRole)}
                                disabled={isFetchingDept}
                            >
                                <SelectTrigger className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 cursor-pointer">
                                    {isFetchingDept
                                        ? <span className="flex items-center gap-1.5 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra...</span>
                                        : <SelectValue placeholder="Chọn vai trò phòng ban" />
                                    }
                                </SelectTrigger>
                                <SelectContent className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                    {/* HEAD chỉ hiện khi phòng ban chưa có HEAD */}
                                    {!deptHasHead && (
                                        <SelectItem value="HEAD" className="cursor-pointer text-xs">
                                            <span className="font-semibold text-amber-700 dark:text-amber-400">Trưởng phòng (HEAD)</span>
                                        </SelectItem>
                                    )}
                                    <SelectItem value="MANAGER" className="cursor-pointer text-xs">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Phó phòng (MANAGER)</span>
                                    </SelectItem>
                                    <SelectItem value="MEMBER" className="cursor-pointer text-xs">
                                        <span className="font-semibold text-blue-700 dark:text-blue-400">Thành viên (MEMBER)</span>
                                    </SelectItem>
                                    <SelectItem value="GUEST" className="cursor-pointer text-xs">
                                        <span className="font-semibold text-zinc-600 dark:text-zinc-400">Khách (GUEST)</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Personal Message (Only for Flow C) */}
                    {flowMode === 'C' && selectedDepartmentId === 'none' && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                            <Label htmlFor="invite-message" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lời nhắn trong email (Tùy chọn)</Label>
                            <Textarea
                                id="invite-message"
                                placeholder="Nhập lời nhắn cá nhân gửi kèm trong thư mời..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={2.5}
                                className="text-xs rounded-lg border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 resize-none focus-visible:ring-1 focus-visible:ring-blue-550"
                            />
                        </div>
                    )}

                    {/* Error display */}
                    {error && (
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-red-600 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-lg animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <p className="flex-1">{error}</p>
                        </div>
                    )}

                    {/* Footer buttons */}
                    <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-750 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={`h-8.5 text-xs font-bold rounded-lg text-white transition-all cursor-pointer min-w-[130px] shadow-sm ${
                                flowMode === 'A'
                                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                            }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : flowMode === 'A' ? (
                                'Cấp tài khoản ngay'
                            ) : (
                                'Gửi thư mời qua Mail'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Inline dummy AlertCircle icon for error fallback to prevent compilation failure
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
