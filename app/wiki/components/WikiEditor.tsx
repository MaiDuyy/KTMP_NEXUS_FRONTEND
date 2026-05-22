"use client";

import React from "react";
import { WikiContent } from "./WikiContent";
import { WikiAiCheckPanel } from "./WikiAiCheckPanel";
import { MarkdownEditor } from "./MarkdownEditor";
import { WikiPage, WikiPageDraft } from "@/src/redux/feature/mrpApi";
import { FileText, CheckCircle, ArrowLeft } from "lucide-react";

interface WikiEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string;
  initialPageType?: string;
  slug?: string;
  wikiPages?: WikiPage[];
  onSubmit: (data: {
    title: string;
    content: string;
    pageType: string;
    tags: string;
    note: string;
  }) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function WikiEditor({
  initialTitle = "",
  initialContent = "",
  initialTags = "",
  initialPageType = "concept",
  slug = "new-page",
  wikiPages,
  onSubmit,
  isLoading = false,
  onCancel,
}: WikiEditorProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [content, setContent] = React.useState(initialContent);
  const [tags, setTags] = React.useState(initialTags);
  const [pageType, setPageType] = React.useState(initialPageType);
  const [note, setNote] = React.useState("");


  // Auto-generate slug from title if not provided/editing new
  const computedSlug = React.useMemo(() => {
    if (initialTitle) return slug; // keep original slug if editing
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [title, slug, initialTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({
      title,
      content,
      pageType,
      tags,
      note: note.trim() || "Đề xuất chỉnh sửa Wiki bởi người dùng.",
    });
  };

  return (
    <div className="font-sans flex flex-col gap-4 w-full text-foreground w-full h-full mx-auto p-2 md:p-3 h-full overflow-y-auto">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-2 gap-3">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Biên soạn & Cập nhật Wiki
            </span>
            <h1 className="text-xl font-bold text-foreground leading-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              {initialTitle ? "Đề xuất bản sửa đổi Wiki" : "Tạo trang Wiki mới"}
            </h1>
          </div>
        </div>

      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-border bg-card p-3 rounded-xl shadow-md">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-mono font-extrabold uppercase text-foreground">Tiêu đề trang (Title)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề trang..."
              required
              className="border border-border bg-background rounded-lg px-3 py-1.5 text-sm font-sans focus:outline-none focus:ring-0 focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-extrabold uppercase text-foreground">Loại trang (Type)</label>
            <select
              value={pageType}
              onChange={(e) => setPageType(e.target.value)}
              className="border border-border bg-background rounded-lg px-3 py-1.5 text-sm font-sans focus:outline-none focus:ring-0 focus:border-primary"
            >
              <option value="concept">Concept (Khái niệm)</option>
              <option value="entity">Entity (Thực thể)</option>
              <option value="topic">Topic (Chủ đề)</option>
              <option value="source">Source (Nguồn tin)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-extrabold uppercase text-foreground">Thẻ (Tags)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ngôn-ngữ, java, spring..."
              className="border border-border bg-background rounded-lg px-3 py-1.5 text-sm font-sans focus:outline-none focus:ring-0 focus:border-primary"
            />
          </div>
        </div>

        {/* Content Pane and AI Check Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main workspace */}
          <div
            className="lg:col-span-8 flex flex-col gap-3 border border-border bg-card p-4 rounded-xl shadow-md"
          >
            <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
              <span className="font-mono text-xs uppercase font-extrabold text-foreground">
                Khung viết nội dung (Markdown Content)
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Hỗ trợ cú pháp [[wikilink]] để tạo liên kết tự động
              </span>
            </div>

            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Nhập nội dung văn bản ở đây. Sử dụng [[Tên Trang]] để tạo liên kết..."
              minHeightClass="min-h-[500px]"
            />
          </div>

          {/* Sidebar Actions & AI Scanner */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Dynamic AI Checks panel */}
            <WikiAiCheckPanel
              content={content}
              title={title}
              slug={computedSlug}
              wikiPages={wikiPages}
            />

            {/* Change Note Block */}
            <div className="border border-border bg-card p-4 rounded-xl shadow-md flex flex-col gap-3">
              <div className="border-b border-border pb-2">
                <span className="font-mono text-xs uppercase font-extrabold text-foreground">
                  XÁC NHẬN GỬI ĐỀ XUẤT (SUBMIT PROPOSAL)
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold uppercase text-foreground">Ghi chú chỉnh sửa (Change Note)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mô tả tóm tắt lý do hoặc những gì bạn đã chỉnh sửa..."
                  required
                  rows={3}
                  className="w-full border border-border bg-background rounded-lg p-2 text-xs font-sans focus:outline-none focus:ring-0 focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !title.trim() || !content.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 rounded-lg shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isLoading ? "Đang gửi..." : "Gửi đề xuất nháp"}
                </button>

                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full px-4 py-2 text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors duration-200 rounded-lg shadow-sm active:scale-[0.98]"
                  >
                    Hủy bỏ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
