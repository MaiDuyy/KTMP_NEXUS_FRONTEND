"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Search, X, CornerDownLeft, Circle, Brain, Network, FileText } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGetWikiPagesMetadataQuery, WikiPage } from "@/src/redux/feature/mrpApi";
import { wikiTypeIcon, wikiTypeGroupLabel, wikiTypeColor } from "./WikiTypeBadge";
import { getPageType } from "./WikilinkAutocomplete";
import { useSearchChunksMutation, ChunkSearchResult } from "@/src/redux/feature/knowledgeApi";

const GROUP_ORDER = ["concept", "entity", "topic", "source"];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function WikiSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const currentWorkspaceId = useSelector((state: any) => state.workspace.currentWorkspaceId);
  const workspaceId = currentWorkspaceId || "default-workspace";
  
  // RTK Query to load wiki pages pool (lightweight metadata)
  const { data: wikiPages } = useGetWikiPagesMetadataQuery({ workspaceId }, { skip: !open });
  const pages: WikiPage[] = React.useMemo(() => wikiPages || [], [wikiPages]);
  
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 120);

  // AI Semantic Search State
  const [semanticSearch, setSemanticSearch] = React.useState(false);
  const [selectedChunk, setSelectedChunk] = React.useState<ChunkSearchResult | null>(null);

  // AI Search Mutation
  const [searchChunks, { data: searchResult, isLoading: isSearching }] = useSearchChunksMutation();

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setSemanticSearch(false);
      setSelectedChunk(null);
    }
  }, [open]);

  // Trigger Semantic Search mutation
  React.useEffect(() => {
    if (semanticSearch && debouncedQuery.trim()) {
      searchChunks({ query: debouncedQuery.trim(), topK: 10 });
    }
  }, [debouncedQuery, semanticSearch, searchChunks]);

  const filtered = React.useMemo(() => {
    if (!debouncedQuery) return pages;
    const q = debouncedQuery.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.tags && p.tags.toLowerCase().includes(q))
    );
  }, [pages, debouncedQuery]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, WikiPage[]>();
    for (const p of filtered.slice(0, 50)) {
      const type = getPageType(p);
      if (!map.has(type)) map.set(type, []);
      map.get(type)!.push(p);
    }
    return map;
  }, [filtered]);

  const navigate = (slug: string) => {
    router.push(`/wiki/${slug}`);
    onOpenChange(false);
  };

  const handleChunkClick = (chunk: ChunkSearchResult) => {
    const matchingPage = pages.find((p) => p.sourceDocumentId === chunk.documentId);
    if (matchingPage) {
      router.push(`/wiki/${matchingPage.slug}`);
      onOpenChange(false);
    } else {
      setSelectedChunk(chunk);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-border bg-card rounded-xl shadow-lg gap-0 animate-in fade-in zoom-in-95 duration-100">
        
        {selectedChunk ? (
          /* Detailed Chunk Preview Mode */
          <div className="flex flex-col gap-0 w-full font-sans">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted">
              <div className="flex items-center gap-2 select-none">
                <Brain className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <span className="font-mono text-[10px] uppercase font-extrabold text-foreground">
                  Chi tiết đoạn tri thức (Raw Chunk)
                </span>
              </div>
              <button
                onClick={() => setSelectedChunk(null)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto bg-background">
              <div className="flex items-center justify-between gap-2 border-b border-dashed border-border pb-2">
                <h3 className="text-xs font-black text-foreground">
                  {selectedChunk.chunkTitle || `Đoạn tri thức #${selectedChunk.chunkIndex + 1}`}
                </h3>
                <span className="text-[9.5px] font-mono font-extrabold shrink-0 border border-border px-1.5 py-0.5 bg-slate-50 text-slate-650 dark:bg-slate-900 dark:text-slate-400 rounded-md">
                  {Math.round(selectedChunk.similarity * 100)}% Khớp
                </span>
              </div>

              <div className="border border-border p-3 bg-muted/10 rounded-lg text-xs leading-relaxed font-sans text-foreground/90 whitespace-pre-wrap select-text max-h-[220px] overflow-y-auto">
                {selectedChunk.text}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-border pt-2 mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground uppercase text-[8px]">Tài liệu nguồn</span>
                  <span className="font-bold text-foreground truncate">{selectedChunk.fileName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground uppercase text-[8px]">Chỉ mục đoạn (Index)</span>
                  <span className="font-bold text-foreground">Chunk #{selectedChunk.chunkIndex}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-muted px-4 py-2.5 flex items-center justify-between gap-2 select-none">
              <p className="text-[10px] text-muted-foreground leading-normal max-w-[240px]">
                Đoạn tri thức này chưa được gán chính thức vào trang Wiki nào.
              </p>
              <button
                onClick={() => setSelectedChunk(null)}
                className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide border border-border bg-background hover:bg-muted text-foreground transition-all rounded-md shadow-sm active:translate-y-[0.5px] shrink-0"
              >
                Quay lại tìm kiếm
              </button>
            </div>
          </div>
        ) : (
          /* Main Search Dialog Mode */
          <>
            {/* Search input bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={semanticSearch ? "Đặt câu hỏi tự nhiên với AI Semantic Search..." : "Tìm kiếm tài liệu Wiki..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onOpenChange(false);
                }}
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-sans font-bold"
              />
              
              {/* Slate UI AI Semantic Search Toggle */}
              <button
                onClick={() => setSemanticSearch((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] font-mono font-bold uppercase transition-all rounded-lg select-none shrink-0 ${
                  semanticSearch
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    : "border-border bg-background hover:bg-muted text-muted-foreground"
                }`}
                title="Tìm kiếm ngữ nghĩa bằng AI"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>AI Search</span>
              </button>

              {query && (
                <button 
                  onClick={() => setQuery("")} 
                  className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results container */}
            <div className="max-h-[360px] overflow-y-auto py-2 bg-background">
              {semanticSearch ? (
                /* AI Semantic Search Results */
                isSearching ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2 bg-background">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent animate-spin rounded-full dark:border-slate-100" />
                    <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                      Đang phân tích ngữ nghĩa AI...
                    </p>
                  </div>
                ) : !debouncedQuery.trim() ? (
                  <div className="text-center py-10 bg-background select-none flex flex-col items-center justify-center gap-2">
                    <Brain className="w-8 h-8 text-slate-400 shrink-0" />
                    <p className="text-sm font-bold text-foreground">Tìm kiếm ngữ nghĩa AI (Vector Search)</p>
                    <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                      Nhập câu hỏi tự nhiên để tìm kiếm theo ý nghĩa và ngữ cảnh thay vì từ khóa chính xác.
                    </p>
                  </div>
                ) : !searchResult || !searchResult.chunks || searchResult.chunks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm font-bold text-foreground">Không tìm thấy tri thức phù hợp</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI không tìm thấy đoạn văn nào khớp với câu hỏi của bạn.
                    </p>
                  </div>
                ) : (
                  <div className="mb-2.5 last:mb-0">
                    <div className="flex items-center gap-1.5 px-4 py-1 border-b border-border pb-2 mb-2 bg-muted/20 select-none">
                      <Network className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                      <span className="text-[10px] font-mono font-extrabold uppercase text-muted-foreground tracking-wider">
                        Đoạn tri thức Vector ({searchResult.chunks.length})
                      </span>
                    </div>
                    <div className="mt-1 flex flex-col divide-y divide-border">
                      {searchResult.chunks.map((chunk) => {
                        const similarityPercent = Math.round(chunk.similarity * 100);
                        const matchingPage = pages.find((p) => p.sourceDocumentId === chunk.documentId);
                        
                        return (
                          <button
                            key={`${chunk.documentId}-${chunk.chunkIndex}`}
                            onClick={() => handleChunkClick(chunk)}
                            className="w-full flex flex-col gap-1.5 px-4 py-3 hover:bg-muted/30 transition-colors text-left border-y border-transparent hover:border-border group"
                          >
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {chunk.chunkTitle || `Đoạn tri thức #${chunk.chunkIndex + 1}`}
                              </span>
                              <span className="text-[9.5px] font-mono font-extrabold shrink-0 border border-border px-1.5 py-0.5 bg-slate-50 text-slate-650 dark:bg-slate-900 dark:text-slate-400 rounded-md">
                                {similarityPercent}% Khớp
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2 select-none">
                              {chunk.text}
                            </p>
                            
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground/80 mt-1 select-none w-full">
                              <FileText className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              <span className="truncate max-w-[200px]">Nguồn: {chunk.fileName}</span>
                              <span className="ml-auto bg-muted px-1.5 py-0.25 border border-border rounded text-[8.5px] font-bold">
                                {matchingPage ? `Trang: /${matchingPage.slug}` : "Chỉ xem trước"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                /* Traditional Keyword Search Results */
                filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm font-bold text-foreground">Không tìm thấy tài liệu phù hợp</p>
                    <p className="text-xs text-muted-foreground mt-1">Hãy thử tìm bằng từ khóa khác.</p>
                  </div>
                ) : (
                  GROUP_ORDER.filter((t) => grouped.has(t) && grouped.get(t)!.length > 0).map((type) => {
                    const items = grouped.get(type)!;
                    const Icon = wikiTypeIcon(type);
                    const colorClass = type === "concept" 
                      ? "text-emerald-600 dark:text-emerald-400"
                      : type === "entity" 
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-amber-600 dark:text-amber-400";
                    
                    return (
                      <div key={type} className="mb-2.5 last:mb-0">
                        <div className="flex items-center gap-1.5 px-4 py-1 select-none">
                          <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                          <span className="text-[10px] font-mono font-extrabold uppercase text-muted-foreground tracking-wider">
                            {wikiTypeGroupLabel(type)}
                          </span>
                        </div>
                        <div className="mt-1">
                          {items.map((page) => (
                            <button
                              key={page.id}
                              onClick={() => navigate(page.slug)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-muted/50 transition-colors text-left border-y border-transparent hover:border-border group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {page.title}
                                </p>
                                {page.tags && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    Thẻ: {page.tags}
                                  </p>
                                )}
                              </div>
                              <span className="text-[9.5px] font-mono text-muted-foreground shrink-0 border border-border px-1.5 py-0.5 bg-muted rounded-md">
                                {page.slug}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Footer shortcuts */}
            <div className="border-t border-border bg-muted px-4 py-2.5 flex items-center gap-4 text-[10px] font-mono text-muted-foreground select-none">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md border border-border bg-background text-[9px] font-bold shadow-xs">Enter ↵</kbd>
                mở trang
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-md border border-border bg-background text-[9px] font-bold shadow-xs">Esc</kbd>
                đóng
              </span>
              <span className="ml-auto font-extrabold text-foreground">
                {semanticSearch 
                  ? `${searchResult?.chunks?.length || 0} đoạn khớp` 
                  : `${filtered.length} tài liệu`
                }
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

