import { RequirePermission } from '@/src/components/guards';
import { AI_PERMISSIONS } from '@/src/lib/rbac/permissions';

export default function AILayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequirePermission permission={AI_PERMISSIONS.ASK}>
            <div className="flex flex-col h-full">
                {/* AI Module Header */}
                <header className="h-14 border-b flex items-center px-4 gap-4">
                    <h1 className="text-lg font-semibold">AI Assistant</h1>
                    <span className="text-xs text-muted-foreground">
                        Answers from your knowledge base
                    </span>
                </header>

                {/* AI Content */}
                <main className="flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </RequirePermission>
    );
}
