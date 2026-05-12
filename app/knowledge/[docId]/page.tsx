import { DocumentPreview } from '@/src/features/knowledge';
import { RequirePermission } from '@/src/components/guards';
import { KNOWLEDGE_PERMISSIONS } from '@/src/lib/rbac/permissions';

interface Props {
    params: Promise<{ docId: string }>;
}

export default async function DocumentDetailPage({ params }: Props) {
    const { docId } = await params;

    return (
        <RequirePermission permission={KNOWLEDGE_PERMISSIONS.READ}>
            <div className="m-2 py-6">
                <DocumentPreview documentId={docId} showChunks />
            </div>
        </RequirePermission>
    );
}
