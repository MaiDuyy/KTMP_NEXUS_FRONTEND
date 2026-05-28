"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  Sparkles, X, Send, Loader2, Bot, RefreshCw,
  Zap, BookOpen, FileText, Search, ChevronRight,
  BookMarked, PenLine, ListTree, MessageSquarePlus, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIMessage, useAIAssistant } from "@/src/hooks/useAIAssistant";
import { AIMessageBubble } from "@/src/features/ai/AIMessageBubble";
import { useSelector } from "react-redux";
import { useGetConversationMessagesQuery, useGetConversationsQuery } from "@/src/redux/feature/aiApi";

// ─── Wiki-specific quick actions for Agent mode ───────────────────────────────
const WIKI_AGENT_SUGGESTIONS = [
  { icon: Search, label: "Tìm trang wiki liên quan", query: "Liệt kê các trang wiki hiện có trong workspace" },
  { icon: BookMarked, label: "Đọc nội dung trang", query: "Tìm kiếm và đọc trang wiki về quy trình onboarding" },
  { icon: PenLine, label: "Đề xuất trang mới", query: "Tạo trang wiki mới về chủ đề: " },
  { icon: ListTree, label: "Tóm tắt wiki hiện tại", query: "Liệt kê tất cả các trang wiki và mô tả ngắn gọn từng trang" },
];

// ─── RAG suggestions ──────────────────────────────────────────────────────────
const WIKI_RAG_SUGGESTIONS = [
  { icon: Search, label: "Tìm tài liệu theo chủ đề", query: "Tìm tài liệu về quy trình nghỉ phép" },
  { icon: FileText, label: "Giải thích khái niệm", query: "Giải thích khái niệm OKR trong tổ chức" },
  { icon: BookOpen, label: "Hỏi về chính sách", query: "Chính sách làm việc từ xa của công ty là gì?" },
];

