"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Shield, 
  Settings, 
  Lock, 
  Puzzle, 
  Database, 
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
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-blue-50 text-blue-700' 
        : danger 
          ? 'text-slate-600 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <span className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}>
      {icon}
    </span>
    {label}
  </Link>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 py-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
      <div className="w-[260px] flex flex-col bg-slate-50/50 border-r border-slate-200 h-screen shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
          <Link 
            href="/chat"
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Quay lại Chat</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
              {currentWorkspace?.name?.substring(0, 1).toUpperCase() || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-sm truncate">{currentWorkspace?.name || 'Workspace'}</h2>
              <p className="text-[10px] text-slate-500 font-medium">Quản trị hệ thống</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Tổng quan" 
            href="/workspace/settings" 
            active={pathname === '/workspace/settings'} 
          />

          <SectionHeader label="Thành viên" />
          <SidebarItem 
            icon={<Users size={18} />} 
            label="Danh sách thành viên" 
            href="/workspace/settings/members" 
            active={pathname === '/workspace/settings/members'} 
          />
          <SidebarItem 
            icon={<Mail size={18} />} 
            label="Lời mời" 
            href="/workspace/settings/invites" 
            active={pathname === '/workspace/settings/invites'} 
          />

          <SectionHeader label="Tài nguyên" />
          <SidebarItem 
            icon={<MessageSquare size={18} />} 
            label="Nhóm Chat" 
            href="/workspace/settings/groups" 
            active={pathname === '/workspace/settings/groups'} 
          />
          
          <SectionHeader label="Bảo mật" />
          <SidebarItem 
            icon={<Shield size={18} />} 
            label="Phân quyền" 
            href="/workspace/settings/permissions" 
            active={pathname === '/workspace/settings/permissions'} 
          />

          <SectionHeader label="Cấu hình" />
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="Thông tin Workspace" 
            href="/workspace/settings/general" 
            active={pathname === '/workspace/settings/general'} 
          />
          <SidebarItem 
            icon={<Lock size={18} />} 
            label="Chính sách bảo mật" 
            href="/workspace/settings/security" 
            active={pathname === '/workspace/settings/security'} 
          />
          <SidebarItem 
            icon={<Puzzle size={18} />} 
            label="Tích hợp" 
            href="/workspace/settings/integrations" 
            active={pathname === '/workspace/settings/integrations'} 
          />
          <SidebarItem 
            icon={<Database size={18} />} 
            label="Lưu trữ dữ liệu" 
            href="/workspace/settings/storage" 
            active={pathname === '/workspace/settings/storage'} 
          />

          <div className="mt-8 pt-4 border-t border-slate-100">
            <SidebarItem 
              icon={<Trash2 size={18} />} 
              label="Giải tán Workspace" 
              href="/workspace/settings/dissolve" 
              active={pathname === '/workspace/settings/dissolve'} 
              danger
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/30">
        {children}
      </main>
    </div>
  );
}
