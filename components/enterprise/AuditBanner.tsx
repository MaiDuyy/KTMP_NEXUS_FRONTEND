'use client';

import { AlertTriangle, Info, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type BannerType = 'info' | 'warning' | 'audit';

interface AuditBannerProps {
    /** Banner type */
    type: BannerType;
    /** Main message */
    message: string;
    /** Optional secondary message */
    description?: string;
    /** Optional action */
    action?: React.ReactNode;
    /** Additional class names */
    className?: string;
}

const bannerStyles: Record<BannerType, { bg: string; border: string; icon: typeof Info }> = {
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: Info,
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        icon: AlertTriangle,
    },
    audit: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-300 dark:border-yellow-700',
        icon: Eye,
    },
};

/**
 * Enterprise audit/warning banner
 * Used for admin DM access, audited actions, security warnings
 * 
 * @example
 * <AuditBanner 
 *   type="audit" 
 *   message="This DM access is audited" 
 *   description="All actions are logged for compliance"
 * />
 */
export function AuditBanner({
    type,
    message,
    description,
    action,
    className,
}: AuditBannerProps) {
    const style = bannerStyles[type];
    const Icon = style.icon;

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border',
                style.bg,
                style.border,
                className
            )}
            role="alert"
        >
            <Icon
                className={cn(
                    'w-5 h-5 flex-shrink-0 mt-0.5',
                    type === 'info' && 'text-blue-500',
                    type === 'warning' && 'text-amber-500',
                    type === 'audit' && 'text-yellow-600'
                )}
            />

            <div className="flex-1 min-w-0">
                <p className={cn(
                    'font-medium text-sm',
                    type === 'info' && 'text-blue-800 dark:text-blue-200',
                    type === 'warning' && 'text-amber-800 dark:text-amber-200',
                    type === 'audit' && 'text-yellow-800 dark:text-yellow-200'
                )}>
                    {message}
                </p>

                {description && (
                    <p className={cn(
                        'text-sm mt-1',
                        type === 'info' && 'text-blue-700 dark:text-blue-300',
                        type === 'warning' && 'text-amber-700 dark:text-amber-300',
                        type === 'audit' && 'text-yellow-700 dark:text-yellow-300'
                    )}>
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}
