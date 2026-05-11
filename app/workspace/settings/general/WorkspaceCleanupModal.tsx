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
import { AlertTriangle, ChevronRight, ShieldCheck, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CleanupItem {
  id: string;
  name: string;
  type: 'CHANNEL' | 'GROUP';
}

interface WorkspaceCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedItems: CleanupItem[];
  members: any[];
  onProcessItem: (itemId: string, type: 'CHANNEL' | 'GROUP', action: 'TRANSFER' | 'DELETE', targetUserId?: string) => Promise<void>;
  onFinish: () => void;
}

export function WorkspaceCleanupModal({ 
  isOpen, 
  onClose, 
  ownedItems, 
  members,
  onProcessItem,
  onFinish 
}: WorkspaceCleanupModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const currentItem = ownedItems[currentIndex];
  const isLast = currentIndex === ownedItems.length - 1;

  const handleAction = async (action: 'TRANSFER' | 'DELETE', targetUserId?: string) => {
    if (!currentItem) return;
    setIsProcessing(true);
    try {
      await onProcessItem(currentItem.id, currentItem.type, action, targetUserId);
      if (isLast) {
        onFinish();
      } else {
        setCurrentIndex(currentIndex + 1);
        setShowMemberPicker(false);
      }
    } catch (err) {
      // Error handling is managed by the parent via toast
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold">Xử lý quyền sở hữu</h2>
          </div>
          <p className="text-blue-100 text-sm">
            Bạn đang là OWNER của {ownedItems.length} nhóm/kênh. Vui lòng bàn giao hoặc xóa chúng trước khi rời khỏi Workspace.
          </p>
          <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / ownedItems.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-8">
          {!showMemberPicker ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang xử lý ({currentIndex + 1}/{ownedItems.length})</p>
                <h3 className="text-2xl font-bold text-slate-900">{currentItem?.name}</h3>
                <p className="text-slate-500 text-sm">Loại: {currentItem?.type === 'CHANNEL' ? 'Kênh Workspace' : 'Nhóm Chat'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 rounded-2xl flex flex-col gap-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 group transition-all"
                  onClick={() => setShowMemberPicker(true)}
                  disabled={isProcessing}
                >
                  <UserPlus size={24} className="text-slate-400 group-hover:text-blue-600" />
                  <span className="font-bold text-slate-700 group-hover:text-blue-700">Chuyển quyền</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 rounded-2xl flex flex-col gap-2 border-slate-200 hover:border-red-500 hover:bg-red-50 group transition-all"
                  onClick={() => handleAction('DELETE')}
                  disabled={isProcessing}
                >
                  <Trash2 size={24} className="text-slate-400 group-hover:text-red-600" />
                  <span className="font-bold text-slate-700 group-hover:text-red-700">Xóa nhóm</span>
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nếu bạn xóa nhóm, tất cả tin nhắn và thành viên sẽ bị loại bỏ. Nếu bạn chuyển quyền, bạn sẽ trở thành thành viên bình thường.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Chọn người nhận quyền</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowMemberPicker(false)} className="text-xs font-bold">Quay lại</Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {members.map((member: any) => (
                  <div 
                    key={member.userId}
                    onClick={() => handleAction('TRANSFER', member.userId)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {member.user?.name?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{member.user?.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
          {isProcessing && (
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Loader2 size={18} className="animate-spin" />
              Đang xử lý yêu cầu...
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
