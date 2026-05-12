"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, Trash2, ShieldAlert } from 'lucide-react';

interface DissolveWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (workspaceNameConfirm: string) => void;
  workspaceName: string;
  isLoading: boolean;
  memberCount?: number;
  channelCount?: number;
}

export function DissolveWorkspaceModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  workspaceName,
  isLoading,
  memberCount,
  channelCount
}: DissolveWorkspaceModalProps) {
  const [confirmName, setConfirmName] = useState("");

  const handleConfirm = () => {
    if (confirmName !== workspaceName) return;
    onConfirm(confirmName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
            <AlertTriangle size={28} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-red-900">Giải tán Workspace</DialogTitle>
            <DialogDescription className="text-red-700 font-medium">
              Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu.
            </DialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3 text-slate-600">
              <div className="mt-1 shrink-0 text-red-500">
                <ShieldAlert size={18} />
              </div>
              <p className="text-sm leading-relaxed">
                Bạn đang chuẩn bị giải tán Workspace <span className="font-bold text-slate-900">{workspaceName}</span>. 
                Hành động này sẽ ảnh hưởng đến <span className="font-bold">{memberCount || 0} thành viên</span> và <span className="font-bold">{channelCount || 0} kênh</span>. 
                Tất cả dữ liệu sẽ bị xóa và <span className="font-bold text-red-600">không thể khôi phục</span>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
              <p className="text-xs font-medium leading-relaxed">
                Lời khuyên: Nếu bạn chỉ muốn rời đi, hãy cân nhắc chuyển quyền sở hữu cho một thành viên khác thay vì giải tán toàn bộ tổ chức.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">
                Nhập tên Workspace để xác nhận:
              </label>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="h-11 rounded-xl border-slate-200 focus:border-red-500 font-medium"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl font-bold text-slate-600 hover:bg-slate-200"
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 px-6"
            disabled={isLoading || confirmName !== workspaceName}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Đang giải tán...
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 size={18} />
                Giải tán ngay lập tức
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
