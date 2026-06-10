"use client";

import React, { useState } from 'react';
import {
  MessageSquare, Search, Plus, MoreVertical, Users, Lock, Globe,
  Calendar, Edit2, Archive, Trash2, Loader2, Filter, Shield,
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
    return <Badge className="text-[9px] bg-yellow-50 dark:bg-yellow-950/20 text-yellow-750 dark:text-yellow-400 border-yellow-250/60 dark:border-yellow-900/30 font-bold rounded-[2px] border shadow-none font-mono px-1.5 py-0.5"><Crown size={8} className="mr-1" />Trưởng nhóm</Badge>;
  if (role === 'CHANNEL_MODERATOR')
    return <Badge className="text-[9px] bg-blue-50 dark:bg-blue-950/20 text-blue-755 dark:text-blue-400 border-blue-250/60 dark:border-blue-900/30 font-bold rounded-[2px] border shadow-none font-mono px-1.5 py-0.5"><Shield size={8} className="mr-1" />Phó nhóm</Badge>;
  return <Badge variant="outline" className="text-[9px] text-slate-500 dark:text-zinc-400 font-semibold rounded-[2px] border border-slate-200 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-900/50 shadow-none font-mono px-1.5 py-0.5">Thành viên</Badge>;
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
        <DialogContent className="sm:max-w-md rounded-[2px] p-4 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <Users size={16} />Thành viên: <span className="text-blue-600 dark:text-blue-400">{chat?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="py-8 flex items-center justify-center"><Loader2 className="animate-spin text-slate-700 dark:text-zinc-300 h-5 w-5" /></div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1.5 pr-2 no-scrollbar text-xs">
                {chat?.participants?.map((p: any) => (
                  <div key={p.accountId} className="flex items-center justify-between p-2 rounded-[2px] border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 rounded-[2px] ring-1 ring-slate-100 dark:ring-white/[0.04]">
                        <AvatarImage src={getAvatarUrl(p.avatar, p.name)} className="rounded-[2px]" />
                        <AvatarFallback className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-350 font-bold rounded-[2px]">{p.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">{p.name || 'Người dùng'}</p>
                        <div className="mt-0.5"><RoleBadge role={p.role} /></div>
                      </div>
                    </div>
                    {isAdmin && p.accountId !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[2px] hover:bg-slate-200/50 dark:hover:bg-zinc-800"><MoreVertical size={13} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-[2px] p-1 border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
                          {myRole === 'CHANNEL_OWNER' && (
                            <>
                              {p.role !== 'CHANNEL_MODERATOR' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(p.accountId, 'CHANNEL_MODERATOR')} disabled={updatingRole} className="rounded-[2px] py-1 cursor-pointer text-xs">
                                  <Shield size={13} className="mr-2 text-blue-600 dark:text-blue-450" />Đặt làm Phó nhóm
                                </DropdownMenuItem>
                              )}
                              {p.role === 'CHANNEL_MODERATOR' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(p.accountId, 'CHANNEL_MEMBER')} disabled={updatingRole} className="rounded-[2px] py-1 cursor-pointer text-xs">
                                  <Settings size={13} className="mr-2" />Hạ xuống Thành viên
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="my-0.5 border-slate-100 dark:border-white/[0.04]" />
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-red-650 dark:text-red-405 focus:bg-red-50/50 dark:focus:bg-red-950/20 rounded-[2px] py-1 cursor-pointer text-xs"
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
            <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono border-slate-200 dark:border-white/[0.08] shadow-none">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm kick dialog */}
      <Dialog open={!!confirmKick} onOpenChange={() => setConfirmKick(null)}>
        <DialogContent className="sm:max-w-xs rounded-[2px] p-4 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-450 uppercase tracking-wider"><AlertTriangle size={16} />Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-xs pt-1.5 leading-relaxed text-slate-500 dark:text-slate-450">Bạn có chắc muốn xóa <strong className="text-slate-800 dark:text-slate-200">"{confirmKick?.name}"</strong> khỏi nhóm không?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setConfirmKick(null)} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono border-slate-200 dark:border-white/[0.08] shadow-none">HỦY BỎ</Button>
            <Button variant="destructive" size="sm" onClick={() => confirmKick && handleKick(confirmKick.id)} disabled={removing} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono bg-red-600 hover:bg-red-700 text-white shadow-none">
              {removing ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null}Xác nhận xóa
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
      <DialogContent className="sm:max-w-md rounded-[2px] p-4 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider"><Edit2 size={16} />Chỉnh sửa nhóm</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex items-center justify-center"><Loader2 className="animate-spin text-slate-700 dark:text-zinc-300 h-5 w-5" /></div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên nhóm</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên nhóm..." className="h-9 text-xs rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chế độ tham gia</Label>
              <Select value={joinPolicy} onValueChange={setJoinPolicy}>
                <SelectTrigger className="h-9 text-xs rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 text-slate-800 dark:text-slate-200 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
                  <SelectItem value="PUBLIC" className="text-xs">
                    <span className="flex items-center gap-1.5"><Globe size={13} className="text-emerald-600 dark:text-emerald-450" />Công khai – Tự do tham gia</span>
                  </SelectItem>
                  <SelectItem value="APPROVAL" className="text-xs">
                    <span className="flex items-center gap-1.5"><Shield size={13} className="text-blue-600 dark:text-blue-450" />Phê duyệt – Cần kiểm duyệt</span>
                  </SelectItem>
                  <SelectItem value="PRIVATE" className="text-xs">
                    <span className="flex items-center gap-1.5"><Lock size={13} className="text-amber-600 dark:text-amber-450" />Riêng tư – Chỉ nhận lời mời</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[9px] text-slate-400 dark:text-zinc-550 mt-1 leading-normal">Chỉ trưởng nhóm hoặc quản trị viên mới có quyền cập nhật chính sách này.</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono border-slate-200 dark:border-white/[0.08] shadow-none">HỦY BỎ</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || isLoading} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-none border border-transparent">
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
      <DialogContent className="sm:max-w-xs rounded-[2px] p-4 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-xs font-bold text-red-650 dark:text-red-450 uppercase tracking-wider"><Trash2 size={16} />Xóa nhóm vĩnh viễn</DialogTitle>
          <DialogDescription className="text-xs pt-1.5 leading-relaxed text-slate-500 dark:text-slate-450">
            Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ tin nhắn và dữ liệu của nhóm <strong className="text-red-650 dark:text-red-400 font-mono">"{chat?.name}"</strong> sẽ bị xóa vĩnh viễn khỏi server.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1 text-xs">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhập tên nhóm để xác thực</Label>
          <Input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={`Nhập tên "${chat?.name}" để xác nhận...`}
            className="h-8 text-xs border-red-200 dark:border-red-950 focus:border-red-500 focus:ring-0 bg-red-50/5 dark:bg-red-950/5 text-red-650 dark:text-red-400 rounded-[2px] font-mono placeholder:text-red-200/50"
          />
        </div>
        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono border-slate-200 dark:border-white/[0.08] shadow-none">HỦY BỎ</Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading || confirm !== chat?.name}
            className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono bg-red-650 hover:bg-red-750 text-white shadow-none"
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
      <DialogContent className="sm:max-w-xs rounded-[2px] p-4 border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider"><Archive size={16} />Lưu trữ nhóm</DialogTitle>
          <DialogDescription className="text-xs pt-1.5 leading-relaxed text-slate-500 dark:text-slate-450">
            Lưu trữ nhóm <strong>{chat?.name}</strong> sẽ chuyển chế độ sang <strong>Riêng tư</strong>. Các thành viên hiện có vẫn duy trì lịch sử trò chuyện nhưng ngăn chặn việc tham gia mới.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] mt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono border-slate-200 dark:border-white/[0.08] shadow-none">HỦY BỎ</Button>
          <Button size="sm" onClick={handleArchive} disabled={isLoading} className="h-7 text-xs rounded-[2px] px-3 font-semibold font-mono bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-950 dark:hover:bg-amber-900/50 dark:border dark:border-amber-900/35 flex items-center gap-1 shadow-none">
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
    return <Badge variant="outline" className="text-[9px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250/60 dark:border-amber-900/30 font-bold px-1.5 py-0.5 rounded-[2px] shadow-none font-mono"><Lock size={10} className="mr-1" />RIÊNG TƯ</Badge>;
  if (policy === 'APPROVAL')
    return <Badge variant="outline" className="text-[9px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-755 dark:text-blue-400 border-blue-250/60 dark:border-blue-900/30 font-bold px-1.5 py-0.5 rounded-[2px] shadow-none font-mono"><Shield size={10} className="mr-1" />PHÊ DUYỆT</Badge>;
  return <Badge variant="outline" className="text-[9px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-255/60 dark:border-emerald-900/30 font-bold px-1.5 py-0.5 rounded-[2px] shadow-none font-mono"><Globe size={10} className="mr-1" />CÔNG KHAI</Badge>;
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
      <div className="flex justify-between items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold font-mono uppercase tracking-tight text-slate-900 dark:text-slate-100">Nhóm Chat</h1>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">Quản lý các nhóm thảo luận trong Workspace của bạn.</p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-250 dark:text-slate-900 font-mono font-semibold rounded-[2px] text-xs h-8 px-3 py-1 flex items-center gap-1.5 border border-transparent shadow-none shrink-0"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={14} />Tạo nhóm mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white dark:bg-[#19191B] p-3 rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 animate-pulse" />
          <Input
            placeholder="Tìm kiếm theo tên nhóm..."
            className="pl-8 h-8 border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 focus:border-slate-850 dark:focus:border-slate-300 rounded-[2px] text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-8 border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 rounded-[2px] text-xs font-mono focus:ring-0">
              <SelectValue placeholder="Loại nhóm" />
            </SelectTrigger>
            <SelectContent className="rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
              <SelectItem value="ALL" className="text-xs">Tất cả loại</SelectItem>
              <SelectItem value="PUBLIC" className="text-xs">Công khai</SelectItem>
              <SelectItem value="APPROVAL" className="text-xs">Phê duyệt</SelectItem>
              <SelectItem value="PRIVATE" className="text-xs">Riêng tư</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-[#19191B] rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] shadow-sm overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-200/80 dark:border-white/[0.06] text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              <th className="px-4 py-3">Tên nhóm</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Thành viên</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs font-mono text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr><td colSpan={5} className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-800 dark:text-slate-200 mx-auto" />
                <p className="text-xs text-slate-400 mt-1.5 font-bold">Đang tải danh sách nhóm...</p>
              </td></tr>
            ) : filteredGroups?.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center">
                <MessageSquare size={24} className="text-slate-200 dark:text-zinc-650 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-slate-400 dark:text-zinc-500">Không tìm thấy nhóm nào</p>
              </td></tr>
            ) : (
              filteredGroups?.map((chat: any) => (
                <tr key={chat.id} className="hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-[2px] bg-slate-100 dark:bg-zinc-800 text-indigo-600 flex items-center justify-center border border-slate-200/50 dark:border-white/[0.04] shrink-0 overflow-hidden">
                        <Avatar className="h-full w-full rounded-[2px]">
                          <AvatarImage src={getAvatarUrl(chat.avatar)} className="object-cover rounded-[2px]" />
                          <AvatarFallback className="rounded-[2px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold">{chat.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-normal">{chat.name}</p>
                        <p className="text-[9px] text-slate-450 dark:text-zinc-550 font-mono leading-none mt-0.5">{chat.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><JoinPolicyBadge policy={chat.joinPolicy} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-650 dark:text-slate-450">
                      <Users size={12} className="text-slate-400 dark:text-zinc-500" />
                      <span className="text-xs font-semibold">{chat.participantCount ?? chat.participants?.length ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-500 dark:text-zinc-550 flex items-center gap-1.5">
                      <Calendar size={11} className="text-slate-400 dark:text-zinc-500" />
                      {chat.createdAt ? format(new Date(chat.createdAt), 'dd/MM/yyyy', { locale: vi }) : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[2px] hover:bg-slate-100 dark:hover:bg-zinc-800 hover:shadow-none border border-transparent hover:border-slate-250/60 dark:hover:border-white/[0.08] transition-colors duration-150">
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1 rounded-[2px] border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B] font-mono text-xs">
                        <DropdownMenuItem className="rounded-[2px] py-1 cursor-pointer text-xs" onClick={() => openAction('members', chat)}>
                          <Users className="w-3.5 h-3.5 mr-2 text-slate-600 dark:text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Quản lý thành viên</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-[2px] py-1 cursor-pointer text-xs" onClick={() => openAction('edit', chat)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Chỉnh sửa nhóm</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-0.5 border-slate-100 dark:border-white/[0.04]" />
                        <DropdownMenuItem className="rounded-[2px] py-1 cursor-pointer text-xs" onClick={() => openAction('archive', chat)}>
                          <Archive className="w-3.5 h-3.5 mr-2 text-amber-605 dark:text-amber-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Lưu trữ nhóm</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-700 focus:bg-red-50/50 dark:text-red-400 dark:focus:bg-red-950/20 rounded-[2px] py-1 cursor-pointer text-xs font-bold"
                          onClick={() => openAction('delete', chat)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2 text-red-500" />
                          <span>Xóa nhóm vĩnh viễn</span>
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
