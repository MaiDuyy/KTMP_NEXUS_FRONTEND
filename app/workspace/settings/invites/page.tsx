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
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${invite.status === 'PENDING' ? 'bg-amber-50 border-amber-100 text-amber-600' :
          invite.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
            invite.status === 'EXPIRED' ? 'bg-slate-50 border-slate-200 text-slate-400' :
              'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
          <Mail size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{invite.email}</p>
            <Badge variant="outline" className="text-[10px] h-4 bg-slate-50 text-slate-500 border-slate-200 font-bold">{invite.role}</Badge>
            {invite.status === 'EXPIRED' && (
              <Badge variant="destructive" className="text-[10px] h-4 font-bold bg-slate-100 text-slate-400 border-transparent">Hết hạn</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar size={12} />
              Đã gửi {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: vi })}
            </p>
            {invite.status === 'PENDING' && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1 font-bold">
                <AlertTriangle size={12} />
                Hết hạn {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
              </p>
            )}
            {invite.status === 'EXPIRED' && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-bold">
                <Clock size={12} />
                Đã hết hạn vào {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
              </p>
            )}
            {invite.status === 'ACCEPTED' && (
              <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} />
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
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 h-9 rounded-xl px-4"
              onClick={() => handleResendInvite(invite.id, invite.email)}
              disabled={isResending}
            >
              {isResending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
              Gửi lại
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-red-600 hover:bg-red-50 h-9 rounded-xl px-4"
              onClick={() => handleCancelInvite(invite.id, invite.email)}
              disabled={isCancelling}
            >
              <Ban size={14} className="mr-1.5" />
              Hủy
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
          <ExternalLink size={16} className="text-slate-400" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lời mời</h1>
          <p className="text-slate-500 mt-1">Theo dõi và quản lý các lời mời tham gia Workspace.</p>
        </div>
        <Button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200"
        >
          {showInviteForm ? <XCircle size={18} className="mr-2" /> : <UserPlus size={18} className="mr-2" />}
          {showInviteForm ? "Đóng form mời" : "Mời thành viên"}
        </Button>
      </div>

      {showInviteForm && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
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

              <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
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
                      {selectedInviteUserId === user.id && <Check className="w-5 h-5 text-blue-600" />}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-[300px] space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Vai trò tham gia
                  </div>
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-100">
                    {/* <SelectItem value="WORKSPACE_OWNER" className="rounded-lg font-medium text-blue-600">Owner</SelectItem> */}
                    <SelectItem value="WORKSPACE_ADMIN" className="rounded-lg font-medium text-blue-600">Admin</SelectItem>
                    <SelectItem value="WORKSPACE_MEMBER" className="rounded-lg font-medium">Member</SelectItem>
                    <SelectItem value="WORKSPACE_GUEST" className="rounded-lg font-medium text-slate-400">Guest</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                  onClick={handleSendInvite}
                  disabled={isInviting || (!selectedInviteUserId && !customInviteEmail)}
                >
                  {isInviting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                  Gửi lời mời ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 h-12 rounded-2xl w-full max-w-md">
          <TabsTrigger value="pending" className="flex-1 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-xs">
            Đang chờ ({pendingInvites.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex-1 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-xs">
            Đã chấp nhận ({acceptedInvites.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-xs">
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-slate-400 mt-2 font-medium">Đang tải danh sách lời mời...</p>
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="m-0 space-y-3">
                {pendingInvites.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <Mail className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Không có lời mời nào đang chờ</p>
                  </div>
                ) : (
                  pendingInvites.map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>

              <TabsContent value="accepted" className="m-0 space-y-3">
                {acceptedInvites.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Chưa có lời mời nào được chấp nhận</p>
                  </div>
                ) : (
                  acceptedInvites.map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>

              <TabsContent value="history" className="m-0 space-y-3">
                {[...acceptedInvites, ...rejectedInvites].length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Chưa có lịch sử lời mời</p>
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
