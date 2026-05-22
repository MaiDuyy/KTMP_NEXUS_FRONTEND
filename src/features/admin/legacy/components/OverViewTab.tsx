"use client";

import React, { useMemo } from "react";
import {
  Users,
  Building2,
  FileText,
  Activity,
  UserPlus,
  Clock,
  Download,
  Shield,
  Settings as SettingsIcon,
  LucideIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAccountDetailsQuery } from "@/src/redux/feature/accountApi";
import { useGetAdminStatsQuery } from "@/src/redux/feature/adminApi";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subValue?: number;
  subLabel?: string;
}

const StatCard = ({ title, value, icon: Icon, color, subValue, subLabel }: StatCardProps) => (
  <Card className="border border-border/60 hover:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] transition-all bg-card rounded-md">
    <CardContent className="p-3.5 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue !== undefined && subLabel && (
            <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
              <span className="font-bold text-foreground">{subValue}</span> {subLabel}
            </p>
          )}
        </div>
        <div className={`p-2 rounded ${color} text-white shrink-0 transition-transform group-hover:scale-105`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className={cn("absolute -right-3 -bottom-3 w-16 h-16 rounded-full opacity-[0.03]", color)} />
    </CardContent>
  </Card>
);

export function OverViewTab() {
  const { data: accountData } = useGetAccountDetailsQuery();
  const user = accountData?.user;
  const router = useRouter();

  const { data: statsData, isLoading: isStatsLoading } = useGetAdminStatsQuery();
  
  const stats = useMemo(() => {
    if (!statsData) return {
      totalUsers: 0,
      activeUsers: 0,
      totalMessages: 0,
      totalWorkspaces: 0,
      pendingInvitations: 0,
      fileUsage: 0,
    };

    return {
      totalUsers: statsData.totalUsers || 0,
      activeUsers: statsData.activeUsers || 0,
      totalMessages: statsData.totalMessages || 0,
      totalWorkspaces: statsData.totalWorkspaces || 0,
      pendingInvitations: statsData.pendingInvitations || 0,
      fileUsage: statsData.fileStorageUsage || 0,
    };
  }, [statsData]);

  const recentActivities = useMemo(() => {
    if (!statsData?.recentActivity) return [];
    
    return statsData.recentActivity.map((activity, idx) => {
      let icon = Activity;
      let color = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

      if (activity.type.includes('user')) {
        icon = UserPlus;
        color = "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
      } else if (activity.type.includes('message') || activity.type.includes('chat')) {
        icon = FileText;
        color = "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
      } else if (activity.type.includes('workspace')) {
        icon = Building2;
        color = "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
      }

      return {
        id: `activity-${idx}`,
        message: activity.description,
        time: new Date(activity.timestamp),
        icon,
        color,
      };
    });
  }, [statsData]);

  const quickActions = [
    {
      icon: UserPlus,
      label: "Thêm người dùng",
      color: "text-blue-500",
      onClick: () => router.push('/admin/dashboard?tab=users'),
    },
    {
      icon: Shield,
      label: "Duyệt NTD",
      color: "text-green-500",
      badge: stats.pendingInvitations > 0 ? stats.pendingInvitations : null,
      onClick: () => router.push('/admin/dashboard?tab=recuriter-pending'),
    },
    {
      icon: Download,
      label: "Xuất báo cáo",
      color: "text-amber-500",
      onClick: () => router.push('/admin/dashboard?tab=reports'),
    },
    {
      icon: SettingsIcon,
      label: "Cài đặt",
      color: "text-zinc-500",
      onClick: () => router.push('/admin/dashboard?tab=settings'),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Xin chào, {user?.name || "Admin"}! 👋
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hệ thống đang hoạt động ổn định • {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          color="bg-blue-600 dark:bg-blue-700"
        />
        <StatCard
          title="Tin nhắn"
          value={stats.totalMessages}
          icon={FileText}
          color="bg-emerald-600 dark:bg-emerald-700"
          subValue={stats.activeUsers}
          subLabel="hoạt động"
        />
        <StatCard
          title="Workspaces"
          value={stats.totalWorkspaces}
          icon={Building2}
          color="bg-sky-600 dark:bg-sky-700"
        />
        <StatCard
          title="Dung lượng File"
          value={`${(stats.fileUsage / (1024 * 1024)).toFixed(1)} MB`}
          icon={FileText}
          color="bg-amber-600 dark:bg-amber-700"
          subValue={stats.pendingInvitations}
          subLabel="chờ duyệt"
        />
      </div>

      {/* Alerts Section */}
      {(stats.pendingInvitations > 0) && (
        <div className="grid grid-cols-1 gap-3">
          <Card className="border border-blue-200/50 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/30 rounded-md">
            <CardContent className="p-2.5 flex items-center gap-3">
              <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/40 shrink-0">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-blue-900 dark:text-blue-100 truncate">
                  {stats.pendingInvitations} lời mời đang chờ chấp nhận
                </p>
                <p className="text-[10px] text-blue-700/80 dark:text-blue-300/60 truncate">Cần theo dõi tiến độ tham gia của thành viên mới</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-background border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 h-7 text-xs rounded"
                onClick={() => router.push('/admin/dashboard?tab=invitations')}
              >
                Xem ngay
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts / Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border/60 bg-card rounded-md shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/40 p-3">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40 max-h-64 overflow-y-auto">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-2.5 p-2.5 hover:bg-secondary/40 transition-colors">
                    <div className={`p-1.5 rounded shrink-0 ${activity.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">{activity.message}</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        {formatDistanceToNow(activity.time, { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 bg-secondary/15 border-t border-border/40 text-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-semibold text-xs h-7 py-1"
                    onClick={() => router.push('/admin/dashboard?tab=activity')}
                >
                    Xem tất cả hoạt động
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card rounded-md shadow-sm p-3 flex flex-col justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">Thao tác nhanh</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">Các chức năng quản trị thường dùng nhất</CardDescription>
          </div>
          <CardContent className="p-0 mt-3 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-2.5 px-3 flex-col gap-2 relative hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 group transition-all rounded-md"
                    onClick={action.onClick}
                  >
                    <div className={`p-1.5 rounded bg-secondary group-hover:bg-background transition-colors`}>
                        <Icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{action.label}</span>
                    {action.badge && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-bold rounded-full h-4 px-1 flex items-center justify-center border border-background shadow">
                        {action.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
