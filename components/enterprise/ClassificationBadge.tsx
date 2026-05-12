'use client';

import { cn } from '@/lib/utils';
import {
    Globe,
    Building2,
    Lock,
    ShieldAlert
} from 'lucide-react';

type Classification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

interface ClassificationBadgeProps {
    /** Document classification level */
    classification: Classification | string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show icon */
    showIcon?: boolean;
    /** Additional class names */
    className?: string;
}

const classificationConfig: Record<Classification, {
    label: string;
    bg: string;
    text: string;
    icon: typeof Globe;
}> = {
    PUBLIC: {
        label: 'Public',
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        icon: Globe,
    },
    INTERNAL: {
        label: 'Internal',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        icon: Building2,
    },
    CONFIDENTIAL: {
        label: 'Confidential',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        icon: Lock,
    },
    RESTRICTED: {
        label: 'Restricted',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        icon: ShieldAlert,
    },
};

const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

/**
 * Document classification badge
 * Displays color-coded security classification level
 * 
 * @example
 * <ClassificationBadge classification="CONFIDENTIAL" />
 * <ClassificationBadge classification="PUBLIC" size="sm" showIcon={false} />
 */
export function ClassificationBadge({
    classification,
    size = 'md',
    showIcon = true,
    className,
}: ClassificationBadgeProps) {
    const normalizedClassification = classification.toUpperCase() as Classification;
    const config = classificationConfig[normalizedClassification] || classificationConfig.INTERNAL;
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-md',
                config.bg,
                config.text,
                sizeStyles[size],
                className
            )}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
        </span>
    );
}
