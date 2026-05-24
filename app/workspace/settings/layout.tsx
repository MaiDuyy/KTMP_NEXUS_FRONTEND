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
    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-colors duration-150 ${
      active 
        ? 'bg-slate-200/60 text-slate-900' 
        : danger 
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
          : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
    }`}
  >
    <span className={active ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-500'}>
      {icon}
    </span>
    {label}
  </Link>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 py-1.5 mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
    {label}
  </div>
);

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find(w => w.id === currentWorkspaceId);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* Settings Sidebar */}
      <div className="w-[240px] flex flex-col bg-slate-50 border-r border-slate-200/80 h-screen shrink-0">
        <div className="p-3.5 border-b border-slate-200/80 bg-slate-50">
          <Link 
            href="/chat"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors mb-3 group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Quay lại Chat</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 rounded-[4px] shrink-0">
              <AvatarImage src={currentWorkspace?.icon ? getAvatarUrl(currentWorkspace.icon) : undefined} alt={currentWorkspace?.name} className="object-cover" />
              <AvatarFallback className="bg-blue-600 text-white font-bold text-sm rounded-[4px]">
                {currentWorkspace?.name?.substring(0, 1).toUpperCase() || 'W'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-xs truncate">{currentWorkspace?.name || 'Workspace'}</h2>
              <p className="text-[10px] text-slate-400 font-medium">Quản trị hệ thống</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
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

          <div className="mt-4 pt-3 border-t border-slate-200/60">
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
      <main className="flex-1 overflow-y-auto bg-slate-50/20">
        {children}
      </main>
    </div>
  );
}
