"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  useGetAccountDetailsQuery,
  useUpdateOnlineStatusMutation,
} from '@/src/redux/feature/accountApi';
import { useGetWorkspaceUnreadCountsQuery } from '@/src/redux/feature/chatApi';
import { useLogoutMutation } from '@/src/redux/feature/authApi';
import { performFullLogout } from '@/src/utils/auth-utils';
import { toast } from 'sonner';
import {
  MessageCircle,
  Library,
  LayoutGrid,
  Settings,
  Moon,
  Sun,
  Shield,
  Sparkles,
  Globe,
  Archive,
  LogOut,
  BookOpen,
  Circle,
  Clock,
  BellOff,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { setWorkspace } from '@/src/redux/feature/workspaceSlice';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';
import { useListDepartmentsQuery } from '@/src/redux/feature/departmentApi';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { DissolvedWorkspacesModal } from './DissolvedWorkspacesModal';
import { getAvatarUrl } from '@/src/utils/image-utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserStatus = 'online' | 'away' | 'dnd';

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; pulse: boolean }> = {
  online: { label: 'Đang hoạt động', color: 'bg-emerald-500', pulse: true },
  away: { label: 'Vắng mặt', color: 'bg-amber-400', pulse: false },
  dnd: { label: 'Không làm phiền', color: 'bg-red-500', pulse: false },
};

// ─── Minimal Rail Button ──────────────────────────────────────────────────────
interface RailBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

