'use client';

import { AdminSettingsPage } from '@/src/features/admin/AdminSettingsPage';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import { USER_PERMISSIONS } from '@/src/lib/rbac/permissions';

export default function AdminSettingsPageRoute() {
    return (
        <RequirePermission permission={USER_PERMISSIONS.ADMIN_ORG}>
            <AdminSettingsPage />
        </RequirePermission>
    );
}
