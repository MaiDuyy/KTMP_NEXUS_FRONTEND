"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useGetAccountDetailsQuery, useUpdateOnlineStatusMutation } from '@/src/redux/feature/accountApi';
import { useGetWorkspaceUnreadCountsQuery } from '@/src/redux/feature/chatApi';
import { useLogoutMutation } from '@/src/redux/feature/authApi';
import { apiSlice } from '@/src/redux/api/baseApi';
import { performFullLogout } from '@/src/utils/auth-utils';
import { toast } from 'sonner';
import {
  MessageCircle,
  Library,
  LayoutGrid,
  Hash,
  Settings,
  Plus,
  HelpCircle,
  Moon,
  Sun,
  Shield,
  Sparkles,
  Globe,
  Archive,
  LogOut
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { setWorkspace } from '@/src/redux/feature/workspaceSlice';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { DissolvedWorkspacesModal } from './DissolvedWorkspacesModal';
import { getAvatarUrl } from '@/src/utils/image-utils';

interface RailIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  unreadCount?: number;
}

const RailIcon: React.FC<RailIconProps> = ({ icon, label, active, href, onClick, unreadCount }) => {
  const content = (
    <button 
      onClick={onClick} 
      className={`p-2 rounded-xl transition-all duration-300 group relative active:scale-95 ${active
        ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-2 ring-blue-400/20'
        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
    >
      <div className={`transition-all duration-300 ${active ? 'scale-110 rotate-0' : 'group-hover:scale-110 group-hover:-rotate-3'}`}>
        {icon}
      </div>
      
      {active && (
        <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-r-full shadow-[4px_0_12px_rgba(37,99,235,0.8)] animate-pulse" />
      )}

      {/* Unread Badge */}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 border-2 border-white dark:border-slate-950 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md ring-1 ring-red-500/20 animate-in zoom-in duration-300">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {href ? <Link href={href}>{content}</Link> : content}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium bg-slate-900 text-white border-slate-800">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// 🔴 THÊM KHAI BÁO COMPONENT CHÍNH Ở ĐÂY 🔴
export default function ModernSidebarRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const dispatch = useDispatch();

  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();
  const { data: unreadCounts } = useGetWorkspaceUnreadCountsQuery();
  const { data: accountData } = useGetAccountDetailsQuery();
  const user = accountData?.user;
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDissolvedModalOpen, setIsDissolvedModalOpen] = useState(false);

  const [logout] = useLogoutMutation();
  const [updateOnlineStatus] = useUpdateOnlineStatusMutation();

  const handleLogout = async () => {
    try {
      await updateOnlineStatus({ isOnline: false });
      await logout({}).unwrap();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      toast.success("Đăng xuất thành công!");
      performFullLogout(dispatch);
    }
  };

  // Avoid Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const imageUrl = getAvatarUrl(user?.avatar, user?.name);

  return (
    <div className="w-[72px] flex flex-col items-center py-5 bg-white/70 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/5 h-screen shrink-0 relative z-20 shadow-xl">
      {/* Workspace Section */}
      <div className="flex flex-col gap-4 mb-6 overflow-y-auto no-scrollbar max-h-[45%] px-3">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center mb-1 scale-75 opacity-50">Work</div>

        <RailIcon
          label="Nexus Global"
          icon={
            <div className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${!currentWorkspaceId ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200/50'}`}>
              <Globe size={20} strokeWidth={2} />
            </div>
          }
          active={!currentWorkspaceId}
          unreadCount={unreadCounts?.['global']}
          onClick={() => {
            dispatch(setWorkspace(null));
            router.push('/chat');
          }}
        />

        <div className="w-8 h-[1.5px] bg-slate-200 dark:bg-slate-800/60 mx-auto my-1 rounded-full" />

        {/* {workspaces?.map((ws) => (
          <RailIcon
            key={ws.id}
            label={ws.name}
            active={currentWorkspaceId === ws.id}
            unreadCount={unreadCounts?.[ws.id] || 0}
            onClick={() => {
              dispatch(setWorkspace(ws.id));
              router.push('/chat');
            }}
            icon={
              ws.icon ? (
                <Avatar className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-slate-200/50 transition-all group-hover:scale-105 border-2 border-transparent group-hover:border-blue-500/30">
                  <AvatarImage src={getAvatarUrl(ws.icon)} className="object-cover" />
                  <AvatarFallback className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={`font-black text-[10px] h-9 w-9 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-slate-200/50 transition-all group-hover:scale-105 border-2 border-transparent ${currentWorkspaceId === ws.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'group-hover:border-blue-500/30'}`}>
                  {ws.name.substring(0, 2).toUpperCase()}
                </div>
              )
            }
          />
        ))} */}


        {currentWorkspaceId && (
          <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
            <RailIcon
              label="Quản trị Workspace"
              icon={
                <div className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200/50'}`}>
                  <Shield size={20} strokeWidth={2} />
                </div>
              }
              active={pathname.startsWith('/workspace/settings')}
              onClick={() => router.push('/workspace/settings')}
            />

            <RailIcon
              label="Kho lưu trữ (Dissolved)"
              icon={
                <div className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200/50'}`}>
                  <Archive size={20} strokeWidth={2} />
                </div>
              }
              onClick={() => setIsDissolvedModalOpen(true)}
            />
          </RequirePermission>
        )}
      </div>

      <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-6" />

      {/* Main Navigation Modules */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center mb-1 scale-75 opacity-50">Menu</div>
        <RailIcon href="/dashboard" icon={<LayoutGrid size={20} strokeWidth={2} />} label="Bảng điều khiển" active={pathname === '/dashboard' || pathname === '/'} />
        <RailIcon href="/chat" icon={<MessageCircle size={20} strokeWidth={2} />} label="Trò chuyện NEXUS" active={pathname?.startsWith('/chat')} />
        <RailIcon href="/ai" icon={<Sparkles size={20} strokeWidth={2} />} label="Trợ lý AI" active={pathname?.startsWith('/ai')} />
        <RailIcon href="/knowledge" icon={<Library size={20} strokeWidth={2} />} label="Kiến thức / Tài liệu" active={pathname?.startsWith('/knowledge')} />
      </div>

      <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mt-auto" />


      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {mounted && (
          <RailIcon
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            icon={theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            label="Chế độ tối/sáng"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-transparent hover:ring-blue-500 dark:hover:ring-blue-400 transition-all mt-4">
              <AvatarImage src={imageUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56 p-2 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 ml-2">
            <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer">
              <Link href="/settings" className="flex items-center">
                <Settings className="w-4 h-4 mr-3 text-slate-500" />
                <span className="font-medium text-sm">Cài đặt cá nhân</span>
              </Link>
            </DropdownMenuItem>

            <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
              <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer">
                <Link href="/workspace/settings" className="flex items-center">
                  <Shield className="w-4 h-4 mr-3 text-blue-600" />
                  <span className="font-bold text-sm text-blue-600">Quản trị Workspace</span>
                </Link>
              </DropdownMenuItem>
            </RequirePermission>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-lg py-2 cursor-pointer">
              <LogOut  className="w-4 h-4 mr-3" />
              <span className="font-bold text-sm">Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <DissolvedWorkspacesModal
        isOpen={isDissolvedModalOpen}
        onClose={() => setIsDissolvedModalOpen(false)}
      />
    </div>
  );
} // 🔴 NHỚ ĐÓNG NGOẶC COMPONENT CHÍNH Ở CUỐI FILE 🔴