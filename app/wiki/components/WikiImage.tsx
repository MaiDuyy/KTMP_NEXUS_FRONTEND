"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, ImageOff, Loader2 } from "lucide-react";

type Status = "ok" | "loading" | "denied" | "missing";

export function WikiImage({
  src,
  alt,
  status,
}: {
  src?: string;
  alt?: string;
  status: Status;
}) {
  if (status === "loading") {
    return (
      <span className="block my-3 rounded-xl border border-border bg-muted p-4 text-center text-xs font-mono font-bold text-muted-foreground flex items-center justify-center gap-2 shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Đang tải hình ảnh…
      </span>
    );
  }

  if (status === "denied") {
    return (
      <span className="block my-3 rounded-xl border border-dashed border-rose-500 bg-rose-500/5 p-4 text-center text-xs font-mono font-bold text-rose-600 flex flex-col items-center justify-center gap-1 shadow-sm">
        <Lock className="w-5 h-5 mb-1" />
        Hình ảnh bị giới hạn quyền truy cập
        {alt ? <span className="block mt-1 italic font-sans font-normal text-muted-foreground">{alt}</span> : null}
      </span>
    );
  }

  if (status === "missing" || !src) {
    return (
      <span className="block my-3 rounded-xl border border-dashed border-border bg-muted/10 p-4 text-center text-xs font-mono font-bold text-muted-foreground flex flex-col items-center justify-center gap-1 shadow-sm">
        <ImageOff className="w-5 h-5 mb-1" />
        Không tìm thấy hình ảnh
        {alt ? <span className="block mt-1 italic font-sans font-normal">{alt}</span> : null}
      </span>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block my-3 group/wiki-img w-full text-left focus:outline-none"
          aria-label={alt || "Hình ảnh wiki"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            className="rounded-xl border border-border max-w-full max-h-[480px] object-contain mx-auto bg-muted/20 shadow-md transition-colors duration-200"
          />
          {alt ? (
            <span className="block mt-2 text-xs text-muted-foreground italic text-center font-sans">
              {alt}
            </span>
          ) : null}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[min(95vw,1400px)] p-3 bg-card border border-border rounded-xl shadow-lg"
      >
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            className="max-h-[75vh] max-w-full object-contain rounded-xl border border-border"
          />
          <div className="flex w-full items-center justify-between gap-3 px-2 pb-1 text-xs font-mono">
            <span className="text-muted-foreground italic flex-1 truncate font-sans">
              {alt || ""}
            </span>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 rounded-lg shadow-sm active:scale-[0.98]"
            >
              Tải xuống hình ảnh gốc
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
