"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight, User } from "lucide-react";
import { WikiPageDraft } from "@/src/redux/feature/mrpApi";

interface WikiDraftBannerProps {
  draft: WikiPageDraft;
  currentUserId?: string;
  onApprove?: () => void;
  onRequestChanges?: (note: string) => void;
  onReject?: (note: string) => void;
  isActionsLoading?: boolean;
}

export function WikiDraftBanner({
  draft,
  currentUserId = "system-user",
  onApprove,
  onRequestChanges,
  onReject,
  isActionsLoading = false,
}: WikiDraftBannerProps) {
  const [feedbackNote, setFeedbackNote] = React.useState("");
  const [showFeedbackInput, setShowFeedbackInput] = React.useState<"changes" | "reject" | null>(null);

  const getStatusConfig = () => {
    switch (draft.status) {
      case "PENDING":
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 shrink-0" />,
          bgColor: "bg-amber-500/10 border-amber-500",
          title: "Bản thảo đang chờ phê duyệt (Pending Review)",
          textColor: "text-amber-800 dark:text-amber-300",
        };
      case "APPROVED":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          bgColor: "bg-emerald-500/10 border-emerald-500",
          title: "Bản thảo đã được phê duyệt (Approved)",
          textColor: "text-emerald-800 dark:text-emerald-300",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          bgColor: "bg-rose-500/10 border-rose-500",
          title: "Bản thảo bị từ chối (Rejected)",
          textColor: "text-rose-800 dark:text-rose-300",
        };
      case "NEEDS_REVISION":
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
          bgColor: "bg-amber-500/10 border-amber-500",
          title: "Bản thảo yêu cầu sửa đổi (Needs Revision)",
          textColor: "text-amber-800 dark:text-amber-300",
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-foreground shrink-0" />,
          bgColor: "bg-muted border-foreground/30",
          title: `Bản thảo: ${draft.status}`,
          textColor: "text-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const isAuthor = draft.authorId === currentUserId;

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNote.trim()) return;

    if (showFeedbackInput === "changes" && onRequestChanges) {
      onRequestChanges(feedbackNote);
    } else if (showFeedbackInput === "reject" && onReject) {
      onReject(feedbackNote);
    }

    setFeedbackNote("");
    setShowFeedbackInput(null);
  };

  return (
    <div className={`border ${config.bgColor} rounded-xl p-3 font-sans shadow-sm flex flex-col gap-2.5 transition-all`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex flex-col gap-0.5">
            <h3 className={`text-sm font-extrabold uppercase tracking-wide ${config.textColor}`}>
              {config.title}
            </h3>
            <p className="text-xs text-foreground/80 font-medium">
              Đề xuất cho đường dẫn: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10.5px] border border-border font-bold text-primary">/wiki/{draft.slug}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md shadow-xs">
          <User className="w-3 h-3 text-foreground/75" />
          <span>Tác giả: {draft.authorId}</span>
        </div>
      </div>

      {draft.note && (
        <div className="text-xs border border-border bg-background/50 p-2.5 rounded-lg font-medium text-foreground/85">
          <span className="font-bold text-foreground">Ghi chú chỉnh sửa:</span> &quot;{draft.note}&quot;
        </div>
      )}

      {draft.reviewerNote && (
        <div className="text-xs border border-border bg-muted/40 p-2.5 rounded-lg font-mono text-foreground/90 leading-relaxed">
          <span className="font-sans font-bold text-foreground">Nhận xét của người duyệt:</span> &quot;{draft.reviewerNote}&quot;
        </div>
      )}

      {draft.status === "PENDING" && (
        <div className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-3 mt-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/wiki/review?draftId=${draft.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
            >
              Xem so sánh chi tiết
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!isAuthor && onApprove && onRequestChanges && onReject && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onApprove}
                disabled={isActionsLoading}
                className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
              >
                Duyệt & Ghi đè
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackInput(showFeedbackInput === "changes" ? null : "changes")}
                disabled={isActionsLoading}
                className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wide bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
              >
                Yêu cầu sửa
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackInput(showFeedbackInput === "reject" ? null : "reject")}
                disabled={isActionsLoading}
                className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wide bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}

      {showFeedbackInput && (
        <form onSubmit={handleSubmitFeedback} className="mt-2 border-t border-border pt-3 flex flex-col gap-2">
          <label className="text-[11px] font-mono font-bold uppercase text-foreground">
            {showFeedbackInput === "changes" ? "Lý do yêu cầu sửa đổi (Required Changes Note):" : "Lý do từ chối bản thảo (Rejection Note):"}
          </label>
          <div className="flex gap-2">
            <textarea
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Nhập nhận xét/lý do..."
              rows={2}
              required
              className="flex-1 text-xs border border-border bg-background rounded-lg p-2 font-sans focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <div className="flex flex-col gap-1.5 justify-end">
              <button
                type="submit"
                className="px-3 py-1 text-[10px] font-mono font-bold uppercase bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
              >
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackInput(null)}
                className="px-3 py-1 text-[10px] font-mono font-bold uppercase border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
