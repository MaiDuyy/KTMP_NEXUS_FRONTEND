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
import { useGetUserWorkspacesQuery, useLeaveWorkspaceMutation } from '@/src/redux/feature/workspaceApi';
import { useGetUnreadCountQuery } from '@/src/redux/feature/notificationApi';
import { useListDepartmentsQuery } from '@/src/redux/feature/departmentApi';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Hash,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Settings,
  Users,
  Search,
  X,
  LogOut,
  BellOff,
  Megaphone,
  Loader2,
  Globe,
  Shield,
  Layers,
  Building2,
  SquarePen,
  Check,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsPanel from './notifications-panel';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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

// ─── Create Channel Modal ─────────────────────────────────────────────────────
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

  const CHANNEL_TYPES = [
    { value: 'PUBLIC' as const, label: 'Công khai', icon: <Hash size={13} /> },
    { value: 'PRIVATE' as const, label: 'Riêng tư', icon: <Lock size={13} /> },
    { value: 'ANNOUNCEMENT' as const, label: 'Thông báo', icon: <Megaphone size={13} /> },
  ];

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
      <DialogContent className="max-w-md rounded-[6px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Tạo kênh mới</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kênh là nơi nhóm thảo luận xung quanh một chủ đề cụ thể.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel type selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Loại kênh</label>
            <div className="flex gap-1.5">
              {CHANNEL_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[4px] border text-xs font-semibold transition-all duration-150
                    ${type === t.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }
                  `}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {type === 'PUBLIC' && 'Mọi thành viên workspace có thể tìm thấy và tham gia.'}
              {type === 'PRIVATE' && 'Chỉ người được mời mới thấy và tham gia kênh này.'}
              {type === 'ANNOUNCEMENT' && 'Chỉ Owner mới đăng được. Dùng cho thông báo chính thức.'}
            </p>
          </div>

          {/* Channel name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tên kênh</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">#</span>
              <Input
                placeholder="ví-dụ-tên-kênh"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="pl-7 h-8 text-sm rounded-[4px]"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả (tùy chọn)</label>
            <Input
              placeholder="Kênh này dùng để..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-sm rounded-[4px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 text-xs rounded-[4px]">Hủy</Button>
            <Button type="submit" size="sm" disabled={isLoading || !name.trim()} className="h-8 text-xs gap-1.5 rounded-[4px]">
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

const BrowseChannelsModal: React.FC<BrowseChannelsModalProps> = ({ open, onClose, workspaceId, myChannelIds }) => {
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
      <DialogContent className="max-w-lg rounded-[6px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Khám phá kênh</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tìm và tham gia các kênh công khai trong workspace này.
          </DialogDescription>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kênh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm rounded-[4px]"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-72 space-y-0.5">
          {isLoading && <p className="text-center text-xs text-muted-foreground py-6">Đang tải...</p>}
          {!isLoading && (!data?.channels || data.channels.length === 0) && (
            <p className="text-center text-xs text-muted-foreground py-6">Không tìm thấy kênh nào.</p>
          )}
          {data?.channels?.map((ch: any) => {
            const isMember = ch.isJoined ?? myChannelIds.has(ch.id);
            return (
              <div key={ch.id} className="flex items-center justify-between gap-3 p-2 rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-[4px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">#{ch.name}</p>
                    {ch.description && <p className="text-[11px] text-muted-foreground truncate">{ch.description}</p>}
                    <p className="text-[10px] text-muted-foreground">{ch.memberCount ?? ch._count?.members ?? 0} thành viên</p>
                  </div>
                </div>
                {isMember ? (
                  <Badge variant="secondary" className="text-[10px] shrink-0 rounded-[4px]">Đã tham gia</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-6 text-[11px] rounded-[4px] px-2"
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
        <p className="text-[10px] text-center text-muted-foreground pt-1">
          Hiển thị {data?.channels?.length ?? 0} / {data?.total ?? 0} kênh
        </p>
      </DialogContent>
    </Dialog>
  );
};

// ─── Channel Row ──────────────────────────────────────────────────────────────
interface ChannelRowProps {
  channel: Channel & { isMember?: boolean };
  active: boolean;
  unreadCount?: number;
  onNavigate: () => void;
  onLeave: () => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({ channel, active, unreadCount, onNavigate, onLeave }) => {
  const hasUnread = unreadCount && unreadCount > 0;
  const ChannelIcon = channel.type === 'PRIVATE' ? Lock : channel.type === 'ANNOUNCEMENT' ? Megaphone : Hash;

  return (
    <div
      className={`
        group flex items-center justify-between px-1.5 py-[5px] rounded-[4px] cursor-pointer
        transition-colors duration-100 text-xs select-none
        ${active
          ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300'
          : hasUnread
            ? 'text-slate-900 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
        }
      `}
    >
      <button onClick={onNavigate} className="flex items-center gap-2 min-w-0 flex-1">
        <ChannelIcon
          size={14}
          strokeWidth={1.5}
          className={`shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : hasUnread ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}
        />
        <span className={`truncate ${active || hasUnread ? 'font-semibold' : 'font-normal'}`}>
          {channel.name}
        </span>
        {hasUnread && (
          <span className="ml-auto bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-[4px] hover:bg-slate-300/60 dark:hover:bg-slate-700 transition-all cursor-pointer ml-0.5 shrink-0">
            <MoreHorizontal size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 text-xs rounded-[6px] shadow-xl p-1">
          <DropdownMenuItem className="gap-2 cursor-pointer rounded-[4px] text-xs">
            <BellOff size={13} /> Tắt thông báo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLeave} className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer rounded-[4px] text-xs">
            <LogOut size={13} /> Rời kênh
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ─── Section Header ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ label, expanded, onToggle, count, actions }) => (
  <div className="flex items-center gap-0.5 px-1 mb-0.5 h-6">
    <button
      onClick={onToggle}
      className="flex items-center gap-1 flex-1 min-w-0 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
    >
      <span className="w-3 h-3 flex items-center justify-center shrink-0">
        {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </span>
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600 shrink-0">({count})</span>
      )}
    </button>
    {actions}
  </div>
);

