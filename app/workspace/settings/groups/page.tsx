"use client";

import React, { useState } from 'react';
import {
  MessageSquare, Search, Plus, MoreVertical, Users, Lock, Globe,
  Calendar, Edit2, Archive, Trash2, Loader2, Filter, X, Shield,
  UserMinus, Crown, AlertTriangle, Settings
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import {
  useGetChatsQuery, useDeleteChatMutation, useUpdateChatMutation,
  useGetChatByIdQuery, useRemoveChatMemberMutation, useUpdateChatMemberRoleMutation
} from '@/src/redux/feature/chatApi';
import { GroupCreationModal } from '@/src/features/chat/group-creating-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/src/utils/image-utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GroupAction {
  type: 'members' | 'edit' | 'archive' | 'delete' | null;
  chatId: string | null;
}

// ─── Role badge helper ─────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  if (role === 'CHANNEL_OWNER')
    return <Badge className="text-[9px] bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold rounded-[4px] border shadow-none"><Crown size={8} className="mr-1" />Trưởng nhóm</Badge>;
  if (role === 'CHANNEL_MODERATOR')
    return <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-semibold rounded-[4px] border shadow-none"><Shield size={8} className="mr-1" />Phó nhóm</Badge>;
  return <Badge variant="outline" className="text-[9px] text-slate-500 font-medium rounded-[4px] border border-slate-200 bg-slate-50 shadow-none">Thành viên</Badge>;
}

