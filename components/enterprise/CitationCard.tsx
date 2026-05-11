'use client';

import { FileText, ExternalLink } from 'lucide-react';
import { ClassificationBadge } from './ClassificationBadge';
import { cn } from '@/lib/utils';

interface CitationCardProps {
    /** Document ID for linking */
    documentId: string;
    /** Document title */
    title: string;
    /** Classification level */
    classification: string;
    /** Source type (UPLOAD, GDRIVE, etc.) */
    sourceType?: string;
    /** Chunk/section reference */
    section?: string;
    /** Relevance score (0-1) */
    relevanceScore?: number;
    /** Click handler */
    onClick?: () => void;
    /** Additional class names */
    className?: string;
}

/**
 * Citation card for AI answers
 * Shows document source with classification badge
 * 
 * @example
 * <CitationCard
 *   documentId="doc-123"
 *   title="Company Policy 2024"
 *   classification="INTERNAL"
 *   sourceType="UPLOAD"
 *   section="Section 3.2"
 * />
 */
export function CitationCard({
    documentId,
    title,
    classification,
    sourceType,
    section,
    relevanceScore,
    onClick,
    className,
}: CitationCardProps) {
    return (
        <div
            className={cn(
                'group flex items-start gap-3 p-3 rounded-lg border',
                'bg-muted/50 hover:bg-muted transition-colors cursor-pointer',
                className
            )}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        >
            <div className="flex-shrink-0 w-8 h-8 rounded bg-background flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground truncate">
                        {title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <ClassificationBadge classification={classification} size="sm" />

                    {sourceType && (
                        <span className="text-xs text-muted-foreground">
                            {sourceType}
                        </span>
                    )}

                    {section && (
                        <span className="text-xs text-muted-foreground">
                            • {section}
                        </span>
                    )}

                    {relevanceScore !== undefined && (
                        <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round(relevanceScore * 100)}% match
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
