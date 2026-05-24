import { DocumentTable } from '@/src/features/knowledge';
import { RequirePermission } from '@/src/components/guards';
import { KNOWLEDGE_PERMISSIONS } from '@/src/lib/rbac/permissions';

export default function KnowledgePage() {
    return (
        <RequirePermission permission={KNOWLEDGE_PERMISSIONS.READ}>
            <div className="m-2 py-6 space-y-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Cơ sở dữ liệu tri thức</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Duyệt và tìm kiếm các tài liệu nội bộ
                    </p>
                </div>

                <DocumentTable />
            </div>
        </RequirePermission>
    );
}
