"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Building,
  Shield,
  Settings,
  HelpCircle,
  FileText,
  Activity,
  FileBarChart,
  Folder,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  MessageSquare,
  Globe,
  Heart,
  Building2,
  BookOpen,
  ArrowLeft,
} from "lucide-react"

import { NavMain } from "./NavMain"
import { NavUser } from "./NavUser"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useGetAccountDetailsQuery } from "@/src/redux/feature/accountApi"
import { getAvatarUrl } from "@/src/utils/image-utils"

const data = {
  navMain: [
    {
      title: "Tổng quan",
      id: "overview",
      icon: LayoutDashboard,
      url: "/admin/dashboard?tab=overview",
    },
    {
      title: "QL Người dùng",
      icon: Users,
      items: [
        {
          title: "Danh sách người dùng",
          id: "users",
          url: "/admin/dashboard?tab=users",
        },
        {
          title: "Quản lý lời mời",
          id: "invitations",
          url: "/admin/dashboard?tab=invitations",
        },
        {
          title: "Phân quyền & Vai trò",
          id: "roles",
          url: "/admin/dashboard?tab=roles",
        },
      ],
    },
    {
      title: "QL Workspace",
      icon: Building,
      items: [
        {
          title: "Danh sách Workspace",
          id: "workspaces",
          url: "/admin/dashboard?tab=workspaces",
        },
        {
          title: "Quản lý Kênh",
          id: "channels",
          url: "/admin/dashboard?tab=channels",
        },
        {
          title: "Quản lý Phòng ban",
          id: "departments",
          url: "/admin/dashboard?tab=departments",
        },
      ],
    },
    {
      title: "Quản lý Tổ chức",
      id: "organizations",
      url: "/admin/dashboard?tab=organizations",
      icon: Building2,
    },
    {
      title: "Wiki & Tri thức",
      icon: BookOpen,
      items: [
        {
          title: "Quản lý Tài liệu",
          id: "documents",
          url: "/admin/dashboard?tab=documents",
        },
        {
          title: "Kế hoạch biên soạn",
          id: "wiki-plans",
          url: "/admin/dashboard?tab=wiki-plans",
        },
        {
          title: "Duyệt bản thảo",
          id: "wiki-drafts",
          url: "/admin/dashboard?tab=wiki-drafts",
        },
      ],
    },
    {
      title: "Thống kê hệ thống",
      id: "analytics",
      url: "/admin/dashboard?tab=analytics",
      icon: FileBarChart,
    },
    {
      title: "Nhật ký hoạt động",
      id: "audit-logs",
      url: "/admin/dashboard?tab=audit-logs",
      icon: Activity,
    },
    {
      title: "Tình trạng hệ thống",
      id: "health",
      url: "/admin/dashboard?tab=health",
      icon: Heart,
    },
  ],
  navSecondary: [
    {
      title: "Cài đặt",
      id: "settings",
      url: "/admin/dashboard?tab=settings",
      icon: Settings,
    },
    {
      title: "Trợ giúp",
      url: "#",
      icon: HelpCircle,
    },
  ],
}

export function DashboardSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") || "overview").toLowerCase()

  // Fetch logged-in user dynamically to prevent static/overlapping details
  const { data: accountData } = useGetAccountDetailsQuery()
  const currentUser = accountData?.user

  const navMainItems = React.useMemo(() => {
    return data.navMain.map((item) => ({
      ...item,
      isActive: item.id === activeTab || item.items?.some(sub => sub.id === activeTab),
      items: item.items?.map(sub => ({
        ...sub,
        isActive: sub.id === activeTab
      }))
    }))
  }, [activeTab])

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-slate-100 bg-white dark:border-white/10 dark:bg-zinc-950 transition-all duration-300 ease-in-out h-screen sticky top-0 z-30",
        isCollapsed ? "w-[60px]" : "w-56"
      )}
    >
      {/* Header Area */}
      <div
        className={cn(
          "flex items-center h-12 px-4 border-b border-slate-100 dark:border-white/10",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-zinc-200 tracking-wider uppercase">
            <div className="h-6 w-6 rounded bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Admin Console</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-md transition-colors text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-4">
        <NavMain items={navMainItems} />
        
        {/* User List Phân Vùng - Trực tuyến & Cân đối tuyệt đối
        {!isCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 px-1.5">
            <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-3">
              Thành viên trực tuyến
            </div>
            <div className="flex flex-col gap-1.5">
              {currentUser && (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-all duration-200 ease-in-out">
                  <div className="relative h-7 w-7 shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    <img className="h-7 w-7 rounded-full object-cover shrink-0" src={getAvatarUrl(currentUser.avatar)} alt={currentUser.name} />
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
         */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 px-1.5">
            {!isCollapsed && (
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 px-3">
                    Cấu hình
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {data.navSecondary.map((item) => {
                    const isActive = item.id === activeTab;
                    return (
                        <Link
                            key={item.title}
                            href={item.url}
                            className={cn(
                                "group flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ease-in-out relative",
                                isActive 
                                    ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold" 
                                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900/40"
                            )}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-blue-600 dark:bg-blue-400 rounded-r" />
                            )}
                            <item.icon className={cn(
                                "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
                                isActive 
                                    ? "text-blue-600 dark:text-blue-400" 
                                    : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                            )} />
                            {!isCollapsed && <span className="truncate">{item.title}</span>}
                        </Link>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-zinc-900/10 flex flex-col gap-2">
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 transition-all duration-200 shadow-sm",
            isCollapsed ? "justify-center" : ""
          )}
          title="Quay lại chat"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Quay lại chat</span>}
        </Link>
        <NavUser />
      </div>
    </aside>
  )
}

