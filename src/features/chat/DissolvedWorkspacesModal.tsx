"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useGetDissolvedWorkspacesQuery,
  useRestoreWorkspaceMutation
} from "@/src/redux/feature/workspaceApi";
import {
  Loader2,
  Archive,
  RefreshCcw,
  Trash2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface DissolvedWorkspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DissolvedWorkspacesModal({
  isOpen,
  onClose
}: DissolvedWorkspacesModalProps) {
  const { data: workspaces, isLoading, refetch } = useGetDissolvedWorkspacesQuery(undefined, {
    skip: !isOpen
  });

  const [restoreWorkspace, { isLoading: isRestoring }] = useRestoreWorkspaceMutation();

  const handleRestore = async (workspaceId: string, name: string) => {
    try {
      await restoreWorkspace(workspaceId).unwrap();
      toast.success(`Đã khôi phục Workspace "${name}" thành công!`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể khôi phục Workspace");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-[4px]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-600" />
            Kho lưu trữ Workspace
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500 mt-0.5">
            Danh sách Workspace đã giải tán. Khôi phục trước khi bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
              <p className="text-xs text-slate-400">Đang tải...</p>
            </div>
          ) : !workspaces || workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-[4px]">
              <Archive className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-500 text-center">
                Không có Workspace nào bị giải tán gần đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between p-3 rounded-[4px] bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 rounded-[4px] border border-slate-200 opacity-60">
                      <AvatarImage src={ws.icon} />
                      <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-bold rounded-[4px]">
                        {ws.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ws.name}</h4>
                      <div className="space-y-0.5 mt-0.5">
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Giải tán {(ws as any).dissolvedAt ? formatDistanceToNow(new Date((ws as any).dissolvedAt), { addSuffix: true, locale: vi }) : 'không rõ'}
                        </p>
                        <p className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Xóa sau {(ws as any).retentionDays || 30} ngày
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-[4px] gap-1.5"
                    onClick={() => handleRestore(ws.id, ws.name)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    Khôi phục
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200/80 dark:border-white/[0.06] flex justify-end">
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-[4px]" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
