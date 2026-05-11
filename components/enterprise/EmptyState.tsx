'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    /** Icon to display */
    icon?: LucideIcon;
    /** Title text */
    title: string;
    /** Description text */
    description?: string;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Secondary action */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional class names */
    className?: string;
}

const sizeStyles = {
    sm: {
        container: 'py-8',
        icon: 'w-10 h-10',
        iconWrapper: 'w-14 h-14',
        title: 'text-base',
        description: 'text-sm',
    },
    md: {
        container: 'py-12',
        icon: 'w-12 h-12',
        iconWrapper: 'w-20 h-20',
        title: 'text-lg',
        description: 'text-sm',
    },
    lg: {
        container: 'py-16',
        icon: 'w-16 h-16',
        iconWrapper: 'w-24 h-24',
        title: 'text-xl',
        description: 'text-base',
    },
};

/**
 * Reusable empty state component
 * 
 * @example
 * <EmptyState
 *   icon={FileQuestion}
 *   title="No documents found"
 *   description="Upload your first document to get started"
 *   action={{ label: "Upload Document", onClick: handleUpload }}
 * />
 */
export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    secondaryAction,
    size = 'md',
    className,
}: EmptyStateProps) {
    const styles = sizeStyles[size];

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center px-4',
                styles.container,
                className
            )}
        >
            <div
                className={cn(
                    'rounded-full bg-muted flex items-center justify-center mb-4',
                    styles.iconWrapper
                )}
            >
                <Icon className={cn('text-muted-foreground', styles.icon)} />
            </div>

            <h3 className={cn('font-semibold text-foreground mb-1', styles.title)}>
                {title}
            </h3>

            {description && (
                <p className={cn('text-muted-foreground max-w-sm mb-4', styles.description)}>
                    {description}
                </p>
            )}

            {(action || secondaryAction) && (
                <div className="flex gap-3">
                    {action && (
                        <Button onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="outline" onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
