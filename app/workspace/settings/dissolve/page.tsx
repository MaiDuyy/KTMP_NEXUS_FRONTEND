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

  const ImpactItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-[2px] bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-white/[0.04]">
      <div className="p-1.5 rounded-[2px] bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-350 border border-slate-200/50 dark:border-white/[0.04]">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-[9px] font-bold font-mono text-slate-400 dark:text-zinc-550 uppercase tracking-wider">{label}</p>
        <p className="text-base font-black font-mono text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link 
            href="/workspace/settings" 
            className="h-7 w-7 rounded-[2px] bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/80 dark:border-white/[0.06] transition-colors"
          >
            <ChevronLeft size={15} />
          </Link>
          <h1 className="text-lg font-bold font-mono uppercase tracking-tight text-red-600 dark:text-red-500">Giải tán Workspace</h1>
        </div>

        <Card className="border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] shadow-sm overflow-hidden relative rounded-[2px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-650 dark:bg-red-500" />
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-[2px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                <AlertTriangle size={30} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold font-mono uppercase tracking-wide text-slate-900 dark:text-slate-100">Hành động này là vĩnh viễn!</h2>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Khi bạn giải tán Workspace <span className="font-bold text-red-600 dark:text-red-400 font-mono">"{workspaceName}"</span>, toàn bộ dữ liệu và quyền truy cập sẽ bị hủy bỏ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <ImpactItem 
                icon={Users} 
                label="Thành viên sẽ mất quyền" 
                value={statsLoading ? "..." : (stats?.memberCount ?? "0")} 
              />
              <ImpactItem 
                icon={MessageSquare} 
                label="Nhóm chat sẽ bị xóa" 
                value={statsLoading ? "..." : (stats?.chatCount ?? "0")} 
              />
              <ImpactItem 
                icon={FileText} 
                label="Dung lượng giải phóng" 
                value={statsLoading ? "..." : (stats?.storageSize ?? "0 Bytes")} 
              />
              <ImpactItem 
                icon={History} 
                label="Tin nhắn sẽ bị ẩn" 
                value={statsLoading ? "..." : `${(stats?.messageCount ?? 0).toLocaleString()} tin`} 
              />
            </div>

            <div className="p-4 rounded-[2px] bg-red-50/20 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/20 space-y-3">
              <div className="flex gap-2.5">
                <ShieldAlert className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] font-mono text-red-800 dark:text-red-400 font-semibold leading-relaxed">
                  Để xác nhận giải tán, vui lòng nhập chính xác tên của Workspace này vào ô bên dưới. 
                  Hãy đảm bảo bạn đã sao lưu tất cả dữ liệu quan trọng trước khi tiếp tục.
                </p>
              </div>
              <Input 
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="h-9 bg-white dark:bg-zinc-900 text-center font-bold font-mono text-sm border-red-200 dark:border-red-900/30 focus:border-red-600 dark:focus:border-red-500 focus:ring-0 rounded-[2px] text-red-600 dark:text-red-400 placeholder:text-red-200/60"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-9 text-xs font-semibold font-mono text-slate-700 dark:text-zinc-300 rounded-[2px] border-slate-200 dark:border-white/[0.08] shadow-none"
                asChild
              >
                <Link href="/workspace/settings">HỦY BỎ</Link>
              </Button>
              <Button 
                variant="destructive" 
                className="flex-[2] h-9 text-xs font-semibold font-mono text-white rounded-[2px] bg-red-650 hover:bg-red-700 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:border dark:border-red-900/40 transition-colors shadow-none"
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
          <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-550">
            Hành động này chỉ dành cho Chủ sở hữu Workspace (Owner).
          </p>
        </div>
      </div>
    </div>
  );
}
