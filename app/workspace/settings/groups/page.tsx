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
    return <Badge className="text-[9px] bg-yellow-50 text-yellow-700 border-yellow-200 font-bold border"><Crown size={8} className="mr-1" />Trưởng nhóm</Badge>;
  if (role === 'CHANNEL_MODERATOR')
    return <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-bold border"><Shield size={8} className="mr-1" />Phó nhóm</Badge>;
  return <Badge variant="outline" className="text-[9px] text-slate-500 font-medium">Thành viên</Badge>;
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={18} />Thành viên nhóm: <span className="text-blue-600">{chat?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="py-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {chat?.participants?.map((p: any) => (
                  <div key={p.accountId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={getAvatarUrl(p.avatar, p.name)} />
                        <AvatarFallback className="text-xs bg-blue-50 text-blue-700 font-bold">{p.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.name || 'Người dùng'}</p>
                        <RoleBadge role={p.role} />
                      </div>
                    </div>
                    {isAdmin && p.accountId !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          {myRole === 'CHANNEL_OWNER' && (
                            <>
                              {p.role !== 'CHANNEL_MODERATOR' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(p.accountId, 'CHANNEL_MODERATOR')} disabled={updatingRole}>
                                  <Shield size={14} className="mr-2 text-blue-500" />Đặt làm Phó nhóm
                                </DropdownMenuItem>
                              )}
                              {p.role === 'CHANNEL_MODERATOR' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(p.accountId, 'CHANNEL_MEMBER')} disabled={updatingRole}>
                                  <Settings size={14} className="mr-2" />Hạ xuống Thành viên
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setConfirmKick({ id: p.accountId, name: p.name })}
                          >
                            <UserMinus size={14} className="mr-2" />Xóa khỏi nhóm
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm kick dialog */}
      <Dialog open={!!confirmKick} onOpenChange={() => setConfirmKick(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle size={18} />Xác nhận xóa thành viên</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa <strong>{confirmKick?.name}</strong> khỏi nhóm không?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmKick(null)}>Hủy</Button>
            <Button variant="destructive" onClick={() => confirmKick && handleKick(confirmKick.id)} disabled={removing}>
              {removing ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Xóa thành viên
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
      toast.success('Cập nhật thông tin nhóm thành công!');
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Lỗi cập nhật nhóm!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Edit2 size={18} />Chỉnh sửa thông tin nhóm</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Tên nhóm</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên nhóm..." />
            </div>
            <div className="space-y-2">
              <Label>Chế độ tham gia</Label>
              <Select value={joinPolicy} onValueChange={setJoinPolicy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <span className="flex items-center gap-2"><Globe size={13} className="text-emerald-600" />Công khai – Ai cũng có thể tham gia</span>
                  </SelectItem>
                  <SelectItem value="APPROVAL">
                    <span className="flex items-center gap-2"><Shield size={13} className="text-blue-600" />Phê duyệt – Cần duyệt yêu cầu</span>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <span className="flex items-center gap-2"><Lock size={13} className="text-amber-600" />Riêng tư – Chỉ được mời</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Chỉ nhóm trưởng mới có thể thay đổi chế độ tham gia.</p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving || isLoading} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Lưu thay đổi
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600"><Trash2 size={18} />Xóa nhóm vĩnh viễn</DialogTitle>
          <DialogDescription className="pt-2">
            Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ tin nhắn, tệp và dữ liệu của nhóm <strong className="text-slate-900">{chat?.name}</strong> sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Nhập tên nhóm để xác nhận: <span className="text-red-600 font-bold">{chat?.name}</span></Label>
          <Input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={`Nhập "${chat?.name}" để xác nhận...`}
            className="border-red-200 focus:border-red-500"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || confirm !== chat?.name}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600"><Archive size={18} />Lưu trữ nhóm</DialogTitle>
          <DialogDescription className="pt-2">
            Lưu trữ nhóm <strong>{chat?.name}</strong> sẽ chuyển nhóm sang chế độ <strong>Riêng tư</strong>. Các thành viên vẫn có thể xem lịch sử nhưng không ai mới tham gia được.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleArchive} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isLoading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Archive size={14} className="mr-2" />}
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
    return <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200 font-bold"><Lock size={10} className="mr-1" />RIÊNG TƯ</Badge>;
  if (policy === 'APPROVAL')
    return <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 font-bold"><Shield size={10} className="mr-1" />PHÊ DUYỆT</Badge>;
  return <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200 font-bold"><Globe size={10} className="mr-1" />CÔNG KHAI</Badge>;
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhóm Chat</h1>
          <p className="text-slate-500 mt-1">Quản lý các nhóm thảo luận trong Workspace.</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} className="mr-2" />Tạo nhóm mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên nhóm..."
            className="pl-10 h-10 border-slate-200 focus:border-blue-500 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-10 border-slate-200 rounded-xl">
              <SelectValue placeholder="Loại nhóm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="PUBLIC">Công khai</SelectItem>
              <SelectItem value="APPROVAL">Phê duyệt</SelectItem>
              <SelectItem value="PRIVATE">Riêng tư</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tên nhóm</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Loại</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thành viên</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày tạo</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Đang tải danh sách nhóm...</p>
              </td></tr>
            ) : filteredGroups?.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center">
                <MessageSquare size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Không tìm thấy nhóm nào</p>
              </td></tr>
            ) : (
              filteredGroups?.map((chat: any) => (
                <tr key={chat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                        {/* <MessageSquare size={18} /> */}
                        <Avatar>
                          <AvatarImage src={getAvatarUrl(chat.avatar)} />
                          <AvatarFallback>{chat.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{chat.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{chat.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><JoinPolicyBadge policy={chat.joinPolicy} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-sm font-medium">{chat.participantCount ?? chat.participants?.length ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {chat.createdAt ? format(new Date(chat.createdAt), 'dd/MM/yyyy', { locale: vi }) : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-xl border-slate-100">
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer" onClick={() => openAction('members', chat)}>
                          <Users className="w-4 h-4 mr-3 text-slate-600" />
                          <span className="font-medium text-sm">Quản lý thành viên</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer" onClick={() => openAction('edit', chat)}>
                          <Edit2 className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="font-medium text-sm">Chỉnh sửa nhóm</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer" onClick={() => openAction('archive', chat)}>
                          <Archive className="w-4 h-4 mr-3 text-amber-600" />
                          <span className="font-medium text-sm">Lưu trữ nhóm</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg py-2 cursor-pointer"
                          onClick={() => openAction('delete', chat)}
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          <span className="font-bold text-sm">Xóa nhóm vĩnh viễn</span>
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
