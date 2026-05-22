"use client";

import React, { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/src/features/admin/legacy/components/DashboardSidebar";
import { useSearchParams } from "next/navigation";
import { RequirePermission } from "@/src/components/guards/RequirePermission";
import { Badge } from "@/components/ui/badge";

// Tab titles mapping (from legacy index.jsx)
const TAB_TITLES: Record<string, string> = {
    overview: "Tổng quan hệ thống",
    users: "Quản lý người dùng",
    invitations: "Quản lý lời mời",
    roles: "Phân quyền & Vai trò",
    workspaces: "Quản lý Workspace",
    channels: "Quản lý Kênh chat",
    departments: "Quản lý Phòng ban",
    documents: "Quản lý Tài liệu thô",
    "wiki-plans": "Kế hoạch Biên soạn MRP",
    "wiki-drafts": "Duyệt Bản thảo Wiki",
    analytics: "Thống kê hệ thống",
    health: "Tình trạng hệ thống",
    settings: "Cài đặt hệ thống",
    "audit-logs": "Nhật ký hoạt động",
    organizations: "Quản lý Tổ chức & Quota",
};

import { GlobalSearch } from "@/src/features/admin/legacy/components/GlobalSearch";
import { NotificationBell } from "@/src/features/admin/legacy/components/NotificationBell";

function AdminHeader() {
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get("tab") || "overview").toLowerCase();
    const pageTitle = TAB_TITLES[activeTab] || "Admin Dashboard";

    return (
        <header className="bg-background/80 backdrop-blur-md border-b border-border h-12 px-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground tracking-tight">
                    {pageTitle}
                </h2>
                <Badge variant="outline" className="text-[9px] px-1 py-0.5 uppercase font-semibold text-muted-foreground border-border bg-muted/40 rounded">
                    Admin
                </Badge>
            </div>
            <div className="flex items-center gap-4">
                <GlobalSearch />
                <NotificationBell />
            </div>
        </header>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequirePermission anyRole={["SUPER_ADMIN", "ADMIN"]}>
            <SidebarProvider defaultOpen={true}>
                <div className="flex min-h-screen w-full bg-background overflow-hidden text-foreground">
                    <Suspense fallback={<div className="w-64 h-full bg-background animate-pulse border-r border-border" />}>
                        <DashboardSidebar />
                    </Suspense>
                    <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-background">
                        <Suspense fallback={<div className="h-12 w-full bg-background animate-pulse border-b border-border" />}>
                            <AdminHeader />
                        </Suspense>
                        <main className="flex-1 overflow-auto p-4 no-scrollbar bg-background">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </RequirePermission>
    );
}
