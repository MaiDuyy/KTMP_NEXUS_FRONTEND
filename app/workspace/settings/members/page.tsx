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
import { useSelector } from 'react-redux';
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

  const filteredMembers = membersData?.items?.filter(member => {
    const matchesSearch =
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold font-mono uppercase tracking-tight text-slate-900 dark:text-slate-100">Thành viên</h1>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">Quản lý người dùng và vai trò trong Workspace của bạn.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-250 dark:text-slate-900 font-mono font-semibold rounded-[2px] text-xs h-8 px-3 py-1 flex items-center gap-1.5 shadow-none shrink-0 border border-transparent">
          <UserPlus size={14} />
          Mời thành viên
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white dark:bg-[#19191B] p-3 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 animate-pulse" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="pl-8 h-8 border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 focus:border-slate-850 dark:focus:border-slate-300 rounded-[2px] text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] h-8 border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 rounded-[2px] text-xs font-mono focus:ring-0">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent className="rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
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
      <div className="bg-white dark:bg-[#19191B] rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-200/80 dark:border-white/[0.06] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <th className="px-4 py-3">Thành viên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Ngày tham gia</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs font-mono text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-800 dark:text-slate-200 mx-auto" />
                  <p className="text-xs text-slate-400 mt-1.5 font-bold">Đang tải danh sách thành viên...</p>
                </td>
              </tr>
            ) : filteredMembers?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Không tìm thấy thành viên phù hợp</p>
                </td>
              </tr>
            ) : (
              filteredMembers?.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 rounded-[2px] ring-1 ring-slate-100 dark:ring-white/[0.04]">
                        <AvatarImage src={getAvatarUrl(member.user?.avatar, member.user?.name)} className="rounded-[2px]" />
                        <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-[2px]">
                          {member.user?.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-none">{member.user?.name}</p>
                        {member.userId === currentUser?.id && (
                          <Badge variant="secondary" className="text-[9px] h-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.06] rounded-[2px] px-1 py-0 font-bold">BẠN</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-600 dark:text-slate-400 truncate max-w-[150px] sm:max-w-none">{member.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`
                        text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] border shadow-none font-mono
                        ${member.role === 'WORKSPACE_OWNER' ? 'text-amber-700 border-amber-250/60 bg-amber-50/50 dark:text-amber-400 dark:border-amber-900/30 dark:bg-amber-950/20' :
                          member.role === 'WORKSPACE_ADMIN' ? 'text-blue-700 border-blue-250/60 bg-blue-50/50 dark:text-blue-400 dark:border-blue-900/30 dark:bg-blue-950/20' :
                            'text-slate-600 border-slate-250/60 bg-slate-50/50 dark:text-slate-400 dark:border-white/[0.06] dark:bg-zinc-900/50'}
                      `}
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-500 dark:text-zinc-550">
                      {format(new Date(member.joinedAt || Date.now()), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${onlineUsers.has(member.userId) || member.userId === currentUser?.id ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-700'}`} />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-450">
                        {onlineUsers.has(member.userId) || member.userId === currentUser?.id ? 'Đang online' : 'Ngoại tuyến'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && member.userId !== currentUser?.id && member.role !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[2px] hover:bg-slate-100 dark:hover:bg-zinc-800 hover:shadow-none transition-colors border border-transparent hover:border-slate-250/60 dark:hover:border-white/[0.08]">
                            <MoreVertical className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
                          <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Thay đổi vai trò</div>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'WORKSPACE_ADMIN')} className="rounded-[2px] py-1 cursor-pointer text-xs">
                            <Shield className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Admin</span>
                            {member.role === 'WORKSPACE_ADMIN' && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'WORKSPACE_MEMBER')} className="rounded-[2px] py-1 cursor-pointer text-xs">
                            <Users className="w-3.5 h-3.5 mr-2 text-slate-650 dark:text-slate-400" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Member</span>
                            {member.role === 'MEMBER' && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                          </DropdownMenuItem>

                          {isOwner && (
                            <>
                              <DropdownMenuSeparator className="my-0.5 border-slate-100 dark:border-white/[0.04]" />
                              <DropdownMenuItem
                                onClick={() => openTransferModal(member)}
                                className="rounded-[2px] py-1 cursor-pointer text-amber-700 focus:text-amber-800 dark:text-amber-400 focus:bg-amber-50/50 dark:focus:bg-amber-950/20 text-xs"
                              >
                                <Crown className="w-3.5 h-3.5 mr-2" />
                                <span className="font-bold">Chuyển quyền sở hữu</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator className="my-0.5 border-slate-100 dark:border-white/[0.04]" />
                          <DropdownMenuItem
                            onClick={() => handleKick(member.userId, member.user?.name)}
                            className="text-red-650 dark:text-red-400 focus:bg-red-50/50 dark:focus:bg-red-950/20 rounded-[2px] py-1 cursor-pointer text-xs"
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
