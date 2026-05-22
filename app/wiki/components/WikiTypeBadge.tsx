import React from "react";
import { User, Lightbulb, Tag, FileText, List, History, HelpCircle } from "lucide-react";

export type WikiPageType = "entity" | "concept" | "topic" | "source" | "index" | "log";

const TYPE_CONFIG: Record<
  WikiPageType,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bg: string; borderColor: string }
> = {
  entity: { icon: User, label: "Thực thể", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/30", borderColor: "border-sky-200 dark:border-sky-800" },
  concept: { icon: Lightbulb, label: "Khái niệm", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
  topic: { icon: Tag, label: "Chủ đề", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
  source: { icon: FileText, label: "Nguồn tin", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", borderColor: "border-rose-200 dark:border-rose-800" },
  index: { icon: List, label: "Chỉ mục", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950/30", borderColor: "border-slate-200 dark:border-slate-800" },
  log: { icon: History, label: "Nhật ký", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950/30", borderColor: "border-slate-200 dark:border-slate-800" },
};

export function WikiTypeBadge({ type }: { type: string }) {
  const normType = (type || "").toLowerCase() as WikiPageType;
  const cfg = TYPE_CONFIG[normType] ?? {
    icon: HelpCircle,
    label: type || "Wiki",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-800",
  };
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10.5px] font-mono font-bold uppercase tracking-wider rounded-md ${cfg.bg} ${cfg.color} ${cfg.borderColor}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

export function wikiTypeIcon(type: string): React.ComponentType<{ className?: string }> {
  const normType = (type || "").toLowerCase() as WikiPageType;
  return TYPE_CONFIG[normType]?.icon ?? HelpCircle;
}

export function wikiTypeColor(type: string): string {
  const normType = (type || "").toLowerCase() as WikiPageType;
  // HEX colors for canvas/graph rendering
  const hexColors: Record<WikiPageType, string> = {
    entity: "#0284c7",  // sky-600
    concept: "#059669", // emerald-600
    topic: "#d97706",   // amber-600
    source: "#e11d48",  // rose-600
    index: "#475569",   // slate-600
    log: "#475569",     // slate-600
  };
  return hexColors[normType] ?? "#475569";
}

export function wikiTypeGroupLabel(type: string): string {
  const labels: Record<string, string> = {
    entity: "Thực thể",
    concept: "Khái niệm",
    topic: "Chủ đề",
    source: "Nguồn tin",
    index: "Chỉ mục",
    log: "Nhật ký",
  };
  return labels[type.toLowerCase()] ?? type;
}
