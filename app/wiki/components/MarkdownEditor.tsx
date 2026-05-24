"use client";

import React from "react";
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Code as CodeIcon, 
  List as ListIcon, 
  ListOrdered as ListOrderedIcon, 
  Quote as QuoteIcon, 
  Braces as BracesIcon, 
  Link as LinkIcon, 
  Network as NetworkIcon, 
  Minus as MinusIcon,
  BookOpen
} from "lucide-react";
import { WikiContent } from "./WikiContent";
import { WikilinkAutocomplete } from "./WikilinkAutocomplete";
import { getTextareaCaretCoords, type CaretCoords } from "../../../src/lib/textarea-caret";
import { useGetWikiPagesMetadataQuery, WikiPage } from "@/src/redux/feature/mrpApi";
import { useSelector } from "react-redux";

function insertWrap(
  ta: HTMLTextAreaElement,
  value: string,
  setValue: (v: string) => void,
  before: string,
  after = "",
  placeholder = "text",
) {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const sel = value.slice(s, e) || placeholder;
  const next = value.slice(0, s) + before + sel + after + value.slice(e);
  setValue(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(s + before.length, s + before.length + sel.length);
  });
}

function insertLinePrefix(
  ta: HTMLTextAreaElement,
  value: string,
  setValue: (v: string) => void,
  prefix: string,
) {
  const s = ta.selectionStart;
  const lineStart = value.lastIndexOf("\n", s - 1) + 1;
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  setValue(next);
  requestAnimationFrame(() => {
    ta.focus();
    const pos = s + prefix.length;
    ta.setSelectionRange(pos, pos);
  });
}

function insertBlock(
  ta: HTMLTextAreaElement,
  value: string,
  setValue: (v: string) => void,
  block: string,
  cursorOffset: number,
) {
  const s = ta.selectionStart;
  const next = value.slice(0, s) + block + value.slice(s);
  setValue(next);
  requestAnimationFrame(() => {
    ta.focus();
    const pos = s + cursorOffset;
    ta.setSelectionRange(pos, pos);
  });
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 border border-border bg-card hover:bg-muted hover:border-primary/30 text-foreground rounded-lg transition-all shadow-xs"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function ToolbarSep() {
  return <span className="w-px h-5 bg-border mx-1 shrink-0" />;
}

export type MarkdownEditorProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeightClass?: string;
};

type LinkContext = {
  start: number;
  query: string;
  caretOffset: number;
};

