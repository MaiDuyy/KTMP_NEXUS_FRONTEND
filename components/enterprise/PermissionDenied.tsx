'use client';

import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PermissionDeniedProps {
    /** Custom title (default: "Access Denied") */
    title?: string;
    /** Custom message */
    message?: string;
    /** Show "Go Back" button */
    showBackButton?: boolean;
    /** Show "Contact Admin" link */
    showContactAdmin?: boolean;
}

/**
 * Permission denied state component
 * Displays when user lacks required permissions
 */
export function PermissionDenied({
    title = 'Access Denied',
    message = 'You do not have permission to view this content.',
    showBackButton = true,
    showContactAdmin = true,
}: PermissionDeniedProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <ShieldX className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">
                {title}
            </h2>

            <p className="text-muted-foreground max-w-md mb-6">
                {message}
            </p>

            <div className="flex gap-3">
                {showBackButton && (
                    <Button variant="outline" onClick={() => router.back()}>
                        Go Back
                    </Button>
                )}

                {showContactAdmin && (
                    <Button variant="ghost" asChild>
                        <a href="mailto:admin@company.com">Contact Admin</a>
                    </Button>
                )}
            </div>
        </div>
    );
}
