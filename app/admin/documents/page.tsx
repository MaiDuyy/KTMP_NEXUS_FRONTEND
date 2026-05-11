'use client';

import { DocumentManagement } from '@/src/features/admin/DocumentManagement';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import { USER_PERMISSIONS } from '@/src/lib/rbac/permissions';
import { FileText } from 'lucide-react';

export default function AdminDocumentsPage() {
    return (
        <RequirePermission permission={USER_PERMISSIONS.ADMIN_ORG}>
            <div className="container mx-auto p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        Quản lý tài liệu (Documents)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý kho tri thức, phê duyệt tài liệu và cấu hình RAG
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <DocumentManagement />
                </div>
            </div>
        </RequirePermission>
    );
}
