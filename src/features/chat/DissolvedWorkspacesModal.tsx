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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-slate-50 to-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Archive className="w-6 h-6 text-amber-600" />
            </div>
            Kho lưu trữ Workspace
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Danh sách các Workspace đã bị giải tán. Bạn có thể khôi phục chúng trước khi bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
              <p className="text-sm text-slate-400 font-medium">Đang tải danh sách...</p>
            </div>
          ) : !workspaces || workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="p-4 rounded-full bg-slate-50 mb-4">
                <Archive className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium text-center max-w-[250px]">
                Không có Workspace nào bị giải tán gần đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm opacity-60 grayscale-[0.5]">
                      <AvatarImage src={ws.icon} />
                      <AvatarFallback className="bg-slate-200 text-slate-500 font-bold uppercase">
                        {ws.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700">{ws.name}</h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Đã giải tán {ws.dissolvedAt ? formatDistanceToNow(new Date(ws.dissolvedAt), { addSuffix: true, locale: vi }) : "không rõ"}
                        </p>
                        <p className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Sẽ bị xóa sau {ws.retentionDays || 30} ngày kể từ lúc giải tán
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-100 transition-all active:scale-95"
                    onClick={() => handleRestore(ws.id, ws.name)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                    Khôi phục
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-slate-50/50">
          <Button variant="ghost" className="font-bold text-slate-600 hover:bg-slate-100 rounded-xl w-full" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
