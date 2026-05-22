"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  X, 
  PanelLeftClose, 
  PanelLeft,
  FolderOpen
} from "lucide-react";
import { useGetWikiPagesMetadataQuery, WikiPage } from "@/src/redux/feature/mrpApi";
import { wikiTypeIcon, wikiTypeColor, wikiTypeGroupLabel } from "./WikiTypeBadge";
import { getPageType } from "./WikilinkAutocomplete";

const GROUP_ORDER = ["concept", "entity", "topic", "source"];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function WikiPageTree({
  activeSlug,
  onPageSelect,
}: {
  activeSlug?: string;
  onPageSelect?: (slug: string) => void;
}) {
  const pathname = usePathname();
  const workspaceId = "default-workspace";
  
  // RTK query to load pages
  const { data: wikiPages, isLoading } = useGetWikiPagesMetadataQuery({ workspaceId });
  const pages: WikiPage[] = React.useMemo(() => wikiPages || [], [wikiPages]);
  
  const [search, setSearch] = React.useState("");
  const [collapsed, setCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(GROUP_ORDER)
  );

  const debouncedSearch = useDebounce(search, 150);

  const filtered = React.useMemo(() => {
    if (!debouncedSearch) return pages;
    const q = debouncedSearch.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.tags && p.tags.toLowerCase().includes(q))
    );
  }, [pages, debouncedSearch]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, WikiPage[]>();
    for (const p of filtered) {
      const type = getPageType(p);
      if (!map.has(type)) map.set(type, []);
      map.get(type)!.push(p);
    }
    return map;
  }, [filtered]);

  const currentSlug = activeSlug ?? pathname.replace(/^\/wiki\//, "");

  // Expand the group containing the active page by default
  React.useEffect(() => {
    if (currentSlug && pages.length > 0) {
      const activePage = pages.find((p) => p.slug === currentSlug);
      if (activePage) {
        const type = getPageType(activePage);
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.add(type);
          return next;
        });
      }
    }
  }, [currentSlug, pages]);

  const toggleGroup = (type: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });

  const totalCount = filtered.length;

  if (collapsed) {
    return (
      <div className="w-12 border border-border bg-card flex flex-col items-center pt-4 gap-3 shrink-0 rounded-xl min-h-[500px] select-none shadow-sm">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 border border-border hover:bg-muted text-foreground transition-all rounded-lg hover:border-primary/20"
          title="Mở rộng danh mục"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 border border-border bg-card flex flex-col overflow-hidden rounded-xl min-h-[500px] shadow-sm">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted select-none">
        <span className="text-[10px] font-mono font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-primary" /> DANH MỤC WIKI
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md shadow-xs">
            {totalCount}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-foreground/5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            title="Thu gọn"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Local Filter input */}
      <div className="px-2.5 py-1.5 border-b border-border bg-background">
        <div className="flex items-center gap-1.5 bg-card border border-border px-2 py-1 rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Lọc trang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Pages Tree Listing */}
      <div className="flex-1 overflow-y-auto py-2 px-1 max-h-[580px] bg-background">
        {isLoading ? (
          <div className="px-2 space-y-2 mt-1 select-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-7 border border-border bg-muted animate-pulse rounded-lg"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-3 py-4 select-none">
            Không tìm thấy trang nào
          </p>
        ) : (
          GROUP_ORDER.filter((t) => grouped.has(t) && grouped.get(t)!.length > 0).map((type) => {
            const items = grouped.get(type)!;
            const isExpanded = expandedGroups.has(type);
            const Icon = wikiTypeIcon(type);
            const colorClass = type === "concept" 
              ? "text-emerald-600 dark:text-emerald-400"
              : type === "entity" 
              ? "text-sky-600 dark:text-sky-400"
              : "text-amber-600 dark:text-amber-400";

            return (
              <div key={type} className="mb-1.5">
                {/* Section header toggle button */}
                <button
                  onClick={() => toggleGroup(type)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1 hover:bg-muted/50 rounded-lg transition-all text-left select-none border border-transparent hover:border-border`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
                  <span className="text-[10px] font-mono font-extrabold uppercase text-foreground/80 tracking-wide flex-1">
                    {wikiTypeGroupLabel(type)}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-muted-foreground">
                    {items.length}
                  </span>
                </button>
 
                {/* Sub-items */}
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-border flex flex-col gap-0.5 mt-0.5">
                    {items.map((page) => {
                      const isActive = page.slug === currentSlug;
                      return (
                        <div
                          key={page.id}
                          className={`group flex items-center gap-1 rounded-lg transition-all border ${
                            isActive 
                              ? "bg-primary/10 text-primary border-primary/20 font-bold" 
                              : "hover:bg-muted/50 border-transparent hover:border-border"
                          }`}
                        >
                          {onPageSelect ? (
                            <button
                              onClick={() => onPageSelect(page.slug)}
                              className={`flex-1 px-2 py-0.5 text-xs truncate text-left transition-all`}
                              title={page.title}
                            >
                              {page.title}
                            </button>
                          ) : (
                            <Link
                              href={`/wiki/${page.slug}`}
                              className={`flex-1 px-2 py-0.5 text-xs truncate transition-all`}
                              title={page.title}
                            >
                              {page.title}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