// ─── Icon Button ──────────────────────────────────────────────────────────────
interface IconBtnProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

const IconBtn: React.FC<IconBtnProps> = ({ icon, label, onClick, variant = 'default' }) => (
  <button
    onClick={onClick}
    title={label}
    className={`
      h-5 w-5 flex items-center justify-center rounded-[4px] transition-colors duration-100 shrink-0 cursor-pointer
      ${variant === 'primary'
        ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950'
        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
      }
    `}
  >
    {icon}
  </button>
);

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export const ModernChannelSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const currentChatId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const currentUser = useSelector((state: any) => state.auth?.user);

  // ── State ──
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
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isOwnerWarningOpen, setIsOwnerWarningOpen] = useState(false);
  const [leaveWorkspace, { isLoading: isLeavingWorkspace }] = useLeaveWorkspaceMutation();

  const handleLeaveWorkspaceClick = () => {
    if (currentWorkspace?.myRole === 'WORKSPACE_OWNER') {
      setIsOwnerWarningOpen(true);
    } else {
      setIsLeaveConfirmOpen(true);
    }
  };

  const handleLeaveWorkspaceConfirm = async () => {
    if (!workspaceId) return;
    try {
      await leaveWorkspace(workspaceId).unwrap();
      toast.success('Đã rời khỏi workspace thành công');
      setIsLeaveConfirmOpen(false);
      dispatch(setWorkspace(null));
      router.push('/chat');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể rời workspace');
    }
  };

  // ── Selectors ──
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const workspaceId = (params.workspaceId as string) || currentWorkspaceId;

  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find((w) => w.id === workspaceId);
  const { data: departments } = useListDepartmentsQuery();
  const currentDepartment = departments?.find((d) => d.id === currentWorkspace?.departmentId);
  const { onlineUsers, isConnected } = useRealtimeChat();

  // ── Data Fetching ──
  const { data: channelsData = [] } = useListChannelsQuery(
    { workspaceId: workspaceId || '' },
    { skip: !workspaceId }
  );
  const [leaveChannel] = useLeaveChannelMutation();
  const { data: unreadCounts } = useGetWorkspaceUnreadCountsQuery();

  const { data: groupChatsData } = useGetChatsQuery({ type: 'group', workspaceId });
  const { data: privatesData } = useGetChatsQuery({ type: 'private', workspaceId });
  const { data: notificationsData } = useGetUnreadCountQuery();

  // ── Derived Lists ──
  const myChannelIds = useMemo(() => new Set(channelsData.map((c: any) => c.id)), [channelsData]);

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

  // ── Workspace display name ──
  const wsDisplayName = currentWorkspace?.name || 'Nexus Global';

  return (
    <div className="w-[240px] flex flex-col bg-[#F8F8F8] dark:bg-[#19191B] border-r border-slate-200/80 dark:border-white/[0.06] h-screen shrink-0">

      {/* ══ HEADER: Workspace identity ══ */}
      <div className="shrink-0 border-b border-slate-200/80 dark:border-white/[0.06] bg-[#F8F8F8] dark:bg-[#19191B]">
        {/* Workspace name + dropdown */}
        <div className="flex items-center justify-between px-3 h-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 min-w-0 flex-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 px-1.5 py-1 rounded-[4px] transition-colors cursor-pointer group">
                {/* Workspace avatar */}
                <Avatar className="h-6 w-6 rounded-[4px] shrink-0 border border-slate-200/50 dark:border-white/[0.08]">
                  <AvatarImage
                    className="rounded-[4px]"
                    src={currentWorkspace?.icon ? getAvatarUrl(currentWorkspace.icon) : undefined}
                    alt={wsDisplayName}
                  />
                  <AvatarFallback className="bg-blue-600 text-white text-[9px] font-bold rounded-[4px]">
                    {wsDisplayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name & Department label stack */}
                <div className="flex flex-col items-start min-w-0 flex-1 select-none text-left">
                  <span className="font-bold text-[13px] leading-snug text-slate-900 dark:text-slate-100 truncate w-full">
                    {wsDisplayName}
                  </span>
                  {currentDepartment ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 rounded-[3px] border border-blue-100 dark:border-blue-900/30 mt-0.5 truncate max-w-full">
                      <Building2 size={9} strokeWidth={2} />
                      {currentDepartment.name}
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      Workspace chung
                    </span>
                  )}
                </div>
                <ChevronDown size={13} className="text-slate-400 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors ml-0.5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={4}
              className="w-52 p-1.5 rounded-[6px] shadow-2xl border-slate-200 dark:border-slate-800"
            >
              <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 truncate">{wsDisplayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className="text-[10px] text-slate-500">{isConnected ? 'Đang kết nối' : 'Đang kết nối lại...'}</span>
                </div>
              </div>

              {workspaceId && (
                <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
                  <DropdownMenuItem
                    onClick={() => router.push('/workspace/settings')}
                    className="rounded-[4px] py-1.5 cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <Settings size={13} className="text-slate-400" />
                    Cài đặt Workspace
                  </DropdownMenuItem>
                </WorkspaceGuard>
              )}

              <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
                <DropdownMenuItem
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-[4px] py-1.5 cursor-pointer flex items-center gap-2 text-xs text-blue-600"
                >
                  <Plus size={13} /> Thêm không gian mới
                </DropdownMenuItem>
              </RequirePermission>

              {workspaceId && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleLeaveWorkspaceClick}
                    className="rounded-[4px] py-1.5 cursor-pointer flex items-center gap-2 text-xs text-rose-600 focus:text-rose-600"
                  >
                    <LogOut size={13} /> Rời Workspace
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick action buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="relative h-7 w-7 flex items-center justify-center rounded-[4px] text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                  aria-label="Thông báo"
                >
                  <Bell size={15} strokeWidth={1.5} />
                  {notificationsData && notificationsData.unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[400px] border-r-0 shadow-2xl">
                <NotificationsPanel />
              </SheetContent>
            </Sheet>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-[4px] text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              aria-label="Tin nhắn mới"
            >
              <SquarePen size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-2 pb-2 gap-1">
          {[
            { id: 'messages', label: 'Tin nhắn', icon: <MessageCircle size={13} /> },
            { id: 'friends', label: 'Bạn bè', icon: <Users size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'messages' | 'friends')}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold rounded-[4px] transition-colors duration-150 cursor-pointer
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar — only in messages tab */}
        {activeTab === 'messages' && (
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-7 pr-7 text-[12px] bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-[4px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ BODY: Scrollable ══ */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none' }}>
        {activeTab === 'messages' ? (
          <div className="py-2">

            {/* ── CHANNELS ── */}
            {workspaceId && (
              <div className="mb-1">
                <div className="px-2">
                  <SectionHeader
                    label="Kênh"
                    expanded={channelsExpanded}
                    onToggle={() => setChannelsExpanded(!channelsExpanded)}
                    count={filteredChannels.length}
                    actions={
                      <div className="flex items-center gap-0.5">
                        <IconBtn icon={<Search size={12} />} label="Khám phá kênh" onClick={() => setShowBrowseModal(true)} />
                        <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
                          <IconBtn icon={<Plus size={12} />} label="Tạo kênh" onClick={() => setShowCreateChannelModal(true)} variant="primary" />
                        </WorkspaceGuard>
                      </div>
                    }
                  />
                  {channelsExpanded && (
                    <div className="space-y-px">
                      {filteredChannels.length === 0 ? (
                        <div className="px-2 py-3 text-center">
                          <p className="text-[11px] text-slate-400 italic">Chưa có kênh nào.</p>
                          <button
                            onClick={() => setShowBrowseModal(true)}
                            className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 cursor-pointer"
                          >
                            Khám phá ngay →
                          </button>
                        </div>
                      ) : (
                        filteredChannels.map((channel: any) => {
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
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="mx-2 my-2 h-px bg-slate-200/80 dark:bg-white/[0.06]" />

            {/* ── GROUPS ── */}
            <div className="mb-1">
              <div className="px-2">
                <SectionHeader
                  label="Nhóm"
                  expanded={groupsExpanded}
                  onToggle={() => setGroupsExpanded(!groupsExpanded)}
                  count={filteredGroups.length}
                  actions={
                    <IconBtn icon={<Plus size={12} />} label="Tạo nhóm" onClick={() => setShowGroupModal(true)} variant="primary" />
                  }
                />
                {groupsExpanded && (
                  <div className="space-y-px">
                    {filteredGroups.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] text-slate-400 italic">
                        Chưa có nhóm.{' '}
                        <button onClick={() => setShowGroupModal(true)} className="text-blue-600 font-semibold hover:underline cursor-pointer">
                          Tạo mới
                        </button>
                      </p>
                    ) : (
                      filteredGroups.map((chat) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-2 my-2 h-px bg-slate-200/80 dark:bg-white/[0.06]" />

            {/* ── DIRECT MESSAGES ── */}
            <div className="mb-1">
              <div className="px-2">
                <SectionHeader
                  label="Tin nhắn trực tiếp"
                  expanded={dmsExpanded}
                  onToggle={() => setDmsExpanded(!dmsExpanded)}
                  count={filteredDMs.length}
                  actions={
                    <IconBtn icon={<Plus size={12} />} label="Tin nhắn mới" onClick={() => setIsSearchModalOpen(true)} variant="primary" />
                  }
                />
                {dmsExpanded && (
                  <div className="space-y-px">
                    {filteredDMs.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] text-slate-400 italic">
                        Chưa có tin nhắn.{' '}
                        <button onClick={() => setIsSearchModalOpen(true)} className="text-blue-600 font-semibold hover:underline cursor-pointer">
                          Bắt đầu chat
                        </button>
                      </p>
                    ) : (
                      filteredDMs.map((chat) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Admin Links ── */}
            <div className="mx-2 my-2 h-px bg-slate-200/80 dark:bg-white/[0.06]" />
            <div className="px-2 pb-2 space-y-px">
              <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
                <Link href="/workspace/settings">
                  <button className="w-full flex items-center gap-2 px-2 py-[5px] text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100 rounded-[4px] transition-colors cursor-pointer">
                    <Settings size={13} strokeWidth={1.5} />
                    Quản trị Workspace
                  </button>
                </Link>
              </WorkspaceGuard>

              {!workspaceId && (
                <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN']} silent>
                  <Link href="/admin">
                    <button className="w-full flex items-center gap-2 px-2 py-[5px] text-xs text-blue-600 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 rounded-[4px] transition-colors cursor-pointer">
                      <Shield size={13} strokeWidth={1.5} />
                      Quản trị Hệ thống
                    </button>
                  </Link>
                </RequirePermission>
              )}
            </div>
          </div>
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

      {/* ══ MODALS ══ */}
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

      {/* Owner Warning Dialog */}
      <Dialog open={isOwnerWarningOpen} onOpenChange={setIsOwnerWarningOpen}>
        <DialogContent className="max-w-sm rounded-[6px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Không thể rời Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Bạn là <strong>Chủ sở hữu</strong> của <strong>{currentWorkspace?.name}</strong>.
              Vui lòng chuyển nhượng quyền sở hữu trước khi rời.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsOwnerWarningOpen(false)} className="h-7 text-xs rounded-[4px]">
              Đóng
            </Button>
            <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER']}>
              <Link href="/workspace/settings?tab=members">
                <Button size="sm" onClick={() => setIsOwnerWarningOpen(false)} className="h-7 text-xs rounded-[4px]">
                  Chuyển nhượng ngay
                </Button>
              </Link>
            </WorkspaceGuard>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Dialog */}
      <Dialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <DialogContent className="max-w-sm rounded-[6px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Rời khỏi Workspace?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Bạn sẽ không thể xem lại tin nhắn và tài nguyên trừ khi được mời lại.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={isLeavingWorkspace} onClick={() => setIsLeaveConfirmOpen(false)} className="h-7 text-xs rounded-[4px]">
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isLeavingWorkspace}
              onClick={handleLeaveWorkspaceConfirm}
              className="h-7 text-xs rounded-[4px] gap-1.5"
            >
              {isLeavingWorkspace ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
              Xác nhận rời đi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
