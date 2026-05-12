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
    documents: "Quản lý Tài liệu",
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
        <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b h-16 px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {pageTitle}
                </h2>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 border-slate-200 dark:border-slate-800">
                    Admin
                </Badge>
            </div>
            <div className="flex items-center gap-6">
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
                <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
                    <Suspense fallback={<div className="w-64 h-full bg-white animate-pulse" />}>
                        <DashboardSidebar />
                    </Suspense>
                    <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen">
                        <Suspense fallback={<div className="h-16 w-full bg-white animate-pulse" />}>
                            <AdminHeader />
                        </Suspense>
                        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 no-scrollbar">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </RequirePermission>
    );
}
