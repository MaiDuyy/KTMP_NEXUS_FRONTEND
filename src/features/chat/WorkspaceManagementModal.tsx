"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetWorkspaceMembersQuery,
  useUpdateWorkspaceMemberRoleMutation,
  useRemoveWorkspaceMemberMutation,
  useDeleteWorkspaceMutation,
  useDissolveWorkspaceMutation,
  useLeaveWorkspaceMutation,
  useSendInviteMutation,
  useGetWorkspaceInvitesQuery,
  useCancelInviteMutation
} from "@/src/redux/feature/workspaceApi";
import { useSearchDirectoryQuery } from "@/src/redux/feature/userApi";
import {
  Loader2,
  Users,
  Shield,
  UserMinus,
  Settings,
  Trash2,
  MoreVertical,
  Check,
  UserPlus,
  Search,
  AlertTriangle,
  Mail,
  User as UserIcon,
  XCircle,
  Clock,
  ExternalLink,
  Ban,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/src/redux/store";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface WorkspaceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export function WorkspaceManagementModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName
}: WorkspaceManagementModalProps) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth?.user);
  const [activeTab, setActiveTab] = useState("members");

  // Invitation State
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [selectedInviteUserId, setSelectedInviteUserId] = useState<string | null>(null);
  const [customInviteEmail, setCustomInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("WORKSPACE_MEMBER");

  // Dissolve confirmation state
  const [dissolveStep, setDissolveStep] = useState(0); // 0: init, 1: confirming
  const [dissolveInput, setDissolveInput] = useState("");

  const { data: membersData, isLoading: isLoadingMembers } = useGetWorkspaceMembersQuery(
    { workspaceId },
    { skip: !isOpen || !workspaceId }
  );

  const { data: invitesData, isLoading: isLoadingInvites } = useGetWorkspaceInvitesQuery(
    workspaceId,
    { skip: !isOpen || !workspaceId }
  );

  const { data: searchResults, isFetching: isSearching } = useSearchDirectoryQuery(inviteSearchQuery, {
    skip: inviteSearchQuery.length < 2 || activeTab !== "invite",
  });

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateWorkspaceMemberRoleMutation();
  const [removeMember, { isLoading: isRemovingMember }] = useRemoveWorkspaceMemberMutation();
  const [deleteWorkspace, { isLoading: isDeletingWorkspace }] = useDeleteWorkspaceMutation();
  const [dissolveWorkspace, { isLoading: isDissolving }] = useDissolveWorkspaceMutation();
  const [leaveWorkspace, { isLoading: isLeaving }] = useLeaveWorkspaceMutation();
  const [sendInvite, { isLoading: isInviting }] = useSendInviteMutation();
  const [cancelInvite, { isLoading: isCancellingInvite }] = useCancelInviteMutation();

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await updateRole({ workspaceId, targetUserId, role: newRole }).unwrap();
      toast.success("Cập nhật vai trò thành công");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể cập nhật vai trò");
    }
  };

  const handleKick = async (targetUserId: string, name: string) => {
    try {
      await removeMember({ workspaceId, targetUserId }).unwrap();
      toast.success(`Đã xóa ${name} khỏi Workspace`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể xóa thành viên");
    }
  };

  const handleInvite = async () => {
    const usersList = searchResults?.users || [];
    const emailToInvite = selectedInviteUserId
      ? usersList.find(u => u.id === selectedInviteUserId)?.email
      : (customInviteEmail || (inviteSearchQuery.includes("@") ? inviteSearchQuery : ""));

    if (!emailToInvite) {
      toast.error("Vui lòng chọn người dùng hoặc nhập email hợp lệ");
      return;
    }

    try {
      await sendInvite({
        workspaceId,
        email: emailToInvite,
        role: inviteRole,
      }).unwrap();

      toast.success(`Đã gửi lời mời tới ${emailToInvite} thành công!`);
      setSelectedInviteUserId(null);
      setCustomInviteEmail("");
      setInviteSearchQuery("");
      setActiveTab("invites"); // Switch to invites tab to see the new pending invite
    } catch (error: any) {
      toast.error(error?.data?.message || "Không thể gửi lời mời");
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    try {
      await cancelInvite(inviteId).unwrap();
      toast.success(`Đã hủy lời mời cho ${email}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể hủy lời mời");
    }
  };

  const handleDissolveWorkspace = async () => {
    if (dissolveInput !== workspaceName) {
      toast.error("Tên xác nhận không khớp");
      return;
    }
    try {
      await dissolveWorkspace({ workspaceId, workspaceNameConfirm: dissolveInput }).unwrap();
      toast.success("Workspace đang được giải tán...");
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể giải tán Workspace");
    }
  };

  const handleLeaveWorkspace = async () => {
    try {
      await leaveWorkspace(workspaceId).unwrap();
      toast.success("Đã rời khỏi Workspace thành công");
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể rời khỏi Workspace");
    }
  };

  const myMemberInfo = membersData?.items?.find(m => m.userId === currentUser?.id);
  const isOwner = myMemberInfo?.role === 'OWNER';
  const isAdmin = isOwner || myMemberInfo?.role === 'ADMIN';

  const usersList = searchResults?.users || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-slate-50 to-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            Quản trị Workspace
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Thiết lập quyền hạn, thành viên và bảo mật cho <span className="font-bold text-slate-900">{workspaceName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-white">
            <TabsList className="bg-transparent border-b-0 gap-6 h-14 p-0">
              <TabsTrigger
                value="members"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent shadow-none px-2 text-sm font-semibold transition-all data-[state=active]:text-blue-600"
              >
                <Users className="w-4 h-4 mr-2" />
                Thành viên
              </TabsTrigger>
              <TabsTrigger
                value="invites"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent shadow-none px-2 text-sm font-semibold transition-all data-[state=active]:text-blue-600"
              >
                <Clock className="w-4 h-4 mr-2" />
                Lời mời đang chờ
                {invitesData && invitesData.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white h-5 min-w-[20px] px-1 justify-center">{invitesData.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="invite"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent shadow-none px-2 text-sm font-semibold transition-all data-[state=active]:text-blue-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Mời thành viên
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent shadow-none px-2 text-sm font-semibold transition-all text-slate-500 data-[state=active]:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vùng nguy hiểm
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            {/* MEMBERS TAB */}
            <TabsContent value="members" className="m-0 space-y-4 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Danh sách thành viên ({membersData?.total || 0})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={() => setActiveTab("invite")}
                >
                  <UserPlus className="w-3 h-3 mr-1.5" />
                  Mời người mới
                </Button>
              </div>

              {isLoadingMembers ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-400 font-medium">Đang tải danh sách...</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {membersData?.items?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={member.user?.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                              {member.user?.name?.[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {member.user?.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{member.user?.name}</p>
                            {member.userId === currentUser?.id && (
                              <Badge variant="secondary" className="text-[10px] h-4 bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-tighter">Bạn</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {member.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          className={`
                            text-[10px] font-bold px-2 py-0.5 rounded-md border
                            ${member.role === 'OWNER' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                              member.role === 'ADMIN' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                'text-slate-500 border-slate-200 bg-slate-50'}
                          `}
                        >
                          {member.role}
                        </Badge>

                        {isAdmin && member.userId !== currentUser?.id && member.role !== 'OWNER' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-xl border-slate-100">
                              <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vai trò hệ thống</div>
                              <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'ADMIN')} className="rounded-lg py-2 cursor-pointer">
                                <Shield className="w-4 h-4 mr-3 text-blue-600" />
                                <span className="font-medium">Quản trị viên (Admin)</span>
                                {member.role === 'ADMIN' && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'MEMBER')} className="rounded-lg py-2 cursor-pointer">
                                <Users className="w-4 h-4 mr-3 text-slate-600" />
                                <span className="font-medium">Thành viên (Member)</span>
                                {member.role === 'MEMBER' && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(member.userId, 'GUEST')} className="rounded-lg py-2 cursor-pointer">
                                <Users className="w-4 h-4 mr-3 text-slate-400" />
                                <span className="font-medium">Khách (Guest)</span>
                                {member.role === 'GUEST' && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2" />
                              <DropdownMenuItem
                                onClick={() => handleKick(member.userId, member.user?.name)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg py-2 cursor-pointer"
                              >
                                <UserMinus className="w-4 h-4 mr-3" />
                                <span className="font-bold">Xóa khỏi Workspace</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* INVITES LIST TAB */}
            <TabsContent value="invites" className="m-0 space-y-4 outline-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Lời mời đang chờ ({invitesData?.length || 0})</h3>
                <p className="text-[10px] text-slate-400 italic">Lời mời sẽ tự động hết hạn sau 7 ngày</p>
              </div>

              {isLoadingInvites ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-400 font-medium">Đang tải danh sách lời mời...</p>
                </div>
              ) : invitesData?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="p-4 rounded-full bg-slate-50 mb-4">
                    <Mail className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Không có lời mời nào đang chờ</p>
                  <Button variant="link" className="text-blue-600 text-xs" onClick={() => setActiveTab("invite")}>Mời ngay bây giờ</Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {invitesData?.map((invite: any) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                          <Mail className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{invite.email}</p>
                            <Badge variant="outline" className="text-[9px] h-4 bg-slate-50 text-slate-500 border-slate-200">{invite.role}</Badge>
                            {invite.status === 'REJECTED' ? (
                              <Badge variant="destructive" className="text-[9px] h-4 bg-red-50 text-red-600 border-red-100 uppercase tracking-tighter">Đã từ chối</Badge>
                            ) : (
                              <Badge className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-100 uppercase tracking-tighter">Đang chờ</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Đã mời {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: vi })}
                            </p>
                            <p className="text-[10px] text-amber-500 flex items-center gap-1 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Hết hạn {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 h-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                          disabled={isCancellingInvite}
                          onClick={() => handleCancelInvite(invite.id, invite.email)}
                        >
                          <Ban className="w-4 h-4 mr-1.5" />
                          Hủy lời mời
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* INVITE TAB */}
            <TabsContent value="invite" className="m-0 space-y-6 outline-none">
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Mời cộng tác viên
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Xây dựng đội ngũ mạnh mẽ bằng cách mời đồng nghiệp tham gia vào không gian làm việc này.
                    </p>
                  </div>
                  <UserPlus className="absolute right-[-10px] bottom-[-10px] w-32 h-32 text-white/10 rotate-12" />
                </div>

                <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Tìm theo tên hoặc email của đồng nghiệp..."
                      className="pl-11 h-12 rounded-xl border-slate-200 focus:border-blue-500 transition-all text-sm"
                      value={inviteSearchQuery}
                      onChange={(e) => {
                        setInviteSearchQuery(e.target.value);
                        setSelectedInviteUserId(null);
                      }}
                    />
                  </div>

                  <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="text-xs text-slate-400 font-medium">Đang tìm kiếm...</p>
                      </div>
                    ) : inviteSearchQuery.length >= 2 && usersList.length === 0 ? (
                      <div
                        onClick={() => setCustomInviteEmail(inviteSearchQuery)}
                        className={`group p-4 rounded-xl border-2 transition-all cursor-pointer ${customInviteEmail === inviteSearchQuery
                          ? "bg-blue-50 border-blue-600 shadow-sm"
                          : "bg-white border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${customInviteEmail === inviteSearchQuery ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
                            <Mail className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${customInviteEmail === inviteSearchQuery ? "text-blue-900" : "text-slate-700"}`}>Gửi lời mời trực tiếp</p>
                            <p className="text-xs text-slate-500 mt-0.5">{inviteSearchQuery}</p>
                          </div>
                          {customInviteEmail === inviteSearchQuery && <Check className="w-5 h-5 text-blue-600" />}
                        </div>
                      </div>
                    ) : (
                      usersList.map((user: any) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedInviteUserId(user.id);
                            setCustomInviteEmail("");
                          }}
                          className={`group flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedInviteUserId === user.id
                            ? "bg-blue-50 border-blue-600 shadow-sm"
                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarImage src={user.avatar || ""} />
                              <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">{user.name[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={`text-sm font-bold ${selectedInviteUserId === user.id ? "text-blue-900" : "text-slate-700"}`}>{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          {selectedInviteUserId === user.id ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-blue-300 transition-all" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {(selectedInviteUserId || customInviteEmail || (inviteSearchQuery.includes("@") && inviteSearchQuery.length > 5)) && (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Shield className="w-4 h-4 text-blue-600" />
                          Phân quyền thành viên
                        </div>
                        <Badge variant="outline" className="bg-white text-[10px] text-slate-500 font-bold border-slate-200">
                          REQUIRED
                        </Badge>
                      </div>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Chọn vai trò tham gia" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl border-slate-100">
                          <SelectItem value="MEMBER" className="rounded-lg font-medium">Thành viên thông thường</SelectItem>
                          <SelectItem value="ADMIN" className="rounded-lg font-medium text-blue-600">Quản trị viên (Admin)</SelectItem>
                          <SelectItem value="GUEST" className="rounded-lg font-medium text-slate-400">Khách truy cập (Guest)</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                        onClick={handleInvite}
                        disabled={isInviting}
                      >
                        {isInviting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                        Gửi lời mời tham gia ngay
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* SETTINGS / DANGER ZONE TAB */}
            <TabsContent value="settings" className="m-0 space-y-6 outline-none">
              <div className="grid gap-6">
                {/* Leave Workspace (For anyone except Owner) */}
                {!isOwner && (
                  <div className="p-6 rounded-3xl border border-orange-100 bg-orange-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-orange-100">
                        <LogOut className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-orange-900">Rời khỏi Workspace</h3>
                        <p className="text-xs text-orange-700/70">Bạn sẽ mất quyền truy cập vào các kênh và tin nhắn.</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-orange-200 hover:bg-orange-600 hover:text-white text-orange-600 font-bold rounded-xl"
                      onClick={handleLeaveWorkspace}
                      disabled={isLeaving}
                    >
                      {isLeaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                      Rời ngay
                    </Button>
                  </div>
                )}

                {/* Dissolve Workspace (OWNER ONLY) */}
                <div className="p-8 rounded-3xl border-2 border-red-100 bg-red-50/30 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                  <div className="p-4 rounded-3xl bg-red-100 shadow-sm relative z-10">
                    <AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <h3 className="text-xl font-black text-red-900">Giải tán Workspace?</h3>
                    <p className="text-sm text-red-700/80 max-w-[320px] mx-auto leading-relaxed">
                      Hành động này sẽ <strong>xóa vĩnh viễn</strong> không gian làm việc này cùng toàn bộ dữ liệu. Không thể khôi phục sau khi xác nhận.
                    </p>
                  </div>

                  {dissolveStep === 0 ? (
                    <Button
                      variant="destructive"
                      className="w-full max-w-[280px] h-12 font-black text-sm uppercase tracking-widest shadow-xl shadow-red-200 rounded-2xl transition-all active:scale-95"
                      disabled={!isOwner}
                      onClick={() => setDissolveStep(1)}
                    >
                      Bắt đầu giải tán
                    </Button>
                  ) : (
                    <div className="w-full max-w-[360px] space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-red-800">Nhập tên Workspace để xác nhận:</p>
                        <Input
                          value={dissolveInput}
                          onChange={(e) => setDissolveInput(e.target.value)}
                          placeholder={workspaceName}
                          className="h-12 text-center font-bold border-red-200 focus:border-red-600 focus:ring-red-600 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1 h-12 font-bold text-slate-500 rounded-xl"
                          onClick={() => { setDissolveStep(0); setDissolveInput(""); }}
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-2 h-12 px-8 font-black rounded-xl shadow-lg shadow-red-200"
                          disabled={dissolveInput !== workspaceName || isDissolving}
                          onClick={handleDissolveWorkspace}
                        >
                          {isDissolving ? <Loader2 className="animate-spin w-5 h-5" /> : "XÁC NHẬN XÓA"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isOwner && (
                    <p className="text-[10px] font-bold text-red-500 bg-white px-3 py-1 rounded-full border border-red-100">
                      CHỈ CHỦ SỞ HỮU (OWNER) MỚI CÓ QUYỀN NÀY
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 font-medium">
            ID: {workspaceId}
          </div>
          <Button variant="ghost" className="font-bold text-slate-600 hover:bg-slate-100 rounded-xl" onClick={onClose}>Đóng cửa sổ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
