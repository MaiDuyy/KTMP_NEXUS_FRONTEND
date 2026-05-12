import { AuditLogTable } from '@/src/features/security';
import { RequirePermission } from '@/src/components/guards';
import { SECURITY_PERMISSIONS } from '@/src/lib/rbac/permissions';
import { AuditBanner } from '@/components/enterprise/AuditBanner';

export default function AuditLogsPage() {
    return (
        <RequirePermission permission={SECURITY_PERMISSIONS.AUDIT_VIEW}>
            <div className="container py-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        View and search system audit events
                    </p>
                </div>

                <AuditBanner
                    type="info"
                    message="Audit logs are immutable and cannot be modified"
                    description="All access to this page is logged for compliance purposes"
                />

                <AuditLogTable />
            </div>
        </RequirePermission>
    );
}