// ─── Members Modal ─────────────────────────────────────────────────────────────
function GroupMembersModal({ chatId, open, onClose }: { chatId: string; open: boolean; onClose: () => void }) {
  const currentUser = useSelector((state: RootState) => state.auth?.user);
  const { data, isLoading } = useGetChatByIdQuery(chatId, { skip: !open || !chatId });
  const [removeMember, { isLoading: removing }] = useRemoveChatMemberMutation();
  const [updateRole, { isLoading: updatingRole }] = useUpdateChatMemberRoleMutation();
  const [confirmKick, setConfirmKick] = useState<{ id: string; name: string } | null>(null);

  const chat = data?.chat;
  const myRole = chat?.myRole;
  const isAdmin = myRole === 'CHANNEL_OWNER' || myRole === 'CHANNEL_MODERATOR';

  const handleKick = async (memberId: string) => {
    try {
      await removeMember({ chatId, memberId }).unwrap();
      toast.success('Đã xóa thành viên!');
      setConfirmKick(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Lỗi xóa thành viên!');
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await updateRole({ chatId, memberId, role }).unwrap();
      toast.success('Đã cập nhật quyền!');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Lỗi cập nhật quyền!');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md rounded-[4px] p-4 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Users size={16} />Thành viên nhóm: <span className="text-blue-600">{chat?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="py-8 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-5 w-5" /></div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1.5 pr-2 no-scrollbar">
                {chat?.participants?.map((p: any) => (
                  <div key={p.accountId} className="flex items-center justify-between p-2 rounded-[4px] border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 rounded-[4px]">
                        <AvatarImage src={getAvatarUrl(p.avatar, p.name)} />
                        <AvatarFallback className="text-xs bg-blue-50 text-blue-700 font-bold rounded-[4px]">{p.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-normal">{p.name || 'Người dùng'}</p>
                        <div className="mt-0.5"><RoleBadge role={p.role} /></div>
                      </div>
                    </div>
                    {isAdmin && p.accountId !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[4px]"><MoreVertical size={13} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-[4px] p-1 border-slate-200">
                          {myRole === 'CHANNEL_OWNER' && (
                            <>
                              {p.role !== 'CHANNEL_MODERATOR' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(p.accountId, 'CHANNEL_MODERATOR')} disabled={updatingRole} className="rounded-[4px] py-1 cursor-pointer text-xs">
                                  <Shield size={13} className="mr-2 text-blue-600" />Đặt làm Phó nhóm
                                </DropdownMenuItem>
                              )}
                              {p.role === 'CHANNEL_MODERATOR' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(p.accountId, 'CHANNEL_MEMBER')} disabled={updatingRole} className="rounded-[4px] py-1 cursor-pointer text-xs">
                                  <Settings size={13} className="mr-2" />Hạ xuống Thành viên
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="my-0.5" />
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-[4px] py-1 cursor-pointer text-xs"
                            onClick={() => setConfirmKick({ id: p.accountId, name: p.name })}
                          >
                            <UserMinus size={13} className="mr-2" />Xóa khỏi nhóm
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[4px] px-3 font-semibold border-slate-200">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm kick dialog */}
      <Dialog open={!!confirmKick} onOpenChange={() => setConfirmKick(null)}>
        <DialogContent className="sm:max-w-xs rounded-[4px] p-4 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertTriangle size={16} />Xác nhận xóa thành viên</DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-normal">Bạn có chắc muốn xóa <strong>{confirmKick?.name}</strong> khỏi nhóm không?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmKick(null)} className="h-7 text-xs rounded-[4px] px-3 font-semibold border-slate-200">Hủy</Button>
            <Button variant="destructive" size="sm" onClick={() => confirmKick && handleKick(confirmKick.id)} disabled={removing} className="h-7 text-xs rounded-[4px] px-3 font-semibold bg-red-600 hover:bg-red-700">
              {removing ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null}Xóa thành viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function GroupEditModal({ chatId, open, onClose }: { chatId: string; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useGetChatByIdQuery(chatId, { skip: !open || !chatId });
  const [updateChat, { isLoading: saving }] = useUpdateChatMutation();
  const [name, setName] = useState('');
  const [joinPolicy, setJoinPolicy] = useState('PUBLIC');

  React.useEffect(() => {
    if (data?.chat) {
      setName(data.chat.name || '');
      setJoinPolicy(data.chat.joinPolicy || 'PUBLIC');
    }
  }, [data]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Tên nhóm không được để trống!'); return; }
    try {
      await updateChat({ chatId, name: name.trim(), joinPolicy }).unwrap();
      toast.success('Chỉnh sửa thông tin nhóm thành công!');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Lỗi cập nhật nhóm!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[4px] p-4 border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><Edit2 size={16} />Chỉnh sửa thông tin nhóm</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-5 w-5" /></div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Tên nhóm</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên nhóm..." className="h-9 text-xs rounded-[4px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Chế độ tham gia</Label>
              <Select value={joinPolicy} onValueChange={setJoinPolicy}>
                <SelectTrigger className="h-9 text-xs rounded-[4px] border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-slate-200">
                  <SelectItem value="PUBLIC" className="text-xs">
                    <span className="flex items-center gap-1.5"><Globe size={13} className="text-emerald-600" />Công khai – Ai cũng có thể tham gia</span>
                  </SelectItem>
                  <SelectItem value="APPROVAL" className="text-xs">
                    <span className="flex items-center gap-1.5"><Shield size={13} className="text-blue-600" />Phê duyệt – Cần duyệt yêu cầu</span>
                  </SelectItem>
                  <SelectItem value="PRIVATE" className="text-xs">
                    <span className="flex items-center gap-1.5"><Lock size={13} className="text-amber-600" />Riêng tư – Chỉ được mời</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Chỉ nhóm trưởng mới có thể thay đổi chế độ tham gia.</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[4px] px-3 font-semibold border-slate-200">Hủy</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || isLoading} className="h-7 text-xs rounded-[4px] px-3 font-semibold bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null}Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function GroupDeleteModal({ chat, open, onClose }: { chat: any; open: boolean; onClose: () => void }) {
  const [deleteChat, { isLoading }] = useDeleteChatMutation();
  const [confirm, setConfirm] = useState('');

  const handleDelete = async () => {
    if (confirm !== chat?.name) { toast.error('Tên nhóm không khớp!'); return; }
    try {
      await deleteChat(chat.id).unwrap();
      toast.success('Đã xóa nhóm!');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Lỗi xóa nhóm!');
    }
  };

  React.useEffect(() => { if (!open) setConfirm(''); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs rounded-[4px] p-4 border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-xs font-bold text-red-600"><Trash2 size={16} />Xóa nhóm vĩnh viễn</DialogTitle>
          <DialogDescription className="text-xs pt-1.5 leading-normal">
            Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ tin nhắn, tệp và dữ liệu của nhóm <strong className="text-slate-900">{chat?.name}</strong> sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label className="text-[11px] font-semibold text-slate-700">Nhập tên nhóm để xác nhận: <span className="text-red-600 font-bold">{chat?.name}</span></Label>
          <Input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={`Nhập "${chat?.name}" để xác nhận...`}
            className="h-8 text-xs border-red-200 focus:border-red-500 rounded-[4px]"
          />
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[4px] px-3 font-semibold border-slate-200">Hủy</Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading || confirm !== chat?.name}
            className="h-7 text-xs rounded-[4px] px-3 font-semibold bg-red-600 hover:bg-red-700"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Trash2 size={12} className="mr-1.5" />}
            Xóa vĩnh viễn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Archive Confirm Modal ─────────────────────────────────────────────────────
function GroupArchiveModal({ chat, open, onClose }: { chat: any; open: boolean; onClose: () => void }) {
  const [updateChat, { isLoading }] = useUpdateChatMutation();

  const handleArchive = async () => {
    try {
      await updateChat({ chatId: chat.id, joinPolicy: 'PRIVATE' }).unwrap();
      toast.success('Đã lưu trữ nhóm! Nhóm hiện chuyển sang chế độ Riêng tư.');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Lỗi lưu trữ nhóm!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs rounded-[4px] p-4 border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-xs font-bold text-amber-600"><Archive size={16} />Lưu trữ nhóm</DialogTitle>
          <DialogDescription className="text-xs pt-1.5 leading-normal">
            Lưu trữ nhóm <strong>{chat?.name}</strong> sẽ chuyển nhóm sang chế độ <strong>Riêng tư</strong>. Các thành viên vẫn có thể xem lịch sử nhưng không ai mới tham gia được.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[4px] px-3 font-semibold border-slate-200">Hủy</Button>
          <Button size="sm" onClick={handleArchive} disabled={isLoading} className="h-7 text-xs rounded-[4px] px-3 font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1">
            {isLoading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Archive size={12} className="mr-1" />}
            Lưu trữ nhóm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Join Policy Badge ─────────────────────────────────────────────────────────
function JoinPolicyBadge({ policy }: { policy: string }) {
  if (policy === 'PRIVATE')
    return <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 font-semibold px-1.5 py-0 rounded-[4px] shadow-none"><Lock size={10} className="mr-1" />RIÊNG TƯ</Badge>;
  if (policy === 'APPROVAL')
    return <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-semibold px-1.5 py-0 rounded-[4px] shadow-none"><Shield size={10} className="mr-1" />PHÊ DUYỆT</Badge>;
  return <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-1.5 py-0 rounded-[4px] shadow-none"><Globe size={10} className="mr-1" />CÔNG KHAI</Badge>;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function GroupsManagement() {
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [action, setAction] = useState<GroupAction>({ type: null, chatId: null });
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const { data: groupsData, isLoading } = useGetChatsQuery(
    { type: 'group', workspaceId: currentWorkspaceId || '' },
    { skip: !currentWorkspaceId }
  );

  const filteredGroups = groupsData?.chats?.filter((chat: any) => {
    const matchesSearch = chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const policy = chat.joinPolicy || 'PUBLIC';
    const matchesType = typeFilter === "ALL" || typeFilter === policy;
    return matchesSearch && matchesType;
  });

  const openAction = (type: GroupAction['type'], chat: any) => {
    setSelectedChat(chat);
    setAction({ type, chatId: chat.id });
  };

  const closeAction = () => setAction({ type: null, chatId: null });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Nhóm Chat</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý các nhóm thảo luận trong Workspace.</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[4px] text-xs h-8 px-3 py-1 flex items-center gap-1.5"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={14} />Tạo nhóm mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center bg-white p-3 rounded-[4px] border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên nhóm..."
            className="pl-8 h-8 border-slate-200 focus:border-blue-500 rounded-[4px] text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-8 border-slate-200 rounded-[4px] text-xs">
              <SelectValue placeholder="Loại nhóm" />
            </SelectTrigger>
            <SelectContent className="rounded-[4px] border-slate-200 shadow-md">
              <SelectItem value="ALL" className="text-xs">Tất cả loại</SelectItem>
              <SelectItem value="PUBLIC" className="text-xs">Công khai</SelectItem>
              <SelectItem value="APPROVAL" className="text-xs">Phê duyệt</SelectItem>
              <SelectItem value="PRIVATE" className="text-xs">Riêng tư</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80">
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tên nhóm</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Loại</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Thành viên</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ngày tạo</th>
              <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">Đang tải danh sách nhóm...</p>
              </td></tr>
            ) : filteredGroups?.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center">
                <MessageSquare size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Không tìm thấy nhóm nào</p>
              </td></tr>
            ) : (
              filteredGroups?.map((chat: any) => (
                <tr key={chat.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-[4px] bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0 overflow-hidden">
                        <Avatar className="h-full w-full rounded-[4px]">
                          <AvatarImage src={getAvatarUrl(chat.avatar)} className="object-cover" />
                          <AvatarFallback className="rounded-[4px] text-xs font-bold">{chat.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-normal">{chat.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">{chat.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><JoinPolicyBadge policy={chat.joinPolicy} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Users size={12} className="text-slate-400" />
                      <span className="text-xs font-medium">{chat.participantCount ?? chat.participants?.length ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={11} />
                      {chat.createdAt ? format(new Date(chat.createdAt), 'dd/MM/yyyy', { locale: vi }) : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[4px] hover:bg-slate-100 hover:shadow-none border border-transparent hover:border-slate-200/60 transition-colors duration-150">
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1 rounded-[4px] shadow-md border-slate-200">
                        <DropdownMenuItem className="rounded-[4px] py-1 cursor-pointer text-xs" onClick={() => openAction('members', chat)}>
                          <Users className="w-3.5 h-3.5 mr-2 text-slate-600" />
                          <span className="font-semibold text-slate-700">Quản lý thành viên</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-[4px] py-1 cursor-pointer text-xs" onClick={() => openAction('edit', chat)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2 text-blue-600" />
                          <span className="font-semibold text-slate-700">Chỉnh sửa nhóm</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-0.5" />
                        <DropdownMenuItem className="rounded-[4px] py-1 cursor-pointer text-xs" onClick={() => openAction('archive', chat)}>
                          <Archive className="w-3.5 h-3.5 mr-2 text-amber-600" />
                          <span className="font-semibold text-slate-700">Lưu trữ nhóm</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-[4px] py-1 cursor-pointer text-xs"
                          onClick={() => openAction('delete', chat)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          <span className="font-bold">Xóa nhóm vĩnh viễn</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <GroupCreationModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChatCreated={() => setIsCreateModalOpen(false)}
      />
      {action.chatId && action.type === 'members' && (
        <GroupMembersModal chatId={action.chatId} open={true} onClose={closeAction} />
      )}
      {action.chatId && action.type === 'edit' && (
        <GroupEditModal chatId={action.chatId} open={true} onClose={closeAction} />
      )}
      <GroupArchiveModal chat={selectedChat} open={action.type === 'archive'} onClose={closeAction} />
      <GroupDeleteModal chat={selectedChat} open={action.type === 'delete'} onClose={closeAction} />
    </div>
  );
}
