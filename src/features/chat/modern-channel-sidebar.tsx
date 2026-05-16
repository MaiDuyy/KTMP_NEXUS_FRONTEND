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
  LogOut, BellOff, Bell as BellOn, Megaphone, Loader2, Globe,
  Shield
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
import { useGetChatsQuery, useGetWorkspaceUnreadCountsQuery } from '@/src/redux/feature/chatApi';
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
      className={`group flex items-center justify-between px-2 py-1 rounded-xl cursor-pointer transition-all duration-200 text-sm ${
        active 
          ? 'bg-blue-600/10 text-blue-700 shadow-sm border border-blue-200/50' 
          : unreadCount && unreadCount > 0 
            ? 'text-slate-900 font-bold' 
            : 'text-slate-600 hover:bg-slate-200/60'
      }`}
    >
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 min-w-0 flex-1 px-0.5"
      >
        <Icon size={14} className={active ? 'text-blue-600' : unreadCount && unreadCount > 0 ? 'text-slate-900' : 'text-slate-400'} />
        <span className={`truncate text-[12.5px] tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>
          {channel.name}
        </span>
        {unreadCount && unreadCount > 0 ? (
          <span className="ml-auto bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm ring-2 ring-white">
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
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');

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
  const { data: unreadCounts } = useGetWorkspaceUnreadCountsQuery();

  const filteredWorkspaces = useMemo(() =>
    workspaces?.filter(ws => ws.name.toLowerCase().includes(workspaceSearchQuery.toLowerCase())) || [],
    [workspaces, workspaceSearchQuery]
  );
  
  const { totalUnread, currentUnread, otherUnread } = useMemo(() => {
    if (!unreadCounts) return { totalUnread: 0, currentUnread: 0, otherUnread: 0 };
    
    const total = Object.values(unreadCounts).reduce((acc, curr) => acc + (curr || 0), 0);
    const current = currentWorkspaceId ? (unreadCounts[currentWorkspaceId] || 0) : (unreadCounts['global'] || 0);
    
    return {
      totalUnread: total,
      currentUnread: current,
      otherUnread: total - current
    };
  }, [unreadCounts, currentWorkspaceId]);

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
      {/* ── Header: Integrated Workspace Identity & Actions ── */}
      <div className="p-2 border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <button className="flex-1 flex items-center gap-2 hover:bg-slate-100/80 p-1.5 rounded-xl transition-all group overflow-hidden border border-transparent hover:border-slate-200">
                <div className="relative shrink-0">
                  <Avatar className="h-7 w-7 rounded-lg shadow-sm border border-slate-200">
                    <AvatarImage src={currentWorkspace?.icon ? getAvatarUrl(currentWorkspace.icon) : undefined} alt={currentWorkspace?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-[9px] font-black rounded-lg">
                      {(currentWorkspace?.name || "Nexus Global").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white dark:border-slate-900 ${isConnected ? 'bg-emerald-500' : 'bg-red-400 animate-pulse'}`} />
                  
                  {/* Current Workspace Unread Badge (Red) */}
                  {currentUnread > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-md animate-in zoom-in duration-300 z-10">
                      {currentUnread > 99 ? '99+' : currentUnread}
                    </div>
                  )}

                  {/* Other Workspaces Activity Indicator (Blue Dot) */}
                  {otherUnread > 0 && (
                    <div className={`absolute ${currentUnread > 0 ? '-top-1.5 -left-1.5' : '-top-1.5 -right-1.5'} h-3 w-3 bg-blue-500 border-2 border-white rounded-full shadow-sm animate-bounce duration-1000`} title="Có tin nhắn ở Workspace khác" />
                  )}
                </div>
                
                <div className="flex flex-col items-start overflow-hidden flex-1">
                  <h2 className="font-bold text-slate-900 text-xs truncate leading-tight w-full text-left">
                    {currentWorkspace?.name || "Nexus Global"}
                  </h2>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">
                      {isConnected ? 'Trực tuyến' : 'Kết nối...'}
                    </span>
                    <ChevronDown size={8} className="text-slate-400 group-hover:text-slate-600 transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>

       

              <DropdownMenuContent align="start" sideOffset={8} className="w-64 p-2 rounded-2xl shadow-2xl border-slate-200/60 backdrop-blur-xl bg-white/95">
  <div className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Không gian làm việc</div>
  
  <div className="px-2 mb-2">
    <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400" />
      <Input
        placeholder="Tìm nhanh..."
        autoFocus
        value={workspaceSearchQuery}
        onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
          e.stopPropagation();
        }}
        className="h-8 pl-8 text-[11px] bg-slate-100/50 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-100 rounded-xl transition-all"
      />
    </div>
  </div>

  <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
    {/* Nexus Global Item */}
    {(!workspaceSearchQuery || "nexus global".includes(workspaceSearchQuery.toLowerCase())) && (() => {
      const globalUnread = unreadCounts?.['global'] || 0;
      const isActive = !currentWorkspaceId;
      return (
        <DropdownMenuItem
          onClick={() => { dispatch(setWorkspace(null)); router.push('/chat'); }}
          className={`rounded-xl py-2.5 cursor-pointer flex items-center gap-3 transition-all ${isActive ? 'bg-blue-50/80 text-blue-700 border border-blue-100' : 'hover:bg-slate-50'}`}
        >
          <div className="relative shrink-0">
            <div className={`h-8 w-8 flex items-center justify-center rounded-lg shadow-sm border border-slate-200 ${isActive ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Globe size={16} strokeWidth={2.5} />
            </div>
            {globalUnread > 0 && (
              <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md animate-in zoom-in duration-300">
                {globalUnread > 99 ? '99+' : globalUnread}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate">Nexus Global</p>
            <p className="text-[9px] text-slate-500 truncate">{isActive ? 'Đang hoạt động' : 'Không gian mặc định'}</p>
          </div>
          {isActive && <Check size={14} className="text-blue-600 shrink-0" />}
        </DropdownMenuItem>
      );
    })()}

    {filteredWorkspaces.map((ws) => {
      const unreadCount = unreadCounts?.[ws.id] || 0;
      const isActive = ws.id === currentWorkspaceId;

      return (
        <DropdownMenuItem
          key={ws.id}
          onClick={() => { dispatch(setWorkspace(ws.id)); router.push('/chat'); }}
          className={`rounded-xl py-2.5 cursor-pointer flex items-center gap-3 transition-all ${isActive ? 'bg-blue-50/80 text-blue-700 border border-blue-100' : 'hover:bg-slate-50'}`}
        >
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8 rounded-lg shadow-sm">
              <AvatarImage src={ws.icon ? getAvatarUrl(ws.icon) : undefined} alt={ws.name} />
              <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg border border-slate-200">
                {ws.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {unreadCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md animate-in zoom-in duration-300">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate">{ws.name}</p>
            <p className="text-[9px] text-slate-500 truncate">{isActive ? 'Đang hoạt động' : 'Nhấn để chuyển'}</p>
          </div>
          
          {isActive && <Check size={14} className="text-blue-600 shrink-0" />}
        </DropdownMenuItem>
      );
    })}

    {filteredWorkspaces.length === 0 && workspaceSearchQuery && (
      <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Globe size={24} className="opacity-20" />
        <p className="text-[10px] font-medium">Không tìm thấy không gian</p>
      </div>
    )}
  </div>
              
              <DropdownMenuSeparator className="my-2 bg-slate-100" />
              
              <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
                <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 group" onClick={() => setIsCreateModalOpen(true)}>
                  <div className="h-8 w-8 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center mr-3 group-hover:border-blue-400 transition-colors">
                    <Plus size={14} />
                  </div>
                  <span className="font-bold text-xs">Thêm không gian mới</span>
                </DropdownMenuItem>
              </RequirePermission>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-0.5 pr-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all">
                  <Search size={14} />
                </Button>
              </SheetTrigger>
              {/* <DirectorySearchModal /> */}
            </Sheet>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all relative">
                  <Bell size={14} />
                  {notificationsData && notificationsData.unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[400px] border-r-0 shadow-2xl">
                <NotificationsPanel />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/50 p-0.5 rounded-xl mx-1">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all ${activeTab === 'messages' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MessageCircle size={12} /> Tin nhắn
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all ${activeTab === 'friends' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={12} /> Bạn bè
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'messages' ? (
          <>
            {/* ═══ CHANNELS SECTION (Slack style) ═══ */}
            {workspaceId ? (
              <div className="px-2 pt-4">
                {/* Section header with collapse + add */}
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <button
                    onClick={() => setChannelsExpanded(!channelsExpanded)}
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.05em] text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    {channelsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Kênh thảo luận
                  </button>
                  <div className="flex items-center gap-1">
                    <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
                      <div className="flex items-center gap-1">
                        <button
                          title="Tạo kênh mới"
                          onClick={() => setShowCreateChannelModal(true)}
                          className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </WorkspaceGuard>
                    <button
                      title="Khám phá kênh"
                      onClick={() => setShowBrowseModal(true)}
                      className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                    >
                      <Search size={13} />
                    </button>
                  </div>
                </div>

                {channelsExpanded && (
                  <div className="space-y-0.5 px-1">
                    {filteredChannels.length === 0 && (
                      <div className="px-3 py-4 text-center rounded-xl bg-slate-100/50 border border-dashed border-slate-200 mx-1">
                        <p className="text-[11px] text-slate-500 font-medium italic">
                          Chưa có kênh nào.
                        </p>
                        <button
                          onClick={() => setShowBrowseModal(true)}
                          className="text-[10px] text-blue-600 font-bold hover:underline mt-1"
                        >
                          Khám phá ngay
                        </button>
                      </div>
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
            <div className="px-2 pt-6">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setGroupsExpanded(!groupsExpanded)}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.05em] text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {groupsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Nhóm riêng tư
                </button>
                <button
                  title="Tạo nhóm chat"
                  onClick={() => setShowGroupModal(true)}
                  className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                >
                  <Plus size={14} />
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

            {/* ═══ Management Links ═══ */}
            <div className="px-2 pt-4 pb-2 border-t border-slate-100 mt-3 space-y-1">
              {/* Workspace Specific Admin */}
              <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
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
              </WorkspaceGuard>

              {/* System Admin (Show in Default Workspace) */}
              {!workspaceId && (
                <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN']} silent>
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-[12px] text-blue-600 bg-blue-50/50 hover:bg-blue-100"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Quản trị Hệ thống
                    </Button>
                  </Link>
                </RequirePermission>
              )}
            </div>
          </>
        ) : (
          <FriendsPanel
            onlineUsers={onlineUsers}
            // workspaceId={workspaceId}
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
