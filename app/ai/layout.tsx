import { RequirePermission } from '@/src/components/guards';
import { AI_PERMISSIONS } from '@/src/lib/rbac/permissions';
import { Bot } from 'lucide-react';

export default function AILayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequirePermission permission={AI_PERMISSIONS.ASK}>
     
            <div className="flex flex-col h-full">
                {/* AI Module Header */}
                <header className="h-11 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">AI Assistant</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                        · Trả lời từ kho tri thức nội bộ
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
