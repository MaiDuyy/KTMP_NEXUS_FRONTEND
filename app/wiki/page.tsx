"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  BookOpen,
  Tag,
  Activity,
  FileText,
  Clock,
  ExternalLink,
  Filter,
  CheckCircle,
  HelpCircle,
  Compass,
  Layers
} from "lucide-react";
import {
  useGetWikiPagesQuery,
  useGetWikiPagesMetadataQuery,
  useGetPendingDraftsQuery,
  useCompileDocumentMutation,
  useGetCompilationPlansQuery,
  WikiPage,
  PaginatedResponse
} from "@/src/redux/feature/mrpApi";
import { WikiPageTree } from "./components/WikiPageTree";
import { WikiGraph } from "./components/WikiGraph";
import { WikiSearchDialog } from "./components/WikiSearchDialog";
import { getPageType } from "./components/WikilinkAutocomplete";
import { useHasRole } from "@/src/lib/rbac/usePermission";
import { WikiPagination } from "./components/WikiPagination";
import { DocumentManagement } from "@/src/features/admin/DocumentManagement";

export default function WikiDashboard() {
  const workspaceId = "default-workspace";
  
  // RBAC checks
  const isSuperAdmin = useHasRole("SUPER_ADMIN");
  const isAdmin = useHasRole("ADMIN");
  const isWorkspaceManager = useHasRole("WORKSPACE_MANAGER");
  const canManageWiki = isSuperAdmin || isAdmin || isWorkspaceManager;

  // Active Tab state
  const [activeTab, setActiveTab] = React.useState<"knowledge" | "documents">("knowledge");

  // Pagination state (Slate Enterprise UI)
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [docIdInput, setDocIdInput] = React.useState("");
  const [compileSuccess, setCompileSuccess] = React.useState(false);
  const [compileError, setCompileError] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [showMap, setShowMap] = React.useState(false);

  // Automatically reset page to 0 when search queries or filters are updated
  React.useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedType]);

  // RTK Queries
  const { data: wikiPagesMetadata } = useGetWikiPagesMetadataQuery({ workspaceId });
  const { data: wikiPagesData, isLoading: isPagesLoading, refetch: refetchPages } = useGetWikiPagesQuery({
    workspaceId,
    page,
    size
  });
  const { data: pendingDrafts, isLoading: isDraftsLoading, refetch: refetchDrafts } = useGetPendingDraftsQuery(undefined, { skip: !canManageWiki });
  const { data: plans } = useGetCompilationPlansQuery(undefined, { skip: !canManageWiki });
  const [compileDocument, { isLoading: isCompiling }] = useCompileDocumentMutation();

  const wikiPages = React.useMemo(() => wikiPagesMetadata || [], [wikiPagesMetadata]);

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

  // Graph Data Computation
  const graphData = React.useMemo(() => {
    if (!wikiPages) return { nodes: [], edges: [] };
    
    const nodes = wikiPages.map((p) => ({
      slug: p.slug,
      title: p.title,
      page_type: getPageType(p),
    }));

    const edges: { from: string; to: string }[] = [];
    const seenEdges = new Set<string>();
    const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

    const titleToSlug = new Map<string, string>();
    const slugToSlug = new Map<string, string>();
    for (const p of wikiPages) {
      titleToSlug.set(p.title.toLowerCase(), p.slug);
      slugToSlug.set(p.slug.toLowerCase(), p.slug);
    }

    const getResolvedSlug = (target: string) => {
      const norm = target.trim().toLowerCase();
      if (slugToSlug.has(norm)) return slugToSlug.get(norm);
      if (titleToSlug.has(norm)) return titleToSlug.get(norm);
      // Fallback: strip accents/spaces to mimic backend slugify
      const slugified = norm.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
      if (slugToSlug.has(slugified)) return slugToSlug.get(slugified);
      return null;
    };

    for (const page of wikiPages) {
      const pageLinks = page.links || [];
      if (pageLinks.length > 0) {
        for (const targetRaw of pageLinks) {
          const resolvedSlug = getResolvedSlug(targetRaw);
          if (resolvedSlug && resolvedSlug !== page.slug) {
            const key = [page.slug, resolvedSlug].sort().join("->");
            if (!seenEdges.has(key)) {
              seenEdges.add(key);
              edges.push({ from: page.slug, to: resolvedSlug });
            }
          }
        }
      } else {
        // Fallback gracefully to client-side Regex content matching if pre-parsed links is empty/undefined
        let match;
        WIKILINK_RE.lastIndex = 0;
        while ((match = WIKILINK_RE.exec(page.content || "")) !== null) {
          const targetRaw = match[1];
          const resolvedSlug = getResolvedSlug(targetRaw);
          if (resolvedSlug && resolvedSlug !== page.slug) {
            const key = [page.slug, resolvedSlug].sort().join("->");
            if (!seenEdges.has(key)) {
              seenEdges.add(key);
              edges.push({ from: page.slug, to: resolvedSlug });
            }
          }
        }
      }
    }
    return { nodes, edges };
  }, [wikiPages]);

  // Statistics calculation
  const stats = React.useMemo(() => {
    if (!wikiPages) return { total: 0, concepts: 0, entities: 0, topics: 0, sources: 0 };
    return {
      total: wikiPages.length,
      concepts: wikiPages.filter((p) => getPageType(p) === "concept").length,
      entities: wikiPages.filter((p) => getPageType(p) === "entity").length,
      topics: wikiPages.filter((p) => getPageType(p) === "topic").length,
      sources: wikiPages.filter((p) => getPageType(p) === "source").length,
    };
  }, [wikiPages]);

  // Filtered pages (from paginated API response)
  const filteredPages = React.useMemo(() => {
    const pages = Array.isArray(wikiPagesData) 
      ? wikiPagesData 
      : (wikiPagesData && Array.isArray(wikiPagesData.content) ? wikiPagesData.content : []);
    
    return pages.filter((page) => {
      const matchesSearch =
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.tags && page.tags.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (selectedType === "all") return matchesSearch;
      
      const type = getPageType(page);
      return matchesSearch && type === selectedType;
    });
  }, [wikiPagesData, searchQuery, selectedType]);

  // Calculate total pages for paginated controls
  const totalPages = React.useMemo(() => {
    if (wikiPagesData && typeof wikiPagesData === "object" && "totalPages" in wikiPagesData) {
      return (wikiPagesData as PaginatedResponse<WikiPage>).totalPages;
    }
    return 1;
  }, [wikiPagesData]);

  // Calculate total elements for label
  const totalElements = React.useMemo(() => {
    if (wikiPagesData && typeof wikiPagesData === "object" && "totalElements" in wikiPagesData) {
      return (wikiPagesData as PaginatedResponse<WikiPage>).totalElements;
    }
    return Array.isArray(wikiPagesData) ? wikiPagesData.length : 0;
  }, [wikiPagesData]);

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWiki) return;
    const id = parseInt(docIdInput);
    if (isNaN(id)) {
      setCompileError("Vui lòng nhập ID tài liệu hợp lệ");
      return;
    }
    setCompileError("");
    setCompileSuccess(false);

    try {
      await compileDocument({ documentId: id, workspaceId, autoApprove: false }).unwrap();
      setCompileSuccess(true);
      setDocIdInput("");
      refetchDrafts();
      setTimeout(() => setCompileSuccess(false), 4000);
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setCompileError(error?.data?.message || "Lỗi khởi chạy quy trình MRP compilation.");
    }
  };

  return (
    <div className="font-sans flex gap-3 w-full text-foreground mx-auto p-2 md:p-3 h-full overflow-y-auto text-xs md:text-sm">
      {/* Collapsible Left Sidebar */}
      <div className="hidden md:block">
        <WikiPageTree />
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Top Banner Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-2.5 gap-2 select-none">
          <div>
            <span className="font-mono text-[9px] uppercase font-extrabold text-muted-foreground tracking-widest">
              Hệ thống quản lý tri thức
            </span>
            <h1 className="text-base md:text-lg font-black uppercase text-foreground leading-tight flex items-center gap-1.5 mt-0.5">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              WIKI KNOWLEDGE BASE
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wide border border-border bg-secondary hover:bg-secondary/85 text-secondary-foreground transition-all rounded-lg shadow-sm active:translate-y-[0.5px] flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Tìm nhanh (Ctrl+K)
            </button>

            {canManageWiki && (
              <>
                <Link
                  href="/wiki/plans"
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wide border transition-all rounded-lg shadow-sm active:translate-y-[0.5px] flex items-center gap-1.5 cursor-pointer ${
                    plans && plans.filter(p => p.status === 'PENDING_REVIEW').length > 0
                      ? "border-primary bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                      : "border-border bg-secondary hover:bg-secondary/85 text-secondary-foreground"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Kế hoạch biên soạn {plans && plans.filter(p => p.status === 'PENDING_REVIEW').length > 0 ? `(${plans.filter(p => p.status === 'PENDING_REVIEW').length})` : ""}
                </Link>

                {pendingDrafts && pendingDrafts.length > 0 && (
                  <Link
                    href="/wiki/review"
                    className="px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wide border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-all rounded-lg shadow-sm active:translate-y-[0.5px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Duyệt bản thảo ({pendingDrafts.length})
                  </Link>
                )}
                
                <Link
                  href="/wiki/new"
                  className="px-2.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wide border border-transparent bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-lg shadow-sm active:translate-y-[0.5px] flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo trang mới
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Flat Tabs for Admin/Manager */}
        {canManageWiki && (
          <div className="flex border-b border-border select-none gap-1 bg-background">
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "knowledge"
                  ? "border-slate-800 dark:border-slate-200 text-foreground font-extrabold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Cơ sở tri thức
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "documents"
                  ? "border-slate-800 dark:border-slate-200 text-foreground font-extrabold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Tài nguyên & Tài liệu gốc
            </button>
          </div>
        )}

        {/* Tab Contents */}
        {canManageWiki && activeTab === "documents" ? (
          <div className="mt-1">
            <DocumentManagement />
          </div>
        ) : (
          <>
            {/* Stats Summary Panel */}
            <div className={`grid gap-2 ${canManageWiki ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"}`}>
              {[
                { label: "Tổng số trang", val: stats.total, color: "text-primary" },
                { label: "Khái niệm (Concept)", val: stats.concepts, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Thực thể (Entity)", val: stats.entities, color: "text-sky-600 dark:text-sky-400" },
                { label: "Chủ đề (Topic)", val: stats.topics, color: "text-amber-600 dark:text-amber-400" },
                ...(canManageWiki ? [{ label: "Bản thảo chờ duyệt", val: pendingDrafts?.length || 0, color: "text-rose-600 dark:text-rose-400 font-bold" }] : []),
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border border-border bg-card p-2.5 rounded-xl shadow-sm flex flex-col gap-0.5 hover:shadow-md transition-shadow duration-200"
                >
                  <span className="text-[9px] font-mono font-extrabold uppercase text-muted-foreground leading-normal">
                    {item.label}
                  </span>
                  <span className={`text-base font-black ${item.color}`}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* Interactive Visual Map Section */}
            {wikiPages && wikiPages.length > 0 && (
              <div className="border border-border bg-card p-3 rounded-xl shadow-sm flex flex-col gap-2">
                <button 
                  onClick={() => setShowMap(!showMap)}
                  className="w-full flex items-center justify-between text-left focus:outline-none select-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-xs uppercase font-extrabold text-foreground">
                      Bản đồ trực quan liên kết tri thức (Visual Map)
                    </span>
                    <span className="text-[9px] font-mono font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                      {showMap ? "Click để thu gọn" : "Click để xem sơ đồ"}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground hidden sm:inline">
                    Quy mô: {graphData.nodes.length} nút &bull; {graphData.edges.length} liên kết
                  </span>
                </button>
                
                {showMap && (
                  <div className="w-full h-[240px] overflow-hidden rounded-xl border border-border bg-slate-50 dark:bg-slate-950 mt-1 transition-all">
                    <WikiGraph nodes={graphData.nodes} edges={graphData.edges} height={240} />
                  </div>
                )}
              </div>
            )}

            {/* Middle row: Compilation controller + Search controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              
              {/* Left pane: Filterable wiki pages grid */}
              <div className={`${canManageWiki ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col gap-3`}>
                {/* Controls Bar */}
                <div className="border border-border bg-card p-2.5 rounded-xl shadow-sm flex flex-col md:flex-row gap-2.5 items-center justify-between">
                  {/* Search */}
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm tiêu đề, thẻ..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-border bg-background rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans transition-all"
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1 border border-border bg-muted p-1 rounded-lg font-mono text-[9px] font-bold">
                    {[
                      { id: "all", label: "TẤT CẢ" },
                      { id: "concept", label: "KHÁI NIỆM" },
                      { id: "entity", label: "THỰC THỂ" },
                      { id: "topic", label: "CHỦ ĐỀ" },
                      { id: "source", label: "NGUỒN TIN" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedType(tab.id)}
                        className={`px-2.5 py-1 transition-all rounded-md cursor-pointer ${
                          selectedType === tab.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-muted-foreground/10 text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wiki list rendering */}
                {isPagesLoading ? (
                  <div className="border border-dashed border-border p-4 rounded-xl text-center flex flex-col items-center justify-center min-h-[200px]">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full mb-1.5" />
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">Đang tải cơ sở tri thức...</p>
                  </div>
                ) : filteredPages.length === 0 ? (
                  <div className="border border-dashed border-border p-4 rounded-xl text-center flex flex-col items-center justify-center min-h-[200px] bg-muted/5">
                    <HelpCircle className="w-6 h-6 text-muted-foreground/60 mb-1.5" />
                    <p className="text-xs font-bold text-foreground">Không tìm thấy bài viết nào</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Hãy nhập từ khóa khác hoặc bấm tạo trang Wiki mới.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredPages.map((page) => {
                        const type = getPageType(page);
                        
                        const typeConfigs: Record<string, { label: string; className: string }> = {
                          concept: { label: "Concept", className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" },
                          entity: { label: "Entity", className: "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400" },
                          topic: { label: "Topic", className: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" },
                          source: { label: "Source", className: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400" },
                        };

                        const config = typeConfigs[type] || typeConfigs.concept;
                        const typeLabel = config.label;
                        const typeClass = config.className;

                        return (
                          <Link
                            key={page.id}
                            href={`/wiki/${page.slug}`}
                            className="border border-border bg-card hover:bg-muted/30 p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[110px] group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded-md ${typeClass}`}>
                                  {typeLabel}
                                </span>
                                <span className="text-[8.5px] font-mono text-muted-foreground select-none">
                                  V.{page.version}
                                </span>
                              </div>
                              <h2 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                                {page.title}
                              </h2>
                              <p className="text-[10px] text-muted-foreground leading-normal mt-1 line-clamp-2">
                                {page.content.replace(/#+\s+/g, "").replace(/\[\[|\]\]/g, "")}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-1.5 mt-2 text-[9px] font-mono text-muted-foreground select-none">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
                              </span>
                              {page.tags && (
                                <span className="truncate max-w-[120px] bg-secondary px-1.5 py-0.5 rounded border border-border text-[9.5px]">
                                  {page.tags}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Pagination Widget (Slate Enterprise UI) */}
                    <WikiPagination
                      page={page}
                      size={size}
                      totalPages={totalPages}
                      totalElements={totalElements}
                      setPage={setPage}
                      setSize={setSize}
                    />
                  </>
                )}
              </div>

              {/* Right pane: Compile new source controls */}
              {canManageWiki && (
                <div className="lg:col-span-4 flex flex-col gap-3">
                  {/* Compile document tool box */}
                  <div className="border border-border bg-card p-3 rounded-xl shadow-sm flex flex-col gap-2.5">
                    <div className="border-b border-border pb-1.5 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-mono text-[10px] uppercase font-extrabold text-foreground">
                        TRÌNH BIÊN SOẠN MRP PIPELINE
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Nhập ID tài liệu thô trong cơ sở dữ liệu để kích hoạt xử lý nền song song Map-Reduce và đề xuất bản thảo tự động.
                    </p>

                    <form onSubmit={handleCompile} className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-mono font-bold uppercase text-foreground">ID Tài liệu thô (Source ID)</label>
                        <input
                          type="text"
                          value={docIdInput}
                          onChange={(e) => setDocIdInput(e.target.value)}
                          placeholder="Ví dụ: 1, 2, 45..."
                          required
                          className="px-2.5 py-1.5 text-xs border border-border bg-background rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono transition-all"
                        />
                      </div>

                      {compileError && (
                        <div className="text-[9px] font-mono p-1.5 border border-rose-500/20 bg-rose-500/5 text-rose-600 rounded-lg">
                          Lỗi: {compileError}
                        </div>
                      )}

                      {compileSuccess && (
                        <div className="text-[9px] font-mono p-1.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Kích hoạt quy trình MRP thành công!
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isCompiling || !docIdInput}
                        className="w-full px-2.5 py-2 text-xs font-mono font-bold uppercase border border-transparent bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-lg shadow-sm active:translate-y-[0.5px] disabled:opacity-50 cursor-pointer font-semibold"
                      >
                        {isCompiling ? "Đang xử lý..." : "Khởi chạy biên soạn"}
                      </button>
                    </form>
                  </div>

                  {/* Quick Guide Wiki Links */}
                  <div className="border border-border bg-card p-3 rounded-xl shadow-sm flex flex-col gap-2">
                    <div className="border-b border-border pb-1.5 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-mono text-[10px] uppercase font-extrabold text-foreground">
                        HƯỚNG DẪN CÚ PHÁP WIKI
                      </span>
                    </div>
                    
                    <ul className="space-y-1.5 text-[9.5px] text-foreground/80 leading-normal font-sans">
                      <li className="flex gap-1.5 items-start">
                        <span className="font-mono text-primary font-bold shrink-0">1.</span>
                        <span>Sử dụng <code>[[Tên-Trang]]</code> để tạo liên kết nhanh giữa các trang Wiki.</span>
                      </li>
                      <li className="flex gap-1.5 items-start">
                        <span className="font-mono text-primary font-bold shrink-0">2.</span>
                        <span>Tạo tiêu đề bằng dấu thăng <code>#</code>, <code>##</code> ở đầu dòng.</span>
                      </li>
                      <li className="flex gap-1.5 items-start">
                        <span className="font-mono text-primary font-bold shrink-0">3.</span>
                        <span>Mọi bản sửa đổi khi được gửi lên sẽ ở trạng thái Nháp (Draft) để chờ ban quản trị phê duyệt.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* Global Wiki Search palette */}
      <WikiSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