function detectWikilinkContext(value: string, caret: number): LinkContext | null {
  const MAX_LOOKBACK = 80;
  const start = Math.max(0, caret - MAX_LOOKBACK);
  for (let i = caret - 1; i >= start; i--) {
    const c = value[i];
    if (c === "\n") return null;
    if (c === "]") return null; 
    if (c === "[" && value[i - 1] === "[") {
      return { start: i + 1, query: value.slice(i + 1, caret), caretOffset: caret };
    }
  }
  return null;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung Markdown tại đây...",
  minHeightClass = "min-h-[400px]",
}: MarkdownEditorProps) {
  const [tab, setTab] = React.useState<"edit" | "preview">("edit");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Autocomplete context
  const [link, setLink] = React.useState<LinkContext | null>(null);
  const [coords, setCoords] = React.useState<CaretCoords | null>(null);
  
  // RTK query for page pool (lightweight metadata)
  const currentWorkspaceId = useSelector((state: any) => state.workspace.currentWorkspaceId);
  const workspaceId = currentWorkspaceId || "default-workspace";
  const { data: pagesData } = useGetWikiPagesMetadataQuery({ workspaceId });
  const pages: WikiPage[] = React.useMemo(() => pagesData || [], [pagesData]);

  const updateLinkCtx = React.useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const ctx = detectWikilinkContext(ta.value, ta.selectionStart);
    if (ctx) {
      setLink(ctx);
      try {
        setCoords(getTextareaCaretCoords(ta, ta.selectionStart));
      } catch {
        setCoords(null);
      }
    } else {
      setLink(null);
      setCoords(null);
    }
  }, []);

  const handlePick = (p: WikiPage) => {
    const ta = taRef.current;
    if (!ta || !link) return;
    const after = `${p.slug}]]`;
    const next = ta.value.slice(0, link.start) + after + ta.value.slice(link.caretOffset);
    onChange(next);
    const newCaret = link.start + after.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCaret, newCaret);
      setLink(null);
      setCoords(null);
    });
  };

  const w = (before: string, after = "", placeholder = "text") => {
    const ta = taRef.current;
    if (!ta) return;
    insertWrap(ta, value, onChange, before, after, placeholder);
  };
  const lp = (prefix: string) => {
    const ta = taRef.current;
    if (!ta) return;
    insertLinePrefix(ta, value, onChange, prefix);
  };
  const blk = (block: string, offset: number) => {
    const ta = taRef.current;
    if (!ta) return;
    insertBlock(ta, value, onChange, block, offset);
  };

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-border bg-card text-foreground overflow-hidden font-sans shadow-sm">
      {/* Header tab controller */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border select-none">
        <div className="flex gap-1 border border-border p-0.5 bg-background rounded-lg">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase transition-colors duration-150 ${
                tab === t
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {t === "edit" ? "Biên soạn" : "Xem trước"}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono font-extrabold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Markdown Editor
        </span>
      </div>

      {tab === "edit" ? (
        <>
          {/* Toolbar */}
          <div className="flex items-center flex-wrap gap-1.5 px-3 py-1.5 bg-muted/50 border-b border-border select-none">
            <ToolbarButton icon={BoldIcon} label="In đậm (Ctrl+B)" onClick={() => w("**", "**", "chữ in đậm")} />
            <ToolbarButton icon={ItalicIcon} label="In nghiêng (Ctrl+I)" onClick={() => w("*", "*", "chữ in nghiêng")} />
            <ToolbarButton icon={CodeIcon} label="Mã dòng (Inline Code)" onClick={() => w("`", "`", "code")} />
            
            <ToolbarSep />
            
            <button
              type="button"
              title="Tiêu đề H2"
              onClick={() => lp("## ")}
              className="px-2 h-7 border border-border bg-card hover:bg-muted hover:border-primary/30 text-foreground rounded-lg transition-all duration-150 text-xs font-black font-mono shadow-xs"
            >
              H2
            </button>
            <button
              type="button"
              title="Tiêu đề H3"
              onClick={() => lp("### ")}
              className="px-2 h-7 border border-border bg-card hover:bg-muted hover:border-primary/30 text-foreground rounded-lg transition-all duration-150 text-xs font-black font-mono shadow-xs"
            >
              H3
            </button>
            
            <ToolbarSep />
            
            <ToolbarButton icon={ListIcon} label="Danh sách không thứ tự" onClick={() => lp("- ")} />
            <ToolbarButton icon={ListOrderedIcon} label="Danh sách có thứ tự" onClick={() => lp("1. ")} />
            <ToolbarButton icon={QuoteIcon} label="Trích dẫn" onClick={() => lp("> ")} />
            
            <ToolbarSep />
            
            <ToolbarButton icon={BracesIcon} label="Khối mã (Code block)" onClick={() => blk("\n```\n\n```\n", 5)} />
            <ToolbarButton icon={LinkIcon} label="Đường dẫn liên kết" onClick={() => w("[", "](url)", "tên liên kết")} />
            <ToolbarButton
              icon={NetworkIcon}
              label="Liên kết Wiki (Wikilink) - Hoặc gõ [["
              onClick={() => {
                const ta = taRef.current;
                if (!ta) return;
                insertWrap(ta, value, onChange, "[[", "", "");
                requestAnimationFrame(() => updateLinkCtx());
              }}
            />
            <ToolbarButton icon={MinusIcon} label="Đường kẻ ngang" onClick={() => blk("\n\n---\n\n", 6)} />
          </div>

          {/* Editor area */}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              requestAnimationFrame(updateLinkCtx);
            }}
            onClick={updateLinkCtx}
            onKeyUp={(e) => {
              if (
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown" ||
                e.key === "Home" ||
                e.key === "End"
              ) {
                updateLinkCtx();
              }
            }}
            onBlur={() => {
              // Timeout to let autocomplete select handler run first
              setTimeout(() => {
                if (document.activeElement !== taRef.current) {
                  setLink(null);
                  setCoords(null);
                }
              }, 200);
            }}
            className={`w-full ${minHeightClass} resize-y p-3 font-mono text-xs leading-relaxed bg-background text-foreground focus:outline-none placeholder:text-muted-foreground border-none`}
            placeholder={placeholder}
            spellCheck={false}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                e.preventDefault();
                w("**", "**", "chữ in đậm");
              }
              if ((e.metaKey || e.ctrlKey) && e.key === "i") {
                e.preventDefault();
                w("*", "*", "chữ in nghiêng");
              }
            }}
          />
        </>
      ) : (
        <div className={`${minHeightClass} p-4 bg-background overflow-y-auto max-h-[500px]`}>
          {value.trim() ? (
            <WikiContent markdown={value} />
          ) : (
            <p className="text-xs text-muted-foreground italic select-none">Không có gì để hiển thị trước.</p>
          )}
        </div>
      )}

      {/* Autocomplete Popup */}
      {tab === "edit" && link && coords && (
        <WikilinkAutocomplete
          pages={pages}
          query={link.query}
          caret={coords}
          onPick={handlePick}
          onClose={() => {
            setLink(null);
            setCoords(null);
          }}
        />
      )}
    </div>
  );
}
