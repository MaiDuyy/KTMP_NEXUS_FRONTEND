"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useGetWikiPagesMetadataQuery,
  WikiPage,
} from "@/src/redux/feature/mrpApi";
import { WikiGraph } from "../components/WikiGraph";
import {
  wikiTypeColor,
  wikiTypeGroupLabel,
  WikiTypeBadge,
} from "../components/WikiTypeBadge";
import { WikiContent } from "../components/WikiContent";
import { getPageType } from "../components/WikilinkAutocomplete";
import {
  ArrowLeft,
  X,
  ExternalLink,
  Search,
  Network,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw,
} from "lucide-react";

const PAGE_TYPES = ["entity", "concept", "topic", "source"] as const;
type PageType = (typeof PAGE_TYPES)[number];

type GraphNode = { slug: string; title: string; page_type: string };
type GraphEdge = { from: string; to: string };
type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

export default function WikiGraphPage() {
  const searchParams = useSearchParams();
  const currentWorkspaceId = useSelector((state: any) => state.workspace.currentWorkspaceId);
  const workspaceId = searchParams.get("workspaceId") || currentWorkspaceId || "default-workspace";

  const { data: allPages = [], isLoading } = useGetWikiPagesMetadataQuery({
    workspaceId,
  });

  const [activeTypes, setActiveTypes] = React.useState<Set<PageType>>(
    new Set(PAGE_TYPES)
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightSlug, setHighlightSlug] = React.useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Build graph data
  const graphData: GraphData = React.useMemo(() => {
    if (!allPages.length) return { nodes: [], edges: [] };

    const nodes: GraphNode[] = allPages.map((p) => ({
      slug: p.slug,
      title: p.title,
      page_type: getPageType(p),
    }));

    const edges: GraphEdge[] = [];
    const seenEdges = new Set<string>();
    const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

    const titleToSlug = new Map<string, string>();
    const slugToSlug = new Map<string, string>();
    for (const p of allPages) {
      titleToSlug.set(p.title.toLowerCase(), p.slug);
      slugToSlug.set(p.slug.toLowerCase(), p.slug);
    }

    const resolve = (target: string) => {
      const norm = target.trim().toLowerCase();
      if (slugToSlug.has(norm)) return slugToSlug.get(norm);
      if (titleToSlug.has(norm)) return titleToSlug.get(norm);
      if (slugToSlug.has(`source/${norm}`)) return slugToSlug.get(`source/${norm}`);
      const slugified = norm
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      if (slugToSlug.has(slugified)) return slugToSlug.get(slugified);
      if (slugToSlug.has(`source/${slugified}`)) return slugToSlug.get(`source/${slugified}`);
      return null;
    };

    for (const page of allPages) {
      const links = page.links || [];
      const targets =
        links.length > 0
          ? links
          : (() => {
              const found: string[] = [];
              let m;
              WIKILINK_RE.lastIndex = 0;
              while ((m = WIKILINK_RE.exec(page.content || "")) !== null)
                found.push(m[1]);
              return found;
            })();

      for (const t of targets) {
        const r = resolve(t);
        if (r && r !== page.slug) {
          const key = [page.slug, r].sort().join("->");
          if (!seenEdges.has(key)) {
            seenEdges.add(key);
            edges.push({ from: page.slug, to: r });
          }
        }
      }
    }

    return { nodes, edges };
  }, [allPages]);

  const filteredData = React.useMemo(() => {
    if (!graphData.nodes.length) return null;
    const nodes = graphData.nodes.filter((n) =>
      activeTypes.has(n.page_type as PageType)
    );
    const slugSet = new Set(nodes.map((n) => n.slug));
    const edges = graphData.edges.filter(
      (e) => slugSet.has(e.from) && slugSet.has(e.to)
    );
    return { nodes, edges };
  }, [graphData, activeTypes]);

  const searchMatches = React.useMemo(() => {
    if (!searchQuery || !graphData.nodes.length) return [];
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.slug.includes(q)
    );
  }, [searchQuery, graphData]);

  const previewPage = React.useMemo(
    () => (previewSlug ? allPages.find((p) => p.slug === previewSlug) ?? null : null),
    [previewSlug, allPages]
  );

  const toggleType = (type: PageType) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });

  const resetFilters = () => setActiveTypes(new Set(PAGE_TYPES));

  const typeStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of graphData.nodes) {
      counts[n.page_type] = (counts[n.page_type] || 0) + 1;
    }
    return counts;
  }, [graphData]);

  return (
    <div
      className={`relative flex flex-col bg-background ${
        isFullscreen
          ? "fixed inset-0 z-50"
          : "-mx-6 -my-4 md:-mx-8 lg:-mx-10"
      }`}
      style={isFullscreen ? undefined : { height: "100vh" }}
    >
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/90 backdrop-blur-sm shrink-0 gap-3">
        {/* Left: back + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/wiki"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Đồ thị tri thức
            </span>
          </div>
          {!isLoading && filteredData && (
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground tabular-nums">
                {filteredData.nodes.length} trang
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground tabular-nums">
                {filteredData.edges.length} liên kết
              </span>
            </div>
          )}
        </div>

        {/* Center: search */}
        <div className="flex-1 max-w-xs relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm trang..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const match = graphData.nodes.find((n) =>
                n.title.toLowerCase().includes(e.target.value.toLowerCase())
              );
              setHighlightSlug(match?.slug ?? null);
            }}
            className="w-full h-8 bg-background border border-border rounded-lg pl-8 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setHighlightSlug(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {activeTypes.size < PAGE_TYPES.length && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>

          {/* Reset */}
          {activeTypes.size < PAGE_TYPES.length && (
            <button
              onClick={resetFilters}
              title="Đặt lại bộ lọc"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border cursor-pointer"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────── */}
      {showFilters && (
        <div className="shrink-0 px-4 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Loại trang
          </span>
          <div className="flex flex-wrap gap-2">
            {PAGE_TYPES.map((type) => {
              const active = activeTypes.has(type);
              const color = wikiTypeColor(type);
              const count = typeStats[type] ?? 0;
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs border transition-all cursor-pointer"
                  style={{
                    background: active ? `${color}15` : "transparent",
                    color: active ? color : "var(--muted-foreground)",
                    borderColor: active ? `${color}40` : "var(--border)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: active ? color : "currentColor" }}
                  />
                  {wikiTypeGroupLabel(type)}
                  <span className="opacity-60 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto text-[10px] text-muted-foreground">
            Hiển thị {filteredData?.nodes.length ?? 0} /{" "}
            {graphData.nodes.length} trang
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {searchQuery && searchMatches.length > 0 && (
        <div className="absolute top-[52px] left-1/2 -translate-x-1/2 z-30 bg-card border border-border rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto w-72 mt-2">
          {searchMatches.slice(0, 8).map((n) => (
            <button
              key={n.slug}
              onClick={() => {
                setHighlightSlug(n.slug);
                setSearchQuery("");
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-accent transition-colors cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: wikiTypeColor(n.page_type) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{n.title}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  /{n.slug}
                </p>
              </div>
              <span
                className="text-[9px] uppercase font-bold shrink-0"
                style={{ color: wikiTypeColor(n.page_type) }}
              >
                {wikiTypeGroupLabel(n.page_type)}
              </span>
            </button>
          ))}
          {searchMatches.length > 8 && (
            <p className="text-[10px] text-center text-muted-foreground py-2">
              +{searchMatches.length - 8} kết quả khác
            </p>
          )}
        </div>
      )}

      {/* ── Main Area ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex relative">
        {/* Graph canvas */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-background">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <Network className="absolute inset-0 m-auto w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Đang xây dựng đồ thị tri thức...
              </p>
            </div>
          ) : !filteredData || filteredData.nodes.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-background">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Network className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Chưa có dữ liệu
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Upload và biên soạn tài liệu để bắt đầu xây dựng đồ thị tri
                  thức liên kết.
                </p>
              </div>
              {activeTypes.size < PAGE_TYPES.length && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  Hiển thị tất cả loại trang
                </button>
              )}
            </div>
          ) : (
            <WikiGraph
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              centerSlug={highlightSlug ?? undefined}
              height={undefined}
              onNodeClick={(slug) => {
                setPreviewSlug(previewSlug === slug ? null : slug);
              }}
            />
          )}

          {/* Legend overlay */}
          {filteredData && filteredData.nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Chú thích
              </p>
              <div className="flex flex-col gap-1.5">
                {PAGE_TYPES.filter((t) => activeTypes.has(t)).map((type) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: wikiTypeColor(type) }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {wikiTypeGroupLabel(type)}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 tabular-nums ml-auto">
                      {typeStats[type] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hint when no selection */}
          {filteredData && filteredData.nodes.length > 0 && !previewSlug && (
            <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow text-[10px] text-muted-foreground">
              Click vào node để xem chi tiết
            </div>
          )}
        </div>

        {/* Preview panel */}
        {previewSlug && (
          <div className="w-[360px] shrink-0 border-l border-border flex flex-col bg-card">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-border bg-card flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                  {previewPage?.title ?? previewSlug}
                </h3>
                {previewPage && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <WikiTypeBadge type={getPageType(previewPage)} />
                    <span className="text-[9px] font-mono text-muted-foreground truncate">
                      /{previewPage.slug}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {previewSlug && (
                  <Link
                    href={`/wiki/${previewSlug}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Mở
                  </Link>
                )}
                <button
                  onClick={() => setPreviewSlug(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metadata strip */}
            {previewPage && (
              <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground">
                {previewPage.version !== undefined && (
                  <span>v{previewPage.version}</span>
                )}
                {previewPage.updatedAt && (
                  <span>
                    Cập nhật{" "}
                    {new Date(previewPage.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
                {previewPage.tags && (
                  <span className="truncate max-w-[120px]">
                    #{previewPage.tags}
                  </span>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-background">
              {previewPage ? (
                <>
                  {previewPage.summary && (
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed italic border-l-2 border-primary/40 pl-3">
                      {previewPage.summary}
                    </p>
                  )}
                  <WikiContent
                    markdown={previewPage.content}
                    allPages={allPages}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Không tìm thấy nội dung.
                </p>
              )}
            </div>

            {/* Related nodes */}
            {filteredData && (() => {
              const related = filteredData.edges
                .filter((e) => e.from === previewSlug || e.to === previewSlug)
                .map((e) => (e.from === previewSlug ? e.to : e.from))
                .slice(0, 5);
              if (!related.length) return null;
              return (
                <div className="border-t border-border px-4 py-3 bg-muted/20 shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Liên kết ({related.length})
                  </p>
                  <div className="flex flex-col gap-1">
                    {related.map((slug) => {
                      const node = filteredData.nodes.find((n) => n.slug === slug);
                      if (!node) return null;
                      return (
                        <button
                          key={slug}
                          onClick={() => setPreviewSlug(slug)}
                          className="flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: wikiTypeColor(node.page_type) }}
                          />
                          <span className="text-[11px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {node.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
