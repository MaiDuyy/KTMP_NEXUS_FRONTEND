'use client';

import { InvitationsTable } from '@/src/features/admin/InvitationsTable';
import { InviteDialog } from '@/src/features/admin/InviteDialog';
import { RequirePermission } from '@/src/components/guards/RequirePermission';
import { USER_PERMISSIONS } from '@/src/lib/rbac/permissions';
import { Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function AdminInvitationsPage() {
    const [showInviteDialog, setShowInviteDialog] = useState(false);

    return (
        <RequirePermission permission={USER_PERMISSIONS.ADMIN_ORG}>
            <div className="container mx-auto p-6 space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Mail className="w-8 h-8 text-primary" />
                            Lời mời (Invitations)
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Quản lý các lời mời tham gia tổ chức đang chờ xử lý
                        </p>
                    </div>
                    <Button onClick={() => setShowInviteDialog(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Mời thành viên mới
                    </Button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <InvitationsTable />
                </div>

                <InviteDialog open={showInviteDialog} onOpenChange={setShowInviteDialog} />
            </div>
        </RequirePermission>
    );
}
