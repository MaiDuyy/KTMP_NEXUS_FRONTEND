'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import {
  useGetDepartmentQuery,
  useAddDepartmentMemberMutation,
  useUpdateDepartmentMemberMutation,
  useRemoveDepartmentMemberMutation,
  useProvisionDepartmentMemberMutation,
  useInviteDepartmentMemberMutation,
} from '@/src/redux/feature/departmentApi';
import { useListUsersQuery } from '@/src/redux/feature/adminApi';
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  User,
  Loader2,
  Trash2,
  Search,
  Building2,
  UserCheck,
  ShieldAlert,
  Users,
  Crown,
  X,
} from 'lucide-react';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeptMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  departmentName: string;
}

// ─── Role Config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  { label: string; short: string; badgeCls: string; dotCls: string; icon: React.ReactNode; priority: number }
> = {
  HEAD: {
    label: 'Trưởng phòng',
    short: 'Head',
    badgeCls:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    dotCls: 'bg-amber-500',
    icon: <Crown className="w-3 h-3" />,
    priority: 0,
  },
  MANAGER: {
    label: 'Quản lý',
    short: 'Manager',
    badgeCls:
      'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
    dotCls: 'bg-indigo-500',
    icon: <ShieldAlert className="w-3 h-3" />,
    priority: 1,
  },
  MEMBER: {
    label: 'Thành viên',
    short: 'Member',
    badgeCls:
      'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    dotCls: 'bg-blue-500',
    icon: <User className="w-3 h-3" />,
    priority: 2,
  },
  GUEST: {
    label: 'Khách',
    short: 'Guest',
    badgeCls:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    dotCls: 'bg-slate-400',
    icon: <UserCheck className="w-3 h-3" />,
    priority: 3,
  },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Component ────────────────────────────────────────────────────────────────

export function DeptMembersDialog({
  open,
  onOpenChange,
  departmentId,
  departmentName,
}: DeptMembersDialogProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedUserId, setSelectedUserId]   = useState('');   // always UUID or ''
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>(undefined);
  const [selectedRole, setSelectedRole]       = useState('MEMBER');
  const [comboOpen, setComboOpen]             = useState(false);
  const [isProvisioningFormOpen, setIsProvisioningFormOpen] = useState(false);
  const [provisionName, setProvisionName]     = useState('');
  const comboRef = useRef<HTMLDivElement>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset state on dialog close
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedUserId('');
      setSelectedUserName('');
      setSelectedUserAvatar(undefined);
      setSelectedRole('MEMBER');
      setComboOpen(false);
      setIsProvisioningFormOpen(false);
      setProvisionName('');
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Queries & Mutations ────────────────────────────────────────────────────
  const { data: department, isLoading: isDeptLoading } = useGetDepartmentQuery(
    departmentId,
    { skip: !departmentId || !open }
  );

  // Load all users once — filter locally for instant, lag-free search
  const { data: usersData, isLoading: isUsersLoading } = useListUsersQuery(
    { limit: 500 },
    { skip: !open }
  );

  const [addMember,    { isLoading: isAdding   }] = useAddDepartmentMemberMutation();
  const [updateMember                           ] = useUpdateDepartmentMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveDepartmentMemberMutation();
  const [provisionMember, { isLoading: isProvisioning }] = useProvisionDepartmentMemberMutation();
  const [inviteMember, { isLoading: isInviting }] = useInviteDepartmentMemberMutation();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id;
  const currentUserRoles = useSelector((state: RootState) => state.auth.roles) || [];
  const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');

  const currentUserDeptRole = useMemo(() => {
    if (!currentUserId || !department?.members) return null;
    const member = department.members.find((m) => m.userId === currentUserId);
    return member ? member.role : null;
  }, [currentUserId, department]);

  const canManage = isSuperAdmin || currentUserDeptRole === 'HEAD' || currentUserDeptRole === 'MANAGER';

  // ── Derived data ───────────────────────────────────────────────────────────
  const allUsers = useMemo(() => usersData?.items || [], [usersData]);
  const currentMembers = useMemo(() =>
    [...(department?.members || [])].sort(
      (a, b) => (ROLE_CONFIG[a.role as string]?.priority ?? 9) - (ROLE_CONFIG[b.role as string]?.priority ?? 9)
    ),
    [department]
  );

  const memberIds = useMemo(
    () => new Set(currentMembers.map((m) => m.userId)),
    [currentMembers]
  );

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !memberIds.has(u.id) && !u.department),
    [allUsers, memberIds]
  );

  // Local filter — instant search, no network round-trip
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableUsers.slice(0, 15);
    return availableUsers
      .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 20);
  }, [availableUsers, searchQuery]);

  const isValidSelection = !!selectedUserId && UUID_RE.test(selectedUserId);
  // Email pattern check — for invite-by-email shortcut
  const isQueryEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchQuery.trim());

  // ── Role summary for header ─────────────────────────────────────────────────
  const roleSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    currentMembers.forEach((m) => {
      const roleKey = (m.role as string) || 'MEMBER';
      counts[roleKey] = (counts[roleKey] || 0) + 1;
    });
    return counts;
  }, [currentMembers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const selectUser = (id: string, name: string, avatar?: string) => {
    setSelectedUserId(id);
    setSelectedUserName(name);
    setSelectedUserAvatar(avatar);
    setSearchQuery('');
    setComboOpen(false);
  };

  const clearSelection = () => {
    setSelectedUserId('');
    setSelectedUserName('');
    setSelectedUserAvatar(undefined);
    setSearchQuery('');
  };

  const handleInviteMember = async () => {
    const email = searchQuery.trim().toLowerCase();
    if (!email) return;
    try {
      await inviteMember({ departmentId, email, role: selectedRole }).unwrap();
      toast.success(`Đã gửi thư mời tham gia phòng ban tới ${email}`);
      clearSelection();
      setComboOpen(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Gửi thư mời thất bại');
    }
  };

  const handleProvisionMember = async () => {
    const email = searchQuery.trim().toLowerCase();
    if (!email || !provisionName.trim()) {
      toast.error('Vui lòng nhập đầy đủ tên và email');
      return;
    }
    try {
      await provisionMember({
        email,
        name: provisionName.trim(),
        role: 'EMPLOYEE',
        departmentId,
        departmentRole: selectedRole
      }).unwrap();
      toast.success(`Đã cấp tài khoản và thêm ${provisionName} vào phòng ban`);
      setIsProvisioningFormOpen(false);
      setProvisionName('');
      clearSelection();
      setComboOpen(false);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Cấp tài khoản thất bại');
    }
  };

  const handleAddMember = async () => {
    if (!isValidSelection) {
      toast.error('Vui lòng chọn nhân sự từ danh sách');
      return;
    }
    try {
      await addMember({ departmentId, userId: selectedUserId, role: selectedRole }).unwrap();
      toast.success(`Đã thêm ${selectedUserName} vào phòng ban`);
      clearSelection();
      setSelectedRole('MEMBER');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Thêm nhân sự thất bại');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    try {
      await removeMember({ departmentId, userId }).unwrap();
      toast.success(`Đã xóa ${name} khỏi phòng ban`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Xóa thành viên thất bại');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!userId || !role) return;
    try {
      await updateMember({ departmentId, userId, role }).unwrap();
      toast.success('Đã cập nhật vai trò');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Cập nhật vai trò thất bại');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
          <DialogTitle asChild>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">
                    Quản lý nhân sự phòng ban
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                    {departmentName}
                  </p>
                </div>
              </div>

              {/* Role pills summary */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {Object.entries(roleSummary).map(([role, count]) => {
                  const cfg = ROLE_CONFIG[role];
                  if (!cfg) return null;
                  return (
                    <span
                      key={role}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeCls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                      {count} {cfg.short}
                    </span>
                  );
                })}
                {currentMembers.length === 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">Chưa có thành viên</span>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Thêm, xóa và phân quyền nhân sự trong phòng ban {departmentName}
          </DialogDescription>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* ── Add Member Panel ──────────────────────────────────────── */}
          {canManage && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Bổ sung nhân sự
                </span>
                {isUsersLoading && (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative min-w-0 sm:min-w-[280px]" ref={comboRef}>
                  {isProvisioningFormOpen ? (
                    <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10">
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded shrink-0">
                        Cấp TK (A)
                      </span>
                      <Input
                        autoFocus
                        placeholder="Nhập họ & tên nhân viên..."
                        value={provisionName}
                        onChange={(e) => setProvisionName(e.target.value)}
                        className="h-7 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-0 flex-1 placeholder:text-slate-400"
                      />
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsProvisioningFormOpen(false);
                            setProvisionName('');
                          }}
                          className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleProvisionMember}
                          disabled={isProvisioning || !provisionName.trim()}
                          className="h-6 px-2.5 text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer disabled:opacity-50"
                        >
                          {isProvisioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cấp'}
                        </Button>
                      </div>
                    </div>
                  ) : isValidSelection ? (
                    <div className="flex items-center justify-between h-9 text-xs px-3 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 font-medium">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5.5 w-5.5 rounded-full shrink-0">
                          <AvatarImage src={selectedUserAvatar ? getAvatarUrl(selectedUserAvatar) : undefined} />
                          <AvatarFallback className="text-[7px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                            {selectedUserName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{selectedUserName}</span>
                        <Badge variant="outline" className="text-[9px] bg-blue-100/50 dark:bg-blue-950/30 border-blue-200/50 text-blue-800 dark:text-blue-300 py-0 px-1.5 h-4.5 font-semibold">
                          Đã chọn
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800/60 text-blue-700 dark:text-blue-300 hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors cursor-pointer shrink-0"
                        aria-label="Xóa lựa chọn"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <Input
                        id="dept-member-search"
                        autoComplete="off"
                        placeholder="Tìm kiếm nhân sự theo tên / email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setComboOpen(true);
                        }}
                        onFocus={() => setComboOpen(true)}
                        className="h-9 text-xs pl-9 pr-8 rounded-lg transition-colors border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSelection}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dropdown */}
                  {comboOpen && !isValidSelection && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                      {isUsersLoading ? (
                        <div className="flex items-center gap-2 justify-center py-5 text-xs text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Đang tải danh sách nhân sự...
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="py-4 px-3 flex flex-col gap-2.5">
                          <div className="text-center text-xs text-slate-400 py-1 flex flex-col items-center gap-1.5">
                            <User className="w-6 h-6 text-slate-300 dark:text-slate-700 opacity-40" />
                            <span>
                              {searchQuery.trim()
                                ? 'Không tìm thấy thành viên nào trùng khớp.'
                                : 'Tất cả nhân sự hệ thống đã có mặt trong phòng ban.'}
                            </span>
                          </div>
                          {isQueryEmail && (
                            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Mời thành viên mới</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInviteMember();
                                  }}
                                  className="flex-1 h-8 text-[10px] font-bold rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100/50 transition-colors cursor-pointer"
                                >
                                  {isInviting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : '✉️ Mời Email (C)'}
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsProvisioningFormOpen(true);
                                  }}
                                  className="flex-1 h-8 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50 hover:bg-amber-100/50 transition-colors cursor-pointer"
                                >
                                  ➕ Cấp tài khoản (A)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <ul className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/80" role="listbox">
                            {filteredUsers.map((u) => (
                              <li key={u.id} role="option" aria-selected={false}>
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // fire before blur
                                    selectUser(u.id, u.name, u.avatar);
                                  }}
                                >
                                  <Avatar className="h-7 w-7 rounded-[4px] border border-slate-200 dark:border-slate-800 shrink-0">
                                    <AvatarImage src={getAvatarUrl(u.avatar, u.name)} />
                                    <AvatarFallback className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-[4px]">
                                      {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                      {u.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate">{u.email}</span>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                          {isQueryEmail && (
                            <div className="border-t border-slate-100 dark:border-slate-800/80 p-3 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Mời thành viên mới</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInviteMember();
                                  }}
                                  className="flex-1 h-8 text-[10px] font-bold rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100/50 transition-colors cursor-pointer"
                                >
                                  {isInviting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : '✉️ Mời Email (C)'}
                                </button>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsProvisioningFormOpen(true);
                                  }}
                                  className="flex-1 h-8 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50 hover:bg-amber-100/50 transition-colors cursor-pointer"
                                >
                                  ➕ Cấp tài khoản (A)
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                            <p className="text-[9px] text-slate-400">
                              {filteredUsers.length} kết quả • Click để chọn
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Role selector ───────────────────────────────────────── */}
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9 w-full sm:w-44 text-xs rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      {ROLE_CONFIG[selectedRole]?.icon}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {Object.entries(ROLE_CONFIG)
                      .filter(([roleKey]) => {
                        if (isSuperAdmin || currentUserDeptRole === 'HEAD') return true;
                        // MANAGER can only assign MEMBER and GUEST
                        return ['MEMBER', 'GUEST'].includes(roleKey);
                      })
                      .map(([roleKey, cfg]) => (
                        <SelectItem key={roleKey} value={roleKey} className="cursor-pointer text-xs py-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                            <span>{cfg.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* ── Add button ──────────────────────────────────────────── */}
                <Button
                  id="dept-add-member-btn"
                  onClick={handleAddMember}
                  disabled={!isValidSelection || isAdding}
                  size="sm"
                  className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shrink-0 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span className="ml-1">Thêm vào</span>
                </Button>
              </div>
            </section>
          )}

          {/* ── Members List ──────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Danh sách nhân sự
                </span>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                  {currentMembers.length}
                </span>
              </div>
              {isDeptLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nhân sự</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-10">Vai trò</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Xóa</span>
              </div>

              {/* Rows */}
              {isDeptLoading ? (
                <div className="flex items-center justify-center py-10 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải dữ liệu...
                </div>
              ) : currentMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <Users className="w-8 h-8 opacity-30" />
                  <p className="text-xs">Phòng ban chưa có thành viên nào.</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600">Sử dụng form trên để bổ sung nhân sự.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {currentMembers.map((m) => {
                    const user = m.user;
                    const roleCfg = ROLE_CONFIG[m.role as string] || ROLE_CONFIG.MEMBER;

                    // Hierarchical Role edit & delete permission
                    const isEditable = (
                      isSuperAdmin || 
                      currentUserDeptRole === 'HEAD' || 
                      (currentUserDeptRole === 'MANAGER' && ['MEMBER', 'GUEST'].includes(m.role || ''))
                    ) && m.userId !== currentUserId;

                    const isDeletable = isEditable;

                    return (
                      <div
                        key={m.id}
                        className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        {/* User info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar className="h-7 w-7 rounded-full border border-slate-200 dark:border-slate-700">
                              <AvatarImage src={user?.avatar ? getAvatarUrl(user.avatar) : undefined} />
                              <AvatarFallback className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                {(user?.name || 'TV').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Online dot */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-950 ${roleCfg.dotCls}`} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                              {user?.name || 'Người dùng ẩn'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {user?.email || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Role selector / static badge */}
                        <div className="mr-3">
                          {isEditable ? (
                            <Select
                              value={m.role}
                              onValueChange={(val) => handleUpdateRole(m.userId, val)}
                            >
                              <SelectTrigger className={`h-7 text-[10px] w-32 rounded-md border cursor-pointer font-semibold ${roleCfg.badgeCls}`}>
                                <div className="flex items-center gap-1.5">
                                  {roleCfg.icon}
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="text-[10px]">
                                {Object.entries(ROLE_CONFIG)
                                  .filter(([roleKey]) => {
                                    if (isSuperAdmin || currentUserDeptRole === 'HEAD') return true;
                                    // MANAGER can only demote/promote between MEMBER and GUEST
                                    return ['MEMBER', 'GUEST'].includes(roleKey);
                                  })
                                  .map(([roleKey, cfg]) => (
                                    <SelectItem
                                      key={roleKey}
                                      value={roleKey}
                                      className="cursor-pointer text-[10px] py-1.5"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                                        {cfg.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="w-32 flex justify-start">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border shadow-sm ${roleCfg.badgeCls}`}>
                                {roleCfg.icon}
                                {roleCfg.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(m.userId, user?.name || 'thành viên')}
                          disabled={!isDeletable || isRemoving}
                          className={`h-7 w-7 rounded-md transition-colors cursor-pointer ${
                            isDeletable 
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' 
                              : 'text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed'
                          }`}
                          aria-label={`Xóa ${user?.name || 'thành viên'} khỏi phòng ban`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Thay đổi vai trò có hiệu lực ngay lập tức
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs rounded-md border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Đóng
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
