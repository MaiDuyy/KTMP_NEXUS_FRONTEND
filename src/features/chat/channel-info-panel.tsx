"use client";

import React, { useState } from 'react';
import { X, Hash, Lock, Users, UserPlus, Settings, Pencil, Bell, BellOff, LogOut, Trash2, CheckCircle2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import {
  useGetChannelQuery,
  useGetChannelMembersQuery,
  useAddChannelMemberMutation,
  useRemoveChannelMemberMutation,
  useUpdateChannelMutation,
  useLeaveChannelMutation,
  useUpdateChannelPreferencesMutation,
  Channel,
} from '@/src/redux/feature/channelApi';
import { useGetWorkspaceMembersQuery } from '@/src/redux/feature/workspaceApi';
import { getAvatarUrl } from '@/src/utils/image-utils';

interface ChannelInfoPanelProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
  onLeaveChannel?: () => void;
}

export const ChannelInfoPanel: React.FC<ChannelInfoPanelProps> = ({
  channelId,
  isOpen,
  onClose,
  onLeaveChannel,
}) => {
  const currentUser = useSelector((state: any) => state.auth?.user);
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'settings'>('about');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');

  const { data: channel, isLoading: loadingChannel } = useGetChannelQuery(channelId, { skip: !channelId || !isOpen });
  const { data: membersData, isLoading: loadingMembers } = useGetChannelMembersQuery(channelId, { skip: !channelId || !isOpen });

  const [updateChannel, { isLoading: updating }] = useUpdateChannelMutation();
  const [addMember, { isLoading: addingMember }] = useAddChannelMemberMutation();
  const [removeMember] = useRemoveChannelMemberMutation();
  const [leaveChannel] = useLeaveChannelMutation();
  const [updatePreferences] = useUpdateChannelPreferencesMutation();

  // Workspace members to invite from
  const workspaceId = channel?.workspaceId;
  const { data: wsMembers } = useGetWorkspaceMembersQuery(
    { workspaceId: workspaceId! },
    { skip: !workspaceId || activeTab !== 'members' }
  );

  const myMembership = membersData?.members?.find((m) => m.userId === currentUser?.id);
  const isMuted = myMembership?.isMuted ?? false;
  const isOwnerOrModerator = myMembership?.role === 'CHANNEL_OWNER' || myMembership?.role === 'CHANNEL_MODERATOR';

  const Icon = channel?.type === 'PRIVATE' || (channel?.type as string) === 'GUEST' ? Lock : Hash;

  const memberIds = new Set(membersData?.members?.map((m) => m.userId) || []);
  const availableToInvite = (wsMembers?.items || []).filter(
    (m: any) => !memberIds.has(m.userId) && ((m.user?.name || m.userId) as string).toLowerCase().includes(addSearch.toLowerCase())
  );

  const filteredMembers = membersData?.members?.filter((m) =>
    (m.user?.name || m.userId).toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

  const handleSaveSettings = async () => {
    try {
      await updateChannel({
        channelId,
        name: editName || undefined,
        description: editDescription || undefined,
        topic: editTopic || undefined,
      }).unwrap();
      toast.success('Đã cập nhật kênh!');
      setEditMode(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleAddMember = async (userId: string, userName: string) => {
    try {
      await addMember({ channelId, targetUserId: userId }).unwrap();
      toast.success(`Đã thêm ${userName} vào kênh!`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Thêm thành viên thất bại');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Xóa ${userName} khỏi kênh?`)) return;
    try {
      await removeMember({ channelId, targetUserId: userId }).unwrap();
      toast.success(`Đã xóa ${userName}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Xóa thất bại');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Rời khỏi kênh này?')) return;
    try {
      await leaveChannel(channelId).unwrap();
      toast.success('Đã rời kênh');
      onLeaveChannel?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Không thể rời kênh');
    }
  };

  const handleToggleMute = async () => {
    try {
      await updatePreferences({ channelId, isMuted: !isMuted }).unwrap();
      toast.success(isMuted ? 'Đã bật thông báo' : 'Đã tắt thông báo');
    } catch (e: any) {
      toast.error('Cập nhật thất bại');
    }
  };

  console.log(membersData?.members);
  return (
    <Sheet open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent style={{ width: '320px', maxWidth: '320px' }} className="!w-80 !max-w-80 p-0 flex flex-col border-l border-slate-100 bg-white shadow-xl z-50">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-slate-100 text-left shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 truncate">
            <Icon size={18} className="text-slate-500 shrink-0" />
            <span>{channel?.name || '...'}</span>
          </SheetTitle>
        </SheetHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 shrink-0">
        {(['about', 'members', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {tab === 'about' ? 'Giới thiệu' : tab === 'members' ? 'Thành viên' : 'Cài đặt'}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loadingChannel ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* ── ABOUT TAB ── */}
            {activeTab === 'about' && (
              <div className="p-4 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{channel?._count?.members ?? 0}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Thành viên</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{channel?._count?.messages ?? 0}</p>
                    <p className="text-[11px] text-slate-400 font-medium">Tin nhắn</p>
                  </div>
                </div>

                {/* Type badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={channel?.type === 'PUBLIC' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}
                  >
                    {channel?.type === 'PUBLIC' ? 'Công khai' : channel?.type === 'PRIVATE' ? 'Riêng tư' : 'Khách'}
                  </Badge>
                  {channel?.isDefault && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">Mặc định</Badge>
                  )}
                </div>

                {/* Description */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mô tả</p>
                  <p className="text-sm text-slate-600">{channel?.description || 'Chưa có mô tả.'}</p>
                </div>

                {/* Topic */}
                {channel?.topic && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Chủ đề</p>
                    <p className="text-sm text-slate-600">{channel.topic}</p>
                  </div>
                )}

                {/* Created */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ngày tạo</p>
                  <p className="text-sm text-slate-600">
                    {channel?.createdAt ? new Date(channel.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </p>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-1">
                  <button
                    onClick={handleToggleMute}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-600"
                  >
                    {isMuted ? <BellOff size={16} className="text-slate-400" /> : <Bell size={16} className="text-slate-400" />}
                    {isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                  </button>
                  <button
                    onClick={handleLeave}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 transition-colors text-sm text-rose-600"
                  >
                    <LogOut size={16} />
                    Rời kênh
                  </button>
                </div>
              </div>
            )}

            {/* ── MEMBERS TAB ── */}
            {activeTab === 'members' && (
              <div className="p-3 space-y-3">
                {/* Search existing members */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm thành viên..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                {/* Member list */}
                {loadingMembers ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={getAvatarUrl(member.user?.avatar, member.user?.name || member.userId)} />
                            <AvatarFallback className="text-[10px]">{(member.user?.name || 'U')[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{member.user?.name || member.userId}</p>
                            <p className="text-[10px] text-slate-400">
                              {member.role  === 'CHANNEL_OWNER' ? '👑 Owner' : member.role === 'CHANNEL_MODERATOR' ? '🛡 Mod' : 'Thành viên'}
                            </p>
                          </div>
                        </div>
                        {isOwnerOrModerator && member.userId !== currentUser?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.userId, member.user?.name || member.userId)}
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-rose-400 hover:bg-rose-50 transition-all"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add member section (owner/mod only) */}
                {isOwnerOrModerator && (
                  <>
                    <Separator />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thêm thành viên</p>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Tìm người dùng trong workspace..."
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                      {availableToInvite.map((m: any) => (
                        <div key={m.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={getAvatarUrl(m.user?.avatar, m.user?.name || m.userId)} />
                              <AvatarFallback className="text-[10px]">{(m.user?.name || 'U')[0]}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium truncate">{m.user?.name || m.userId}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-blue-600 hover:bg-blue-50 px-2"
                            onClick={() => handleAddMember(m.userId, m.user?.name || m.userId)}
                            disabled={addingMember}
                          >
                            Thêm
                          </Button>
                        </div>
                      ))}
                      {addSearch && availableToInvite.length === 0 && (
                        <p className="text-xs text-center text-slate-400 py-3">Không tìm thấy</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
              <div className="p-4 space-y-4">
                {isOwnerOrModerator ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">Thông tin kênh</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => {
                          if (!editMode) {
                            setEditName(channel?.name || '');
                            setEditDescription(channel?.description || '');
                            setEditTopic(channel?.topic || '');
                          }
                          setEditMode(!editMode);
                        }}
                      >
                        <Pencil size={12} />
                        {editMode ? 'Hủy' : 'Sửa'}
                      </Button>
                    </div>

                    {editMode ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Tên kênh</label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 text-sm" placeholder="tên-kênh" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Mô tả</label>
                          <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="text-sm resize-none" rows={3} placeholder="Kênh này dùng để..." />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Chủ đề hiện tại</label>
                          <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} className="h-9 text-sm" placeholder="Chủ đề đang thảo luận..." />
                        </div>
                        <Button onClick={handleSaveSettings} disabled={updating} className="w-full h-9 text-sm gap-2">
                          {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Lưu thay đổi
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tên</p>
                          <p className="text-slate-700">#{channel?.name}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mô tả</p>
                          <p className="text-slate-500 italic">{channel?.description || 'Chưa có mô tả'}</p>
                        </div>
                        {channel?.topic && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Chủ đề</p>
                            <p className="text-slate-500 italic">{channel.topic}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Settings size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Chỉ Owner/Moderator mới có thể thay đổi cài đặt kênh.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
