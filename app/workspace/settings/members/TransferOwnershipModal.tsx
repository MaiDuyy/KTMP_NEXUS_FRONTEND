"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Crown, Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shouldLeave: boolean) => void;
  targetMember: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  } | null;
  isLoading: boolean;
}

export function TransferOwnershipModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  targetMember,
  isLoading 
}: TransferOwnershipModalProps) {
  const [shouldLeave, setShouldLeave] = React.useState(false);

  if (!targetMember) return null;

  const isMemberOnly = targetMember.role === 'MEMBER';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading && !open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-amber-50 p-6 flex items-center gap-4 border-b border-amber-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <Crown size={28} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-amber-900">Chuyển quyền sở hữu</DialogTitle>
            <DialogDescription className="text-amber-700 font-medium">
              Hành động này có tính chất quan trọng và không thể hoàn tác.
            </DialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
              <AvatarImage src={targetMember.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-bold">
                {targetMember.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-lg">{targetMember.name}</p>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold text-[10px]">
                  {targetMember.role}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium">{targetMember.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 text-slate-600">
              <div className="mt-1 shrink-0 text-blue-500">
                <ShieldAlert size={18} />
              </div>
              <p className="text-sm leading-relaxed">
                Bạn đang chuyển toàn bộ quyền kiểm soát Workspace cho <span className="font-bold text-slate-900">{targetMember.name}</span>. 
                Sau khi xác nhận, vai trò của bạn sẽ được chuyển thành <span className="font-bold text-blue-600">ADMIN</span>.
              </p>
            </div>

            {isMemberOnly && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700">
                <div className="mt-0.5 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Lưu ý: Người dùng này hiện là <span className="font-bold">MEMBER</span>. Họ sẽ được nâng cấp trực tiếp lên <span className="font-bold">OWNER</span> mà không qua cấp ADMIN.
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="leave-after-transfer" 
                  checked={shouldLeave}
                  onCheckedChange={(checked) => setShouldLeave(!!checked)}
                  className="mt-1 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="leave-after-transfer"
                    className={`text-sm font-bold text-slate-800 leading-none ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    Rời khỏi Workspace sau khi chuyển quyền
                  </label>
                  <p className="text-xs text-slate-500">
                    Bạn sẽ mất quyền truy cập vào tất cả tin nhắn và kênh của Workspace này ngay sau khi chuyển quyền.
                  </p>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 font-medium italic border-t border-slate-200 pt-3">
                * Bạn chỉ có thể lấy lại quyền OWNER nếu người sở hữu mới thực hiện chuyển quyền lại cho bạn.
              </p>
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
            onClick={() => onConfirm(shouldLeave)}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-200 px-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <div className="flex items-center gap-2">
                {shouldLeave ? <LogOut size={18} /> : <Crown size={18} />}
                {shouldLeave ? "Chuyển quyền & Rời đi" : "Xác nhận chuyển quyền"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
