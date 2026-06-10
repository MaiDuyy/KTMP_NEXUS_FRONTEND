'use client';

import { useGetAdminStatsQuery } from '@/src/redux/feature/adminApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    UserCheck,
    TrendingUp,
    Loader2,
    Activity,
    MessageSquare,
    Layers,
    HardDrive,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, formatNumber, formatFileSize } from '@/lib/utils';
import { AdminCharts } from './AdminCharts';

export function AdminStats() {
    const { data, isLoading, error } = useGetAdminStatsQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Không thể tải dữ liệu thống kê
            </div>
        );
    }

    const stats = [
        {
            title: 'Tổng người dùng',
            value: formatNumber(data.totalUsers),
            icon: Users,
            iconClass: 'text-blue-600 dark:text-blue-400',
            bgClass: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
            title: 'Người dùng hoạt động',
            value: formatNumber(data.activeUsers),
            icon: UserCheck,
            iconClass: 'text-green-600 dark:text-green-400',
            bgClass: 'bg-green-50 dark:bg-green-950/30',
        },
        {
            title: 'Tổng tin nhắn',
            value: formatNumber(data.totalMessages),
            icon: MessageSquare,
            iconClass: 'text-indigo-600 dark:text-indigo-400',
            bgClass: 'bg-indigo-50 dark:bg-indigo-950/30',
        },
        {
            title: 'Đoạn chat',
            value: formatNumber(data.totalWorkspaces),
            icon: Layers,
            iconClass: 'text-amber-600 dark:text-amber-400',
            bgClass: 'bg-amber-50 dark:bg-amber-950/30',
        },
        {
            title: 'Dung lượng',
            value: formatFileSize(data.fileStorageUsage),
            icon: HardDrive,
            iconClass: 'text-rose-600 dark:text-rose-400',
            bgClass: 'bg-rose-50 dark:bg-rose-950/30',
        },
        {
            title: 'Tỷ lệ hoạt động',
            value: data.totalUsers > 0
                ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}%`
                : '0%',
            icon: TrendingUp,
            iconClass: 'text-emerald-600 dark:text-emerald-400',
            bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
        },
    ];

    return (
        <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="border border-border rounded-xl shadow-sm hover:shadow-md transition-all bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 space-y-0">
                                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {stat.title}
                                </CardTitle>
                                <div className={cn('p-1.5 rounded-lg', stat.bgClass)}>
                                    <Icon className={cn('h-3.5 w-3.5', stat.iconClass)} />
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-xl font-bold tracking-tight">{stat.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Analytics Section */}
            <div className="space-y-3">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Phân tích hệ thống</h2>
                    <p className="text-xs text-muted-foreground">Thống kê tăng trưởng và hoạt động nền tảng</p>
                </div>
                
                <AdminCharts 
                    userGrowth={data.userGrowth}
                    messageActivity={data.messageActivity}
                    roleDistribution={data.roleDistribution}
                />
            </div>

            {/* Recent Activity */}
            <Card className="border border-border rounded-xl shadow-sm bg-card">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Activity className="w-4 h-4 text-primary" />
                        Hoạt động gần đây
                    </CardTitle>
                    <CardDescription className="text-xs">Sự kiện mới nhất và nhật ký hệ thống</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                        {data.recentActivity?.length > 0 ? (
                            <div className="relative space-y-3 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                {data.recentActivity.slice(0, 10).map((activity, index) => (
                                    <div key={index} className="relative flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm z-10">
                                                <Activity className="h-3.5 w-3.5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">{activity.description}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] font-extrabold uppercase tracking-tight py-0 px-1.5 rounded-md">
                                            {activity.type}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-6">
                                Chưa có hoạt động nào gần đây
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

