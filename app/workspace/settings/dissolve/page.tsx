"use client";

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Loader2, 
  ShieldAlert, 
  MessageSquare, 
  Users, 
  FileText, 
  History,
  ChevronLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/redux/store';
import { useGetUserWorkspacesQuery, useDissolveWorkspaceMutation, useGetWorkspaceStatsQuery } from '@/src/redux/feature/workspaceApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DissolveWorkspace() {
  const router = useRouter();
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find(w => w.id === currentWorkspaceId);
  const workspaceName = currentWorkspace?.name || "";

  const { data: stats, isLoading: statsLoading } = useGetWorkspaceStatsQuery(currentWorkspaceId!, { skip: !currentWorkspaceId });

  const [confirmName, setConfirmName] = useState("");
  const [dissolveWorkspace, { isLoading }] = useDissolveWorkspaceMutation();

  const handleDissolve = async () => {
    if (confirmName !== workspaceName) {
      toast.error("Tên xác nhận không chính xác.");
      return;
    }

    try {
      await dissolveWorkspace({ 
        workspaceId: currentWorkspaceId!, 
        workspaceNameConfirm: confirmName 
      }).unwrap();
      toast.success("Workspace đang được giải tán...");
      router.push('/modern-dashboard');
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể giải tán Workspace.");
    }
  };

  const ImpactItem = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-[4px] bg-slate-50 border border-slate-100">
      <div className="p-1.5 rounded-[4px] bg-slate-200 text-slate-700">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-base font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link 
            href="/workspace/settings" 
            className="h-7 w-7 rounded-[4px] bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 border border-slate-200/80 transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <h1 className="text-lg font-bold text-red-600">Giải tán Workspace</h1>
        </div>

        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden relative rounded-[4px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-[4px] bg-red-100 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900">Hành động này là vĩnh viễn!</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Khi bạn giải tán Workspace <span className="font-bold text-red-600">"{workspaceName}"</span>, toàn bộ dữ liệu và quyền truy cập sẽ bị hủy bỏ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <ImpactItem 
                icon={Users} 
                label="Thành viên sẽ mất quyền" 
                value={statsLoading ? "Đang tải..." : (stats?.memberCount ?? "0")} 
                color="bg-blue-600" 
              />
              <ImpactItem 
                icon={MessageSquare} 
                label="Nhóm chat sẽ bị xóa" 
                value={statsLoading ? "Đang tải..." : (stats?.chatCount ?? "0")} 
                color="bg-indigo-600" 
              />
              <ImpactItem 
                icon={FileText} 
                label="Dung lượng giải phóng" 
                value={statsLoading ? "Đang tải..." : (stats?.storageSize ?? "0 Bytes")} 
                color="bg-emerald-600" 
              />
              <ImpactItem 
                icon={History} 
                label="Tin nhắn sẽ bị ẩn" 
                value={statsLoading ? "Đang tải..." : `${(stats?.messageCount ?? 0).toLocaleString()} tin nhắn`} 
                color="bg-amber-600" 
              />
            </div>

            <div className="p-4 rounded-[4px] bg-red-50/60 border border-red-100/80 space-y-3">
              <div className="flex gap-2.5">
                <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-red-800 font-semibold leading-normal">
                  Để xác nhận giải tán, vui lòng nhập chính xác tên của Workspace này vào ô bên dưới. 
                  Hãy đảm bảo bạn đã sao lưu tất cả dữ liệu quan trọng.
                </p>
              </div>
              <Input 
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="h-9 bg-white text-center font-bold text-sm border-red-200 focus:border-red-600 focus:ring-0 rounded-[4px]"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-9 text-xs font-semibold text-slate-700 rounded-[4px] border-slate-200"
                asChild
              >
                <Link href="/workspace/settings">Hủy bỏ, quay lại</Link>
              </Button>
              <Button 
                variant="destructive" 
                className="flex-[2] h-9 text-xs font-semibold text-white rounded-[4px] bg-red-600 hover:bg-red-700 transition-colors"
                disabled={confirmName !== workspaceName || isLoading}
                onClick={handleDissolve}
              >
                {isLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Trash2 size={14} className="mr-1.5" />}
                XÁC NHẬN GIẢI TÁN VĨNH VIỄN
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Hành động này chỉ dành cho Chủ sở hữu Workspace (Owner).
          </p>
        </div>
      </div>
    </div>
  );
}
