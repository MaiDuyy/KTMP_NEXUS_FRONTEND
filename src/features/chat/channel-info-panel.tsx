"use client";

import React, { useState } from 'react';
import { X, Hash, Lock, Users, UserPlus, Settings, Pencil, Bell, BellOff, LogOut, Trash2, CheckCircle2, Loader2, Search, Pin, FileText, Image as ImageIcon, Video, Paperclip, MoreHorizontal } from 'lucide-react';
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
import { useGetPinnedMessagesQuery, useGetMediaMessagesQuery, useTogglePinMessageMutation } from '@/src/redux/feature/messageApi';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'files' | 'settings'>('about');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'file'>('all');

  const { data: channel, isLoading: loadingChannel } = useGetChannelQuery(channelId, { skip: !channelId || !isOpen });
  const { data: membersData, isLoading: loadingMembers } = useGetChannelMembersQuery(channelId, { skip: !channelId || !isOpen });

  const [updateChannel, { isLoading: updating }] = useUpdateChannelMutation();
  const [addMember, { isLoading: addingMember }] = useAddChannelMemberMutation();
  const [removeMember] = useRemoveChannelMemberMutation();
  const [leaveChannel] = useLeaveChannelMutation();
  const [updatePreferences] = useUpdateChannelPreferencesMutation();

  const { data: pinnedData, isLoading: loadingPinned } = useGetPinnedMessagesQuery(channelId, { skip: !channelId || !isOpen });
  const { data: mediaData, isLoading: loadingMedia } = useGetMediaMessagesQuery({ chatId: channelId, type: mediaFilter }, { skip: !channelId || !isOpen || activeTab !== 'files' });
  const [togglePin] = useTogglePinMessageMutation();

  const normalizeUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const renderMediaItem = (message: any) => {
    if (message.type === "image") {
        return (
            <div
                key={message.id}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
            >
                <img
                    src={normalizeUrl(message.content || "")}
                    alt="Media"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(normalizeUrl(message.content || ""), "_blank");
                        }}
                    >
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    if (message.type === "video") {
        return (
            <div
                key={message.id}
                className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer bg-slate-900"
            >
                <video
                    src={normalizeUrl(message.content || "")}
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-6 w-6 text-white opacity-80" />
                </div>
            </div>
        );
    }

    return (
        <div
            key={message.id}
            className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-100"
        >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-[11px] truncate">{message.file?.name || "File"}</p>
                <p className="text-[9px] text-slate-400 truncate">
                   {message.sender?.name} • {message.time ? format(new Date(message.time), 'dd/MM') : '--/--'}
                </p>
            </div>
        </div>
    );
  };

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

  return (
    <Sheet open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent style={{ width: '320px', maxWidth: '320px' }} className="!w-80 !max-w-80 p-0 flex flex-col border-l border-slate-100 bg-white shadow-xl z-50">
        <ScrollArea className="flex-1 h-full">
          <div className="flex flex-col min-h-full">
            {/* Banner/Header Section */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 w-full shrink-0 relative">
               <div className="absolute -bottom-6 left-6">
                  <div className="h-12 w-12 rounded-2xl bg-white p-1 shadow-lg">
                     <div className="h-full w-full rounded-xl bg-blue-50 flex items-center justify-center">
                        <Icon size={24} className="text-blue-600" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-8 px-6 pb-4 shrink-0">
               <h2 className="text-xl font-bold text-slate-900 truncate">{channel?.name || '...'}</h2>
               <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Users size={12} />
                  {channel?._count?.members ?? 0} thành viên
               </p>
            </div>

            {/* Sticky Tabs Navigation */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 flex px-2 shrink-0">
              {(['about', 'members', 'files', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                    activeTab === tab
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {tab === 'about' ? 'Giới thiệu' : tab === 'members' ? 'Thành viên' : tab === 'files' ? 'Media' : 'Cài đặt'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1">
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
                        {channel?.isReadOnly && (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Chỉ đọc</Badge>
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
                          {channel?.createdAt ? format(new Date(channel.createdAt), 'dd MMMM, yyyy', { locale: vi }) : '—'}
                        </p>
                      </div>

                      <Separator />

                      {/* Members Preview */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thành viên</p>
                          <button 
                            onClick={() => setActiveTab('members')}
                            className="text-[10px] text-blue-600 font-semibold hover:underline"
                          >
                            Xem tất cả
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                           {membersData?.members?.slice(0, 8).map((m) => (
                             <Avatar key={m.userId} className="h-8 w-8 border-2 border-white dark:border-gray-800 shadow-sm shrink-0">
                               <AvatarImage src={getAvatarUrl(m.user?.avatar, m.user?.name || '')} />
                               <AvatarFallback className="text-[10px] font-bold bg-slate-100">{m.user?.name?.[0]}</AvatarFallback>
                             </Avatar>
                           ))}
                           {(membersData?.total || 0) > 8 && (
                             <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold border-2 border-white dark:border-gray-800">
                               +{(membersData?.total || 0) - 8}
                             </div>
                           )}
                        </div>
                      </div>

                      <Separator className="bg-slate-100 dark:bg-slate-800" />

                      {/* Media Preview Section */}
                      <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Media mới nhất</h3>
                              <button onClick={() => setActiveTab('files')} className="text-[10px] text-blue-600 font-semibold hover:underline">Xem tất cả</button>
                          </div>
                          {loadingMedia ? (
                              <Loader2 className="h-5 w-5 animate-spin text-slate-200 mx-auto" />
                          ) : (mediaData?.media || []).length > 0 ? (
                              <div className="grid grid-cols-4 gap-2">
                                  {(mediaData?.media || []).filter((m: any) => m.type === 'image').slice(0, 4).map((msg: any) => (
                                      <div key={msg.id} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-slate-100 dark:border-slate-800">
                                          <img src={normalizeUrl(msg.content || "")} alt="" className="w-full h-full object-cover" />
                                      </div>
                                  ))}
                                  {(mediaData?.media || []).filter((m: any) => m.type === 'image').length === 0 && (
                                      <div className="col-span-4 text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                          <p className="text-[10px] text-slate-400 italic">Không có hình ảnh nào</p>
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <p className="text-center py-4 text-[10px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed">Chưa có tệp tin</p>
                          )}
                      </div>

                      <Separator />

                      {/* Pinned Messages Preview */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tin nhắn đã ghim</p>
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{pinnedData?.pinnedMessages?.length || 0}</Badge>
                        </div>
                        {loadingPinned ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-200 mx-auto" />
                        ) : pinnedData?.pinnedMessages?.length ? (
                          <div className="space-y-2">
                            {pinnedData.pinnedMessages.slice(0, 3).map((msg) => (
                              <div key={msg.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 relative group">
                                <div className="flex items-center gap-2 mb-1">
                                   <Avatar className="h-4 w-4">
                                      <AvatarImage src={getAvatarUrl(msg.sender?.avatar, msg.sender?.name || '')} />
                                      <AvatarFallback className="text-[8px]">{msg.sender?.name?.[0]}</AvatarFallback>
                                   </Avatar>
                                   <span className="text-[10px] font-bold truncate">{msg.sender?.name}</span>
                                   <span className="text-[9px] text-slate-400 ml-auto">{msg.time ? format(new Date(msg.time), 'HH:mm') : '--:--'}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                  {msg.content || (msg.file ? '📎 Tệp đính kèm' : '...')}
                                </p>
                                <button 
                                  onClick={() => togglePin({ messageId: msg.id, chatId: channelId })}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                                >
                                  <X size={10} className="text-slate-400" />
                                </button>
                              </div>
                            ))}
                            {pinnedData.pinnedMessages.length > 3 && (
                              <p className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline text-center">
                                Xem thêm {pinnedData.pinnedMessages.length - 3} tin nhắn...
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 rounded-lg border border-dashed border-slate-200">
                            <Pin size={16} className="mx-auto mb-1 text-slate-300" />
                            <p className="text-[10px] text-slate-400">Chưa có tin nhắn nào được ghim</p>
                          </div>
                        )}
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
                          <div className="space-y-0.5">
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

                  {/* ── MEDIA TAB ── */}
                  {activeTab === 'files' && (
                    <div className="p-4 space-y-4">
                      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                          {[
                              { value: "all", label: "Tất cả", icon: null },
                              { value: "image", label: "Ảnh", icon: ImageIcon },
                              { value: "video", label: "Video", icon: Video },
                              { value: "file", label: "File", icon: FileText },
                          ].map(({ value, label, icon: IconComponent }) => (
                              <Button
                                  key={value}
                                  size="sm"
                                  variant={mediaFilter === value ? "default" : "outline"}
                                  onClick={() => setMediaFilter(value as any)}
                                  className="h-7 px-2.5 text-[10px] flex items-center gap-1 shrink-0 rounded-full"
                              >
                                  {IconComponent && <IconComponent className="h-3 w-3" />}
                                  {label}
                              </Button>
                          ))}
                      </div>

                      {loadingMedia ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
                      ) : mediaData?.media?.length ? (
                        <div className={`
                            ${mediaFilter === "file" || (mediaFilter === "all" && mediaData.media.every((m: any) => m.type === "file"))
                                ? "space-y-2"
                                : "grid grid-cols-3 gap-2"
                            }
                        `}>
                          {mediaData.media.map((msg: any) => renderMediaItem(msg))}
                        </div>
                      ) : (
                        <div className="text-center py-24 px-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800">
                          <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                              <Paperclip size={32} className="text-slate-200" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Không có tệp tin</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Các tệp tin, ảnh và video trong kênh này sẽ xuất hiện tại đây.</p>
                        </div>
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
                              <Separator />
                              <div className="flex items-center justify-between py-2">
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Chế độ Chỉ đọc</p>
                                  <p className="text-[11px] text-slate-500">Chỉ Admin mới có thể nhắn tin</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={channel?.isReadOnly ? "default" : "outline"}
                                  className={`h-7 text-[10px] ${channel?.isReadOnly ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                  onClick={async () => {
                                    try {
                                      await updateChannel({ channelId, isReadOnly: !channel?.isReadOnly }).unwrap();
                                      toast.success(channel?.isReadOnly ? 'Đã tắt chế độ chỉ đọc' : 'Đã bật chế độ chỉ đọc');
                                    } catch (e) {
                                      toast.error('Cập nhật thất bại');
                                    }
                                  }}
                                >
                                  {channel?.isReadOnly ? 'Đang bật' : 'Đang tắt'}
                                </Button>
                              </div>
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
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
