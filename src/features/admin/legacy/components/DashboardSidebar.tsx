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
} from "lucide-react"

import { NavMain } from "./NavMain"
import { NavUser } from "./NavUser"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

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
      title: "Tài liệu & File",
      id: "documents",
      url: "/admin/dashboard?tab=documents",
      icon: Folder,
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
        "flex flex-col border-r bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out h-screen sticky top-0 z-30",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <LayoutDashboard className="w-6 h-6" />
            <span>Admin Panel</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        <NavMain items={navMainItems} />
        
        <div className="mt-4 pt-4 border-t px-4">
            {!isCollapsed && (
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Hệ thống
                </div>
            )}
            <div className="flex flex-col gap-1">
                {data.navSecondary.map((item) => (
                    <a
                        key={item.title}
                        href={item.url}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            item.id === activeTab 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                    </a>
                ))}
            </div>
        </div>
      </div>

      <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
        <NavUser />
      </div>
    </aside>
  )
}
