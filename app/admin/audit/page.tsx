'use client';

import { AuditLogsPage } from '@/src/features/admin/AuditLogsPage';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import { USER_PERMISSIONS } from '@/src/lib/rbac/permissions';

export default function AdminAuditPage() {
    return (
        <RequirePermission permission={USER_PERMISSIONS.ADMIN_ORG}>
            <AuditLogsPage />
        </RequirePermission>
    );
}
