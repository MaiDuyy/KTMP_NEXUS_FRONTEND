"use client";

import React from 'react';
import { Shield, Crown, ShieldCheck, User, UserX, Check, X, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Permission Matrix (reflects actual backend RBAC logic) ──────────────────
const ROLES = [
  { key: 'WORKSPACE_OWNER',  label: 'Owner',  icon: Crown,        color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { key: 'WORKSPACE_ADMIN',  label: 'Admin',  icon: ShieldCheck,  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'WORKSPACE_MEMBER', label: 'Member', icon: User,         color: 'text-slate-600 bg-slate-50 border-slate-200' },
  { key: 'WORKSPACE_GUEST',  label: 'Guest',  icon: UserX,        color: 'text-slate-400 bg-slate-50 border-slate-100' },
];

const PERMISSION_GROUPS = [
  {
    section: 'Quản trị Workspace',
    items: [
      { label: 'Xem thông tin Workspace',     tip: 'Xem tên, mô tả và cấu hình Workspace.',               OWNER: true,  ADMIN: true,  MEMBER: true,  GUEST: true  },
      { label: 'Chỉnh sửa thông tin WS',      tip: 'Thay đổi tên, slug, mô tả Workspace.',                OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Giải tán Workspace',           tip: 'Chỉ Owner mới có thể giải tán hoàn toàn.',            OWNER: true,  ADMIN: false, MEMBER: false, GUEST: false },
      { label: 'Khôi phục Workspace đã giải', tip: 'Khôi phục trong thời gian lưu trữ (30 ngày).',       OWNER: true,  ADMIN: false, MEMBER: false, GUEST: false },
      { label: 'Chuyển quyền sở hữu',         tip: 'Trao quyền Owner cho thành viên khác.',               OWNER: true,  ADMIN: false, MEMBER: false, GUEST: false },
    ],
  },
  {
    section: 'Quản lý Thành viên',
    items: [
      { label: 'Xem danh sách thành viên',    tip: 'Truy cập trang danh sách thành viên.',                OWNER: true,  ADMIN: true,  MEMBER: true,  GUEST: false },
      { label: 'Mời thành viên qua email',    tip: 'Gửi lời mời tham gia Workspace.',                     OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Xóa thành viên',              tip: 'Trục xuất thành viên (không thể xóa Owner).',        OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Thay đổi vai trò thành viên', tip: 'Nâng/hạ role của thành viên (không cao hơn mình).',  OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Hủy lời mời đang chờ',       tip: 'Thu hồi lời mời chưa được chấp nhận.',               OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
    ],
  },
  {
    section: 'Nhóm Chat',
    items: [
      { label: 'Xem danh sách nhóm chat',     tip: 'Truy cập và xem các nhóm trong Workspace.',           OWNER: true,  ADMIN: true,  MEMBER: true,  GUEST: true  },
      { label: 'Tạo nhóm chat mới',           tip: 'Tạo nhóm chat trong Workspace.',                      OWNER: true,  ADMIN: true,  MEMBER: true,  GUEST: false },
      { label: 'Xóa nhóm chat',               tip: 'Chỉ nhóm trưởng hoặc Admin WS mới xóa được.',        OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Quản lý thành viên nhóm',     tip: 'Thêm/xóa/phân quyền thành viên trong nhóm.',         OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
    ],
  },
  {
    section: 'Kênh thảo luận (Channel)',
    items: [
      { label: 'Xem kênh công khai',          tip: 'Đọc tin nhắn trong kênh PUBLIC.',                     OWNER: true,  ADMIN: true,  MEMBER: true,  GUEST: true  },
      { label: 'Tạo kênh mới',                tip: 'Tạo kênh PUBLIC hoặc PRIVATE trong Workspace.',       OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Xóa kênh',                    tip: 'Xóa kênh (chỉ Channel Owner hoặc WS Admin).',        OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
      { label: 'Lưu trữ/Khôi phục kênh',     tip: 'Archive hoặc Unarchive một kênh.',                   OWNER: true,  ADMIN: true,  MEMBER: false, GUEST: false },
    ],
  },
];

// ─── Cell: Yes/No ─────────────────────────────────────────────────────────────
const PermCell = ({ allowed }: { allowed: boolean }) => (
  <td className="px-4 py-3 text-center">
    <div className="flex justify-center">
      {allowed
        ? <Check size={16} className="text-emerald-600 font-bold" strokeWidth={3} />
        : <X size={16} className="text-slate-200" strokeWidth={2.5} />}
    </div>
  </td>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PermissionsReference() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Phân quyền</h1>
        <p className="text-slate-500 mt-1">Ma trận quyền hạn theo vai trò trong Workspace. Quyền được thực thi ở cấp độ Backend.</p>
      </div>

      {/* Notice */}
      <Card className="border-blue-100 bg-blue-50/60 shadow-none">
        <CardContent className="p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Đây là tài liệu tham chiếu</p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              Quyền hạn được <strong>tự động áp dụng</strong> bởi hệ thống dựa trên vai trò. 
              Để thay đổi quyền của một thành viên, hãy điều chỉnh <strong>Vai trò (Role)</strong> của họ trong trang <a href="/workspace/settings/members" className="underline font-bold">Danh sách thành viên</a>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3">
        {ROLES.map(({ label, icon: Icon, color }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${color}`}>
            <Icon size={13} />
            {label}
          </div>
        ))}
      </div>

      {/* Permission tables */}
      <div className="space-y-8">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.section} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Shield size={15} className="text-slate-400" />
              {group.section}
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-1/2">Quyền hạn</th>
                    {ROLES.map(({ key, label, icon: Icon, color }) => (
                      <th key={key} className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold ${color}`}>
                          <Icon size={10} />
                          {label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((perm) => (
                    <tr key={perm.label} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-slate-700 cursor-help flex items-center gap-1.5">
                                {perm.label}
                                <Info size={11} className="text-slate-300" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[220px] text-xs">
                              {perm.tip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <PermCell allowed={perm.OWNER} />
                      <PermCell allowed={perm.ADMIN} />
                      <PermCell allowed={perm.MEMBER} />
                      <PermCell allowed={perm.GUEST} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
