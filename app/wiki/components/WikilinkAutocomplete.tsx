"use client";

import React from "react";
import { createPortal } from "react-dom";
import { WikiPage } from "@/src/redux/feature/mrpApi";
import { wikiTypeIcon, wikiTypeColor } from "./WikiTypeBadge";

export function getPageType(page: { tags?: string; content?: string; pageType?: string; page_type?: string }): string {
  const rawType = page.pageType || page.page_type;
  if (rawType) {
    const pt = rawType.toLowerCase();
    if (pt === "concept" || pt === "entity" || pt === "topic" || pt === "source") {
      return pt;
    }
  }
  const tagsLower = page.tags?.toLowerCase() || "";
  const contentLower = page.content?.toLowerCase() || "";
  if (tagsLower.includes("concept") || contentLower.includes("khái niệm")) return "concept";
  if (tagsLower.includes("entity") || contentLower.includes("thực thể")) return "entity";
  if (tagsLower.includes("topic") || contentLower.includes("chủ đề")) return "topic";
  if (tagsLower.includes("source") || contentLower.includes("nguồn tin")) return "source";
  return "concept";
}

type Props = {
  pages: WikiPage[];
  query: string;
  caret: { top: number; left: number; lineHeight: number };
  onPick: (page: WikiPage) => void;
  onClose: () => void;
};

const MAX_RESULTS = 8;
const POPUP_WIDTH = 340;
const POPUP_MAX_HEIGHT = 280;

function score(page: WikiPage, q: string): number {
  if (!q) return 0;
  const ql = q.toLowerCase();
  const slug = page.slug.toLowerCase();
  const title = page.title.toLowerCase();
  if (slug === ql || title === ql) return 100;
  if (slug.startsWith(ql) || title.startsWith(ql)) return 50;
  if (slug.includes(ql) || title.includes(ql)) return 20;
  return -1;
}

export function WikilinkAutocomplete({ pages, query, caret, onPick, onClose }: Props) {
  const [active, setActive] = React.useState(0);

  const filtered = React.useMemo(() => {
    if (!query) {
      return pages.slice(0, MAX_RESULTS);
    }
    const scored = pages
      .map((p) => ({ p, s: score(p, query) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_RESULTS);
    return scored.map((x) => x.p);
  }, [pages, query]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (filtered.length === 0) {
        if (e.key === "Escape") onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const pick = filtered[active];
        if (pick) onPick(pick);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [filtered, active, onPick, onClose]);

  if (typeof window === "undefined") return null;

  const top = caret.top + caret.lineHeight + 4;
  const left = caret.left;
  const flipUp = top + POPUP_MAX_HEIGHT > window.innerHeight - 16;
  const finalTop = flipUp ? caret.top - POPUP_MAX_HEIGHT - 4 : top;
  const finalLeft = Math.min(left, window.innerWidth - POPUP_WIDTH - 16);

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: finalTop,
        left: finalLeft,
        width: POPUP_WIDTH,
        maxHeight: POPUP_MAX_HEIGHT,
        zIndex: 100,
      }}
      className="rounded-xl border border-border bg-card text-card-foreground shadow-lg overflow-hidden flex flex-col font-sans"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="px-3 py-1.5 border-b border-border bg-muted flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wide text-muted-foreground select-none">
        <span>Liên kết tới trang</span>
        <span className="font-mono">↑↓ Enter</span>
      </div>
      {filtered.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground italic font-sans">
          Không tìm thấy trang phù hợp với &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <ul className="overflow-y-auto py-1" style={{ maxHeight: POPUP_MAX_HEIGHT - 32 }}>
          {filtered.map((p, i) => {
            const isActive = i === active;
            const pageType = getPageType(p);
            const Icon = wikiTypeIcon(pageType);
            const colorClass = p.tags?.includes("concept") || p.content.toLowerCase().includes("khái niệm")
              ? "text-emerald-600 dark:text-emerald-400"
              : p.tags?.includes("entity") || p.content.toLowerCase().includes("thực thể")
              ? "text-sky-600 dark:text-sky-400"
              : "text-amber-600 dark:text-amber-400";
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onPick(p)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors font-sans ${
                    isActive ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-bold">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      [[{p.slug}]]
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>,
    document.body,
  );
}
