"use client";

import React, { useEffect, useState } from 'react';
import { useListChannelsQuery } from '@/src/redux/feature/channelApi';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';
import { useGetUnreadCountQuery } from '@/src/redux/feature/notificationApi';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Hash,
  Lock,
  MessageCircle,
  MoreVertical,
  Plus,
  Settings,
  Star,
  Users,
  Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsPanel from './notifications-panel';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import NewChatModal from './new-chat-modal';
import { GroupCreationModal } from './group-creating-model';
import FriendsPanel from './friends-panel';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { RequirePermission } from '@/src/components/guards';
import { getAvatarUrl } from '@/src/utils/image-utils';


interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number | string;
  active?: boolean;
  status?: 'online' | 'offline' | 'busy';
  starred?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  badge,
  active,
  status,
  starred,
  onClick
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg group transition-all duration-200 ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
      }`}>
    <div className="flex items-center gap-2.5 overflow-hidden">
      <div className="relative flex-shrink-0">
        <span className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}>
          {icon}
        </span>
        {status && (
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${status === 'online' ? 'bg-emerald-500' : status === 'busy' ? 'bg-rose-500' : 'bg-slate-300'
            }`} />
        )}
      </div>
      <span className="truncate text-[14px]">{label}</span>
    </div>
    <div className="flex items-center gap-1.5">
      {starred && <Star size={12} className="fill-amber-400 text-amber-400" />}
      {badge && (typeof badge === 'string' || badge > 0) && (
        <Badge variant="secondary" className="bg-red-500 hover:bg-red-600 text-white font-bold border-0 h-5 px-1.5 text-[10px] min-w-[20px] justify-center shadow-sm">
          {badge}
        </Badge>
      )}
    </div>
  </button>
);

const SectionHeader: React.FC<{ label: string; action?: boolean }> = ({ label, action }) => (
  <div className="flex items-center justify-between px-3 py-2 mt-4">
    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      <ChevronDown size={12} />
      <span>{label}</span>
    </div>
    {action && (
      <button className="text-slate-400 hover:text-slate-600 transition-colors">
        <Plus size={14} />
      </button>
    )}
  </div>
);

export const ModernChannelSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const currentChatId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const currentUser = useSelector((state: any) => state.auth?.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'friends'>('messages');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Workspace State
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const workspaceId = (params.workspaceId as string) || currentWorkspaceId;

  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find(w => w.id === workspaceId);
  // Real-time online users from socket context
  const { onlineUsers, isConnected } = useRealtimeChat();

  const { data: groupChatsData } = useGetChatsQuery({ type: 'group', workspaceId });
  const { data: privatesData, isLoading: chatsLoading } = useGetChatsQuery({ type: 'private', workspaceId });

  const filteredGroups = groupChatsData?.chats?.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDMs = privatesData?.chats?.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-join all socket rooms so we can receive notifications globally
  React.useEffect(() => {
    if (isConnected) {
      groupChatsData?.chats?.forEach(c => socketService.joinChat(c.id));
      privatesData?.chats?.forEach(c => socketService.joinChat(c.id));
    }
  }, [groupChatsData, privatesData, isConnected]);

  // Sidebar refetch is handled automatically by RTK Query when
  // RealtimeChatProvider invalidates the "Chats" tag on new messages.
  // No manual socket listener needed here.


  // Determine online status for a chat's partner
  const getPartnerStatus = (chat: Chat): 'online' | 'offline' => {
    if (!chat?.participants) return 'offline';
    const partner = chat.participants.find((p) => p.accountId !== currentUser?.id);
    if (!partner?.accountId) return 'offline';
    return onlineUsers.has(partner.accountId) ? 'online' : 'offline';
  };

  const { data: notificationsData } = useGetUnreadCountQuery();
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <div className="w-[260px] flex flex-col bg-slate-50/50 border-r border-slate-100 h-screen shrink-0 pb-6">
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
                    onClick={() => {
                      dispatch(setWorkspace(ws.id));
                      router.push(`/chat`);
                    }}
                    className={`rounded-lg py-2 cursor-pointer flex items-center gap-3 ${ws.id === currentWorkspaceId ? 'bg-blue-50 text-blue-700' : ''}`}
                  >
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarImage src={ws.icon ? getAvatarUrl(ws.icon) : undefined} alt={ws.name} />
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-xs rounded-lg">
                        {ws.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
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
              <SheetContent side="left" className="p-0 w-[400px] border-r-0 shadow-2xl animate-in slide-in-from-left duration-300">
                <NotificationsPanel />
              </SheetContent>
            </Sheet>
            <button className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'messages'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <MessageCircle size={14} />
            Tin nhắn
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'friends'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Users size={14} />
            Bạn bè
          </button>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' ? (
          <>
            <div className="p-2">
              <button
                onClick={() => setChannelsExpanded(!channelsExpanded)}
                className="flex items-center gap-1 w-full px-2 py-1 text-sm font-medium text-muted-foreground"
              >
                {channelsExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>Kênh thảo luận</span>
                <span className="ml-auto text-xs">{groupChatsData?.chats?.length || 0}</span>
              </button>
              {channelsExpanded && filteredGroups?.map((chat) => {
                return (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={chat.id === currentChatId}
                    isOnline={false}
                    isTyping={false}
                    typingUserNames={""}
                    onSelectChat={() => router.push(`/chat/${chat.id}`)}
                    isFriend={false}
                  />
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => setShowNewChatModal(true)}
              >
                <Plus className="w-4 h-4" />
                Thêm Kênh
              </Button>
              <WorkspaceGuard allowedRoles={['WORKSPACE_OWNER', 'WORKSPACE_ADMIN']}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  asChild
                >
                  <Link href="/workspace/settings">
                    <Settings className="w-4 h-4" />
                    Quản trị Workspace
                  </Link>
                </Button>
              </WorkspaceGuard>
            </div>

            <div className="p-2 border-t">
              <button
                onClick={() => setDmsExpanded(!dmsExpanded)}
                className="flex items-center gap-1 w-full px-2 py-1 text-sm font-medium text-muted-foreground "
              >
                {dmsExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>Tin nhắn riêng</span>
                <span className="ml-auto text-xs">{privatesData?.chats?.length || 0}</span>
              </button>
              {dmsExpanded && filteredDMs?.map((chat) => {
                return (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isSelected={chat.id === currentChatId}
                    isOnline={getPartnerStatus(chat) === 'online'}
                    isTyping={false}
                    typingUserNames={""}
                    onSelectChat={() => router.push(`/chat/${chat.id}`)}
                    isFriend={true}
                  />
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <Plus className="w-4 h-4" />
                Tin nhắn mới
              </Button>
            </div>
          </>
        ) : (
          /* Friends Tab Content */
          <FriendsPanel
            onlineUsers={onlineUsers}
            onStartChat={(chatId) => {
              setActiveTab('messages');
              router.push(`/chat/${chatId}`);
            }}
          />
        )}
      </div>


      {/* Enterprise Directory Search Modal */}
      <DirectorySearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
      />

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <GroupCreationModal
        open={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={(chatId) => {
          setShowNewChatModal(false);
          // onSelectChat(chatId);
        }}
      />
    </div>
  );
};
