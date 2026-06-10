"use client";

import React, { useState } from 'react';
import {
  Mail,
  Clock,
  UserPlus,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Search,
  Shield,
  Check,
  RefreshCw
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import {
  useGetWorkspaceInvitesQuery,
  useCancelInviteMutation,
  useSendInviteMutation,
  useResendInviteMutation
} from '@/src/redux/feature/workspaceApi';
import { useSearchDirectoryQuery } from '@/src/redux/feature/userApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function InvitesManagement() {
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const [activeTab, setActiveTab] = useState("pending");
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Invite Form States
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [selectedInviteUserId, setSelectedInviteUserId] = useState<string | null>(null);
  const [customInviteEmail, setCustomInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("WORKSPACE_MEMBER");

  const { data: invitesData, isLoading } = useGetWorkspaceInvitesQuery(
    currentWorkspaceId || '',
    { 
      skip: !currentWorkspaceId,
      pollingInterval: 5000 // Realtime update every 5s
    }
  );

  const { data: searchResults, isFetching: isSearching } = useSearchDirectoryQuery(inviteSearchQuery, {
    skip: inviteSearchQuery.length < 2
  });

  const [sendInvite, { isLoading: isInviting }] = useSendInviteMutation();
  const [cancelInvite, { isLoading: isCancelling }] = useCancelInviteMutation();
  const [resendInvite, { isLoading: isResending }] = useResendInviteMutation();

  const handleSendInvite = async () => {
    const email = customInviteEmail || searchResults?.users.find(u => u.id === selectedInviteUserId)?.email;
    if (!email && !selectedInviteUserId) {
      toast.error("Vui lòng chọn người dùng hoặc nhập email");
      return;
    }

    try {
      await sendInvite({
        workspaceId: currentWorkspaceId!,
        email: email || "",
        userId: selectedInviteUserId || undefined,
        role: inviteRole
      }).unwrap();

      toast.success("Đã gửi lời mời thành công!");
      setShowInviteForm(false);
      setInviteSearchQuery("");
      setSelectedInviteUserId(null);
      setCustomInviteEmail("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể gửi lời mời");
    }
  };

  const handleResendInvite = async (inviteId: string, email: string) => {
    try {
      await resendInvite(inviteId).unwrap();
      toast.success(`Đã gửi lại lời mời cho ${email}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể gửi lại lời mời");
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy lời mời cho ${email}?`)) return;
    try {
      await cancelInvite(inviteId).unwrap();
      toast.success(`Đã hủy lời mời cho ${email}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể hủy lời mời");
    }
  };

  const pendingInvites = invitesData?.filter((i: any) => i.status === 'PENDING' || i.status === 'EXPIRED') || [];
  const acceptedInvites = invitesData?.filter((i: any) => i.status === 'ACCEPTED') || [];
  const rejectedInvites = invitesData?.filter((i: any) => i.status === 'REJECTED' || i.status === 'REVOKED') || [];

  const usersList = searchResults?.users || [];

  const InviteCard = ({ invite }: any) => (
    <div className="flex items-center justify-between p-3 rounded-[2px] bg-white dark:bg-[#19191B] border border-slate-200/80 dark:border-white/[0.06] shadow-sm hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150 group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center border shrink-0 ${invite.status === 'PENDING' ? 'bg-amber-50/50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400' :
          invite.status === 'ACCEPTED' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450' :
            invite.status === 'EXPIRED' ? 'bg-slate-50/50 border-slate-200 text-slate-400 dark:bg-zinc-900/50 dark:border-white/[0.04] dark:text-zinc-550' :
              'bg-rose-50/50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
          }`}>
          <Mail size={16} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">{invite.email}</p>
            <Badge variant="outline" className="text-[9px] h-3.5 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/[0.06] font-bold px-1.5 py-0.5 rounded-[2px] font-mono">{invite.role}</Badge>
            {invite.status === 'EXPIRED' && (
              <Badge variant="destructive" className="text-[9px] h-3.5 font-bold bg-slate-100 dark:bg-zinc-800/50 text-slate-400 dark:text-zinc-500 border-transparent px-1.5 py-0.5 rounded-[2px] font-mono">Hết hạn</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[10px] font-mono text-slate-450 dark:text-zinc-550 flex items-center gap-1">
              <Calendar size={11} className="text-slate-400 dark:text-zinc-500" />
              Đã gửi {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: vi })}
            </p>
            {invite.status === 'PENDING' && (
              <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                <AlertTriangle size={11} />
                Hết hạn {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
              </p>
            )}
            {invite.status === 'EXPIRED' && (
              <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-550 flex items-center gap-1 font-semibold">
                <Clock size={11} />
                Hết hạn {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
              </p>
            )}
            {invite.status === 'ACCEPTED' && (
              <p className="text-[10px] font-mono text-emerald-650 dark:text-emerald-450 flex items-center gap-1 font-bold">
                <CheckCircle2 size={11} />
                Đã chấp nhận
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(invite.status === 'PENDING' || invite.status === 'EXPIRED') && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] font-mono font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-slate-200/80 dark:border-white/[0.06] h-7 rounded-[2px] px-2.5 shadow-none"
              onClick={() => handleResendInvite(invite.id, invite.email)}
              disabled={isResending}
            >
              {isResending ? <Loader2 size={12} className="mr-1 animate-spin" /> : <RefreshCw size={12} className="mr-1" />}
              Gửi lại
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] font-mono font-semibold text-red-700 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-900/30 border-red-200/80 dark:border-red-900/30 h-7 rounded-[2px] px-2.5 shadow-none"
              onClick={() => handleCancelInvite(invite.id, invite.email)}
              disabled={isCancelling}
            >
              <Ban size={12} className="mr-1" />
              Hủy
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[2px] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-white/[0.08] flex items-center justify-center">
          <ExternalLink size={12} className="text-slate-400 dark:text-zinc-550" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold font-mono uppercase tracking-tight text-slate-900 dark:text-slate-100 font-mono">Lời mời</h1>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 font-mono">Theo dõi và quản lý các lời mời tham gia Workspace của bạn.</p>
        </div>
        <Button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-250 dark:text-slate-900 font-mono font-semibold rounded-[2px] text-xs h-8 px-3 py-1 flex items-center gap-1.5 border border-transparent shadow-none shrink-0"
        >
          {showInviteForm ? <XCircle size={14} /> : <UserPlus size={14} />}
          {showInviteForm ? "ĐÓNG FORM" : "MỜI THÀNH VIÊN"}
        </Button>
      </div>

      {showInviteForm && (
        <div className="bg-white dark:bg-[#19191B] p-4 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 animate-pulse" />
                <Input
                  placeholder="Tìm theo tên hoặc email của đồng nghiệp..."
                  className="pl-8 h-9 rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 focus:border-slate-850 dark:focus:border-slate-300 transition-all text-xs font-mono"
                  value={inviteSearchQuery}
                  onChange={(e) => {
                    setInviteSearchQuery(e.target.value);
                    setSelectedInviteUserId(null);
                  }}
                />
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar font-mono text-xs">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-800 dark:text-slate-200" />
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold">Đang tìm kiếm...</p>
                  </div>
                ) : inviteSearchQuery.length >= 2 && usersList.length === 0 ? (
                  <div
                    onClick={() => setCustomInviteEmail(inviteSearchQuery)}
                    className={`group p-3 rounded-[2px] border transition-all cursor-pointer ${customInviteEmail === inviteSearchQuery
                      ? "bg-slate-50 dark:bg-zinc-900 border-slate-900 dark:border-slate-100"
                      : "bg-white dark:bg-[#19191B] border-dashed border-slate-250 dark:border-white/[0.06] hover:border-slate-800 dark:hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-900"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center transition-all shrink-0 ${customInviteEmail === inviteSearchQuery ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Gửi lời mời trực tiếp</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5 leading-none">{inviteSearchQuery}</p>
                      </div>
                      {customInviteEmail === inviteSearchQuery && <Check className="w-4 h-4 text-slate-900 dark:text-slate-100" />}
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
                      className={`group flex items-center justify-between p-2.5 rounded-[2px] border cursor-pointer transition-all ${selectedInviteUserId === user.id
                        ? "bg-slate-50 dark:bg-zinc-900 border-slate-900 dark:border-slate-100"
                        : "bg-white dark:bg-[#19191B] border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:border-slate-200/50 dark:hover:border-white/[0.04]"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-[2px] border border-slate-200 dark:border-white/[0.06] ring-1 ring-slate-100 dark:ring-white/[0.04]">
                          <AvatarImage src={user.avatar || ""} className="rounded-[2px]" />
                          <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-[2px]">{user.name[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-none">{user.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate max-w-[180px] sm:max-w-none">{user.email}</p>
                        </div>
                      </div>
                      {selectedInviteUserId === user.id && <Check className="w-4 h-4 text-slate-900 dark:text-slate-100" />}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-[260px] space-y-3">
              <div className="p-3.5 rounded-[2px] bg-slate-50 dark:bg-[#111113]/40 border border-slate-200/60 dark:border-white/[0.04] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase text-slate-750 dark:text-slate-200 tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-400" />
                  Quyền tham gia
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-8 rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/50 text-xs font-mono focus:ring-0">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
                    <SelectItem value="WORKSPACE_ADMIN" className="text-xs">Admin</SelectItem>
                    <SelectItem value="WORKSPACE_MEMBER" className="text-xs">Member</SelectItem>
                    <SelectItem value="WORKSPACE_GUEST" className="text-xs">Guest</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  className="w-full h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-bold font-mono rounded-[2px] shadow-none transition-colors flex items-center justify-center gap-1.5 mt-2.5 border border-transparent"
                  onClick={handleSendInvite}
                  disabled={isInviting || (!selectedInviteUserId && !customInviteEmail)}
                >
                  {isInviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Gửi lời mời ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-zinc-900/60 p-0.5 h-8 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] w-full max-w-sm">
          <TabsTrigger value="pending" className="flex-1 rounded-[2px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm font-bold font-mono text-xs">
            Chờ duyệt ({pendingInvites.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex-1 rounded-[2px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm font-bold font-mono text-xs">
            Đã nhận ({acceptedInvites.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-[2px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm font-bold font-mono text-xs">
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-800 dark:text-slate-200 mx-auto" />
              <p className="text-xs text-slate-400 mt-1.5 font-bold">Đang tải danh sách lời mời...</p>
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="m-0 space-y-2">
                {pendingInvites.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-[#19191B] rounded-[2px] border border-dashed border-slate-200 dark:border-white/[0.06]">
                    <Mail className="w-8 h-8 text-slate-350 dark:text-zinc-650 mx-auto mb-2 animate-pulse" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">Không có lời mời nào đang chờ</p>
                  </div>
                ) : (
                  pendingInvites.map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>

              <TabsContent value="accepted" className="m-0 space-y-2">
                {acceptedInvites.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-[#19191B] rounded-[2px] border border-dashed border-slate-200 dark:border-white/[0.06]">
                    <CheckCircle2 className="w-8 h-8 text-slate-355 dark:text-zinc-655 mx-auto mb-2 animate-pulse" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">Chưa có lời mời nào được chấp nhận</p>
                  </div>
                ) : (
                  acceptedInvites.map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>

              <TabsContent value="history" className="m-0 space-y-2">
                {[...acceptedInvites, ...rejectedInvites].length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-[#19191B] rounded-[2px] border border-dashed border-slate-200 dark:border-white/[0.06]">
                    <Clock className="w-8 h-8 text-slate-350 dark:text-zinc-650 mx-auto mb-2 animate-pulse" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">Chưa có lịch sử lời mời</p>
                  </div>
                ) : (
                  [...acceptedInvites, ...rejectedInvites]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
