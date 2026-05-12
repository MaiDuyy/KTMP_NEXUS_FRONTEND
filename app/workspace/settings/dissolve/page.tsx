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
import { useGetUserWorkspacesQuery, useDissolveWorkspaceMutation } from '@/src/redux/feature/workspaceApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DissolveWorkspace() {
  const router = useRouter();
  const currentWorkspaceId = useSelector((state: RootState) => state.workspace.currentWorkspaceId);
  const { data: workspaces } = useGetUserWorkspacesQuery();
  const currentWorkspace = workspaces?.find(w => w.id === currentWorkspaceId);
  const workspaceName = currentWorkspace?.name || "";

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
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white">
      <div className={`p-3 rounded-xl ${color} text-white shadow-sm`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-red-50/30 p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/workspace/settings" 
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm border border-slate-100 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-black text-red-600">Giải tán Workspace</h1>
        </div>

        <Card className="border-none bg-white shadow-xl shadow-red-200/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-3xl bg-red-100 text-red-600 shadow-inner">
                <AlertTriangle size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Hành động này là vĩnh viễn!</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Khi bạn giải tán Workspace <span className="font-bold text-red-600">"{workspaceName}"</span>, toàn bộ dữ liệu và quyền truy cập sẽ bị hủy bỏ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImpactItem icon={Users} label="Thành viên sẽ mất quyền" value="158" color="bg-blue-600" />
              <ImpactItem icon={MessageSquare} label="Nhóm chat sẽ bị xóa" value="42" color="bg-indigo-600" />
              <ImpactItem icon={FileText} label="Dung lượng giải phóng" value="12.5 GB" color="bg-emerald-600" />
              <ImpactItem icon={History} label="Tin nhắn sẽ bị ẩn" value="150k+" color="bg-amber-600" />
            </div>

            <div className="p-6 rounded-2xl bg-red-50 border border-red-100 space-y-4">
              <div className="flex gap-3">
                <ShieldAlert className="text-red-600 shrink-0" size={20} />
                <p className="text-xs text-red-800 font-medium leading-relaxed">
                  Để xác nhận giải tán, vui lòng nhập chính xác tên của Workspace này vào ô bên dưới. 
                  Hãy đảm bảo bạn đã sao lưu tất cả dữ liệu quan trọng.
                </p>
              </div>
              <Input 
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="h-12 bg-white text-center font-bold text-lg border-red-200 focus:border-red-600 focus:ring-red-600 rounded-xl"
              />
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 font-bold rounded-xl border-slate-200"
                asChild
              >
                <Link href="/workspace/settings">Hủy bỏ, quay lại</Link>
              </Button>
              <Button 
                variant="destructive" 
                className="flex-[2] h-12 font-black rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                disabled={confirmName !== workspaceName || isLoading}
                onClick={handleDissolve}
              >
                {isLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Trash2 size={18} className="mr-2" />}
                XÁC NHẬN GIẢI TÁN VĨNH VIỄN
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-slate-400 font-medium">
            Hành động này chỉ dành cho Chủ sở hữu Workspace (Owner).
          </p>
        </div>
      </div>
    </div>
  );
}
