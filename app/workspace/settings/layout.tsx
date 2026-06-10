"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Shield, 
  Settings, 
  Trash2, 
  ChevronLeft,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { useGetUserWorkspacesQuery } from '@/src/redux/feature/workspaceApi';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/src/utils/image-utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  danger?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, href, active, danger }) => (
  <Link
    href={href}
    className={`flex items-center gap-2.5 px-3 py-1.5 transition-all duration-150 text-xs font-mono font-medium ${
      active 
        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100 font-bold border-l-2 border-slate-900 dark:border-slate-100 pl-2 rounded-none' 
        : danger 
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-400 rounded-[2px]'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-200 rounded-[2px]'
    }`}
  >
    <span className={active ? 'text-slate-850 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-500 dark:group-hover:text-zinc-400'}>
      {icon}
    </span>
    {label}
  </Link>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 py-1.5 mt-3 text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-550">
    {label}
  </div>
);

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find(w => w.id === currentWorkspaceId);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white dark:bg-[#111113]">
      {/* Settings Sidebar */}
      <div className="w-[240px] flex flex-col bg-slate-50 dark:bg-[#19191B] border-r border-slate-200/80 dark:border-white/[0.06] h-screen shrink-0">
        <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50 dark:bg-[#19191B]">
          <Link 
            href="/chat"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-3 group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider">Quay lại Chat</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 rounded-[2px] shrink-0">
              <AvatarImage src={currentWorkspace?.icon ? getAvatarUrl(currentWorkspace.icon) : undefined} alt={currentWorkspace?.name} className="object-cover rounded-[2px]" />
              <AvatarFallback className="bg-blue-600 dark:bg-zinc-800 text-white dark:text-zinc-300 font-bold text-sm rounded-[2px]">
                {currentWorkspace?.name?.substring(0, 1).toUpperCase() || 'W'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs truncate">{currentWorkspace?.name || 'Workspace'}</h2>
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium">Quản trị hệ thống</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <SidebarItem 
            icon={<LayoutDashboard size={16} />} 
            label="Tổng quan" 
            href="/workspace/settings" 
            active={pathname === '/workspace/settings'} 
          />

          <SectionHeader label="Thành viên" />
          <SidebarItem 
            icon={<Users size={16} />} 
            label="Danh sách thành viên" 
            href="/workspace/settings/members" 
            active={pathname === '/workspace/settings/members'} 
          />
          <SidebarItem 
            icon={<Mail size={16} />} 
            label="Lời mời" 
            href="/workspace/settings/invites" 
            active={pathname === '/workspace/settings/invites'} 
          />

          <SectionHeader label="Tài nguyên" />
          <SidebarItem 
            icon={<MessageSquare size={16} />} 
            label="Nhóm Chat" 
            href="/workspace/settings/groups" 
            active={pathname === '/workspace/settings/groups'} 
          />
          
          <SectionHeader label="Bảo mật" />
          <SidebarItem 
            icon={<Shield size={16} />} 
            label="Phân quyền" 
            href="/workspace/settings/permissions" 
            active={pathname === '/workspace/settings/permissions'} 
          />

          <SectionHeader label="Cấu hình" />
          <SidebarItem 
            icon={<Settings size={16} />} 
            label="Thông tin Workspace" 
            href="/workspace/settings/general" 
            active={pathname === '/workspace/settings/general'} 
          />

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
            <SidebarItem 
              icon={<Trash2 size={16} />} 
              label="Giải tán Workspace" 
              href="/workspace/settings/dissolve" 
              active={pathname === '/workspace/settings/dissolve'} 
              danger
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-[#111113]/50">
        {children}
      </main>
    </div>
  );
}
