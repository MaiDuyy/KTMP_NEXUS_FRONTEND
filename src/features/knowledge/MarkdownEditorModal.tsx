'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIngestDocumentMutation, useAiRefactorDocumentMutation, useGetRawDocumentQuery } from '@/src/redux/feature/knowledgeApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    FileText,
    Loader2,
    CheckCircle,
    Eye,
    Edit3,
    Split,
    AlertTriangle,
    Save,
    X,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MarkdownEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMarkdown: string;
    documentId: number;
    fileName: string;
    onSuccess?: () => void;
}

export function MarkdownEditorModal({
    isOpen,
    onClose,
    initialMarkdown,
    documentId,
    fileName,
    onSuccess
}: MarkdownEditorModalProps) {
    const [markdown, setMarkdown] = useState(initialMarkdown);
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
    const [previewTab, setPreviewTab] = useState<'markdown' | 'pdf'>('markdown');
    const [ingestDocument, { isLoading: isIngesting }] = useIngestDocumentMutation();
    const [aiRefactorDocument, { isLoading: isRefactoring }] = useAiRefactorDocumentMutation();

    const { data: rawBlob, isLoading: isPdfLoading } = useGetRawDocumentQuery(documentId.toString(), {
        skip: previewTab !== 'pdf',
    });

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (rawBlob) {
            const url = URL.createObjectURL(rawBlob);
            setPdfUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [rawBlob]);

    useEffect(() => {
        setMarkdown(initialMarkdown);
    }, [initialMarkdown, isOpen]);

    const handleSaveAndIngest = async () => {
        if (!markdown.trim()) {
            toast.error('Nội dung Markdown không được để trống');
            return;
        }

        try {
            await ingestDocument({
                id: documentId,
                markdownContent: markdown
            }).unwrap();
            toast.success('Phê duyệt và lưu trữ tài liệu thành công!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Ingest error:', err);
            toast.error(err.data?.message || 'Có lỗi xảy ra khi phê duyệt tài liệu');
        }
    };

    const handleAiRefactor = async () => {
        const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
        const selectedText = textarea ? markdown.substring(textarea.selectionStart, textarea.selectionEnd) : '';

        const isPartial = selectedText.length > 0;
        
        try {
            const res = await aiRefactorDocument({
                id: documentId,
                body: {
                    mode: isPartial ? 'PARTIAL' : 'FULL_DOCUMENT',
                    targetText: isPartial ? selectedText : undefined,
                }
            }).unwrap();
            
            setMarkdown(res.refactoredMarkdown);
            toast.success(isPartial ? 'Đã dùng AI sửa cấu trúc đoạn chọn!' : 'Đã dùng AI chuẩn hóa toàn bộ tài liệu!');
        } catch (err: any) {
            console.error('AI Refactor error:', err);
            toast.error(err.data?.message || 'Có lỗi xảy ra khi dùng AI');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-7xl h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-slate-900 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-slate-100 rounded-md">
                {/* Header */}
                <DialogHeader className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                                Biên tập & Phê duyệt cấu trúc tài liệu
                            </DialogTitle>
                            <p className="text-[10px] text-slate-500 mt-0.5 max-w-2xl truncate font-mono">
                                File: {fileName} (ID: {documentId})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Modes */}
                        <div className="flex items-center bg-slate-900 p-0.5 rounded-md border border-slate-800">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('edit')}
                                className={cn(
                                    "rounded-sm px-2.5 py-1 h-7 text-[11px] font-semibold gap-1.5 transition-all text-slate-400 hover:text-slate-200",
                                    viewMode === 'edit' && "bg-slate-800 text-white shadow-sm"
                                )}
                            >
                                <Edit3 className="w-3 h-3" />
                                Chỉ sửa
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('split')}
                                className={cn(
                                    "rounded-sm px-2.5 py-1 h-7 text-[11px] font-semibold gap-1.5 transition-all text-slate-400 hover:text-slate-200",
                                    viewMode === 'split' && "bg-slate-800 text-white shadow-sm"
                                )}
                            >
                                <Split className="w-3 h-3" />
                                Song song
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('preview')}
                                className={cn(
                                    "rounded-sm px-2.5 py-1 h-7 text-[11px] font-semibold gap-1.5 transition-all text-slate-400 hover:text-slate-200",
                                    viewMode === 'preview' && "bg-slate-800 text-white shadow-sm"
                                )}
                            >
                                <Eye className="w-3 h-3" />
                                Xem trước
                            </Button>
                        </div>

                        {/* Close button inside standard shadcn dialog is top-right, but let's have a manual clean action button */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose}
                            className="rounded h-7 w-7 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Editor & Preview Area */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-slate-950">
                    {/* Left Pane: Editor */}
                    <div 
                        className={cn(
                            "flex flex-col border-r border-slate-800 h-full overflow-hidden bg-slate-950/60",
                            viewMode === 'preview' && "hidden",
                            viewMode === 'edit' && "md:col-span-2 border-r-0"
                        )}
                    >
                        <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <span>Markdown Editor (Có thể chỉnh sửa tiêu đề, bảng, danh sách)</span>
                            <span className="font-mono text-primary/70">{markdown.length} kí tự</span>
                        </div>
                        <div className="flex-1 relative p-3 overflow-hidden">
                            <textarea
                                id="markdown-editor"
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                placeholder="Nhập văn bản Markdown..."
                                className="w-full h-full bg-transparent text-slate-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 placeholder-slate-700 select-text overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                                style={{ tabSize: 4 }}
                                disabled={isIngesting || isRefactoring}
                            />
                        </div>
                    </div>

                    {/* Right Pane: Live HTML Preview */}
                    <div 
                        className={cn(
                            "flex flex-col h-full overflow-hidden bg-slate-900/40",
                            viewMode === 'edit' && "hidden",
                            viewMode === 'preview' && "md:col-span-2"
                        )}
                    >
                        <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPreviewTab('markdown')}
                                    className={cn(
                                        "px-2 py-0.5 rounded transition-colors",
                                        previewTab === 'markdown' ? "bg-slate-800 text-slate-200" : "hover:text-slate-300"
                                    )}
                                >
                                    Bản xem trước (Render HTML)
                                </button>
                                <button
                                    onClick={() => setPreviewTab('pdf')}
                                    className={cn(
                                        "px-2 py-0.5 rounded transition-colors",
                                        previewTab === 'pdf' ? "bg-slate-800 text-slate-200" : "hover:text-slate-300"
                                    )}
                                >
                                    Bản gốc (PDF)
                                </button>
                            </div>
                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 uppercase">
                                <CheckCircle className="w-2.5 h-2.5" /> Layout-Aware
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto select-text pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent flex flex-col bg-slate-950">
                            {previewTab === 'markdown' ? (
                                <div className="p-5 prose prose-invert max-w-none text-slate-300 select-text pb-8">
                                {markdown ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-extrabold text-white mt-4 mb-2.5 border-b border-slate-800 pb-1.5" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-slate-100 mt-3.5 mb-2 border-b border-slate-900/50 pb-0.5" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold text-slate-200 mt-3 mb-1.5" {...props} />,
                                            h4: ({ node, ...props }) => <h4 className="text-sm font-semibold text-slate-300 mt-2 mb-1" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-slate-400 text-xs leading-relaxed mb-3 text-justify" {...props} />,
                                            
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 mb-3 text-slate-400 text-xs" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 mb-3 text-slate-400 text-xs" {...props} />,
                                            li: ({ node, ...props }) => <li className="pl-0.5 text-slate-400 text-xs" {...props} />,
                                            
                                            blockquote: ({ node, ...props }) => (
                                                <blockquote className="border-l-2 border-primary/40 pl-3 italic my-3 text-slate-500 bg-slate-900/40 py-2 pr-2 rounded-r-md text-xs" {...props} />
                                            ),
                                            
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-4 border border-slate-800 rounded-md shadow bg-slate-900/30">
                                                    <table className="min-w-full divide-y divide-slate-800 text-[11px] text-left" {...props} />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }) => <thead className="bg-slate-900/80 font-semibold text-slate-300" {...props} />,
                                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-800 bg-transparent" {...props} />,
                                            tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/20 transition-colors" {...props} />,
                                            th: ({ node, ...props }) => <th className="px-3 py-2 font-semibold border-b border-slate-800 bg-slate-900 text-slate-250" {...props} />,
                                            td: ({ node, ...props }) => <td className="px-3 py-2 text-slate-350 border-b border-slate-850 font-medium" {...props} />,
                                            
                                            code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const isInline = !match;
                                                return isInline ? (
                                                    <code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded font-mono text-[10px]" {...props}>
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <pre className="bg-slate-950 text-slate-300 p-3 rounded-md font-mono text-[11px] overflow-x-auto shadow-inner my-3 relative border border-slate-800">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                );
                                            }
                                        }}
                                    >
                                        {markdown}
                                    </ReactMarkdown>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-1.5">
                                        <AlertTriangle className="w-6 h-6 opacity-20" />
                                        <span className="text-xs">Không có nội dung hiển thị</span>
                                    </div>
                                )}
                                </div>
                            ) : (
                                <div className="w-full h-full flex-1 bg-slate-800/20">
                                    {isPdfLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                                            <span className="text-xs">Đang tải bản gốc...</span>
                                        </div>
                                    ) : pdfUrl ? (
                                        <iframe 
                                            src={pdfUrl} 
                                            className="w-full h-full border-none" 
                                            title="PDF Preview"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1.5">
                                            <AlertTriangle className="w-6 h-6 opacity-20" />
                                            <span className="text-xs">Không thể tải bản gốc PDF</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-amber-500 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-md max-w-xl">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Kiểm duyệt các đề mục H1, H2, H3 để đảm bảo cấu trúc cây phân cấp (Tree Hierarchy) chính xác.</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleAiRefactor}
                            className="rounded-md border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary h-8 text-xs px-3 font-semibold transition-all"
                            disabled={isIngesting || isRefactoring}
                        >
                            {isRefactoring ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            ✨ AI Auto-Fix
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-md border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white h-8 text-xs px-3"
                            disabled={isIngesting || isRefactoring}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleSaveAndIngest}
                            className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-1.5 h-8 px-4 text-xs"
                            disabled={isIngesting || isRefactoring}
                        >
                            {isIngesting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Đang phân mảnh (Chunking)...
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    Phê duyệt & Cắt mảnh
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
