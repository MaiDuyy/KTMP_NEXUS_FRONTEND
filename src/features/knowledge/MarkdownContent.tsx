'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
    content: string;
    className?: string;
    isInverted?: boolean;
}

export function MarkdownContent({ content, className, isInverted = false }: MarkdownContentProps) {
    return (
        <div className={cn(
            "prose max-w-none text-sm leading-relaxed text-justify",
            isInverted ? "prose-invert text-slate-300" : "prose-slate text-slate-800 dark:prose-invert dark:text-slate-300",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className={cn(
                            "text-xl font-extrabold mt-6 mb-3 border-b pb-2",
                            isInverted ? "text-white border-slate-850" : "text-slate-900 border-slate-100 dark:text-white dark:border-slate-800"
                        )} {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className={cn(
                            "text-lg font-bold mt-5 mb-2.5",
                            isInverted ? "text-slate-100" : "text-slate-800 dark:text-slate-100"
                        )} {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className={cn(
                            "text-base font-bold mt-4 mb-2",
                            isInverted ? "text-slate-200" : "text-slate-800 dark:text-slate-200"
                        )} {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className={cn(
                            "text-sm font-semibold mt-3 mb-1.5",
                            isInverted ? "text-slate-300" : "text-slate-800 dark:text-slate-300"
                        )} {...props} />
                    ),
                    p: ({ node, ...props }) => (
                        <p className={cn(
                            "mb-4",
                            isInverted ? "text-slate-400" : "text-slate-650 dark:text-slate-400"
                        )} {...props} />
                    ),
                    
                    ul: ({ node, ...props }) => (
                        <ul className={cn(
                            "list-disc pl-5 space-y-1 mb-4",
                            isInverted ? "text-slate-450" : "text-slate-600 dark:text-slate-400"
                        )} {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className={cn(
                            "list-decimal pl-5 space-y-1 mb-4",
                            isInverted ? "text-slate-450" : "text-slate-600 dark:text-slate-400"
                        )} {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className={cn(
                            "pl-1",
                            isInverted ? "text-slate-405" : "text-slate-600 dark:text-slate-400"
                        )} {...props} />
                    ),
                    
                    blockquote: ({ node, ...props }) => (
                        <blockquote className={cn(
                            "border-l-4 pl-4 italic my-4 py-2.5 pr-2 rounded-r-[4px]",
                            isInverted 
                                ? "border-primary/40 text-slate-500 bg-slate-900/40" 
                                : "border-primary/45 text-slate-500 bg-slate-50/50 dark:border-primary/40 dark:text-slate-400 dark:bg-slate-900/40"
                        )} {...props} />
                    ),
                    
                    table: ({ node, ...props }) => (
                        <div className={cn(
                            "not-prose overflow-x-auto my-6 border rounded-[4px] shadow-sm",
                            isInverted ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/30"
                        )}>
                            <table className={cn(
                                "min-w-full divide-y text-xs text-left",
                                isInverted ? "divide-slate-800" : "divide-slate-200 dark:divide-slate-850"
                            )} {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className={cn(
                            "font-semibold",
                            isInverted ? "bg-slate-900/80 text-slate-300" : "bg-slate-50 text-slate-700 dark:bg-slate-900/80 dark:text-slate-300"
                        )} {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                        <tbody className={cn(
                            "divide-y",
                            isInverted ? "divide-slate-800 bg-transparent" : "divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent"
                        )} {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className={cn(
                            "transition-colors",
                            isInverted ? "hover:bg-slate-800/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                        )} {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className={cn(
                            "px-4 py-3 font-semibold border-b",
                            isInverted ? "border-slate-800 bg-slate-900 text-slate-250" : "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-250"
                        )} {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className={cn(
                            "px-4 py-3 font-medium border-b",
                            isInverted ? "border-slate-850 text-slate-350" : "border-slate-100 text-slate-650 dark:border-slate-850 dark:text-slate-350"
                        )} {...props} />
                    ),
                    
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return isInline ? (
                            <code className={cn(
                                "px-1.5 py-0.5 rounded font-mono text-[11px]",
                                isInverted ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            )} {...props}>
                                {children}
                            </code>
                        ) : (
                            <pre className={cn(
                                "p-4 rounded-[4px] font-mono text-xs overflow-x-auto shadow-inner my-4 relative border",
                                isInverted ? "bg-slate-950 text-slate-300 border-slate-800" : "bg-slate-900 text-slate-100 border-transparent dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800"
                            )}>
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
