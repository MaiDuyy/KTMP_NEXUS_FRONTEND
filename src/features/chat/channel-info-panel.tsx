"use client";

import React, { useState, useRef } from 'react';
import { X, Hash, Lock, Users, UserPlus, Settings, Pencil, Bell, BellOff, LogOut, CheckCircle2, Loader2, Search, Pin, FileText, Image as ImageIcon, Video, Paperclip, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
} from '@/src/redux/feature/channelApi';
import { useGetWorkspaceMembersQuery } from '@/src/redux/feature/workspaceApi';
import { useGetPinnedMessagesQuery, useGetMediaMessagesQuery, useTogglePinMessageMutation } from '@/src/redux/feature/messageApi';
import { getAvatarUrl, getMediaUrl } from '@/src/utils/image-utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageSnippet } from './message-snippet';

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
  const [error, setError] = useState<string | null>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

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

  const renderMediaItem = (message: any) => {
    if (message.type === "image") {
      return (
        <div
          key={message.id}
          className="relative aspect-square rounded-[2px] border border-slate-200 dark:border-white/[0.06] overflow-hidden group cursor-pointer"
        >
          <img
            src={getMediaUrl(message.content || "")}
            alt="Media"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 rounded-[2px]"
              onClick={(e) => {
                e.stopPropagation();
                window.open(getMediaUrl(message.content || ""), "_blank");
              }}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      );
    }

    if (message.type === "video") {
      return (
        <div
          key={message.id}
          className="relative aspect-video rounded-[2px] border border-slate-200 dark:border-white/[0.06] overflow-hidden group cursor-pointer bg-slate-950"
        >
          <video
            src={getMediaUrl(message.content || "")}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="h-5 w-5 text-white opacity-85" />
          </div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className="flex items-center gap-2.5 p-2 bg-slate-50/50 dark:bg-zinc-900/35 rounded-[2px] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all border border-slate-200/80 dark:border-white/[0.04] group"
      >
        <div className="w-7 h-7 bg-slate-150 dark:bg-zinc-800 rounded-[2px] flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-white/[0.04]">
          <FileText className="h-3.5 w-3.5 text-slate-700 dark:text-zinc-300" />
        </div>
        <div className="flex-1 min-w-0 font-mono">
          <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate">{message.file?.name || "File"}</p>
          <p className="text-[9px] text-slate-400 dark:text-zinc-550 truncate mt-0.5">
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
    setError(null);
    if (!editName.trim()) {
      setError('Tên nhóm không được để trống!');
      editNameRef.current?.focus();
      return;
    }
    try {
      await updateChannel({
        channelId,
        name: editName.trim(),
        description: editDescription || undefined,
        topic: editTopic || undefined,
      }).unwrap();
      toast.success('Đã cập nhật kênh!');
      setEditMode(false);
    } catch (e: any) {
      if (e?.data?.errorCode === 'DUPLICATE_GROUP_NAME') {
        setError(e.data.message || 'Tên nhóm đã tồn tại.');
        editNameRef.current?.focus();
        toast.error('Cập nhật nhóm thất bại, vui lòng kiểm tra lại thông tin');
      } else {
        toast.error(e?.data?.message || 'Cập nhật thất bại');
      }
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
      <SheetContent 
        style={{ width: '320px', maxWidth: '320px' }} 
        className="!w-80 !max-w-80 p-0 flex flex-col border-l border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] shadow-2xl z-50 font-mono no-scrollbar"
      >
        <ScrollArea className="flex-1 h-full custom-scrollbar no-scrollbar">
          <div className="flex flex-col min-h-full">
            {/* Minimalist Tech Header Section */}
            <div className="h-16 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200/80 dark:border-white/[0.06] w-full shrink-0 relative flex items-center px-4">
              <div className="h-8 w-8 rounded-[2px] bg-white dark:bg-[#19191B] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center mr-3 shadow-none shrink-0">
                <div className="h-6 w-6 rounded-[2px] bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-center">
                  <Icon size={14} className="text-slate-800 dark:text-zinc-200" />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate uppercase tracking-wider">#{channel?.name || '...'}</h2>
                <p className="text-[9px] text-slate-400 dark:text-zinc-550 leading-none mt-0.5">INFO_SIDEBAR_PANEL</p>
              </div>
            </div>

            {/* Sticky Tabs Navigation (Sleek Geometric Lines) */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#19191B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.06] flex px-2 shrink-0">
              {(['about', 'members', 'files', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider transition-all border-b-2 font-mono ${
                    activeTab === tab
                      ? 'text-slate-900 dark:text-slate-100 border-slate-900 dark:border-slate-100'
                      : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab === 'about' ? 'Về kênh' : tab === 'members' ? 'Thành viên' : tab === 'files' ? 'Media' : 'Cài đặt'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {loadingChannel ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 dark:text-zinc-550" />
                </div>
              ) : (
                <>
                  {/* ── ABOUT TAB ── */}
                  {activeTab === 'about' && (
                    <div className="p-4 space-y-4">
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50/50 dark:bg-zinc-900/35 border border-slate-200/80 dark:border-white/[0.04] rounded-[2px] p-2.5 text-center font-mono">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{channel?._count?.members ?? 0}</p>
                          <p className="text-[8px] uppercase tracking-widest text-slate-400 dark:text-zinc-550 font-bold mt-0.5">Thành viên</p>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-zinc-900/35 border border-slate-200/80 dark:border-white/[0.04] rounded-[2px] p-2.5 text-center font-mono">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{channel?._count?.messages ?? 0}</p>
                          <p className="text-[8px] uppercase tracking-widest text-slate-400 dark:text-zinc-550 font-bold mt-0.5">Tin nhắn</p>
                        </div>
                      </div>

                      {/* Type badge status tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`rounded-[2px] shadow-none border font-mono text-[9px] uppercase tracking-wider font-bold ${
                            channel?.type === 'PUBLIC' 
                              ? 'bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-500 border-emerald-250/20' 
                              : 'bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-500 border-amber-250/20'
                          }`}
                        >
                          {channel?.type === 'PUBLIC' ? 'Công khai' : channel?.type === 'PRIVATE' ? 'Riêng tư' : 'Khách'}
                        </Badge>
                        {channel?.isDefault && (
                          <Badge variant="secondary" className="rounded-[2px] shadow-none border border-blue-200/40 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-500 dark:border-blue-900/20 font-mono text-[9px] uppercase tracking-wider font-bold">Mặc định</Badge>
                        )}
                        {channel?.isReadOnly && (
                          <Badge variant="secondary" className="rounded-[2px] shadow-none border border-indigo-200/40 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-500 dark:border-indigo-900/20 font-mono text-[9px] uppercase tracking-wider font-bold">Chỉ đọc</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div className="font-mono">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Mô tả</p>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed bg-slate-50/20 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-white/[0.04] p-2 rounded-[2px] min-h-[48px]">
                          {channel?.description || 'Chưa có mô tả.'}
                        </p>
                      </div>

                      {/* Topic */}
                      {channel?.topic && (
                        <div className="font-mono">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Chủ đề</p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed bg-slate-50/20 dark:bg-zinc-900/20 border border-slate-200/50 dark:border-white/[0.04] p-2 rounded-[2px]">{channel.topic}</p>
                        </div>
                      )}

                      {/* Created */}
                      <div className="font-mono">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-0.5">Ngày khởi tạo</p>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 font-semibold">
                          {channel?.createdAt ? format(new Date(channel.createdAt), 'dd/MM/yyyy') : '—'}
                        </p>
                      </div>

                      <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />

                      {/* Members Preview */}
                      <div className="space-y-3 font-mono">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Thành viên xem trước</p>
                          <button 
                            onClick={() => setActiveTab('members')}
                            className="text-[9px] text-slate-900 dark:text-slate-100 font-bold hover:underline"
                          >
                            [ XEM TẤT CẢ ]
                          </button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                           {membersData?.members?.slice(0, 7).map((m) => (
                             <Avatar key={m.userId} className="h-7 w-7 border border-slate-200 dark:border-white/[0.08] shadow-none shrink-0 rounded-[2px]">
                               <AvatarImage src={getAvatarUrl(m.user?.avatar, m.user?.name || '')} className="rounded-[2px]" />
                               <AvatarFallback className="text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-[2px]">
                                 {m.user?.name?.[0].toUpperCase()}
                               </AvatarFallback>
                             </Avatar>
                           ))}
                           {(membersData?.total || 0) > 7 && (
                             <div className="h-7 w-7 rounded-[2px] bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[9px] text-slate-500 dark:text-zinc-450 font-bold">
                               +{((membersData?.total || 0) - 7)}
                             </div>
                           )}
                        </div>
                      </div>

                      <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />

                      {/* Media Preview Section */}
                      <div className="space-y-3 font-mono">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Thư viện ảnh gần đây</h3>
                          <button onClick={() => setActiveTab('files')} className="text-[9px] text-slate-900 dark:text-slate-100 font-bold hover:underline">[ XEM TẤT CẢ ]</button>
                        </div>
                        {loadingMedia ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400 mx-auto" />
                        ) : (mediaData?.media || []).length > 0 ? (
                          <div className="grid grid-cols-4 gap-1.5">
                            {(mediaData?.media || []).filter((m: any) => m.type === 'image').slice(0, 4).map((msg: any) => (
                              <div key={msg.id} className="aspect-square rounded-[2px] overflow-hidden cursor-pointer hover:opacity-85 transition-opacity border border-slate-200 dark:border-white/[0.06]">
                                <img src={getMediaUrl(msg.content || "")} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {(mediaData?.media || []).filter((m: any) => m.type === 'image').length === 0 && (
                              <div className="col-span-4 text-center py-3 bg-slate-50/50 dark:bg-zinc-900/35 border border-dashed border-slate-200/80 dark:border-white/[0.04] rounded-[2px]">
                                <p className="text-[9px] text-slate-400 dark:text-zinc-550 italic">Không có hình ảnh nào</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-[9px] text-slate-400 dark:text-zinc-550 italic bg-slate-50/50 dark:bg-zinc-900/35 border border-dashed border-slate-200/80 dark:border-white/[0.04] rounded-[2px]">Chưa có tệp tin nào được tải lên</p>
                        )}
                      </div>

                      <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />

                      {/* Pinned Messages Preview */}
                      <div className="space-y-3 font-mono">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Tin nhắn đã ghim</p>
                          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:border-white/[0.06] rounded-[2px] font-mono shadow-none">{pinnedData?.pinnedMessages?.length || 0}</Badge>
                        </div>
                        {loadingPinned ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
                        ) : pinnedData?.pinnedMessages?.length ? (
                          <div className="space-y-2">
                            {pinnedData.pinnedMessages.slice(0, 3).map((msg) => (
                              <div key={msg.id} className="p-2 rounded-[2px] bg-slate-50/50 border border-slate-200/80 dark:bg-zinc-900/35 dark:border-white/[0.04] relative group">
                                <div className="flex items-center gap-1.5 mb-1 font-mono">
                                   <Avatar className="h-4 w-4 rounded-[2px]">
                                      <AvatarImage src={getAvatarUrl(msg.sender?.avatar, msg.sender?.name || '')} className="rounded-[2px]" />
                                      <AvatarFallback className="text-[7px] rounded-[2px]">{msg.sender?.name?.[0]}</AvatarFallback>
                                   </Avatar>
                                   <span className="text-[9px] font-bold text-slate-900 dark:text-slate-100 truncate">{msg.sender?.name}</span>
                                   <span className="text-[8px] text-slate-400 dark:text-zinc-550 ml-auto">{msg.time ? format(new Date(msg.time), 'HH:mm') : '--:--'}</span>
                                </div>
                                <div className="text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                  <MessageSnippet 
                                    type={msg.type} 
                                    content={msg.content} 
                                    file={(msg as any).file} 
                                    className="text-[10px] text-slate-650 dark:text-zinc-400 line-clamp-2 leading-relaxed"
                                    iconClassName="h-3 w-3 inline-block align-middle shrink-0 mr-1 text-slate-500"
                                  />
                                </div>
                                <button 
                                  onClick={() => togglePin({ messageId: msg.id, chatId: channelId })}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-[2px]"
                                >
                                  <X size={10} className="text-slate-400" />
                                </button>
                              </div>
                            ))}
                            {pinnedData.pinnedMessages.length > 3 && (
                              <p className="text-[9px] text-slate-900 dark:text-slate-100 font-bold cursor-pointer hover:underline text-center">
                                [ XEM THÊM {pinnedData.pinnedMessages.length - 3} TIN NHẮN ĐÃ GHIM ]
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 rounded-[2px] border border-dashed border-slate-200 dark:border-white/[0.06]">
                            <Pin size={12} className="mx-auto mb-1 text-slate-350 dark:text-zinc-650" />
                            <p className="text-[9px] text-slate-400 dark:text-zinc-550">Chưa có tin nhắn được ghim</p>
                          </div>
                        )}
                      </div>

                      <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />

                      {/* Quick Actions */}
                      <div className="space-y-1.5 font-mono">
                        <button
                          onClick={handleToggleMute}
                          className="w-full flex items-center gap-2.5 p-2 rounded-[2px] border border-slate-200 dark:border-white/[0.04] bg-slate-50/20 hover:bg-slate-50 dark:bg-zinc-900/10 dark:hover:bg-zinc-800 transition-colors text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                        >
                          {isMuted ? <BellOff size={13} className="text-slate-500" /> : <Bell size={13} className="text-slate-500" />}
                          {isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                        </button>
                        <button
                          onClick={handleLeave}
                          className="w-full flex items-center gap-2.5 p-2 rounded-[2px] border border-rose-200 dark:border-red-950/20 bg-rose-50/10 hover:bg-rose-50 dark:bg-red-950/5 dark:hover:bg-red-950/20 transition-colors text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500"
                        >
                          <LogOut size={13} />
                          Rời kênh
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── MEMBERS TAB ── */}
                  {activeTab === 'members' && (
                    <div className="p-3 space-y-3 font-mono">
                      {/* Search existing members */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                        <Input
                          placeholder="Tìm thành viên..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="pl-8 h-8 rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 text-xs font-mono"
                        />
                      </div>

                      {/* Member list */}
                      {loadingMembers ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                      ) : (
                        <div className="space-y-1">
                          {filteredMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-1.5 rounded-[2px] hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.04] group transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-6.5 w-6.5 shrink-0 rounded-[2px]">
                                  <AvatarImage src={getAvatarUrl(member.user?.avatar, member.user?.name || member.userId)} className="rounded-[2px]" />
                                  <AvatarFallback className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-[2px]">
                                    {(member.user?.name || 'U')[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-150 truncate leading-none">{member.user?.name || member.userId}</p>
                                  <p className="text-[8px] text-slate-400 mt-0.5 leading-none uppercase tracking-wide">
                                    {member.role === 'CHANNEL_OWNER' ? '👑 Chủ sở hữu' : member.role === 'CHANNEL_MODERATOR' ? '🛡 Quản trị' : 'Thành viên'}
                                  </p>
                                </div>
                              </div>
                              {isOwnerOrModerator && member.userId !== currentUser?.id && (
                                <button
                                  onClick={() => handleRemoveMember(member.userId, member.user?.name || member.userId)}
                                  className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-[2px] text-rose-500 hover:bg-rose-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-rose-200/40"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add member section (owner/mod only) */}
                      {isOwnerOrModerator && (
                        <>
                          <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Thêm nhân sự mới</p>
                          <div className="relative">
                            <UserPlus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                            <Input
                              placeholder="Tìm người trong Workspace..."
                              value={addSearch}
                              onChange={(e) => setAddSearch(e.target.value)}
                              className="pl-8 h-8 rounded-[2px] border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-zinc-900/50 focus-visible:ring-0 focus-visible:border-slate-800 dark:focus-visible:border-slate-200 text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            {availableToInvite.map((m: any) => (
                              <div key={m.userId} className="flex items-center justify-between p-1.5 rounded-[2px] hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.04]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6.5 w-6.5 shrink-0 rounded-[2px]">
                                    <AvatarImage src={getAvatarUrl(m.user?.avatar, m.user?.name || m.userId)} className="rounded-[2px]" />
                                    <AvatarFallback className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-350 rounded-[2px]">{(m.user?.name || 'U')[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-150 truncate leading-none">{m.user?.name || m.userId}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-[2px] px-2 shadow-none"
                                  onClick={() => handleAddMember(m.userId, m.user?.name || m.userId)}
                                  disabled={addingMember}
                                >
                                  Mời
                                </Button>
                              </div>
                            ))}
                            {addSearch && availableToInvite.length === 0 && (
                              <p className="text-[10px] text-center text-slate-400 py-3 italic">Không tìm thấy nhân sự phù hợp</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── MEDIA TAB ── */}
                  {activeTab === 'files' && (
                    <div className="p-4 space-y-4 font-mono">
                      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide no-scrollbar">
                          {[
                              { value: "all", label: "TẤT CẢ", icon: null },
                              { value: "image", label: "ẢNH", icon: ImageIcon },
                              { value: "video", label: "VIDEO", icon: Video },
                              { value: "file", label: "TÀI LIỆU", icon: FileText },
                          ].map(({ value, label, icon: IconComponent }) => (
                              <Button
                                  key={value}
                                  size="sm"
                                  variant={mediaFilter === value ? "default" : "outline"}
                                  onClick={() => setMediaFilter(value as any)}
                                  className="h-6 px-2 text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 shrink-0 rounded-[2px] shadow-none"
                              >
                                  {IconComponent && <IconComponent className="h-3 w-3" />}
                                  {label}
                              </Button>
                          ))}
                      </div>

                      {loadingMedia ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                      ) : mediaData?.media?.length ? (
                        <div className={`
                            ${mediaFilter === "file" || (mediaFilter === "all" && mediaData.media.every((m: any) => m.type === "file"))
                                ? "space-y-2"
                                : "grid grid-cols-3 gap-1.5"
                            }
                        `}>
                          {mediaData.media.map((msg: any) => renderMediaItem(msg))}
                        </div>
                      ) : (
                        <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-zinc-900/35 rounded-[2px] border border-dashed border-slate-200 dark:border-white/[0.06]">
                          <div className="h-10 w-10 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/[0.08] rounded-[2px] flex items-center justify-center mx-auto mb-3 shadow-none">
                              <Paperclip size={18} className="text-slate-350 dark:text-zinc-550" />
                          </div>
                          <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Thư viện trống</h4>
                          <p className="text-[9px] text-slate-400 dark:text-zinc-550 mt-1 leading-normal">Ảnh, tệp tin và các tài liệu trao đổi trong kênh này sẽ được tự động đồng bộ tại đây.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SETTINGS TAB ── */}
                  {activeTab === 'settings' && (
                    <div className="p-4 space-y-4 font-mono">
                      {isOwnerOrModerator ? (
                        <>
                          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Cấu hình kênh</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6.5 text-[9px] font-bold font-mono uppercase tracking-wider gap-1.5 rounded-[2px] shadow-none"
                              onClick={() => {
                                if (!editMode) {
                                  setEditName(channel?.name || '');
                                  setEditDescription(channel?.description || '');
                                  setEditTopic(channel?.topic || '');
                                }
                                setEditMode(!editMode);
                                setError(null);
                              }}
                            >
                              <Pencil size={11} />
                              {editMode ? 'Hủy' : 'Sửa'}
                            </Button>
                          </div>

                          {editMode ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 block">Tên kênh</label>
                                <Input
                                  ref={editNameRef}
                                  value={editName}
                                  onChange={(e) => {
                                    setEditName(e.target.value);
                                    if (error) setError(null);
                                  }}
                                  className={`h-8 text-xs rounded-[2px] border font-mono transition-colors ${
                                    error 
                                      ? 'border-red-500 focus-visible:border-red-500 dark:border-red-550 dark:focus-visible:border-red-550 focus-visible:ring-0 focus-visible:ring-offset-0' 
                                      : 'border-slate-200 dark:border-white/[0.08]'
                                  }`}
                                  placeholder="tên-kênh"
                                />
                                {error && (
                                  <span className="text-[10px] font-mono font-medium text-red-500 dark:text-red-400 mt-1 block">
                                    {error}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 block">Mô tả</label>
                                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="text-xs resize-none rounded-[2px] border-slate-200 dark:border-white/[0.08]" rows={3} placeholder="Kênh này dùng để..." />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 block">Chủ đề thảo luận</label>
                                <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} className="h-8 text-xs rounded-[2px] border-slate-200 dark:border-white/[0.08]" placeholder="Chủ đề đang thảo luận..." />
                              </div>
                              <Button onClick={handleSaveSettings} disabled={updating} className="w-full h-8 text-[10px] font-bold uppercase tracking-wider rounded-[2px] gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-none border border-transparent active:scale-[0.98] transition-all">
                                {updating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                Lưu thiết lập
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3.5 text-xs">
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Tên định danh</p>
                                <p className="text-slate-850 dark:text-slate-200 font-bold font-mono">#{channel?.name}</p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Mô tả chi tiết</p>
                                <p className="text-slate-600 dark:text-zinc-400 leading-normal">{channel?.description || 'Chưa cấu hình mô tả.'}</p>
                              </div>
                              {channel?.topic && (
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">Chủ đề hiện tại</p>
                                  <p className="text-slate-600 dark:text-zinc-400 leading-normal">{channel.topic}</p>
                                </div>
                              )}
                              <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />
                              <div className="flex items-center justify-between py-1 bg-slate-50/30 dark:bg-zinc-900/10 border border-slate-200/80 dark:border-white/[0.04] p-2.5 rounded-[2px]">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Chế độ Chỉ đọc</p>
                                  <p className="text-[8px] text-slate-400 dark:text-zinc-550 mt-0.5 leading-none">Chỉ Admin mới có quyền phát ngôn</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={channel?.isReadOnly ? "default" : "outline"}
                                  className={`h-6 text-[8px] font-bold uppercase tracking-wider rounded-[2px] shadow-none ${
                                    channel?.isReadOnly 
                                      ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 border-transparent' 
                                      : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                                  }`}
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
                        <div className="text-center py-8 bg-slate-50/50 dark:bg-zinc-900/35 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-[2px]">
                          <Settings size={20} className="mx-auto mb-2 text-slate-350 dark:text-zinc-650 animate-spin" style={{ animationDuration: '6s' }} />
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 px-4 leading-normal">Chỉ Chủ sở hữu kênh hoặc Quản trị viên mới được cấu hình cài đặt kỹ thuật.</p>
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
