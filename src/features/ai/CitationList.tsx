'use client';

import Link from 'next/link';
import type { Citation } from '@/src/redux/feature/aiApi';
import { FileText, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CitationListProps {
    citations: Citation[];
    onCitationClick?: (citation: Citation) => void;
    maxVisible?: number;
    className?: string;
}

/**
 * Resolve the href for a citation:
 *  1. If citation has a wiki slug → /wiki/[slug]
 *  2. Fallback → /knowledge/[documentId]
 */
function getCitationHref(citation: Citation): string {
    if (citation.slug) return `/wiki/${citation.slug}`;
    return `/knowledge/${citation.documentId}`;
}

/**
 * List of AI answer citations.
 * Each card is a Next.js Link pointing to the wiki page (or knowledge fallback).
 * Cmd/Ctrl+click opens in a new tab automatically via Next.js Link.
 */
export function CitationList({
    citations,
    onCitationClick,
    maxVisible = 4,
    className,
}: CitationListProps) {
    const [expanded, setExpanded] = useState(false);

    if (citations.length === 0) return null;

    const visibleCitations = expanded ? citations : citations.slice(0, maxVisible);
    const hasMore = citations.length > maxVisible;

    return (
        <div className={cn('space-y-2.5', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <FileText className="w-3 h-3 text-primary/60" />
                    <span>Nguồn tham khảo</span>
                </div>
                {hasMore && (
                    <button
                        type="button"
                        className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest cursor-pointer"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Thu gọn' : `+${citations.length - maxVisible} Thêm`}
                    </button>
                )}
            </div>

            {/* Citation Cards */}
            <div className="flex flex-wrap gap-2">
                {visibleCitations.map((citation, index) => {
                    const href = getCitationHref(citation);
                    const isWikiLink = !!citation.slug;

                    return (
                        <Link
                            key={`${citation.documentId}-${index}`}
                            href={href}
                            onClick={() => onCitationClick?.(citation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Mở: ${citation.title}${isWikiLink ? ' (Wiki)' : ' (Tài liệu)'}`}
                            className={cn(
                                'group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left no-underline',
                                'transition-colors duration-150 cursor-pointer',
                                'bg-card border border-border',
                                'hover:border-primary/40 hover:bg-primary/5',
                                'max-w-[240px]'
                            )}
                        >
                            {/* File icon */}
                            <div className="flex-shrink-0 w-5 h-5 rounded bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <FileText className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>

                            {/* Text block */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[12px] font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                                    {citation.title}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-medium text-muted-foreground">
                                        {Math.round((citation.relevanceScore || 0.95) * 100)}% phù hợp
                                    </span>
                                    <span className="w-0.5 h-0.5 rounded-full bg-border flex-shrink-0" />
                                    <span className={cn(
                                        'text-[9px] font-bold uppercase tracking-tighter',
                                        isWikiLink ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                                    )}>
                                        {isWikiLink ? 'Wiki' : (citation.classification || 'Nội bộ')}
                                    </span>
                                </div>
                            </div>

                            {/* External link indicator */}
                            <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
