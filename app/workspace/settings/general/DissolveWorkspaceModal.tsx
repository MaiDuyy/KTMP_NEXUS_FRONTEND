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
      <DialogContent className="sm:max-w-md rounded-[4px] p-0 overflow-hidden border border-slate-200 shadow-md">
        <div className="bg-red-50 p-4 flex items-center gap-3 border-b border-red-100/80">
          <div className="w-9 h-9 rounded-[4px] bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <DialogTitle className="text-xs font-bold text-red-900">Giải tán Workspace</DialogTitle>
            <DialogDescription className="text-[10px] text-red-700 font-semibold mt-0.5">
              Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu.
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2.5 text-slate-600">
              <div className="mt-0.5 shrink-0 text-red-500">
                <ShieldAlert size={14} />
              </div>
              <p className="text-xs leading-normal">
                Bạn đang chuẩn bị giải tán Workspace <span className="font-bold text-slate-900">{workspaceName}</span>. 
                Hành động này sẽ ảnh hưởng đến <span className="font-bold">{memberCount || 0} thành viên</span> và <span className="font-bold">{channelCount || 0} kênh</span>. 
                Tất cả dữ liệu sẽ bị xóa và <span className="font-bold text-red-600">không thể khôi phục</span>.
              </p>
            </div>

            <div className="p-3 rounded-[4px] bg-amber-50 border border-amber-100/80 text-amber-800">
              <p className="text-[11px] font-semibold leading-normal">
                Lời khuyên: Nếu bạn chỉ muốn rời đi, hãy cân nhắc chuyển quyền sở hữu cho một thành viên khác thay vì giải tán toàn bộ tổ chức.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nhập tên Workspace để xác nhận:
              </label>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="h-8 rounded-[4px] border-slate-200 focus:border-red-500 font-medium text-xs"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 gap-2.5">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-[4px] font-semibold text-slate-600 hover:bg-slate-200 h-8 text-xs px-3"
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white rounded-[4px] font-semibold h-8 text-xs shadow-none px-4 flex items-center gap-1.5"
            disabled={isLoading || confirmName !== workspaceName}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Đang giải tán...
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Trash2 size={14} />
                Giải tán ngay lập tức
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
