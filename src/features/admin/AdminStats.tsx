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
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Người dùng hoạt động',
            value: formatNumber(data.activeUsers),
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Tổng tin nhắn',
            value: formatNumber(data.totalMessages),
            icon: MessageSquare,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
        {
            title: 'Đoạn chat',
            value: formatNumber(data.totalWorkspaces),
            icon: Layers,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            title: 'Dung lượng',
            value: formatFileSize(data.fileStorageUsage),
            icon: HardDrive,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
        },
        {
            title: 'Tỷ lệ hoạt động',
            value: data.totalUsers > 0
                ? `${Math.round((data.activeUsers / data.totalUsers) * 100)}%`
                : '0%',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {stat.title}
                                </CardTitle>
                                <div className={cn('p-2 rounded-full', stat.bgColor)}>
                                    <Icon className={cn('h-4 w-4', stat.color)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Analytics Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Phân tích hệ thống</h2>
                        <p className="text-sm text-muted-foreground">Thống kê tăng trưởng và hoạt động nền tảng</p>
                    </div>
                </div>
                
                <AdminCharts 
                    userGrowth={data.userGrowth}
                    messageActivity={data.messageActivity}
                    roleDistribution={data.roleDistribution}
                />
            </div>

            {/* Recent Activity */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="w-4 h-4 text-primary" />
                        Hoạt động gần đây
                    </CardTitle>
                    <CardDescription>Sự kiện mới nhất và nhật ký hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.recentActivity?.length > 0 ? (
                            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {data.recentActivity.slice(0, 10).map((activity, index) => (
                                    <div key={index} className="relative flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 border-4 border-white shadow-sm z-10">
                                                <Activity className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight">
                                            {activity.type}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Chưa có hoạt động nào gần đây
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

