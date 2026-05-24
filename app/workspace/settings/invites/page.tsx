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
    <div className="flex items-center justify-between p-3 rounded-[4px] bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50/50 transition-colors duration-150 group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center border shrink-0 ${invite.status === 'PENDING' ? 'bg-amber-50 border-amber-100 text-amber-600' :
          invite.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
            invite.status === 'EXPIRED' ? 'bg-slate-50 border-slate-200 text-slate-400' :
              'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
          <Mail size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-900">{invite.email}</p>
            <Badge variant="outline" className="text-[9px] h-3.5 bg-slate-50 text-slate-500 border-slate-200 font-semibold px-1 rounded-[2px]">{invite.role}</Badge>
            {invite.status === 'EXPIRED' && (
              <Badge variant="destructive" className="text-[9px] h-3.5 font-bold bg-slate-100 text-slate-400 border-transparent px-1 rounded-[2px]">Hết hạn</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Calendar size={11} />
              Đã gửi {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true, locale: vi })}
            </p>
            {invite.status === 'PENDING' && (
              <p className="text-[10px] text-amber-600 flex items-center gap-1 font-bold">
                <AlertTriangle size={11} />
                Hết hạn {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
              </p>
            )}
            {invite.status === 'EXPIRED' && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                <Clock size={11} />
                Đã hết hạn vào {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true, locale: vi })}
              </p>
            )}
            {invite.status === 'ACCEPTED' && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
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
              className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200/80 h-7 rounded-[4px] px-2.5"
              onClick={() => handleResendInvite(invite.id, invite.email)}
              disabled={isResending}
            >
              {isResending ? <Loader2 size={12} className="mr-1 animate-spin" /> : <RefreshCw size={12} className="mr-1" />}
              Gửi lại
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border-red-200/80 h-7 rounded-[4px] px-2.5"
              onClick={() => handleCancelInvite(invite.id, invite.email)}
              disabled={isCancelling}
            >
              <Ban size={12} className="mr-1" />
              Hủy
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center">
          <ExternalLink size={12} className="text-slate-400" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Lời mời</h1>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi và quản lý các lời mời tham gia Workspace.</p>
        </div>
        <Button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[4px] text-xs h-8 px-3 py-1 flex items-center gap-1.5"
        >
          {showInviteForm ? <XCircle size={14} /> : <UserPlus size={14} />}
          {showInviteForm ? "Đóng form mời" : "Mời thành viên"}
        </Button>
      </div>

      {showInviteForm && (
        <div className="bg-white p-4 rounded-[4px] border border-slate-200/80 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên hoặc email của đồng nghiệp..."
                  className="pl-8 h-9 rounded-[4px] border-slate-200 focus:border-blue-500 transition-all text-xs"
                  value={inviteSearchQuery}
                  onChange={(e) => {
                    setInviteSearchQuery(e.target.value);
                    setSelectedInviteUserId(null);
                  }}
                />
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <p className="text-[11px] text-slate-400 font-semibold">Đang tìm kiếm...</p>
                  </div>
                ) : inviteSearchQuery.length >= 2 && usersList.length === 0 ? (
                  <div
                    onClick={() => setCustomInviteEmail(inviteSearchQuery)}
                    className={`group p-3 rounded-[4px] border transition-all cursor-pointer ${customInviteEmail === inviteSearchQuery
                      ? "bg-slate-50 border-blue-600"
                      : "bg-white border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-all shrink-0 ${customInviteEmail === inviteSearchQuery ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">Gửi lời mời trực tiếp</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{inviteSearchQuery}</p>
                      </div>
                      {customInviteEmail === inviteSearchQuery && <Check className="w-4 h-4 text-blue-600" />}
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
                      className={`group flex items-center justify-between p-2.5 rounded-[4px] border cursor-pointer transition-all ${selectedInviteUserId === user.id
                        ? "bg-slate-50 border-blue-600"
                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-[4px] border border-slate-200">
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback className="bg-slate-200 text-slate-600 font-bold text-xs rounded-[4px]">{user.name[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{user.name}</p>
                          <p className="text-[10px] text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      {selectedInviteUserId === user.id && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="w-full md:w-[260px] space-y-3">
              <div className="p-3.5 rounded-[4px] bg-slate-50 border border-slate-200/60 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Vai trò tham gia
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-8 rounded-[4px] border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-slate-200 shadow-md">
                    <SelectItem value="WORKSPACE_ADMIN" className="text-xs">Admin</SelectItem>
                    <SelectItem value="WORKSPACE_MEMBER" className="text-xs">Member</SelectItem>
                    <SelectItem value="WORKSPACE_GUEST" className="text-xs">Guest</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[4px] shadow-none transition-colors flex items-center justify-center gap-1.5 mt-2.5"
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
        <TabsList className="bg-slate-100 p-0.5 h-8 rounded-[4px] border border-slate-200/80 w-full max-w-sm">
          <TabsTrigger value="pending" className="flex-1 rounded-[3px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-semibold text-xs">
            Đang chờ ({pendingInvites.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex-1 rounded-[3px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-semibold text-xs">
            Đã chấp nhận ({acceptedInvites.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-[3px] data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-semibold text-xs">
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-1.5 font-semibold">Đang tải danh sách lời mời...</p>
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="m-0 space-y-2">
                {pendingInvites.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-[4px] border border-dashed border-slate-200">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs font-semibold">Không có lời mời nào đang chờ</p>
                  </div>
                ) : (
                  pendingInvites.map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>

              <TabsContent value="accepted" className="m-0 space-y-2">
                {acceptedInvites.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-[4px] border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs font-semibold">Chưa có lời mời nào được chấp nhận</p>
                  </div>
                ) : (
                  acceptedInvites.map((invite: any) => <InviteCard key={invite.id} invite={invite} />)
                )}
              </TabsContent>

              <TabsContent value="history" className="m-0 space-y-2">
                {[...acceptedInvites, ...rejectedInvites].length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-[4px] border border-dashed border-slate-200">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs font-semibold">Chưa có lịch sử lời mời</p>
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
