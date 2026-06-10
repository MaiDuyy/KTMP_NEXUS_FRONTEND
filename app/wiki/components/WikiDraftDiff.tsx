"use client";

import React from "react";
import { diffLines, diffWordsWithSpace } from "diff";
import { ChevronRight, ChevronDown, Check, Minus, Plus } from "lucide-react";

type Props = {
  oldText: string;
  newText: string;
  mode?: "unified" | "split";
  contextLines?: number;
  groupByHeading?: boolean;
};

const HEADING_RE = /^(#{1,6})\s+(.+)$/;

type DiffSection = {
  heading: string | null;
  level: number;
  items: LineChange[];
  hasChanges: boolean;
};

function groupBySection(changes: LineChange[]): DiffSection[] {
  const sections: DiffSection[] = [];
  let current: DiffSection = { heading: null, level: 0, items: [], hasChanges: false };
  for (const c of changes) {
    const m = c.kind === "equal" ? c.text.match(HEADING_RE) : null;
    if (m) {
      if (current.items.length > 0 || current.heading !== null) {
        sections.push(current);
      }
      current = {
        heading: m[2].trim(),
        level: m[1].length,
        items: [c],
        hasChanges: false,
      };
    } else {
      if (c.kind !== "equal") current.hasChanges = true;
      current.items.push(c);
    }
  }
  if (current.items.length > 0) sections.push(current);
  if (sections.length === 1 && sections[0].heading === null) {
    return sections;
  }
  return sections;
}

type LineChange = {
  kind: "add" | "remove" | "equal";
  text: string;
};

function buildLineChanges(oldText: string, newText: string): LineChange[] {
  const parts = diffLines(oldText, newText, { newlineIsToken: false });
  const out: LineChange[] = [];
  for (const part of parts) {
    const lines = part.value.split(/\r?\n/);
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    const kind: LineChange["kind"] = part.added ? "add" : part.removed ? "remove" : "equal";
    for (const line of lines) {
      out.push({ kind, text: line });
    }
  }
  return out;
}

function collapseEqualRuns(changes: LineChange[], context: number): LineChange[] {
  if (context <= 0) return changes.filter((c) => c.kind !== "equal");
  const out: LineChange[] = [];
  let i = 0;
  while (i < changes.length) {
    const c = changes[i];
    if (c.kind !== "equal") {
      out.push(c);
      i++;
      continue;
    }
    let j = i;
    while (j < changes.length && changes[j].kind === "equal") j++;
    const run = changes.slice(i, j);

    if (i === 0) {
      const tail = run.slice(Math.max(0, run.length - context));
      if (run.length > tail.length) {
        out.push({ kind: "equal", text: `··· ${run.length - tail.length} dòng không thay đổi ···` });
      }
      out.push(...tail);
    } else if (j === changes.length) {
      out.push(...run.slice(0, context));
      if (run.length > context) {
        out.push({ kind: "equal", text: `··· ${run.length - context} dòng không thay đổi ···` });
      }
    } else if (run.length <= 2 * context) {
      out.push(...run);
    } else {
      out.push(...run.slice(0, context));
      out.push({ kind: "equal", text: `··· ${run.length - 2 * context} dòng không thay đổi ···` });
      out.push(...run.slice(run.length - context));
    }
    i = j;
  }
  return out;
}

function renderWordDiff(oldLine: string, newLine: string): React.ReactNode {
  const parts = diffWordsWithSpace(oldLine, newLine);
  return parts.map((p, i) => {
    if (p.added) {
      return (
        <span key={i} className="bg-emerald-200/60 dark:bg-emerald-800/40 text-emerald-950 dark:text-emerald-100 rounded px-0.5 font-semibold">
          {p.value}
        </span>
      );
    }
    if (p.removed) {
      return (
        <span key={i} className="bg-rose-200/60 dark:bg-rose-800/40 text-rose-950 dark:text-rose-100 rounded px-0.5 line-through opacity-70">
          {p.value}
        </span>
      );
    }
    return <span key={i}>{p.value}</span>;
  });
}

export function WikiDraftDiff({
  oldText,
  newText,
  mode = "unified",
  contextLines = 3,
  groupByHeading = true,
}: Props) {
  const changes = React.useMemo(() => buildLineChanges(oldText, newText), [oldText, newText]);
  const visible = React.useMemo(() => collapseEqualRuns(changes, contextLines), [changes, contextLines]);
  const sections = React.useMemo(
    () => (groupByHeading ? groupBySection(visible) : null),
    [visible, groupByHeading]
  );

  if (oldText === newText) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-muted/20 text-center">
        <Check className="w-8 h-8 text-emerald-500 mb-2" />
        <p className="text-sm font-medium text-foreground">Không có thay đổi</p>
        <p className="text-xs text-muted-foreground mt-1">Bản thảo trùng khớp hoàn toàn với phiên bản chính thức.</p>
      </div>
    );
  }

  if (mode === "split") {
    return <SplitDiff oldText={oldText} newText={newText} />;
  }

  if (sections && sections.length > 1) {
    return <SectionedDiff sections={sections} />;
  }

  return (
    <div className="font-mono text-xs leading-relaxed space-y-px">
      {visible.map((c, i) => {
        if (c.kind === "equal") {
          if (c.text.startsWith("···")) {
            return (
              <div key={i} className="text-muted-foreground/60 text-center py-2 select-none border-y border-dashed my-2 text-[10px]">
                {c.text}
              </div>
            );
          }
          return (
            <div key={i} className="text-muted-foreground/80 px-2 py-0.5 whitespace-pre-wrap rounded hover:bg-muted/30">
              <span className="text-muted-foreground/30 mr-3 select-none inline-block w-4 text-right">·</span>
              {c.text || " "}
            </div>
          );
        }
        if (c.kind === "add") {
          return (
            <div
              key={i}
              className="bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 whitespace-pre-wrap border-l-2 border-emerald-500 rounded-r"
            >
              <span className="text-emerald-500 mr-3 select-none inline-block w-4 text-right">+</span>
              {c.text || " "}
            </div>
          );
        }
        return (
          <div
            key={i}
            className="bg-rose-500/10 dark:bg-rose-500/5 text-rose-800 dark:text-rose-200 px-2 py-0.5 whitespace-pre-wrap border-l-2 border-rose-500 rounded-r"
          >
            <span className="text-rose-500 mr-3 select-none inline-block w-4 text-right">−</span>
            {c.text || " "}
          </div>
        );
      })}
    </div>
  );
}

