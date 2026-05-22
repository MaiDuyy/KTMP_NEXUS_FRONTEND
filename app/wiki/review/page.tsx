"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGetPendingDraftsQuery,
  useGetWikiPagesMetadataQuery,
  useGetWikiPageByIdQuery,
  useApproveDraftMutation,
  useRejectDraftMutation,
  useRequestChangesOnDraftMutation
} from "@/src/redux/feature/mrpApi";
import { WikiDraftDiff } from "../components/WikiDraftDiff";
import { WikiAiCheckPanel } from "../components/WikiAiCheckPanel";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Command,
  HelpCircle,
  Split,
  Maximize2
} from "lucide-react";
import { useHasRole } from "@/src/lib/rbac/usePermission";

import { WikiPagination } from "../components/WikiPagination";

export default function WikiReviewConsole({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");
  const workspaceId = "default-workspace";

  // RBAC checks
  const isSuperAdmin = useHasRole("SUPER_ADMIN");
  const isAdmin = useHasRole("ADMIN");
  const isWorkspaceManager = useHasRole("WORKSPACE_MANAGER");
  const canManageWiki = isSuperAdmin || isAdmin || isWorkspaceManager;

  // State
  const [selectedDraftId, setSelectedDraftId] = React.useState<number | null>(
    draftIdParam ? parseInt(draftIdParam) : null
  );
  const [diffMode, setDiffMode] = React.useState<"unified" | "split">("unified");
  const [reviewerNote, setReviewerNote] = React.useState("");
  const [isNoteExpanded, setIsNoteExpanded] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Pagination State
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(5);

  // RTK Query calls
  const { data: draftsResponse, isLoading: isDraftsLoading, refetch: refetchDrafts } = useGetPendingDraftsQuery({ page, size }, { skip: !canManageWiki });
  const { data: wikiPages } = useGetWikiPagesMetadataQuery({ workspaceId }, { skip: !canManageWiki });

  // Extract drafts list and total elements
  const drafts = React.useMemo(() => {
    if (!draftsResponse) return [];
    if (Array.isArray(draftsResponse)) return draftsResponse;
    return draftsResponse.content || [];
  }, [draftsResponse]);

  const totalElements = React.useMemo(() => {
    if (!draftsResponse) return 0;
    if (Array.isArray(draftsResponse)) return draftsResponse.length;
    return draftsResponse.totalElements || 0;
  }, [draftsResponse]);

  const totalPages = React.useMemo(() => {
    if (!draftsResponse) return 0;
    if (Array.isArray(draftsResponse)) return Math.ceil(draftsResponse.length / size);
    return draftsResponse.totalPages || 0;
  }, [draftsResponse, size]);

  // Reset page if totalElements changes and page is out of bounds
  React.useEffect(() => {
    if (totalElements > 0 && page * size >= totalElements) {
      setPage(0);
    }
  }, [totalElements, page, size]);

  const paginatedDrafts = drafts;

  // Mutations
  const [approveDraft, { isLoading: isApproving }] = useApproveDraftMutation();
  const [rejectDraft, { isLoading: isRejecting }] = useRejectDraftMutation();
  const [requestChanges, { isLoading: isRequesting }] = useRequestChangesOnDraftMutation();

  const activeDraft = React.useMemo(() => {
    if (!drafts || selectedDraftId === null) return null;
    return drafts.find((d) => d.id === selectedDraftId) || null;
  }, [drafts, selectedDraftId]);

  // Dynamically load the base wiki page content only when activeDraft changes and a wikiPageId exists
  const { data: activeBasePage } = useGetWikiPageByIdQuery(
    activeDraft?.wikiPageId as number,
    { skip: !activeDraft?.wikiPageId }
  );

  // Find base version wiki page content to perform Diff
  const baseWikiPage = activeBasePage || null;

  const oldText = baseWikiPage?.content || "";
  const newText = activeDraft?.content || "";

  // Review Actions
  const handleApprove = async () => {
    if (!activeDraft) return;
    setMessage(null);
    try {
      await approveDraft(activeDraft.id).unwrap();
      setMessage({ text: `Đã phê duyệt và trộn bản thảo "${activeDraft.title}" thành công.`, type: "success" });
      setReviewerNote("");
      setSelectedDraftId(null);
      refetchDrafts();
    } catch (err) {
      const error = err as { data?: { message?: string } } | undefined;
      setMessage({ text: error?.data?.message || "Lỗi khi phê duyệt bản thảo.", type: "error" });
    }
  };

  const handleReject = async () => {
    if (!activeDraft) return;
    if (!reviewerNote.trim()) {
      setIsNoteExpanded(true);
      setMessage({ text: "Vui lòng nhập lý do từ chối bản thảo vào ô Nhận xét.", type: "error" });
      return;
    }
    setMessage(null);
    try {
      await rejectDraft({ draftId: activeDraft.id, note: reviewerNote }).unwrap();
      setMessage({ text: `Đã từ chối bản thảo "${activeDraft.title}" kèm nhận xét lý do.`, type: "success" });
      setReviewerNote("");
      setSelectedDraftId(null);
      refetchDrafts();
    } catch (err) {
      const error = err as { data?: { message?: string } } | undefined;
      setMessage({ text: error?.data?.message || "Lỗi khi từ chối bản thảo.", type: "error" });
    }
  };

  const handleRequestChanges = async () => {
    if (!activeDraft) return;
    if (!reviewerNote.trim()) {
      setIsNoteExpanded(true);
      setMessage({ text: "Vui lòng nhập lý do yêu cầu chỉnh sửa vào ô Nhận xét.", type: "error" });
      return;
    }
    setMessage(null);
    try {
      await requestChanges({ draftId: activeDraft.id, note: reviewerNote }).unwrap();
      setMessage({ text: `Đã gửi yêu cầu sửa đổi cho bản thảo "${activeDraft.title}".`, type: "success" });
      setReviewerNote("");
      setSelectedDraftId(null);
      refetchDrafts();
    } catch (err) {
      const error = err as { data?: { message?: string } } | undefined;
      setMessage({ text: error?.data?.message || "Lỗi khi yêu cầu sửa đổi.", type: "error" });
    }
  };

  // Keyboard shortcuts listeners
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input/textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (!activeDraft) {
        if (e.key === "Escape") {
          router.push("/wiki");
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "a": // Approve
          e.preventDefault();
          handleApprove();
          break;
        case "r": // Reject
          e.preventDefault();
          handleReject();
          break;
        case "c": // Request changes
          e.preventDefault();
          handleRequestChanges();
          break;
        case "escape": // Cancel selection
          e.preventDefault();
          setSelectedDraftId(null);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDraft, reviewerNote]);

  if (!canManageWiki) {
    return (
      <div className="font-sans max-w-xl mx-auto p-6 border border-border bg-card text-center rounded-xl shadow-md my-16 flex flex-col items-center gap-3">
        <h2 className="text-sm font-black uppercase text-rose-600">403 - KHÔNG CÓ QUYỀN TRUY CẬP</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tài khoản của bạn không có quyền kiểm duyệt hay duyệt bản thảo. Giao diện này chỉ dành riêng cho Quản trị viên và Quản lý Workspace.
        </p>
        <Link
          href="/wiki"
          className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide border border-transparent bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-lg shadow-sm active:translate-y-[0.5px] cursor-pointer font-semibold"
        >
          Quay lại Dashboard Wiki
        </Link>
      </div>
    );
  }

  return (
    <div className={`font-sans flex flex-col gap-3 w-full text-foreground w-full h-full mx-auto h-full overflow-y-auto text-xs md:text-sm ${isEmbedded ? "p-0" : "p-2 md:p-3"}`}>
      
      {/* Review Console Header */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-2 gap-2 select-none">
          <div className="flex items-center gap-2">
            <Link
              href="/wiki"
              className="p-1.5 border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
              title="Quay lại"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div>
              <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                Giao diện điều phối tri thức
              </span>
              <h1 className="text-base font-bold text-foreground leading-tight flex items-center gap-1.5 mt-0.5">
                <Command className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                WIKI REVIEW CONSOLE
              </h1>
            </div>
          </div>

          {/* Global info */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground bg-muted p-1 border border-border rounded-lg">
            <span>Phím tắt:</span>
            <span className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-semibold">[A] Duyệt</span>
            <span className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-semibold">[C] Yêu cầu</span>
            <span className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-semibold">[R] Từ chối</span>
            <span className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground font-semibold">[Esc] Hủy</span>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`border p-3 text-xs rounded-xl shadow-md ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* Left Column: Draft Picker list (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2.5 border border-border bg-card p-3 rounded-xl shadow-md">
          <div className="border-b pb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-extrabold text-foreground tracking-wide">
              BẢN THẢO CHỜ DUYỆT
            </span>
            <span className="text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-primary font-semibold">
              {drafts?.length || 0}
            </span>
          </div>

          {isDraftsLoading ? (
            <div className="py-8 text-center text-[10px] font-mono text-muted-foreground">Đang tải bản thảo...</div>
          ) : !drafts || drafts.length === 0 ? (
            <div className="py-6 text-center flex flex-col items-center justify-center gap-1 border border-dashed border-border rounded-xl bg-muted/5">
              <Clock className="w-4 h-4 text-muted-foreground/60" />
              <p className="text-[10px] font-bold text-foreground">Sạch bóng bản thảo</p>
              <p className="text-[8.5px] text-muted-foreground">Tất cả tài liệu đã được duyệt.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-1">
                {paginatedDrafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDraftId(d.id);
                      setMessage(null);
                    }}
                    className={`w-full text-left p-2.5 border transition-all rounded-lg flex flex-col gap-1 ${
                      selectedDraftId === d.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-400 rounded-md self-start leading-none">
                      DRAFT #{d.id}
                    </span>
                    <h3 className="text-[11px] font-extrabold text-foreground leading-snug line-clamp-2">
                      {d.title}
                    </h3>
                    <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground select-none mt-1">
                      <span>Tác giả: {d.authorId}</span>
                      <span>V.{d.baseVersion || 1}</span>
                    </div>
                  </button>
                ))}
              </div>

              <WikiPagination
                page={page}
                size={size}
                totalPages={totalPages}
                totalElements={totalElements}
                setPage={setPage}
                compact={true}
              />
            </>
          )}
        </div>

        {/* Middle/Right: Review Panel (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-3">
          {activeDraft ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
              
              {/* Diff Viewer Workspace (8 cols) */}
              <div className="xl:col-span-8 flex flex-col gap-3 border border-border bg-card p-4 rounded-xl shadow-md">
                <div className="flex items-center justify-between border-b border-border pb-1.5 select-none">
                  <div>
                    <span className="font-mono text-[8px] uppercase font-bold text-muted-foreground">Khung so sánh phiên bản (Diff View)</span>
                    <h2 className="text-xs font-bold text-foreground mt-0.5 line-clamp-1">
                      {activeDraft.title}
                    </h2>
                  </div>

                  <div className="flex items-center border border-border bg-muted p-0.5 rounded-lg font-mono text-[9px] font-semibold">
                    <button
                      onClick={() => setDiffMode("unified")}
                      className={`px-2 py-0.75 rounded-md transition-all flex items-center gap-1 ${
                        diffMode === "unified" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted-foreground/10 text-foreground"
                      }`}
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      Unified
                    </button>
                    <button
                      onClick={() => setDiffMode("split")}
                      className={`px-2 py-0.75 rounded-md transition-all flex items-center gap-1 ${
                        diffMode === "split" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted-foreground/10 text-foreground"
                      }`}
                    >
                      <Split className="w-2.5 h-2.5" />
                      Split Side
                    </button>
                  </div>
                </div>

                <div className="max-h-[520px] overflow-y-auto p-2 bg-muted/10 border border-border rounded-lg">
                  <WikiDraftDiff oldText={oldText} newText={newText} mode={diffMode} />
                </div>

                {activeDraft.note && (
                  <div className="border border-border p-2.5 bg-muted/30 rounded-lg text-[10.5px] font-sans text-foreground/90">
                    <span className="font-bold text-foreground">Ghi chú của Tác giả:</span> &quot;{activeDraft.note}&quot;
                  </div>
                )}
              </div>

              {/* Action Box & AI Checks (4 cols) */}
              <div className="xl:col-span-4 flex flex-col gap-3">
                
                {/* AI Auditing */}
                <WikiAiCheckPanel
                  content={newText}
                  title={activeDraft.title}
                  slug={activeDraft.slug}
                  wikiPages={wikiPages}
                />

                {/* Reviewer Note & Buttons */}
                <div className="border border-border bg-card p-3 rounded-xl shadow-md flex flex-col gap-2.5">
                  <div className="border-b border-border pb-1.5">
                    <span className="font-mono text-[9px] uppercase font-extrabold text-foreground">
                      ĐIỀU PHỐI ĐỀ XUẤT (ACTIONS)
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold uppercase text-foreground">Nhận xét (Reviewer Note)</label>
                      <span className="text-[8px] font-mono text-rose-500">* Bắt buộc</span>
                    </div>
                    <textarea
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                      placeholder="Nhập ghi chú phản hồi..."
                      rows={isNoteExpanded ? 3 : 1.5}
                      onFocus={() => setIsNoteExpanded(true)}
                      onBlur={() => {
                        if (!reviewerNote.trim()) setIsNoteExpanded(false);
                      }}
                      className="w-full border border-border bg-background rounded-lg p-2 text-xs font-sans focus:outline-none focus:ring-0 focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1 font-mono text-[10.5px] font-bold">
                    <button
                      onClick={handleApprove}
                      disabled={isApproving || isRejecting || isRequesting}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-600/90 text-white transition-colors rounded-lg shadow-sm active:scale-[0.98] disabled:opacity-50 uppercase font-medium"
                    >
                      Duyệt & Xuất bản (A)
                    </button>
                    <button
                      onClick={handleRequestChanges}
                      disabled={isApproving || isRejecting || isRequesting}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-500/90 text-white transition-colors rounded-lg shadow-sm active:scale-[0.98] disabled:opacity-50 uppercase font-medium"
                    >
                      Yêu cầu sửa đổi (C)
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isApproving || isRejecting || isRequesting}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-600/90 text-white transition-colors rounded-lg shadow-sm active:scale-[0.98] disabled:opacity-50 uppercase font-medium"
                    >
                      Từ chối bản thảo (R)
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="border border-dashed border-border p-8 rounded-xl text-center flex flex-col items-center justify-center min-h-[300px] bg-muted/5">
              <Sparkles className="w-8 h-8 text-primary/70 mb-2 shrink-0 animate-bounce" />
              <h2 className="text-xs font-semibold uppercase text-foreground">Không có bản thảo nào đang được chọn</h2>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-sm leading-normal">
                Vui lòng nhấp vào một bản thảo nháp trong danh sách bên trái để mở Khung so sánh phiên bản (Diff View) và tiến hành điều phối tri thức.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
