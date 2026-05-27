"use client";

import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  UserMinus,
  Check,
  Loader2,
  Filter,
  Crown
} from 'lucide-react';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { useRealtimeChat } from '@/src/hooks/useRealtimeChat';
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

  const { onlineUsers } = useRealtimeChat();

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
  const currentUserRoles = useSelector((state: RootState) => state.auth?.roles) || [];
  
  const isSystemManager = currentUserRoles.includes('SUPER_ADMIN') || 
                           currentUserRoles.includes('ADMIN') || 
                           currentUserRoles.includes('WORKSPACE_MANAGER');

  const isAdmin = isSystemManager || 
                  myMemberInfo?.role === 'WORKSPACE_OWNER' || 
                  myMemberInfo?.role === 'WORKSPACE_ADMIN' || 
                  myMemberInfo?.role === 'WORKSPACE_MANAGER';
  const isOwner = myMemberInfo?.role === 'WORKSPACE_OWNER';

  console.log("Check role" , myMemberInfo)
  const filteredMembers = membersData?.items?.filter(member => {
    const matchesSearch =
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Thành viên</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý người dùng và vai trò trong Workspace của bạn.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[4px] text-xs h-8 px-3 py-1 flex items-center gap-1.5">
          <UserPlus size={14} />
          Mời thành viên
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center bg-white p-3 rounded-[4px] border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="pl-8 h-8 border-slate-200 focus:border-blue-500 rounded-[4px] text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] h-8 border-slate-200 rounded-[4px] text-xs">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent className="rounded-[4px]">
              <SelectItem value="ALL" className="text-xs">Tất cả vai trò</SelectItem>
              <SelectItem value="OWNER" className="text-xs">Owner</SelectItem>
              <SelectItem value="ADMIN" className="text-xs">Admin</SelectItem>
              <SelectItem value="MEMBER" className="text-xs">Member</SelectItem>
              <SelectItem value="GUEST" className="text-xs">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80">
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Thành viên</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vai trò</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ngày tham gia</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-400 mt-1.5 font-semibold">Đang tải danh sách thành viên...</p>
                </td>
              </tr>
            ) : filteredMembers?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <p className="text-xs text-slate-500 font-semibold">Không tìm thấy thành viên phù hợp</p>
                </td>
              </tr>
            ) : (
              filteredMembers?.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 rounded-[4px]">
                        <AvatarImage src={getAvatarUrl(member.user?.avatar, member.user?.name)} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs rounded-[4px]">
                          {member.user?.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900">{member.user?.name}</p>
                        {member.userId === currentUser?.id && (
                          <Badge variant="secondary" className="text-[9px] h-3.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-[2px] px-1 py-0">BẠN</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-slate-600">{member.user?.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      className={`
                        text-[9px] font-semibold px-1.5 py-0 rounded-[4px] border shadow-none
                        ${member.role === 'WORKSPACE_OWNER' ? 'text-amber-700 border-amber-200 bg-amber-50' :
                          member.role === 'WORKSPACE_ADMIN' ? 'text-blue-700 border-blue-200 bg-blue-50' :
                            'text-slate-600 border-slate-200 bg-slate-50'}
                      `}
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-slate-500">
                      {format(new Date(member.joinedAt || Date.now()), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${onlineUsers.has(member.userId) || member.userId === currentUser?.id ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[11px] font-medium text-slate-500">
                        {onlineUsers.has(member.userId) || member.userId === currentUser?.id ? 'Đang online' : 'Ngoại tuyến'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {isAdmin && member.userId !== currentUser?.id && member.role !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[4px] hover:bg-slate-100 hover:shadow-none transition-colors border border-transparent hover:border-slate-200/60">
                            <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-[4px] shadow-md border-slate-200">
                          <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Thay đổi vai trò</div>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'WORKSPACE_ADMIN')} className="rounded-[4px] py-1 cursor-pointer text-xs">
                            <Shield className="w-3.5 h-3.5 mr-2 text-blue-600" />
                            <span className="font-semibold text-slate-700">Admin</span>
                            {member.role === 'WORKSPACE_ADMIN' && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'WORKSPACE_MEMBER')} className="rounded-[4px] py-1 cursor-pointer text-xs">
                            <Users className="w-3.5 h-3.5 mr-2 text-slate-600" />
                            <span className="font-semibold text-slate-700">Member</span>
                            {member.role === 'MEMBER' && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                          </DropdownMenuItem>

                          {isOwner && (
                            <>
                              <DropdownMenuSeparator className="my-0.5" />
                              <DropdownMenuItem
                                onClick={() => openTransferModal(member)}
                                className="rounded-[4px] py-1 cursor-pointer text-amber-700 focus:text-amber-800 focus:bg-amber-50 text-xs"
                              >
                                <Crown className="w-3.5 h-3.5 mr-2" />
                                <span className="font-bold text-amber-700">Chuyển quyền sở hữu</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator className="my-0.5" />
                          <DropdownMenuItem
                            onClick={() => handleKick(member.userId, member.user?.name)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-[4px] py-1 cursor-pointer text-xs"
                          >
                            <UserMinus className="w-3.5 h-3.5 mr-2" />
                            <span className="font-bold">Xóa khỏi Workspace</span>
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
