"use client";

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  MessageSquare,
  FileText,
  Settings,
  Save,
  RefreshCw,
  Info,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PermissionGroup = ({ title, description, permissions, roles, matrix, onToggle }: any) => (
  <div className="space-y-4">
    <div className="flex flex-col">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-1/3">Hành động</th>
            {roles.map((role: string) => (
              <th key={role} className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {permissions.map((perm: any) => (
            <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 group cursor-help">
                  <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-[10px]">
                        {perm.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </td>
              {roles.map((role: string) => (
                <td key={role} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={role === 'OWNER' ? true : matrix[role]?.[perm.id]}
                      disabled={role === 'OWNER'}
                      onCheckedChange={() => onToggle(role, perm.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function PermissionsManagement() {
  const [isSaving, setIsSaving] = useState(false);
  const roles = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];

  // Mock initial state
  const [matrix, setMatrix] = useState<any>({
    ADMIN: {
      invite_member: true, remove_member: true, create_group: true, delete_group: true, edit_workspace: true
    },
    MEMBER: {
      invite_member: false, remove_member: false, create_group: true, delete_group: false, edit_workspace: false
    },
    GUEST: {
      invite_member: false, remove_member: false, create_group: false, delete_group: false, edit_workspace: false
    }
  });

  const handleToggle = (role: string, permId: string) => {
    setMatrix((prev: any) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permId]: !prev[role]?.[permId]
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Đã lưu ma trận phân quyền thành công!");
    }, 1000);
  };

  const permGroups = [
    {
      title: "Quản trị Workspace",
      description: "Các quyền cấp cao liên quan đến cấu hình hệ thống.",
      permissions: [
        { id: "edit_workspace", label: "Chỉnh sửa thông tin Workspace", description: "Cho phép thay đổi tên, logo và mô tả." },
        { id: "dissolve_workspace", label: "Giải tán Workspace", description: "Hành động hủy bỏ toàn bộ Workspace (Chỉ Owner)." },
        { id: "manage_integrations", label: "Quản lý tích hợp", description: "Cấu hình Webhook, SSO, LDAP." }
      ]
    },
    {
      title: "Quản lý Thành viên",
      description: "Các quyền liên quan đến việc điều phối nhân sự.",
      permissions: [
        { id: "invite_member", label: "Mời thành viên", description: "Gửi lời mời tham gia qua email." },
        { id: "remove_member", label: "Xóa thành viên", description: "Trục xuất thành viên khỏi Workspace." },
        { id: "change_role", label: "Thay đổi vai trò", description: "Nâng cấp hoặc hạ cấp quyền của người khác." }
      ]
    },
    {
      title: "Nhóm Chat & Tin nhắn",
      description: "Các quyền tương tác hàng ngày.",
      permissions: [
        { id: "create_group", label: "Tạo nhóm mới", description: "Tạo kênh công khai hoặc nhóm riêng tư." },
        { id: "delete_group", label: "Xóa nhóm", description: "Xóa vĩnh viễn một nhóm chat." },
        { id: "pin_message", label: "Ghim tin nhắn", description: "Ghim thông tin quan trọng trong nhóm." }
      ]
    }
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phân quyền</h1>
          <p className="text-slate-500 mt-1">Thiết lập ma trận quyền hạn chi tiết cho từng vai trò trong hệ thống.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl font-bold border-slate-200">
            <RefreshCw size={18} className="mr-2" /> Hoàn tác
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {permGroups.map((group, idx) => (
          <PermissionGroup
            key={idx}
            {...group}
            roles={roles}
            matrix={matrix}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <Card className="border-none bg-amber-50 shadow-sm border border-amber-100">
        <CardContent className="p-6 flex gap-4">
          <ShieldAlert className="text-amber-600 shrink-0" size={24} />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Lưu ý quan trọng về bảo mật</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Các thay đổi về quyền hạn sẽ có hiệu lực ngay lập tức đối với tất cả thành viên.
              Hãy cẩn trọng khi cấp quyền quản trị cho các vai trò thấp hơn.
              Quyền của <strong>OWNER</strong> là cố định và không thể thay đổi để đảm bảo tính ổn định của hệ thống.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
