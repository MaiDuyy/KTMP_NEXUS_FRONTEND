'use client';

import React, { useState, useMemo } from 'react';
import {
  useGetDepartmentQuery,
  useAddDepartmentMemberMutation,
  useRemoveDepartmentMemberMutation,
} from '@/src/redux/feature/departmentApi';
import { useListUsersQuery } from '@/src/redux/feature/adminApi';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Shield, User, X, Loader2, Trash2, Search, Building2
} from 'lucide-react';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { toast } from 'sonner';

interface DeptMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  departmentName: string;
}

export function DeptMembersDialog({
  open,
  onOpenChange,
  departmentId,
  departmentName,
}: DeptMembersDialogProps) {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'MEMBER' | 'MANAGER'>('MEMBER');

  // Queries & Mutations
  const { data: department, isLoading: isDeptLoading } = useGetDepartmentQuery(
    departmentId,
    { skip: !departmentId || !open }
  );

  const { data: usersData, isLoading: isUsersLoading } = useListUsersQuery(
    { limit: 200 },
    { skip: !open }
  );

  const [addMember, { isLoading: isAdding }] = useAddDepartmentMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveDepartmentMemberMutation();

  const allUsers = usersData?.items || [];
  const currentMembers = department?.members || [];

  // Filter out existing department members from the autocomplete list
  const memberIds = useMemo(() => new Set(currentMembers.map((m) => m.userId)), [currentMembers]);
  
  const availableUsers = useMemo(() => {
    return allUsers.filter((u) => !memberIds.has(u.id));
  }, [allUsers, memberIds]);

  const filteredAvailableUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return availableUsers.slice(0, 10);
    return availableUsers
      .filter(
        (u) =>
          u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
      )
      .slice(0, 15);
  }, [availableUsers, userSearchQuery]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    try {
      await addMember({
        departmentId,
        userId: selectedUserId,
        role: selectedRole,
      }).unwrap();
      toast.success('Đã thêm thành viên vào phòng ban');
      setSelectedUserId('');
      setUserSearchQuery('');
      setSelectedRole('MEMBER');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Thêm thành viên thất bại');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember({ departmentId, userId }).unwrap();
      toast.success('Đã xóa thành viên khỏi phòng ban');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Xóa thành viên thất bại');
    }
  };

  const handleUpdateRole = async (userId: string, role: 'MEMBER' | 'MANAGER') => {
    try {
      await addMember({ departmentId, userId, role }).unwrap();
      toast.success('Đã cập nhật vai trò thành viên');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Cập nhật vai trò thất bại');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-white p-6 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Quản lý thành viên — {departmentName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Thêm, xóa thành viên và phân công chức vụ Manager/Member trong phòng ban này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Add Member Form */}
          <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Thêm nhân sự mới
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* User search & select dropdown */}
              <div className="flex-1 relative">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full h-9 text-xs rounded-lg border-slate-200 bg-white">
                    <SelectValue placeholder="Chọn nhân sự để thêm..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-2" onKeyDown={(e) => e.stopPropagation()}>
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <Input
                        placeholder="Tìm theo tên/email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="h-7 text-xs border-transparent bg-slate-50 focus-visible:ring-1 focus-visible:ring-blue-100 pl-2 rounded"
                      />
                    </div>
                    {isUsersLoading && (
                      <div className="flex items-center justify-center py-4 text-slate-400 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        Đang tải danh sách...
                      </div>
                    )}
                    {!isUsersLoading && filteredAvailableUsers.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400">
                        Không có nhân viên phù hợp hoặc đã là thành viên.
                      </div>
                    )}
                    {filteredAvailableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs py-2 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 rounded-full shrink-0">
                            <AvatarImage src={u.avatar ? getAvatarUrl(u.avatar) : undefined} />
                            <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700 font-bold">
                              {u.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-800 truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400 truncate">{u.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Select */}
              <div className="w-full sm:w-36">
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as 'MEMBER' | 'MANAGER')}
                >
                  <SelectTrigger className="w-full h-9 text-xs rounded-lg border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="MEMBER" className="cursor-pointer">Thành viên (Member)</SelectItem>
                    <SelectItem value="MANAGER" className="cursor-pointer">Trưởng phòng (Manager)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || isAdding}
                size="sm"
                className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 px-4 active:scale-[0.98] transition-transform"
              >
                {isAdding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1" />
                )}
                Thêm vào
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm flex flex-col">
            <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Thành viên phòng ban ({currentMembers.length})
              </h3>
              {isDeptLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {currentMembers.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  Chưa có thành viên nào trong phòng ban này.
                </div>
              ) : (
                currentMembers.map((m) => {
                  const userDetail = m.user;
                  const isManager = m.role === 'MANAGER';
                  return (
                    <div key={m.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 rounded-full shrink-0 border border-slate-100">
                          <AvatarImage src={userDetail?.avatar ? getAvatarUrl(userDetail.avatar) : undefined} />
                          <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600 font-bold">
                            {(userDetail?.name || 'TV').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5">
                            {userDetail?.name || 'Người dùng ẩn'}
                            {isManager && (
                              <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] px-1 py-0.2 rounded font-black shrink-0">
                                <Shield className="w-2.5 h-2.5 text-amber-600" />
                                MANAGER
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {userDetail?.email || 'Chưa đồng bộ tài khoản'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Inline Role switcher */}
                        <Select
                          value={m.role || 'MEMBER'}
                          onValueChange={(val) => handleUpdateRole(m.userId, val as 'MEMBER' | 'MANAGER')}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-28 rounded-md border-slate-100 hover:border-slate-200 bg-slate-50/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-[10px]">
                            <SelectItem value="MEMBER" className="cursor-pointer text-[10px]">Member</SelectItem>
                            <SelectItem value="MANAGER" className="cursor-pointer text-[10px]">Manager</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(m.userId)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-md transition-colors"
                          title="Xóa khỏi phòng ban"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
