"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useGetAccountDetailsQuery, useUpdateOnlineStatusMutation } from '@/src/redux/feature/accountApi';
import { useLogoutMutation } from '@/src/redux/feature/authApi';
import { apiSlice } from '@/src/redux/api/baseApi';
import { performFullLogout } from '@/src/utils/auth-utils';
import { toast } from 'sonner';
import {
  MessageSquare,
  Files,
  LayoutDashboard,
  Hash,
  Settings,
  Plus,
  HelpCircle,
  Moon,
  Sun,
  ShieldCheck,
  Bot,
  Briefcase,
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
}

const RailIcon: React.FC<RailIconProps> = ({ icon, label, active, href, onClick }) => {
  const content = (
    <button onClick={onClick} className={`p-3 rounded-xl transition-all duration-200 group relative ${active
      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }`}>
      {icon}
      {active && (
        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />
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
    <div className="w-[72px] flex flex-col items-center py-6 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen shrink-0 relative z-20">
      {/* Workspace Icons */}
      <div className="flex flex-col gap-3 mb-8 overflow-y-auto no-scrollbar max-h-[40%] px-3">
        <RailIcon
          label="Tất cả Workspace"
          icon={<Briefcase size={22} />}
          active={!currentWorkspaceId}
          onClick={() => {
            dispatch(setWorkspace(null));
            router.push('/chat');
          }}
        />

        <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 mx-auto my-1" />

        {/* {workspaces?.map((ws) => (
          <RailIcon
            key={ws.id}
            label={ws.name}
            active={currentWorkspaceId === ws.id}
            onClick={() => {
              dispatch(setWorkspace(ws.id));
              router.push('/chat');
            }}
            icon={
              ws.icon ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={ws.icon} />
                  <AvatarFallback className="text-[10px] bg-slate-100 dark:bg-slate-800">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="font-bold text-sm">
                  {ws.name.substring(0, 1).toUpperCase()}
                </div>
              )
            }
          />
        ))} */}


        <RequirePermission anyRole={['SUPER_ADMIN', 'ADMIN', 'WORKSPACE_MANAGER']} silent>
          {/* <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 w-10 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all active:scale-95"
          >
            <Plus size={20} />
          </button> */}

          <RailIcon
            label="Quản trị Workspace"
            icon={<ShieldCheck size={22} />}
            active={pathname.startsWith('/workspace/settings')}
            onClick={() => router.push('/workspace/settings')}
          />

          <RailIcon
            label="Kho lưu trữ (Dissolved)"
            icon={<Archive size={22} />}
            onClick={() => setIsDissolvedModalOpen(true)}
          />
        </RequirePermission>
      </div>

      {/* Main Navigation Modules */}
      <div className="flex flex-col gap-2 flex-1">
        <RailIcon href="/dashboard" icon={<LayoutDashboard size={22} />} label="Bảng điều khiển" active={pathname === '/dashboard' || pathname === '/'} />
        <RailIcon href="/chat" icon={<MessageSquare size={22} />} label="Trò chuyện NEXUS" active={pathname?.startsWith('/chat')} />
        <RailIcon href="/ai" icon={<Bot size={22} />} label="Trợ lý AI" active={pathname?.startsWith('/ai')} />
        <RailIcon href="/knowledge" icon={<Files size={22} />} label="Kiến thức / Tài liệu" active={pathname?.startsWith('/knowledge')} />
        {/* <RailIcon href="/security" icon={<ShieldCheck size={22} />} label="Security & Audit" active={pathname?.startsWith('/security')} /> */}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {mounted && (
          <RailIcon
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            icon={theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
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
                  <Briefcase className="w-4 h-4 mr-3 text-blue-600" />
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