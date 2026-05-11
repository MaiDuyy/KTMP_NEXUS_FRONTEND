"use client";

import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  UserMinus,
  Mail,
  Check,
  Loader2,
  Filter,
  Crown,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/src/redux/store';
import {
  useGetWorkspaceMembersQuery,
  useUpdateWorkspaceMemberRoleMutation,
  useRemoveWorkspaceMemberMutation,
  useTransferOwnershipMutation,
  useLeaveWorkspaceMutation
} from '@/src/redux/feature/workspaceApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { useRouter } from 'next/navigation';

export default function MembersManagement() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const currentUser = useSelector((state: RootState) => state.auth?.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // State for Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedForTransfer, setSelectedForTransfer] = useState<any>(null);

  const { data: membersData, isLoading } = useGetWorkspaceMembersQuery(
    { workspaceId: currentWorkspaceId || '' },
    { skip: !currentWorkspaceId }
  );

  const [updateRole] = useUpdateWorkspaceMemberRoleMutation();
  const [removeMember] = useRemoveWorkspaceMemberMutation();
  const [transferOwnership, { isLoading: isTransferring }] = useTransferOwnershipMutation();
  const [leaveWorkspace] = useLeaveWorkspaceMutation();

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await updateRole({ workspaceId: currentWorkspaceId!, targetUserId, role: newRole }).unwrap();
      toast.success("Cập nhật vai trò thành công");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể cập nhật vai trò");
    }
  };

  const openTransferModal = (member: any) => {
    setSelectedForTransfer({
      userId: member.userId,
      name: member.user?.name,
      email: member.user?.email,
      avatar: member.user?.avatar,
      role: member.role
    });
    setIsTransferModalOpen(true);
  };

  const confirmTransferOwnership = async (shouldLeave: boolean) => {
    if (!selectedForTransfer) return;

    try {
      await transferOwnership({
        workspaceId: currentWorkspaceId!,
        targetUserId: selectedForTransfer.userId
      }).unwrap();

      toast.success(`Đã chuyển quyền sở hữu cho ${selectedForTransfer.name} thành công!`);

      if (shouldLeave) {
        try {
          await leaveWorkspace(currentWorkspaceId!).unwrap();
          toast.info("Bạn đã rời khỏi Workspace.");
          router.push("/chat");
        } catch (leaveErr) {
          console.error("Failed to leave after transfer:", leaveErr);
          toast.error("Đã chuyển quyền nhưng không thể rời Workspace tự động.");
        }
      }

      setIsTransferModalOpen(false);
      setSelectedForTransfer(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể chuyển quyền sở hữu");
    }
  };

  const handleKick = async (targetUserId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${name} khỏi Workspace?`)) return;
    try {
      await removeMember({ workspaceId: currentWorkspaceId!, targetUserId }).unwrap();
      toast.success(`Đã xóa ${name} khỏi Workspace`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể xóa thành viên");
    }
  };

  const myMemberInfo = membersData?.items?.find(m => m.userId === currentUser?.id);
  const isAdmin = myMemberInfo?.role === 'WORKSPACE_OWNER' || myMemberInfo?.role === 'WORKSPACE_ADMIN';
  const isOwner = myMemberInfo?.role === 'WORKSPACE_OWNER';

  const filteredMembers = membersData?.items?.filter(member => {
    const matchesSearch =
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thành viên</h1>
          <p className="text-slate-500 mt-1">Quản lý người dùng và vai trò trong Workspace của bạn.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200">
          <UserPlus size={18} className="mr-2" />
          Mời thành viên
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="pl-10 h-10 border-slate-200 focus:border-blue-500 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="GUEST">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thành viên</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày tham gia</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-sm text-slate-400 mt-2 font-medium">Đang tải danh sách thành viên...</p>
                </td>
              </tr>
            ) : filteredMembers?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <p className="text-sm text-slate-500 font-medium">Không tìm thấy thành viên phù hợp</p>
                </td>
              </tr>
            ) : (
              filteredMembers?.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.user?.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                          {member.user?.name?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{member.user?.name}</p>
                        {member.userId === currentUser?.id && (
                          <Badge variant="secondary" className="text-[9px] h-3.5 bg-blue-50 text-blue-600 border-blue-100">BẠN</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{member.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-md border
                        ${member.role === 'WORKSPACE_OWNER' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                          member.role === 'WORKSPACE_ADMIN' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                            'text-slate-500 border-slate-200 bg-slate-50'}
                      `}
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">
                      {format(new Date(member.joinedAt || Date.now()), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${member.user?.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                      <span className="text-xs font-medium text-slate-600">
                        {member.user?.isOnline ? 'Đang online' : 'Ngoại tuyến'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && member.userId !== currentUser?.id && member.role !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-xl border-slate-100">
                          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thay đổi vai trò</div>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'WORKSPACE_ADMIN')} className="rounded-lg py-2 cursor-pointer">
                            <Shield className="w-4 h-4 mr-3 text-blue-600" />
                            <span className="font-medium text-sm">Admin</span>
                            {member.role === 'WORKSPACE_ADMIN' && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'WORKSPACE_MEMBER')} className="rounded-lg py-2 cursor-pointer">
                            <Users className="w-4 h-4 mr-3 text-slate-600" />
                            <span className="font-medium text-sm">Member</span>
                            {member.role === 'MEMBER' && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                          </DropdownMenuItem>

                          {isOwner && (
                            <>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => openTransferModal(member)}
                                className="rounded-lg py-2 cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                              >
                                <Crown className="w-4 h-4 mr-3" />
                                <span className="font-bold text-sm text-amber-600">Chuyển quyền sở hữu</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator className="my-2" />
                          <DropdownMenuItem
                            onClick={() => handleKick(member.userId, member.user?.name)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg py-2 cursor-pointer"
                          >
                            <UserMinus className="w-4 h-4 mr-3" />
                            <span className="font-bold text-sm">Xóa khỏi Workspace</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TransferOwnershipModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirm={confirmTransferOwnership}
        targetMember={selectedForTransfer}
        isLoading={isTransferring}
      />
    </div>
  );
}
