'use client';

import { RoleEditor } from '@/src/features/admin/RoleEditor';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import { USER_PERMISSIONS } from '@/src/lib/rbac/permissions';
import { Shield } from 'lucide-react';

export default function AdminRolesPage() {
    return (
        <RequirePermission permission={USER_PERMISSIONS.ADMIN_ORG}>
            <div className="container mx-auto p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        Vai trò & Quyền (Roles)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý các cấp bậc quyền hạn và phân quyền chi tiết trong hệ thống
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <RoleEditor />
                </div>
            </div>
        </RequirePermission>
    );
}
