'use client';

import { useState } from 'react';
import { UserTable } from '@/src/features/admin';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import { USER_PERMISSIONS } from '@/src/lib/rbac/permissions';
import { InviteDialog } from '@/src/features/admin/InviteDialog';
import { UserEditDialog } from '@/src/features/admin/UserEditDialog';
import { User } from '@/src/redux/feature/adminApi';

export default function UsersPage() {

    return (
        <RequirePermission permission={USER_PERMISSIONS.ADMIN_ORG}>
            <div className="container mx-auto py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
                    <p className="text-muted-foreground">
                        Quản lý người dùng, vai trò và quyền truy cập
                    </p>
                </div>

                <UserTable />
            </div>
        </RequirePermission>
    );
}
