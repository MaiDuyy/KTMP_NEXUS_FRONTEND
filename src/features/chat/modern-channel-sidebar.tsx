"use client";

import React, { useState, useMemo } from 'react';
import {
  useListChannelsQuery,
  useBrowseChannelsQuery,
  useJoinChannelMutation,
  useLeaveChannelMutation,
  useCreateChannelMutation,
  Channel,
} from '@/src/redux/feature/channelApi';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';
import { useGetUnreadCountQuery } from '@/src/redux/feature/notificationApi';
import {
  Bell, ChevronDown, ChevronRight, Hash, Lock, MessageCircle,
  MoreVertical, Plus, Settings, Users, Check, Search, X,
  LogOut, BellOff, Bell as BellOn, Megaphone, Loader2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsPanel from './notifications-panel';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetChatsQuery } from '@/src/redux/feature/chatApi';
import { Chat } from '@/src/type/chat.types';
import { useDispatch, useSelector } from 'react-redux';
import { setWorkspace } from '@/src/redux/feature/workspaceSlice';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRealtimeChat } from '@/src/hooks/useRealtimeChat';
import { socketService } from '@/src/services/socket.service';
import { RootState } from '@/src/redux/store';
import { WorkspaceGuard } from '@/src/components/WorkspaceGuard';
import { DirectorySearchModal } from './DirectorySearchModal';
import { Button } from '@/components/ui/button';
import { ChatItem } from './chat-item';
import FriendsPanel from './friends-panel';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { GroupCreationModal } from './group-creating-model';
import { RequirePermission } from '@/src/components/guards';
import { getAvatarUrl } from '@/src/utils/image-utils';
import { toast } from 'sonner';

