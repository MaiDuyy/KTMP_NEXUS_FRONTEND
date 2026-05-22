"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useGetWikiPageBySlugQuery,
  useGetDraftsByWorkspaceQuery,
  useGetWikiPagesMetadataQuery,
  useApproveDraftMutation,
  useRejectDraftMutation,
  useRequestChangesOnDraftMutation
} from "@/src/redux/feature/mrpApi";
import { WikiContent } from "../components/WikiContent";
import { WikiDraftBanner } from "../components/WikiDraftBanner";
import { WikiBacklinks } from "../components/WikiBacklinks";
import { WikiPageTree } from "../components/WikiPageTree";
import { WikiGraphMini } from "../components/WikiGraph/WikiGraphMini";
import { WikiSearchDialog } from "../components/WikiSearchDialog";
import { getPageType } from "../components/WikilinkAutocomplete";
import { useHasRole } from "@/src/lib/rbac/usePermission";
import {
  Calendar,
  Layers,
  ArrowLeft,
  Settings,
  Shield,
  Clock,
  Compass,
  FileEdit,
  Tag,
  Search
} from "lucide-react";

export default function WikiPageDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const workspaceId = "default-workspace";

  // RBAC checks
  const isSuperAdmin = useHasRole("SUPER_ADMIN");
  const isAdmin = useHasRole("ADMIN");
  const isWorkspaceManager = useHasRole("WORKSPACE_MANAGER");
  const canManageWiki = isSuperAdmin || isAdmin || isWorkspaceManager;

  // RTK Queries
  const { data: page, isLoading: isPageLoading, error: pageError } = useGetWikiPageBySlugQuery({ slug, workspaceId });
  const { data: allPages } = useGetWikiPagesMetadataQuery({ workspaceId });
  const { data: drafts, isLoading: isDraftsLoading, refetch: refetchDrafts } = useGetDraftsByWorkspaceQuery(workspaceId, { skip: !canManageWiki });

  // Review mutations
  const [approveDraft, { isLoading: isApproving }] = useApproveDraftMutation();
  const [rejectDraft, { isLoading: isRejecting }] = useRejectDraftMutation();
  const [requestChanges, { isLoading: isRequesting }] = useRequestChangesOnDraftMutation();

  const activeDraft = React.useMemo(() => {
    if (!drafts) return null;
    return drafts.find((d) => d.slug === slug && d.status === "PENDING");
  }, [drafts, slug]);

  const handleApprove = async () => {
    if (!activeDraft || !canManageWiki) return;
    try {
      await approveDraft(activeDraft.id).unwrap();
      refetchDrafts();
      router.refresh();
    } catch (err) {
      console.error("Lỗi phê duyệt bản thảo:", err);
    }
  };

  const handleReject = async (note: string) => {
    if (!activeDraft || !canManageWiki) return;
    try {
      await rejectDraft({ draftId: activeDraft.id, note }).unwrap();
      refetchDrafts();
    } catch (err) {
      console.error("Lỗi từ chối bản thảo:", err);
    }
  };

  const handleRequestChanges = async (note: string) => {
    if (!activeDraft || !canManageWiki) return;
    try {
      await requestChanges({ draftId: activeDraft.id, note }).unwrap();
      refetchDrafts();
    } catch (err) {
      console.error("Lỗi yêu cầu sửa đổi:", err);
    }
  };

  const [searchOpen, setSearchOpen] = React.useState(false);

  // Key bindings for Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute backlinks graph nodes & edges
  const localGraphData = React.useMemo(() => {
    if (!allPages || !page) return { nodes: [], edges: [] };

    const currentSlug = page.slug;
    const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

    const directLinks = new Set<string>();
    const edges: { from: string; to: string }[] = [];
    const seenEdges = new Set<string>();

    const titleToSlug = new Map<string, string>();
    const slugToSlug = new Map<string, string>();
    for (const p of allPages) {
      titleToSlug.set(p.title.toLowerCase(), p.slug);
      slugToSlug.set(p.slug.toLowerCase(), p.slug);
    }

    const getResolvedSlug = (target: string) => {
      const norm = target.trim().toLowerCase();
      if (slugToSlug.has(norm)) return slugToSlug.get(norm);
      if (titleToSlug.has(norm)) return titleToSlug.get(norm);
      const slugified = norm.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
      if (slugToSlug.has(slugified)) return slugToSlug.get(slugified);
      return null;
    };

    for (const p of allPages) {
      const pageLinks = p.links || [];
      for (const targetRaw of pageLinks) {
        const resolvedSlug = getResolvedSlug(targetRaw);
        if (resolvedSlug && resolvedSlug !== p.slug) {
          if (p.slug === currentSlug || resolvedSlug === currentSlug) {
            const key = [p.slug, resolvedSlug].sort().join("->");
            if (!seenEdges.has(key)) {
              seenEdges.add(key);
              edges.push({ from: p.slug, to: resolvedSlug });
            }
            directLinks.add(p.slug);
            directLinks.add(resolvedSlug);
          }
        }
      }
    }

    directLinks.add(currentSlug);

    const nodes = allPages
      .filter((p) => directLinks.has(p.slug))
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        page_type: getPageType(p),
      }));

    return { nodes, edges };
  }, [allPages, page]);

  if (isPageLoading) {
    return (
      <div className="font-sans min-h-[400px] flex flex-col items-center justify-center text-center p-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full mb-3" />
        <p className="text-xs font-mono uppercase text-muted-foreground">Đang tải tài liệu Wiki...</p>
      </div>
    );
  }

  if (pageError || !page) {
    return (
      <div className="font-sans max-w-2xl mx-auto p-4 border border-rose-500/30 bg-rose-500/5 text-center rounded-xl shadow-md my-6">
        <h2 className="text-sm font-semibold uppercase text-rose-600 mb-1.5">Trang không tồn tại hoặc đã bị xóa</h2>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
          Tài liệu với đường dẫn <code className="bg-muted px-1 py-0.5 rounded font-mono border">/wiki/{slug}</code> không được tìm thấy trong cơ sở tri thức hiện tại.
        </p>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Dashboard
        </Link>
      </div>
    );
  }

  // Tags processing
  const tagsList = page.tags ? page.tags.split(/,\s*/) : [];

  return (
    <div className="font-sans flex gap-3 w-full text-foreground mx-auto p-2 md:p-3 h-full overflow-y-auto text-xs md:text-sm">
      {/* Collapsible Left Sidebar */}
      <div className="hidden md:block">
        <WikiPageTree activeSlug={slug} />
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        
        {/* Detail Page Navigation Header */}
        <div className="flex items-center justify-between border-b border-border pb-2 select-none">
          <div className="flex items-center gap-2">
            <Link
              href="/wiki"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
            >
              <ArrowLeft className="w-3 h-3" />
              Quay lại bảng
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
            >
              <Search className="w-3 h-3" />
              Tìm nhanh (Ctrl+K)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded-md border border-border text-muted-foreground">
              Workspace: {page.workspaceId}
            </span>
            <span className="text-[9px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded-md border border-border text-muted-foreground">
              Phiên bản: V.{page.version}
            </span>
          </div>
        </div>

        {/* Main Grid: Content (8 cols) & Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          
          {/* Left main content pane */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            
            {/* Active Draft Alert Banner */}
            {activeDraft && canManageWiki && (
              <WikiDraftBanner
                draft={activeDraft}
                onApprove={handleApprove}
                onReject={handleReject}
                onRequestChanges={handleRequestChanges}
                isActionsLoading={isApproving || isRejecting || isRequesting}
              />
            )}

            {/* Wiki Content Render Box */}
            <div className="border border-border bg-card p-3 md:p-4.5 rounded-xl shadow-md">
              {/* Title block */}
              <div className="flex flex-col gap-1.5 border-b pb-2 mb-4">
                <h1 className="text-lg md:text-xl font-bold text-foreground leading-snug">
                  {page.title}
                </h1>
                
                {/* Tags & quick info */}
                {tagsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <Tag className="w-3 h-3 text-muted-foreground mr-1" />
                    {tagsList.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Markdown Content Render */}
              <WikiContent markdown={page.content} allPages={allPages} />
            </div>

          </div>

          {/* Right sidebar pane */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            
            {/* Metadata information card */}
            <div className="border border-border bg-card p-3 rounded-xl shadow-md flex flex-col gap-2.5">
              <div className="border-b pb-1 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono text-[9px] uppercase font-extrabold text-foreground">
                  THÔNG TIN CHI TIẾT
                </span>
              </div>

              <div className="flex flex-col gap-1.5 font-sans text-[11px]">
                <div className="flex items-center justify-between border-b border-dashed border-border pb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> ID trang</span>
                  <span className="font-mono font-bold">{page.id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border pb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Ngày tạo</span>
                  <span className="font-mono font-bold">{new Date(page.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border pb-1.5">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Cập nhật</span>
                  <span className="font-mono font-bold">{new Date(page.updatedAt).toLocaleDateString("vi-VN")}</span>
                </div>
                {page.sourceDocumentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" /> ID Nguồn thô</span>
                    <span className="font-mono font-bold text-primary">{page.sourceDocumentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic internal backlinks cross-linking */}
            <WikiBacklinks
              currentPageTitle={page.title}
              currentPageSlug={page.slug}
              allWikiPages={allPages}
            />

            {/* Mini sub-graph visual */}
            {localGraphData.nodes.length > 1 && (
              <div className="border border-border bg-card p-3 rounded-xl shadow-md flex flex-col gap-2.5">
                <div className="border-b pb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-mono text-[9px] uppercase font-extrabold text-foreground">
                    BẢN ĐỒ LIÊN KẾT
                  </span>
                </div>
                <div className="w-full h-[180px] overflow-hidden rounded-lg border border-border bg-muted/30">
                  <WikiGraphMini slug={slug} nodes={localGraphData.nodes} edges={localGraphData.edges} />
                </div>
              </div>
            )}

            {/* Quick Wiki Navigation Sidebar Actions */}
            <div className="border border-border bg-card p-3 rounded-xl shadow-md flex flex-col gap-2">
              <div className="border-b pb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono text-[9px] uppercase font-extrabold text-foreground">
                  ĐIỀU HƯỚNG WIKI
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Bạn có thể xem các trang khác trong hệ thống để tìm kiếm thông tin liên quan hoặc trích xuất tri thức.
              </p>

              <Link
                href="/wiki"
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors rounded-lg shadow-sm active:scale-[0.98]"
              >
                Mở Wiki Explorer Dashboard
              </Link>
            </div>

          </div>

        </div>

      </div>

      {/* Global Wiki Search palette */}
      <WikiSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
