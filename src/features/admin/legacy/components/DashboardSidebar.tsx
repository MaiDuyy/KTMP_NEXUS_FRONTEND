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
        "flex flex-col border-r border-border/60 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-sm transition-all duration-300 ease-in-out h-screen sticky top-0 z-30",
        isCollapsed ? "w-[60px]" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex items-center h-11 px-3 border-b border-border/60",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-xs text-foreground tracking-wider uppercase">
            <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            <span>Admin Console</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-secondary dark:hover:bg-zinc-800 rounded transition-colors text-muted-foreground"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-2">
        <NavMain items={navMainItems} />
        
        <div className="mt-2 pt-2 border-t border-border/40 px-2.5">
            {!isCollapsed && (
                <div className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1.5 px-2">
                    Cấu hình
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {data.navSecondary.map((item) => (
                    <a
                        key={item.title}
                        href={item.url}
                        className={cn(
                            "flex items-center gap-2.5 px-2 py-1 text-xs font-medium rounded transition-colors",
                            item.id === activeTab 
                                ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                    </a>
                ))}
            </div>
        </div>
      </div>

      <div className="p-2 border-t border-border/60 bg-secondary/30 dark:bg-zinc-900/30">
        <NavUser />
      </div>
    </aside>
  )
}