const RailBtn: React.FC<RailBtnProps> = ({ icon, label, active, href, onClick, badge }) => {
  const btn = (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center w-9 h-9 rounded-[4px]
        transition-all duration-150 cursor-pointer
        ${active
          ? 'bg-white/20 text-white shadow-inner'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
        }
      `}
      aria-label={label}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
      )}

      <span className="flex items-center justify-center w-5 h-5">{icon}</span>

      {/* Unread badge */}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 border-2 border-[#1A1D21] rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {href ? <Link href={href}>{btn}</Link> : btn}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="text-xs font-semibold bg-slate-900 text-white border-slate-700 rounded-[4px] py-1 px-2"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Workspace Icon ────────────────────────────────────────────────────────────
interface WsIconProps {
  name: string;
  icon?: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
  departmentName?: string;
}

const WsIcon: React.FC<WsIconProps> = ({ name, icon, active, badge, onClick, departmentName }) => {
  const initials = name.substring(0, 2).toUpperCase();
  const imageUrl = icon ? getAvatarUrl(icon) : undefined;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="relative flex items-center justify-center cursor-pointer group"
            aria-label={name}
          >
            {/* Active pill indicator */}
            <span
              className={`
                absolute -left-[13px] w-1 rounded-r-full bg-white transition-all duration-150
                ${active ? 'h-5' : 'h-0 group-hover:h-3'}
              `}
            />
            <div
              className={`
                w-9 h-9 rounded-[8px] flex items-center justify-center text-xs font-bold
                overflow-hidden transition-all duration-150
                ${active
                  ? 'rounded-[12px] ring-2 ring-white/80 ring-offset-2 ring-offset-[#1A1D21]'
                  : 'hover:rounded-[12px]'
                }
                ${imageUrl ? '' : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'}
              `}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 border-2 border-[#1A1D21] rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="text-xs bg-slate-900 text-white border border-slate-700 rounded-[4px] py-1 px-2 flex flex-col gap-0.5"
        >
          <span className="font-semibold">{name}</span>
          {departmentName ? (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              🏢 {departmentName}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              🏢 Workspace chung
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot: React.FC<{ status: UserStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="relative flex items-center justify-center">
      <span className={`w-3 h-3 rounded-full border-2 border-[#1A1D21] ${cfg.color} relative z-10`} />
      {cfg.pulse && (
        <span
          className={`absolute w-3 h-3 rounded-full ${cfg.color} opacity-60 animate-ping`}
          style={{ animationDuration: '2s' }}
        />
      )}
    </span>
  );
};

// ─── Department Folder (Flyout Workspace Cluster) ────────────────────────────
interface DeptFolderProps {
  name: string;
  workspaces: any[];
  activeWorkspaceId?: string | null;
  unreadCounts?: Record<string, number>;
  onSelectWorkspace: (id: string) => void;
}

const DeptFolder: React.FC<DeptFolderProps> = ({
  name,
  workspaces,
  activeWorkspaceId,
  unreadCounts,
  onSelectWorkspace,
}) => {
  const isFolderActive = workspaces.some((ws) => ws.id === activeWorkspaceId);
  const totalUnread = workspaces.reduce((acc, ws) => acc + (unreadCounts?.[ws.id] || 0), 0);
  const folderInitials = name.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className="relative flex items-center justify-center cursor-pointer group"
                aria-label={`Phòng ban ${name}`}
              >
                {/* Active indicator bar */}
                <span
                  className={`
                    absolute -left-[13px] w-1 rounded-r-full bg-white transition-all duration-150
                    ${isFolderActive ? 'h-5' : 'h-0 group-hover:h-3'}
                  `}
                />
                
                {/* Folder Icon Container */}
                <div
                  className={`
                    w-9 h-9 rounded-[8px] flex flex-col items-center justify-center text-[10px] font-extrabold
                    transition-all duration-155 relative border select-none
                    ${isFolderActive
                      ? 'rounded-[12px] ring-2 ring-white/80 ring-offset-2 ring-offset-[#1A1D21] bg-gradient-to-br from-blue-600 to-blue-800 border-white/20 text-white'
                      : 'hover:rounded-[12px] bg-slate-800/80 hover:bg-slate-700/80 border-white/5 text-slate-300 hover:text-white'
                    }
                  `}
                >
                  <span>{folderInitials}</span>
                  <span className="text-[7px] uppercase tracking-tighter opacity-70 mt-0.5">Phòng</span>
                </div>

                {/* Cumulative unread badge */}
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 border-2 border-[#1A1D21] rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          
          <TooltipContent
            side="right"
            className="text-xs font-semibold bg-slate-900 text-white border-slate-700 rounded-[4px] py-1 px-2"
          >
            {`Phòng ban: ${name}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        side="right"
        align="start"
        className="w-56 p-1.5 rounded-[6px] shadow-2xl bg-[#1A1D21] border border-white/10 text-slate-200 ml-2"
      >
        <DropdownMenuLabel className="text-[10px] text-slate-500 uppercase tracking-widest px-2.5 py-1">
          {name} ({workspaces.length} Workspace)
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-white/10 my-1" />
        
        <div className="space-y-0.5 max-h-60 overflow-y-auto no-scrollbar">
          {workspaces.map((ws) => {
            const isWsActive = ws.id === activeWorkspaceId;
            const wsBadge = unreadCounts?.[ws.id] || 0;
            const wsInitials = ws.name.substring(0, 2).toUpperCase();
            const wsImageUrl = ws.icon ? getAvatarUrl(ws.icon) : undefined;
            
            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`
                  flex items-center gap-2.5 rounded-[4px] py-1.5 px-2 cursor-pointer transition-colors text-xs
                  ${isWsActive 
                    ? 'bg-white/15 text-white font-bold' 
                    : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }
                `}
              >
                {/* Ws Avatar */}
                <Avatar className="h-5 w-5 rounded-[4px] shrink-0 border border-white/10">
                  <AvatarImage className="rounded-[4px] object-cover" src={wsImageUrl} />
                  <AvatarFallback className="bg-blue-600 text-white text-[8px] font-bold rounded-[4px]">
                    {wsInitials}
                  </AvatarFallback>
                </Avatar>
                
                <span className="truncate flex-1">{ws.name}</span>
                
                {wsBadge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
                    {wsBadge > 99 ? '99+' : wsBadge}
                  </span>
                )}
                {isWsActive && <span className="text-blue-400 font-bold ml-1">✓</span>}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ModernSidebarRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const dispatch = useDispatch();

  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();
  const { data: departments } = useListDepartmentsQuery();
  const { data: unreadCounts } = useGetWorkspaceUnreadCountsQuery();
  const { data: accountData } = useGetAccountDetailsQuery();
  const user = accountData?.user;

  // Group workspaces by department for folder rail view
  const groupedByDept = useMemo(() => {
    const standalone: typeof workspaces = [];
    const depts: Record<string, { id: string; name: string; workspaces: any[] }> = {};

    if (!workspaces) return { depts, standalone };

    workspaces.forEach((ws) => {
      if (ws.departmentId && departments) {
        const deptObj = departments.find((d) => d.id === ws.departmentId);
        if (deptObj) {
          if (!depts[ws.departmentId]) {
            depts[ws.departmentId] = {
              id: deptObj.id,
              name: deptObj.name,
              workspaces: [],
            };
          }
          depts[ws.departmentId].workspaces.push(ws);
        } else {
          standalone.push(ws);
        }
      } else {
        standalone.push(ws);
      }
    });

    return { depts, standalone };
  }, [workspaces, departments]);

  const [mounted, setMounted] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>('online');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDissolvedModalOpen, setIsDissolvedModalOpen] = useState(false);

  const [logout] = useLogoutMutation();
  const [updateOnlineStatus] = useUpdateOnlineStatusMutation();

  const handleLogout = async () => {
    try {
      await updateOnlineStatus({ isOnline: false });
      await logout({}).unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      toast.success('Đã đăng xuất!');
      performFullLogout(dispatch);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  const imageUrl = getAvatarUrl(user?.avatar, user?.name);

  return (
    <div className="w-[60px] flex flex-col items-center py-3 gap-1 bg-[#1A1D21] border-r border-white/[0.06] h-screen shrink-0 relative z-20">

      {/* ── Workspace Section ── */}
      <div className="flex flex-col items-center gap-2 w-full px-[10px] overflow-y-auto no-scrollbar max-h-[50%]">
        {/* Global / Nexus */}
        <WsIcon
          name="Nexus Global"
          active={!currentWorkspaceId}
          badge={unreadCounts?.['global']}
          onClick={() => { dispatch(setWorkspace(null)); router.push('/chat'); }}
          icon={undefined}
        />

        {/* Divider */}
        <div className="w-7 h-px bg-white/10 my-0.5" />

        {/* Standalone Workspaces */}
        {groupedByDept.standalone.map((ws) => (
          <WsIcon
            key={ws.id}
            name={ws.name}
            icon={ws.icon}
            active={currentWorkspaceId === ws.id}
            badge={unreadCounts?.[ws.id]}
            onClick={() => { dispatch(setWorkspace(ws.id)); router.push('/chat'); }}
          />
        ))}

        {/* Department Folders */}
        {Object.values(groupedByDept.depts).map((dept: any) => (
          <DeptFolder
            key={dept.id}
            name={dept.name}
            workspaces={dept.workspaces}
            activeWorkspaceId={currentWorkspaceId}
            unreadCounts={unreadCounts}
            onSelectWorkspace={(id) => {
              dispatch(setWorkspace(id));
              router.push('/chat');
            }}
          />
        ))}

        {/* Admin tools */}
        {currentWorkspaceId && (
          <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-px bg-white/10 my-0.5" />
              <RailBtn
                label="Quản trị Workspace"
                icon={<Shield size={18} />}
                active={pathname.startsWith('/workspace/settings')}
                onClick={() => router.push('/workspace/settings')}
              />
              <RailBtn
                label="Kho lưu trữ"
                icon={<Archive size={18} />}
                onClick={() => setIsDissolvedModalOpen(true)}
              />
            </div>
          </RequirePermission>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="w-7 h-px bg-white/10 my-1" />

      {/* ── Main Navigation ── */}
      <nav className="flex flex-col items-center gap-1 w-full px-[10px] flex-1">
        <RailBtn
          href="/dashboard"
          icon={<LayoutGrid size={18} />}
          label="Bảng điều khiển"
          active={pathname === '/dashboard' || pathname === '/'}
        />
        <RailBtn
          href="/chat"
          icon={<MessageCircle size={18} />}
          label="Tin nhắn"
          active={pathname?.startsWith('/chat')}
        />
        <RailBtn
          href="/ai"
          icon={<Sparkles size={18} />}
          label="Trợ lý AI"
          active={pathname?.startsWith('/ai')}
        />
        <RailBtn
          href="/knowledge"
          icon={<Library size={18} />}
          label="Kiến thức"
          active={pathname?.startsWith('/knowledge')}
        />
        <RailBtn
          href="/wiki"
          icon={<BookOpen size={18} />}
          label="Wiki"
          active={pathname?.startsWith('/wiki')}
        />
      </nav>

      {/* ── Bottom Actions ── */}
      <div className="flex flex-col items-center gap-2 w-full px-[10px] mt-auto">
        {/* Theme toggle */}
        {mounted && (
          <RailBtn
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          />
        )}

        {/* User Avatar + Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative mt-1 cursor-pointer group" aria-label="Tài khoản của tôi">
              <Avatar className="h-9 w-9 rounded-[8px] border border-white/10 transition-all duration-150 hover:rounded-[12px] group-hover:border-white/25">
                <AvatarImage src={imageUrl} className="object-cover" />
                <AvatarFallback className="bg-blue-700 text-white text-xs font-bold rounded-[8px]">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Status dot overlay */}
              <span className="absolute -bottom-0.5 -right-0.5">
                <StatusDot status={userStatus} />
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="end"
            className="w-52 p-1.5 rounded-[6px] shadow-2xl bg-[#1A1D21] border border-white/10 text-slate-200 ml-2"
          >
            {/* User info */}
            <div className="px-2.5 py-2.5 border-b border-white/10 mb-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusDot status={userStatus} />
                <span className="text-[11px] text-slate-400">{STATUS_CONFIG[userStatus].label}</span>
              </div>
            </div>

            {/* Status options */}
            <DropdownMenuLabel className="text-[10px] text-slate-500 uppercase tracking-widest px-2.5 py-1">
              Trạng thái
            </DropdownMenuLabel>
            {(['online', 'away', 'dnd'] as UserStatus[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setUserStatus(s)}
                className="flex items-center gap-2.5 rounded-[4px] py-1.5 px-2.5 cursor-pointer hover:bg-white/10 text-slate-300"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[s].color}`} />
                <span className="text-xs font-medium">{STATUS_CONFIG[s].label}</span>
                {userStatus === s && <span className="ml-auto text-blue-400 text-[10px] font-bold">✓</span>}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-white/10 my-1" />

            {/* Settings */}
            <DropdownMenuItem asChild className="rounded-[4px] py-1.5 px-2.5 cursor-pointer hover:bg-white/10 text-slate-300">
              <Link href="/settings" className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium">Cài đặt cá nhân</span>
              </Link>
            </DropdownMenuItem>

            <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
              <DropdownMenuItem asChild className="rounded-[4px] py-1.5 px-2.5 cursor-pointer hover:bg-white/10">
                <Link href="/workspace/settings" className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400">Quản trị</span>
                </Link>
              </DropdownMenuItem>
            </RequirePermission>

            <DropdownMenuSeparator className="bg-white/10 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-[4px] py-1.5 px-2.5 cursor-pointer hover:bg-red-500/10 text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold">Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Modals ── */}
      <CreateWorkspaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <DissolvedWorkspacesModal isOpen={isDissolvedModalOpen} onClose={() => setIsDissolvedModalOpen(false)} />
    </div>
  );
}