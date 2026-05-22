"use client";

import React from "react";
import Link from "next/link";
import { Link2, FileText, Compass } from "lucide-react";
import { WikiPage } from "@/src/redux/feature/mrpApi";

interface WikiBacklinksProps {
  currentPageTitle: string;
  currentPageSlug: string;
  allWikiPages: WikiPage[] | undefined;
}

export function WikiBacklinks({ currentPageTitle, currentPageSlug, allWikiPages }: WikiBacklinksProps) {
  const backlinks = React.useMemo(() => {
    if (!allWikiPages) return [];
    
    const removeAccents = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const titleToSlug = new Map<string, string>();
    const slugToSlug = new Map<string, string>();
    const normalizedTitleToSlug = new Map<string, string>();

    for (const p of allWikiPages) {
      const lowerTitle = p.title.toLowerCase();
      const lowerSlug = p.slug.toLowerCase();
      titleToSlug.set(lowerTitle, p.slug);
      slugToSlug.set(lowerSlug, p.slug);
      normalizedTitleToSlug.set(removeAccents(lowerTitle), p.slug);
      normalizedTitleToSlug.set(removeAccents(lowerSlug), p.slug);
    }

    const getResolvedSlug = (target: string) => {
      const norm = target.trim().toLowerCase();
      if (slugToSlug.has(norm)) return slugToSlug.get(norm);
      if (titleToSlug.has(norm)) return titleToSlug.get(norm);
      
      const normNoAccents = removeAccents(norm);
      if (normalizedTitleToSlug.has(normNoAccents)) return normalizedTitleToSlug.get(normNoAccents);
      
      const slugified = norm.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
      if (slugToSlug.has(slugified)) return slugToSlug.get(slugified);
      
      if (norm.endsWith("s")) {
        const singular = norm.slice(0, -1);
        if (slugToSlug.has(singular)) return slugToSlug.get(singular);
        if (titleToSlug.has(singular)) return titleToSlug.get(singular);
        if (normalizedTitleToSlug.has(removeAccents(singular))) return normalizedTitleToSlug.get(removeAccents(singular));
        const slugifiedSingular = slugified.slice(0, -1);
        if (slugToSlug.has(slugifiedSingular)) return slugToSlug.get(slugifiedSingular);
      }
      if (norm.endsWith("es")) {
        const singular = norm.slice(0, -2);
        if (slugToSlug.has(singular)) return slugToSlug.get(singular);
        if (titleToSlug.has(singular)) return titleToSlug.get(singular);
        if (normalizedTitleToSlug.has(removeAccents(singular))) return normalizedTitleToSlug.get(removeAccents(singular));
        const slugifiedSingular = slugified.slice(0, -2);
        if (slugToSlug.has(slugifiedSingular)) return slugToSlug.get(slugifiedSingular);
      }
      return target;
    };

    const targetSlug = currentPageSlug.toLowerCase();

    // Find other pages that reference this page's slug or title
    return allWikiPages.filter((page) => {
      // Don't link to itself
      if (page.slug === currentPageSlug) return false;
      
      // Check pre-parsed links from DTO
      const pageLinks = page.links;
      if (Array.isArray(pageLinks)) {
        for (const linkTarget of pageLinks) {
          if (getResolvedSlug(linkTarget) === currentPageSlug) {
            return true;
          }
        }
        return false;
      }
      
      const content = page.content || "";
      
      // 1. Check for standard markdown link format (/wiki/slug)
      if (content.toLowerCase().includes(`/wiki/${targetSlug}`)) return true;
      
      // 2. Parse and resolve all double bracket [[wikilinks]]
      const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
      for (const match of matches) {
        const fullContent = match[1]; // target or target|label
        const target = fullContent.split("|")[0];
        if (getResolvedSlug(target) === currentPageSlug) {
          return true;
        }
      }
      
      return false;
    });
  }, [currentPageTitle, currentPageSlug, allWikiPages]);

  return (
    <div className="border border-border bg-card text-card-foreground rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-2 mb-2.5">
        <Link2 className="w-4 h-4 text-primary shrink-0" />
        <span className="font-mono text-xs uppercase font-extrabold tracking-wide text-foreground">
          LIÊN KẾT LIÊN QUAN (BACKLINKS)
        </span>
      </div>

      {backlinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-border bg-muted/10 rounded-lg min-h-[100px]">
          <Compass className="w-6 h-6 text-muted-foreground/60 mb-1.5" />
          <p className="text-[11px] font-medium text-foreground/80 leading-normal">
            Chưa có liên kết nội bộ nào trỏ tới trang này.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-muted-foreground leading-normal mb-1">
            Có {backlinks.length} trang khác liên kết đến đây:
          </p>
          <div className="flex flex-col gap-1.5">
            {backlinks.map((page) => (
              <Link
                key={page.id}
                href={`/wiki/${page.slug}`}
                className="flex items-center gap-2 p-2 border border-border hover:border-primary/30 bg-muted/15 hover:bg-primary/5 transition-all rounded-lg group"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                   {page.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