// ─── Create Channel Modal (Admin/Owner only) ─────────────────────────────────
interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onCreated: (channelId: string) => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ open, onClose, workspaceId, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE' | 'ANNOUNCEMENT'>('PUBLIC');
  const [createChannel, { isLoading }] = useCreateChannelMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const channel = await createChannel({ workspaceId, name: name.trim(), description, type }).unwrap();
      toast.success(`Đã tạo kênh #${channel.name}`);
      setName('');
      setDescription('');
      onCreated(channel.id);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể tạo kênh');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setName(''); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Tạo kênh mới</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kênh là nơi nhóm thảo luận xung quanh một chủ đề cụ thể.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Loại kênh</label>
            <div className="flex gap-2">
              {(['PUBLIC', 'PRIVATE', 'ANNOUNCEMENT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {t === 'PUBLIC' ? '# Công khai' : t === 'PRIVATE' ? '🔒 Riêng tư' : '📣 Thông báo'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {type === 'PUBLIC' && 'Mọi thành viên workspace có thể tìm thấy và tham gia.'}
              {type === 'PRIVATE' && 'Chỉ người được mời mới thấy và tham gia kênh này.'}
              {type === 'ANNOUNCEMENT' && 'Chỉ Owner mới đăng được. Dùng cho thông báo chính thức.'}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên kênh</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">#</span>
              <Input
                placeholder="ví-dụ-tên-kênh"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="pl-7 h-9 text-sm"
                autoFocus
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả (tùy chọn)</label>
            <Input
              placeholder="Kênh này dùng để..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Hủy</Button>
            <Button type="submit" size="sm" disabled={isLoading || !name.trim()} className="gap-1.5">
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Tạo kênh
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Browse Channels Modal ────────────────────────────────────────────────────
interface BrowseChannelsModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  myChannelIds: Set<string>;
}

const BrowseChannelsModal: React.FC<BrowseChannelsModalProps> = ({
  open, onClose, workspaceId, myChannelIds,
}) => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useBrowseChannelsQuery(
    { workspaceId, search: search || undefined },
    { skip: !workspaceId || !open }
  );
  const [joinChannel, { isLoading: joining }] = useJoinChannelMutation();

  const handleJoin = async (channelId: string, name: string) => {
    try {
      await joinChannel(channelId).unwrap();
      toast.success(`Đã tham gia kênh #${name}`);
      onClose();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Không thể tham gia kênh');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Khám phá kênh</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tìm và tham gia các kênh công khai trong workspace này.
          </DialogDescription>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto max-h-80 space-y-1">
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground py-6">Đang tải...</p>
          )}
          {!isLoading && (!data?.channels || data.channels.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-6">Không tìm thấy kênh nào.</p>
          )}
          {data?.channels?.map((ch: any) => {
            const isMember = ch.isJoined ?? myChannelIds.has(ch.id);
            return (
              <div
                key={ch.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">#{ch.name}</p>
                    {ch.description && (
                      <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">{ch.memberCount ?? ch._count?.members ?? 0} thành viên</p>
                  </div>
                </div>
                {isMember ? (
                  <Badge variant="secondary" className="text-xs shrink-0">Đã tham gia</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 text-xs"
                    onClick={() => handleJoin(ch.id, ch.name)}
                    disabled={joining}
                  >
                    Tham gia
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-center text-muted-foreground pt-1">
          Hiển thị {data?.channels?.length ?? 0} / {data?.total ?? 0} kênh
        </p>
      </DialogContent>
    </Dialog>
  );
};

// ─── Channel Context Row ──────────────────────────────────────────────────────
interface ChannelRowProps {
  channel: Channel & { isMember?: boolean };
  active: boolean;
  unreadCount?: number;
  onNavigate: () => void;
  onLeave: () => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({ channel, active, unreadCount, onNavigate, onLeave }) => {
  const Icon = channel.type === 'PRIVATE' ? Lock : channel.type === 'GUEST' ? Lock : Hash;

  return (
    <div
      className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all text-sm ${
        active ? 'bg-blue-50 text-blue-700 font-semibold' : unreadCount && unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 min-w-0 flex-1"
      >
        <Icon size={14} className={active ? 'text-blue-600' : unreadCount && unreadCount > 0 ? 'text-slate-900' : 'text-slate-400'} />
        <span className="truncate text-[13.5px]">{channel.name}</span>
        {unreadCount && unreadCount > 0 ? (
          <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-slate-200 transition-all">
            <MoreVertical size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 text-sm rounded-xl shadow-xl">
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <BellOff size={14} /> Tắt thông báo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLeave}
            className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
          >
            <LogOut size={14} /> Rời kênh
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ─── Main Sidebar ──────────────────────────────────────────────────────────────
export const ModernChannelSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const currentChatId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const currentUser = useSelector((state: any) => state.auth?.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'friends'>('messages');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const workspaceId = (params.workspaceId as string) || currentWorkspaceId;

  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find((w) => w.id === workspaceId);
  const { onlineUsers, isConnected } = useRealtimeChat();

  // ── Data Fetching ──
  const { data: channelsData = [] } = useListChannelsQuery(
    { workspaceId: workspaceId || '' },
    { skip: !workspaceId }
  );
  const [leaveChannel] = useLeaveChannelMutation();

  const { data: groupChatsData } = useGetChatsQuery({ type: 'group', workspaceId });
  const { data: privatesData } = useGetChatsQuery({ type: 'private', workspaceId });
  const { data: notificationsData } = useGetUnreadCountQuery();
  const unreadCount = notificationsData?.unreadCount || 0;

  // ── Derived Lists ──
  const myChannelIds = useMemo(() => new Set(channelsData.map((c: any) => c.id)), [channelsData]);

  // Only show channels where user IS a member (isMember from API)
  const myChannels = useMemo(() =>
    channelsData.filter((ch: any) => ch.isMember !== false),
    [channelsData]
  );

  const joinedChannelIds = useMemo(() => new Set(myChannels.map((c: any) => c.id)), [myChannels]);

  const filteredChannels = useMemo(() =>
    myChannels.filter((ch: any) => ch.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [myChannels, searchQuery]
  );

  const filteredGroups = useMemo(() =>
    groupChatsData?.chats?.filter((chat: any) =>
      !myChannelIds.has(chat.id) && chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [],
    [groupChatsData, myChannelIds, searchQuery]
  );

  const filteredDMs = useMemo(() =>
    privatesData?.chats?.filter((chat) =>
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [],
    [privatesData, searchQuery]
  );

  // ── Auto-join socket rooms ──
  React.useEffect(() => {
    if (!isConnected) return;
    myChannels.forEach((c: any) => socketService.joinChat(c.id));
    groupChatsData?.chats?.forEach((c) => socketService.joinChat(c.id));
    privatesData?.chats?.forEach((c) => socketService.joinChat(c.id));
  }, [myChannels, groupChatsData, privatesData, isConnected]);

  const getPartnerStatus = (chat: Chat): 'online' | 'offline' => {
    const partner = chat.participants?.find((p) => p.accountId !== currentUser?.id);
    return partner && onlineUsers.has(partner.accountId) ? 'online' : 'offline';
  };

  const handleLeaveChannel = async (channelId: string, name: string) => {
    try {
      await leaveChannel(channelId).unwrap();
      toast.success(`Đã rời kênh #${name}`);
      if (currentChatId === channelId) router.push('/chat');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Không thể rời kênh');
    }
  };

  return (
    <div className="w-[260px] flex flex-col bg-slate-50/50 border-r border-slate-100 h-screen shrink-0 pb-6">
      {/* ── Header ── */}
      <div className="p-4 flex flex-col gap-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500' : 'bg-red-400 animate-pulse'}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-100 px-1.5 py-1 rounded-md transition-all group overflow-hidden">
                  <Avatar className="h-6 w-6 rounded-lg shrink-0">
                    <AvatarImage src={currentWorkspace?.icon ? getAvatarUrl(currentWorkspace.icon) : undefined} alt={currentWorkspace?.name} />
                    <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold rounded-lg">
                      {currentWorkspace?.name?.substring(0, 1).toUpperCase() || 'W'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="font-bold text-slate-900 text-sm truncate">
                    {currentWorkspace?.name || "Chọn Workspace"}
                  </h2>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 rounded-xl shadow-2xl border-slate-200">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chuyển Workspace</div>
                {workspaces?.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => { dispatch(setWorkspace(ws.id)); router.push('/chat'); }}
                    className={`rounded-lg py-2 cursor-pointer flex items-center gap-3 ${ws.id === currentWorkspaceId ? 'bg-blue-50 text-blue-700' : ''}`}
                  >
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarImage src={ws.icon ? getAvatarUrl(ws.icon) : undefined} alt={ws.name} />
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-xs rounded-lg">{ws.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{ws.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{ws.id === currentWorkspaceId ? 'Đang truy cập' : 'Nhấn để chuyển'}</p>
                    </div>
                    {ws.id === currentWorkspaceId && <Check size={16} className="text-blue-600" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-2" />
                <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
                  <DropdownMenuItem className="rounded-lg py-2 cursor-pointer text-blue-600" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={16} className="mr-3" />
                    <span className="font-bold text-sm">Tạo Workspace mới</span>
                  </DropdownMenuItem>
                </RequirePermission>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <button className="h-8 w-8 relative rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all group">
                  <Bell size={18} className="group-hover:text-blue-600 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[400px] border-r-0 shadow-2xl">
                <NotificationsPanel />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'messages' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MessageCircle size={14} /> Tin nhắn
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={14} /> Bạn bè
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' ? (
          <>
            {/* ═══ CHANNELS SECTION (Slack style) ═══ */}
            {workspaceId ? (
              <div className="px-2 pt-3">
                {/* Section header with collapse + add */}
                <div className="flex items-center justify-between px-1 mb-1">
                  <button
                    onClick={() => setChannelsExpanded(!channelsExpanded)}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {channelsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Kênh
                  </button>
                  <div className="flex items-center gap-1">
                    {/* Manage channels — Admin/Owner only */}
                    <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
                      <>
                        <button
                          title="Tạo kênh mới"
                          onClick={() => setShowCreateChannelModal(true)}
                          className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-all"
                        >
                          <Plus size={12} />
                        </button>
                        <Link href="/admin">
                          <button
                            title="Quản lý kênh"
                            className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-all"
                          >
                            <Settings size={12} />
                          </button>
                        </Link>
                      </>
                    </WorkspaceGuard>
                    {/* Browse channels — everyone */}
                    <button
                      title="Khám phá kênh"
                      onClick={() => setShowBrowseModal(true)}
                      className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-all"
                    >
                      <Search size={12} />
                    </button>
                  </div>
                </div>

                {channelsExpanded && (
                  <div className="space-y-0.5">
                    {filteredChannels.length === 0 && (
                      <p className="px-3 py-2 text-xs text-muted-foreground italic">
                        Chưa tham gia kênh nào.{' '}
                        <button
                          onClick={() => setShowBrowseModal(true)}
                          className="text-blue-600 underline hover:no-underline"
                        >
                          Khám phá kênh
                        </button>
                      </p>
                    )}
                    {filteredChannels.map((channel: any) => {
                      const chatObj = groupChatsData?.chats?.find((c: any) => c.id === channel.id);
                      return (
                        <ChannelRow
                          key={channel.id}
                          channel={channel}
                          active={channel.id === currentChatId}
                          unreadCount={chatObj?.unreadCount || 0}
                          onNavigate={() => router.push(`/chat/${channel.id}`)}
                          onLeave={() => handleLeaveChannel(channel.id, channel.name)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* ═══ GROUPS SECTION ═══ */}
            <div className="px-2 pt-4 border-t border-slate-100 mt-3">
              <div className="flex items-center justify-between px-1 mb-1">
                <button
                  onClick={() => setGroupsExpanded(!groupsExpanded)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {groupsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Nhóm chat
                </button>
                <button
                  title="Tạo nhóm chat"
                  onClick={() => setShowGroupModal(true)}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
              {groupsExpanded && (
                <div className="space-y-0.5">
                  {filteredGroups.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground italic">
                      Chưa có nhóm nào.{' '}
                      <button
                        onClick={() => setShowGroupModal(true)}
                        className="text-blue-600 underline hover:no-underline"
                      >
                        Tạo nhóm mới
                      </button>
                    </p>
                  )}
                  {filteredGroups.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isSelected={chat.id === currentChatId}
                      isOnline={false}
                      isTyping={false}
                      typingUserNames=""
                      onSelectChat={() => router.push(`/chat/${chat.id}`)}
                      isFriend={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ═══ DMs SECTION ═══ */}
            <div className="px-2 pt-4 border-t border-slate-100 mt-3">
              <div className="flex items-center justify-between px-1 mb-1">
                <button
                  onClick={() => setDmsExpanded(!dmsExpanded)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {dmsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Tin nhắn trực tiếp
                </button>
                <button
                  title="Tin nhắn mới"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
              {dmsExpanded && (
                <div className="space-y-0.5">
                  {filteredDMs.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isSelected={chat.id === currentChatId}
                      isOnline={getPartnerStatus(chat) === 'online'}
                      isTyping={false}
                      typingUserNames=""
                      onSelectChat={() => router.push(`/chat/${chat.id}`)}
                      isFriend={chat.isFriend ?? true}
                    />
                  ))}
                  {filteredDMs.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground italic">
                      Chưa có tin nhắn.{' '}
                      <button
                        onClick={() => setIsSearchModalOpen(true)}
                        className="text-blue-600 underline hover:no-underline"
                      >
                        Bắt đầu chat
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ═══ Workspace Admin Link ═══ */}
            <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
              <div className="px-2 pt-4 pb-2 border-t border-slate-100 mt-3">
                <Link href="/workspace/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-[12px] text-muted-foreground hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Quản trị Workspace
                  </Button>
                </Link>
              </div>
            </WorkspaceGuard>
          </>
        ) : (
          <FriendsPanel
            onlineUsers={onlineUsers}
            onStartChat={(chatId) => {
              setActiveTab('messages');
              router.push(`/chat/${chatId}`);
            }}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <DirectorySearchModal open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} />
      <CreateWorkspaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <BrowseChannelsModal
        open={showBrowseModal}
        onClose={() => setShowBrowseModal(false)}
        workspaceId={workspaceId || ''}
        myChannelIds={joinedChannelIds}
      />
      <GroupCreationModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onChatCreated={(chatId) => {
          setShowGroupModal(false);
          router.push(`/chat/${chatId}`);
        }}
      />
      <CreateChannelModal
        open={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        workspaceId={workspaceId || ''}
        onCreated={(channelId) => router.push(`/chat/${channelId}`)}
      />
    </div>
  );
};
