"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  UserTable,
  InvitationsTable,
  RoleEditor,
  DocumentManagement,
  AuditLogTable,
  AdminStats,
  WorkspaceTable,
  AdminSettingsPage,
  BroadcastDialog,
  ChannelManagement,
  DepartmentManagement,
  SystemHealth,
  OrganizationsTable,
} from "@/src/features/admin";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompilationPlansPage from "@/app/wiki/plans/page";
import WikiReviewConsole from "@/app/wiki/review/page";

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "overview").toLowerCase();
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case "users":
        return <UserTable />;
      case "invitations":
        return <InvitationsTable />;
      case "roles":
        return <RoleEditor />;
      case "workspaces":
        return <WorkspaceTable />;
      case "channels":
        return <ChannelManagement />;
      case "departments":
        return <DepartmentManagement />;
      case "documents":
        return <DocumentManagement />;
      case "wiki-plans":
        return <CompilationPlansPage isEmbedded={true} />;
      case "wiki-drafts":
        return <WikiReviewConsole isEmbedded={true} />;
      case "audit-logs":
        return <AuditLogTable />;
      case "health":
        return <SystemHealth />;
      case "settings":
        return <AdminSettingsPage />;
      case "organizations":
        return <OrganizationsTable />;
      case "analytics":
        return <AdminStats />;
      case "overview":
      default:
        return (
          <div className="space-y-6">
            <AdminStats />
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Hoạt động mới nhất</h3>
              <AuditLogTable />
            </div>
          </div>
        );
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản trị hệ thống</h1>
          <p className="text-muted-foreground text-sm">Quản lý người dùng, không gian làm việc và cài đặt toàn hệ thống</p>
        </div>
        <Button 
          onClick={() => setBroadcastOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          <Megaphone className="w-4 h-4" />
          Gửi thông báo toàn hệ thống
        </Button>
      </div>
      
      {renderContent}

      <BroadcastDialog 
        open={broadcastOpen} 
        onOpenChange={setBroadcastOpen} 
      />
    </div>
  );
}
