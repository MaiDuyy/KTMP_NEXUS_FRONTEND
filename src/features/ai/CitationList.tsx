'use client';

import { ClassificationBadge } from '@/components/enterprise/ClassificationBadge';
import type { Citation } from '@/src/redux/feature/aiApi';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CitationListProps {
    citations: Citation[];
    onCitationClick?: (citation: Citation) => void;
    maxVisible?: number;
    className?: string;
}

/**
 * List of AI answer citations
 * Shows documents used to generate the answer
 */
export function CitationList({
    citations,
    onCitationClick,
    maxVisible = 4,
    className,
}: CitationListProps) {
    const [expanded, setExpanded] = useState(false);

    if (citations.length === 0) {
        return null;
    }

    const visibleCitations = expanded ? citations : citations.slice(0, maxVisible);
    const hasMore = citations.length > maxVisible;

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>Reference Sources</span>
                </div>
                {hasMore && (
                    <button
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Show Less' : `+${citations.length - maxVisible} More`}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {visibleCitations.map((citation, index) => (
                    <button
                        key={`${citation.documentId}-${index}`}
                        className={cn(
                            'group flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200',
                            'bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm',
                            'max-w-[200px]'
                        )}
                        onClick={() => onCitationClick?.(citation)}
                    >
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                            <FileText className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-indigo-700">
                                {citation.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-medium text-slate-400">
                                    {Math.round((citation.relevanceScore || 0.95) * 100)}% Match
                                </span>
                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-medium text-indigo-500 uppercase tracking-tighter">
                                    {citation.classification || 'Internal'}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
