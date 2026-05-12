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
  <Card className="hover:shadow-md transition-shadow overflow-hidden group border-none shadow-sm bg-white dark:bg-slate-900">
    <CardContent className="p-6 relative">
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue !== undefined && subLabel && (
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span className="font-bold text-slate-600 dark:text-slate-300">{subValue}</span> {subLabel}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {/* Subtle background decoration */}
      <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10", color)} />
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
      let color = "bg-slate-100 text-slate-600";

      if (activity.type.includes('user')) {
        icon = UserPlus;
        color = "bg-blue-100 text-blue-600";
      } else if (activity.type.includes('message') || activity.type.includes('chat')) {
        icon = FileText;
        color = "bg-orange-100 text-orange-600";
      } else if (activity.type.includes('workspace')) {
        icon = Building2;
        color = "bg-emerald-100 text-emerald-600";
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
      color: "text-purple-500",
      onClick: () => router.push('/admin/dashboard?tab=reports'),
    },
    {
      icon: SettingsIcon,
      label: "Cài đặt",
      color: "text-gray-500",
      onClick: () => router.push('/admin/dashboard?tab=settings'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Xin chào, {user?.name || "Admin"}! 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Hệ thống đang hoạt động ổn định • {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          title="Tin nhắn"
          value={stats.totalMessages}
          icon={FileText}
          color="bg-emerald-600"
          subValue={stats.activeUsers}
          subLabel="người dùng hoạt động"
        />
        <StatCard
          title="Workspaces"
          value={stats.totalWorkspaces}
          icon={Building2}
          color="bg-violet-600"
        />
        <StatCard
          title="Dung lượng File"
          value={`${(stats.fileUsage / (1024 * 1024)).toFixed(1)} MB`}
          icon={FileText}
          color="bg-orange-600"
          subValue={stats.pendingInvitations}
          subLabel="lời mời chờ duyệt"
        />
      </div>

      {/* Alerts Section */}
      {(stats.pendingInvitations > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingInvitations > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 dark:text-blue-100">
                    {stats.pendingInvitations} lời mời đang chờ chấp nhận
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300/70">Cần theo dõi tiến độ tham gia</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-slate-900 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => router.push('/admin/dashboard?tab=invitations')}
                >
                  Xem ngay
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts / Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`p-2 rounded-xl ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{activity.message}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(activity.time, { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-bold"
                    onClick={() => router.push('/admin/dashboard?tab=activity')}
                >
                    Xem tất cả hoạt động
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
            <CardDescription>Các chức năng quản trị thường dùng nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-6 flex-col gap-3 relative hover:border-primary/50 hover:bg-primary/5 group transition-all"
                    onClick={action.onClick}
                  >
                    <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}>
                        <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <span className="text-sm font-bold">{action.label}</span>
                    {action.badge && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 px-1.5 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
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