// ─── Format conversation title helper ─────────────────────────────────────────
function formatTitle(title: string) {
  if (!title) return "";
  let clean = title;
  if (clean.startsWith("{")) {
    try { clean = JSON.parse(clean).summary || clean; } catch { /* skip */ }
  }
  const lower = clean.toLowerCase();
  if (lower.includes("summary:")) {
    const start = lower.indexOf("summary:") + 8;
    let end = lower.indexOf("details:");
    if (end === -1) end = clean.length;
    if (end > start) clean = clean.substring(start, end);
  }
  return clean.replace(/[{}"[\]]|summary:|details:|sources:/g, "").trim().replace(/,$/, "").trim();
}

// ─── Component interface ──────────────────────────────────────────────────────
interface WikiAIChatPanelProps {
  /** Current wiki page slug (used for context injection) */
  currentPageSlug?: string;
  /** Current wiki page title */
  currentPageTitle?: string;
  onClose: () => void;
}

// ─── WIKI_CHAT_ID — synthetic chatId for wiki agent context ──────────────────
const WIKI_CHAT_ID = "wiki-assistant";

export function WikiAIChatPanel({ currentPageSlug, currentPageTitle, onClose }: WikiAIChatPanelProps) {
  const [agentMode, setAgentMode] = useState(true); // Wiki defaults to agent mode
  const [inputValue, setInputValue] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [forceNewConv, setForceNewConv] = useState(false);

  const currentWorkspaceId = useSelector((state: any) => state.workspace?.currentWorkspaceId);
  const workspaceId = currentWorkspaceId || "default-workspace";

  // ── Conversation history ───────────────────────────────────────────────────
  const { data: conversations, isLoading: isLoadingConv, refetch: refetchConversations } =
    useGetConversationsQuery();

  const activeConv = useMemo(() => {
    if (forceNewConv || !conversations) return null;
    return conversations.find((c: any) => {
      const isAgentTitle = c.title.startsWith("Agent");
      return c.chatId === WIKI_CHAT_ID && (agentMode ? isAgentTitle : !isAgentTitle);
    });
  }, [conversations, agentMode, forceNewConv]);

  const { aiMessages: currentMessages, isStreaming, sendAIQuery, sendAgentQuery, clearAI } =
    useAIAssistant(WIKI_CHAT_ID, activeConv?.id || undefined);

  const { data: historyMessages, isLoading: isLoadingHistory } = useGetConversationMessagesQuery(
    activeConv?.id as number,
    { skip: !activeConv?.id }
  );

  const mappedHistory: AIMessage[] = useMemo(() => {
    if (!activeConv?.id || !historyMessages) return [];
    return historyMessages.map((m: any) => ({
      id: `hist_${m.id}`,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: m.createdAt,
      mode: agentMode ? "agent" : "rag",
    }));
  }, [historyMessages, agentMode, activeConv?.id]);

  const allMessages = useMemo(() => [...mappedHistory, ...currentMessages], [mappedHistory, currentMessages]);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Auto scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // ── Refetch conversations after streaming ends ─────────────────────────────
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) refetchConversations();
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, refetchConversations]);

  // ── Clear on mode switch ───────────────────────────────────────────────────
  useEffect(() => { clearAI(); }, [agentMode, clearAI]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setForceNewConv(false);

    // Inject wiki context if on a specific page
    const contextualText = currentPageSlug
      ? `[Context: Đang xem trang wiki "${currentPageTitle || currentPageSlug}"] ${text}`
      : text;

    if (agentMode) {
      sendAgentQuery(contextualText, workspaceId);
    } else {
      sendAIQuery(contextualText);
    }
    setInputValue("");
    textareaRef.current?.focus();
  }, [inputValue, isStreaming, agentMode, currentPageSlug, currentPageTitle, workspaceId, sendAIQuery, sendAgentQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearAI();
    setForceNewConv(true);
  };

  const handleSuggestion = (query: string) => {
    setForceNewConv(false);
    if (agentMode) {
      sendAgentQuery(query, workspaceId);
    } else {
      sendAIQuery(query);
    }
  };

  const suggestions = agentMode ? WIKI_AGENT_SUGGESTIONS : WIKI_RAG_SUGGESTIONS;
  const isEmpty = allMessages.length === 0 && !isLoadingHistory;

  // ── Minimized state ────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-xs font-bold border border-white/10 hover:scale-105 transition-transform"
      >
        <Sparkles size={14} className="animate-pulse" />
        Trợ lý Wiki AI
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
        "w-[360px] h-[580px]"
      )}
      style={{ boxShadow: "0 8px 40px -8px rgba(99,102,241,0.25), 0 0 0 1px rgba(0,0,0,0.06)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b shrink-0 transition-colors duration-300",
          agentMode
            ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/60 dark:border-amber-800/30"
            : "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200/60 dark:border-indigo-800/30"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-md shrink-0",
              agentMode
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-to-br from-indigo-500 to-purple-600"
            )}
          >
            {agentMode ? <Zap size={15} className="text-white" /> : <Sparkles size={15} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-none">
              {agentMode ? "Wiki Agent" : "Wiki AI Search"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", agentMode ? "bg-amber-500" : "bg-emerald-500")} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {isStreaming ? "Đang xử lý..." : "Sẵn sàng"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <button
            onClick={() => setAgentMode((v) => !v)}
            title={agentMode ? "Chuyển về RAG Search" : "Bật Agent Mode (wiki tools)"}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all border",
              agentMode
                ? "bg-amber-500 border-amber-400 text-white"
                : "bg-background border-border text-muted-foreground hover:border-amber-300 hover:text-amber-500"
            )}
          >
            <Zap size={13} />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            title="Cuộc hội thoại mới"
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
          >
            <RefreshCw size={12} />
          </button>

          {/* Minimize */}
          <button
            onClick={() => setMinimized(true)}
            title="Thu nhỏ"
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-border bg-background text-muted-foreground hover:text-foreground transition-all"
          >
            <Minimize2 size={12} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-border bg-background text-muted-foreground hover:text-red-500 hover:border-red-200 transition-all"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Context chip (if on a specific wiki page) ───────────────────────── */}
      {currentPageSlug && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/40 border-b border-border shrink-0">
          <BookOpen size={11} className="text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground font-mono truncate">
            Ngữ cảnh: <span className="font-bold text-foreground">{currentPageTitle || currentPageSlug}</span>
          </span>
        </div>
      )}

      {/* ── Mode banner ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "px-4 py-1.5 shrink-0 flex items-center gap-1.5 border-b transition-colors duration-300",
          agentMode
            ? "bg-amber-500/5 border-amber-200/40 dark:border-amber-800/20"
            : "bg-indigo-500/5 border-indigo-200/40 dark:border-indigo-800/20"
        )}
      >
        {agentMode ? (
          <>
            <Zap size={10} className="text-amber-500 shrink-0" />
            <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
              Agent Mode · wiki tools · search · create · edit
            </span>
          </>
        ) : (
          <>
            <Sparkles size={10} className="text-indigo-500 shrink-0" />
            <span className="text-[9px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">
              RAG Mode · tìm kiếm ngữ nghĩa trong cơ sở tri thức
            </span>
          </>
        )}
      </div>

      {/* ── Messages area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 custom-scrollbar">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-[10px] font-medium">Đang tải lịch sử...</span>
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-5 py-6 animate-in fade-in duration-500">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                agentMode
                  ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40"
                  : "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40"
              )}
            >
              <Bot size={28} className={agentMode ? "text-amber-500" : "text-indigo-500"} />
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground">
                {agentMode ? "Wiki Agent sẵn sàng" : "Hỏi về kiến thức tổ chức"}
              </p>
              <p className="text-[10px] text-muted-foreground max-w-[240px] leading-relaxed">
                {agentMode
                  ? "Tôi có thể tìm, đọc, đề xuất tạo hoặc chỉnh sửa trang wiki cho bạn."
                  : "Đặt câu hỏi về tài liệu, quy trình hoặc chính sách nội bộ."}
              </p>
            </div>

            <div className="w-full space-y-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.query)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium border transition-all duration-200 group",
                    agentMode
                      ? "bg-amber-50/50 border-amber-200/60 text-amber-800 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-300"
                      : "bg-indigo-50/50 border-indigo-200/60 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-900/10 dark:border-indigo-800/30 dark:text-indigo-300"
                  )}
                  disabled={isStreaming}
                >
                  <s.icon size={13} className="shrink-0 opacity-70" />
                  <span className="truncate">{s.label}</span>
                  <ChevronRight size={11} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {allMessages.map((msg) => (
              <AIMessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.isStreaming}
                mode={msg.mode}
              />
            ))}
            <div ref={scrollEndRef} className="h-2" />
          </>
        )}
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-border bg-background shrink-0">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              agentMode
                ? "Yêu cầu agent tìm, tạo hoặc chỉnh sửa wiki..."
                : "Hỏi về tài liệu và tri thức nội bộ..."
            }
            disabled={isStreaming}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border py-3 pl-4 pr-12 text-xs font-medium leading-relaxed",
              "bg-muted/40 placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:bg-background transition-all duration-200",
              "max-h-[120px] min-h-[44px] custom-scrollbar",
              agentMode
                ? "border-amber-200/60 focus:ring-amber-200 focus:border-amber-300 dark:border-amber-800/30"
                : "border-indigo-200/60 focus:ring-indigo-200 focus:border-indigo-300 dark:border-indigo-800/30"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className={cn(
              "absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              agentMode
                ? "bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
                : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            )}
          >
            {isStreaming
              ? <Loader2 size={14} className="animate-spin text-white" />
              : <Send size={14} className="text-white" />
            }
          </button>
        </div>

        <p className="text-center text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest mt-2">
          {agentMode ? "Gemini Agent · Wiki Tools" : "Gemini RAG · Vector Search"}
        </p>
      </div>
    </div>
  );
}

// ─── Floating trigger button ──────────────────────────────────────────────────
interface WikiAIChatButtonProps {
  onClick: () => void;
  hasMessages?: boolean;
}

export function WikiAIChatButton({ onClick, hasMessages }: WikiAIChatButtonProps) {
  return (
    <button
      onClick={onClick}
      id="wiki-ai-chat-button"
      className={cn(
        "group relative flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-all duration-300",
        "border text-xs font-bold uppercase tracking-wide",
        "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
        "text-white border-indigo-400/30 hover:shadow-indigo-200/50 hover:shadow-xl",
        "active:scale-95"
      )}
    >
      <MessageSquarePlus size={14} className="shrink-0 group-hover:rotate-12 transition-transform duration-300" />
      <span>Hỏi AI</span>
      {hasMessages && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </button>
  );
}
