"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WikiPaginationProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setSize?: (size: number) => void;
  sizeOptions?: number[];
  compact?: boolean;
}

export function WikiPagination({
  page,
  size,
  totalPages,
  totalElements,
  setPage,
  setSize,
  sizeOptions = [10, 20, 50],
  compact = false,
}: WikiPaginationProps) {
  if (totalPages <= 0) return null;

  // ─── Compact Mode (dành cho Sidebar) ───────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center justify-between bg-card border border-border rounded-md px-2 py-1.5 mt-2 select-none">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded text-xs font-medium",
            "border border-border bg-background text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
          )}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-[10px] font-mono text-muted-foreground font-medium px-2">
          {page + 1} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className={cn(
            "h-6 w-6 flex items-center justify-center rounded text-xs font-medium",
            "border border-border bg-background text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
          )}
          aria-label="Trang tiếp"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ─── Tính toán range trang hiển thị (window of 5) ──────────────────────────
  const getPageRange = () => {
    const delta = 2;
    const start = Math.max(0, page - delta);
    const end = Math.min(totalPages - 1, page + delta);
    const range: number[] = [];
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  const pageRange = getPageRange();
  const showLeftEllipsis = pageRange[0] > 1;
  const showRightEllipsis = pageRange[pageRange.length - 1] < totalPages - 2;
  const startItem = page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  // ─── Full Pagination ────────────────────────────────────────────────────────
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 select-none",
      "bg-card border border-border rounded-lg px-4 py-2.5 shadow-none"
    )}>
      {/* Rows per page */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
          Hiển thị
        </span>
        <div className="flex items-center rounded-md border border-border overflow-hidden bg-background">
          {sizeOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (setSize) setSize(s);
                setPage(0);
              }}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono font-semibold border-r last:border-r-0 border-border",
                "transition-colors duration-150 cursor-pointer",
                size === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          dòng / trang
        </span>
      </div>

      {/* Page number buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          type="button"
          onClick={() => setPage(0)}
          disabled={page === 0}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md text-xs",
            "border border-border bg-background text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
          )}
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous */}
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md text-xs",
            "border border-border bg-background text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
          )}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* First page number (if not in range) */}
        {pageRange[0] > 0 && (
          <button
            type="button"
            onClick={() => setPage(0)}
            className={cn(
              "h-7 min-w-[28px] px-1 flex items-center justify-center rounded-md",
              "text-[11px] font-mono font-semibold border border-border",
              "bg-background text-foreground hover:bg-muted",
              "transition-colors duration-150 cursor-pointer"
            )}
          >
            1
          </button>
        )}

        {/* Left ellipsis */}
        {showLeftEllipsis && (
          <span className="h-7 w-7 flex items-center justify-center text-[11px] text-muted-foreground font-mono select-none">
            …
          </span>
        )}

        {/* Page range */}
        {pageRange.map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setPage(idx)}
            aria-current={page === idx ? "page" : undefined}
            className={cn(
              "h-7 min-w-[28px] px-1 flex items-center justify-center rounded-md",
              "text-[11px] font-mono font-semibold border",
              "transition-colors duration-150 cursor-pointer",
              page === idx
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {idx + 1}
          </button>
        ))}

        {/* Right ellipsis */}
        {showRightEllipsis && (
          <span className="h-7 w-7 flex items-center justify-center text-[11px] text-muted-foreground font-mono select-none">
            …
          </span>
        )}

        {/* Last page number (if not in range) */}
        {pageRange[pageRange.length - 1] < totalPages - 1 && (
          <button
            type="button"
            onClick={() => setPage(totalPages - 1)}
            className={cn(
              "h-7 min-w-[28px] px-1 flex items-center justify-center rounded-md",
              "text-[11px] font-mono font-semibold border border-border",
              "bg-background text-foreground hover:bg-muted",
              "transition-colors duration-150 cursor-pointer"
            )}
          >
            {totalPages}
          </button>
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md text-xs",
            "border border-border bg-background text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
          )}
          aria-label="Trang tiếp"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => setPage(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md text-xs",
            "border border-border bg-background text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors duration-150 cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border"
          )}
          aria-label="Trang cuối"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary info */}
      <div className="text-[11px] font-mono text-muted-foreground text-right whitespace-nowrap">
        {startItem}–{endItem} / {totalElements} kết quả
      </div>
    </div>
  );
}
