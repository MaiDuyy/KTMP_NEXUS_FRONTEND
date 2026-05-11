"use client";

import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { useGetWorkspaceMembersQuery } from '@/src/redux/feature/workspaceApi';
import { useGetChatsQuery } from '@/src/redux/feature/chatApi';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color }: any) => (
  <Card className="border-none shadow-sm bg-white overflow-hidden group">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-slate-900">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp size={14} className="text-emerald-500" />
              ) : (
                <TrendingDown size={14} className="text-rose-500" />
              )}
              <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trendValue}
              </span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">so với tuần trước</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ActivityItem = ({ user, action, target, time }: any) => (
  <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 border-b last:border-0 border-slate-100">
    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
      {user.substring(0, 1)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-900">
        <span className="font-bold">{user}</span> {action} <span className="font-bold text-blue-600">{target}</span>
      </p>
      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
        <Clock size={12} />
        {time}
      </p>
    </div>
    <ArrowRight size={14} className="text-slate-300" />
  </div>
);

export default function WorkspaceDashboard() {
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: membersData } = useGetWorkspaceMembersQuery({ workspaceId: currentWorkspaceId || '' }, { skip: !currentWorkspaceId });
  const { data: groupsData } = useGetChatsQuery({ type: 'group', workspaceId: currentWorkspaceId || '' }, { skip: !currentWorkspaceId });

  const totalMembers = membersData?.total || 0;
  const onlineMembers = membersData?.items?.filter(m => m.user?.isOnline).length || 0;
  const totalGroups = groupsData?.chats?.length || 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan Workspace</h1>
        <p className="text-slate-500 mt-1">Theo dõi hoạt động và chỉ số phát triển của đội ngũ bạn.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng thành viên" 
          value={totalMembers} 
          trend="up" 
          trendValue="+12%" 
          icon={Users} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Nhóm chat" 
          value={totalGroups} 
          trend="up" 
          trendValue="+5" 
          icon={MessageSquare} 
          color="bg-indigo-600" 
        />
        <StatCard 
          title="Tin nhắn (Tuần)" 
          value="12.4k" 
          trend="up" 
          trendValue="+18%" 
          icon={Activity} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="Đang Online" 
          value={onlineMembers} 
          icon={Activity} 
          color="bg-amber-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Lưu lượng tin nhắn (30 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full flex items-end gap-2 px-2">
              {[40, 60, 45, 90, 65, 80, 50, 70, 85, 100, 75, 60, 40, 55, 70, 95, 110, 80, 60, 45, 50, 65, 80, 90, 70, 60, 55, 40, 30, 45].map((val, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-blue-100 hover:bg-blue-600 transition-colors rounded-t-sm relative group cursor-pointer"
                  style={{ height: `${val}%` }}
                >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                     {val * 10}
                   </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>30 ngày trước</span>
              <span>Hôm nay</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Thành viên mới (12 tuần)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full flex items-end gap-4 px-4">
              {[5, 8, 12, 7, 10, 15, 20, 18, 25, 22, 30, 28].map((val, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-indigo-500 rounded-t-lg relative group cursor-pointer hover:bg-indigo-600 transition-colors"
                  style={{ height: `${(val / 30) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                     {val}
                   </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Tuần 1</span>
              <span>Tuần 12</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-700">Hoạt động gần đây</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-blue-600 font-bold">Xem tất cả</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <ActivityItem 
              user="Nguyễn Văn A" 
              action="đã tạo nhóm chat" 
              target="Dự án Alpha" 
              time="2 giờ trước" 
            />
            <ActivityItem 
              user="Trần Thị B" 
              action="đã được mời vào" 
              target="Workspace" 
              time="5 giờ trước" 
            />
            <ActivityItem 
              user="Lê Văn C" 
              action="đã rời nhóm chat" 
              target="Thảo luận chung" 
              time="1 ngày trước" 
            />
            <ActivityItem 
              user="Hệ thống" 
              action="đã cập nhật chính sách" 
              target="Bảo mật" 
              time="2 ngày trước" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Button({ children, variant, size, className, onClick }: any) {
  const variants: any = {
    ghost: "hover:bg-slate-100 text-slate-600",
    outline: "border border-slate-200 hover:bg-slate-50",
    primary: "bg-blue-600 text-white hover:bg-blue-700"
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm"
  };
  return (
    <button 
      onClick={onClick}
      className={`rounded-lg font-medium transition-all ${variants[variant || 'primary']} ${sizes[size || 'md']} ${className}`}
    >
      {children}
    </button>
  );
}