function SplitDiff({ oldText, newText }: { oldText: string; newText: string }) {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  const max = Math.max(oldLines.length, newLines.length);

  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-xs leading-relaxed overflow-x-auto">
      <div className="border rounded-xl p-3 bg-muted/10">
        <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 pb-1 border-b border-border flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-rose-500" /> Bản chính thức
        </div>
        <div className="space-y-px">
          {Array.from({ length: max }).map((_, i) => {
            const o = oldLines[i] ?? "";
            const n = newLines[i] ?? "";
            const changed = o !== n;
            return (
              <div
                key={`o${i}`}
                className={`px-2 py-0.5 whitespace-pre-wrap rounded min-h-[1.5rem] ${
                  changed ? "bg-rose-500/10 text-rose-800 dark:text-rose-300 font-medium" : "text-muted-foreground/80"
                }`}
              >
                {changed && o ? renderWordDiff(o, n) : o || " "}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border rounded-xl p-3 bg-muted/10">
        <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 pb-1 border-b border-border flex items-center gap-1.5">
          <Plus className="w-3 h-3 text-emerald-500" /> Bản thảo đề xuất
        </div>
        <div className="space-y-px">
          {Array.from({ length: max }).map((_, i) => {
            const o = oldLines[i] ?? "";
            const n = newLines[i] ?? "";
            const changed = o !== n;
            return (
              <div
                key={`n${i}`}
                className={`px-2 py-0.5 whitespace-pre-wrap rounded min-h-[1.5rem] ${
                  changed ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium" : "text-foreground/90"
                }`}
              >
                {changed && n ? renderWordDiff(o, n) : n || " "}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderHunkLine(c: LineChange, key: number) {
  if (c.kind === "equal") {
    if (c.text.startsWith("···")) {
      return (
        <div key={key} className="text-muted-foreground/60 text-center py-2 select-none border-y border-dashed my-2 text-[10px]">
          {c.text}
        </div>
      );
    }
    return (
      <div key={key} className="text-muted-foreground/70 px-2 py-0.5 whitespace-pre-wrap rounded hover:bg-muted/30">
        <span className="text-muted-foreground/30 mr-3 select-none inline-block w-4 text-right">·</span>
        {c.text || " "}
      </div>
    );
  }
  if (c.kind === "add") {
    return (
      <div
        key={key}
        className="bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 whitespace-pre-wrap border-l-2 border-emerald-500 rounded-r font-medium"
      >
        <span className="text-emerald-500 mr-3 select-none inline-block w-4 text-right">+</span>
        {c.text || " "}
      </div>
    );
  }
  return (
    <div
      key={key}
      className="bg-rose-500/10 dark:bg-rose-500/5 text-rose-800 dark:text-rose-200 px-2 py-0.5 whitespace-pre-wrap border-l-2 border-rose-500 rounded-r font-medium"
    >
      <span className="text-rose-500 mr-3 select-none inline-block w-4 text-right">−</span>
      {c.text || " "}
    </div>
  );
}

function SectionedDiff({ sections }: { sections: DiffSection[] }) {
  const [openIdx, setOpenIdx] = React.useState<Set<number>>(() => {
    const s = new Set<number>();
    sections.forEach((sec, i) => {
      if (sec.hasChanges || sec.heading === null) s.add(i);
    });
    return s;
  });

  return (
    <div className="font-mono text-xs leading-relaxed space-y-3">
      {sections.map((sec, i) => {
        const open = openIdx.has(i);
        if (sec.heading === null) {
          return (
            <div key={i} className="space-y-px">
              {sec.items.map((c, j) => renderHunkLine(c, j))}
            </div>
          );
        }
        return (
          <section
            key={i}
            className={`rounded-xl border ${
              sec.hasChanges
                ? "border-amber-500/25 bg-amber-500/5"
                : "border-border bg-card/25"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setOpenIdx((prev) => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50 rounded-t-xl`}
            >
              {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <span
                className={`flex-1 truncate font-sans font-semibold text-foreground ${
                  sec.level <= 2 ? "text-sm" : "text-xs"
                }`}
              >
                {"#".repeat(sec.level)} {sec.heading}
              </span>
              {sec.hasChanges ? (
                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  Có thay đổi
                </span>
              ) : (
                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  Trùng khớp
                </span>
              )}
            </button>
            {open && (
              <div className="p-3 border-t border-border/50 space-y-px">
                {sec.items.map((c, j) => renderHunkLine(c, j))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
