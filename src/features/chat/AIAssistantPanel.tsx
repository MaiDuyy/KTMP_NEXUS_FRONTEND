'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Sparkles, X, Send, Loader2, Bot, RefreshCw,
  Zap, History, Clock, ChevronRight, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AIMessage, useAIAssistant } from '@/src/hooks/useAIAssistant';
import { AIMessageBubble } from '../ai/AIMessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetConversationMessagesQuery, useGetConversationsQuery } from '@/src/redux/feature/aiApi';

const formatTitle = (title: string) => {
  if (!title) return '';
  let clean = title;
  
  // 1. Handle JSON
  if (clean.startsWith('{')) {
    try {
      const parsed = JSON.parse(clean);
      clean = parsed.summary || clean;
    } catch { /* skip */ }
  }
  
  // 2. Handle label-style string: "summary: Title, details: ..."
  const lower = clean.toLowerCase();
  if (lower.includes('summary:')) {
    const start = lower.indexOf('summary:') + 8;
    let end = lower.indexOf('details:');
    if (end === -1) end = lower.indexOf(', details:');
    if (end === -1) end = clean.length;
    
    if (end > start) {
      clean = clean.substring(start, end);
    }
  }
  
  // 3. Final cleanup
  return clean.replace(/[{}\"\\[\\]]|summary:|details:|sources:/g, '').trim().replace(/,$/, '').trim();
};

interface AIAssistantPanelProps {
  chatId: string;
  initialQuery?: string;
  onClose: () => void;
}

export function AIAssistantPanel({ chatId, initialQuery, onClose }: AIAssistantPanelProps) {
  const { aiMessages: currentMessages, isStreaming, sendAIQuery, sendAgentQuery, clearAI } = useAIAssistant(chatId);
  const { data: conversations, isLoading: isLoadingConv } = useGetConversationsQuery();
  
  // Find the relevant conversation for this chatId
  // RAG titles are "Chat {chatId}", Agent titles are "Agent — {chatId}"
  const activeConv = useMemo(() => {
    if (!conversations || !chatId) return null;
    return conversations.find(c => c.chatId === chatId);
  }, [conversations, chatId]);

  const { data: historyMessages, isLoading: isLoadingHistoryMessages } = useGetConversationMessagesQuery(
    activeConv?.id as number,
    { skip: !activeConv?.id }
  );
  
  const [inputValue, setInputValue] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentInitialRef = useRef(false);

  // Map history messages to AIMessage format
  const mappedHistory: AIMessage[] = useMemo(() => {
    if (!historyMessages) return [];
    return historyMessages.map(m => ({
      id: `hist_${m.id}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.createdAt,
      mode: activeConv?.title.startsWith('Agent') ? 'agent' : 'rag'
    }));
  }, [historyMessages, activeConv]);

  // Combine history and current session messages
  const allMessages = useMemo(() => {
    return [...mappedHistory, ...currentMessages];
  }, [mappedHistory, currentMessages]);

  // Send initial query from "Ask AI" button or /ai slash command
  useEffect(() => {
    if (initialQuery && !sentInitialRef.current) {
      sentInitialRef.current = true;
      sendAIQuery(initialQuery);
    }
  }, [initialQuery, sendAIQuery]);

  // Auto-scroll on new messages/tokens
  useEffect(() => {
    if (view === 'chat') {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, view]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    if (agentMode) {
      sendAgentQuery(text);
    } else {
      sendAIQuery(text);
    }
    setInputValue('');
    textareaRef.current?.focus();
  }, [inputValue, isStreaming, agentMode, sendAIQuery, sendAgentQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearAI();
    sentInitialRef.current = false;
    setView('chat');
  };

  // Suggested queries differ by mode
  const suggestions = agentMode
    ? ['Tóm tắt chat này', 'Tạo task: Review PR', 'Thông tin nhóm']
    : ['Tìm tài liệu liên quan', 'Giải thích quy trình', 'Chính sách nghỉ phép'];

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd] border-l border-slate-200/60 w-[360px] shrink-0 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Header with Glassmorphism */}
      <div className={cn(
        'sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b backdrop-blur-md transition-all duration-500',
        agentMode
          ? 'bg-amber-50/80 border-amber-100/50'
          : 'bg-white/80 border-slate-100'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105',
            agentMode
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200/50'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200/50'
          )}>
            {agentMode ? <Zap size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1">
              {view === 'history' ? 'Lịch sử AI' : (agentMode ? 'Trợ lý Agent' : 'Trợ lý AI')}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", agentMode ? "bg-amber-500" : "bg-emerald-500")} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {view === 'history' ? 'Gần đây' : 'Sẵn sàng'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* History Toggle */}
          <button
            onClick={() => setView(v => v === 'chat' ? 'history' : 'chat')}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 border shadow-sm',
              view === 'history'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-100'
                : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'
            )}
            title={view === 'chat' ? 'Xem lịch sử hội thoại' : 'Quay lại Chat'}
          >
            {view === 'chat' ? <History size={14} /> : <MessageSquare size={14} />}
          </button>

          {/* Agent Mode Toggle Button */}
          {view === 'chat' && (
            <button
              onClick={() => setAgentMode(prev => !prev)}
              className={cn(
                'group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 border shadow-sm',
                agentMode
                  ? 'bg-amber-500 border-amber-400 text-white shadow-amber-100'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500'
              )}
              title={agentMode ? 'Chuyển về chế độ RAG' : 'Bật Chế độ Agent (Tool Calling)'}
            >
              <Zap size={14} className={cn("transition-transform", agentMode && "animate-pulse")} />
            </button>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={handleClear} title="Làm mới">
            <RefreshCw size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {view === 'chat' ? (
          /* Chat View */
          <ScrollArea className="flex-1 h-full px-5 py-6 custom-scrollbar">
            <div className="space-y-6 pb-4">
              {allMessages.length === 0 && !isLoadingHistoryMessages && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center py-8 animate-in fade-in zoom-in duration-700">
                  <div className={cn(
                    'w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl transform -rotate-3 transition-transform hover:rotate-0 duration-300',
                    agentMode ? 'bg-amber-50 shadow-amber-100' : 'bg-indigo-50 shadow-indigo-100'
                  )}>
                    <Bot size={32} className={agentMode ? 'text-amber-500' : 'text-indigo-500'} />
                  </div>
                  <div className="space-y-2 mb-8">
                    <h4 className="text-lg font-bold text-slate-800 tracking-tight">
                      {agentMode ? 'Agent đã sẵn sàng' : 'Tôi có thể giúp gì cho bạn?'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mx-auto font-medium">
                      {agentMode
                        ? 'Tôi có thể tóm tắt chat, tạo công việc, tìm tài liệu và thực thi các hành động thông minh.'
                        : 'Hãy hỏi bất cứ điều gì về tài liệu nội bộ và quy trình của tổ chức bạn.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                    {suggestions.map(q => (
                      <button
                        key={q}
                        onClick={() => agentMode ? sendAgentQuery(q) : sendAIQuery(q)}
                        className={cn(
                          'group flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 border text-left',
                          agentMode
                            ? 'bg-white border-amber-100 text-amber-700 hover:border-amber-400 hover:bg-amber-50 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/30 shadow-sm'
                        )}
                      >
                        <span className="truncate">{q}</span>
                        <Send size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoadingHistoryMessages && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                  <span className="text-xs font-medium">Đang tải tin nhắn cũ...</span>
                </div>
              )}

              {allMessages.map((msg) => (
                <AIMessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                  mode={msg.mode}
                />
              ))}
              <div ref={scrollEndRef} className="h-4" />
            </div>
          </ScrollArea>
        ) : (
          /* History View */
          <ScrollArea className="flex-1 h-full px-5 py-6 custom-scrollbar">
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Hội thoại gần đây</span>
                <Clock size={12} className="text-slate-300" />
              </div>
              
              {isLoadingConv ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                  <span className="text-xs font-medium">Đang tải lịch sử...</span>
                </div>
              ) : conversations?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500 font-medium">Chưa có lịch sử hội thoại.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations?.slice(0, 10).map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => setView('chat')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 group text-left shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                        <MessageSquare size={14} className="text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-900 transition-colors">
                          {formatTitle(conv.title)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(conv.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Mode Banner Subtle */}
      {view === 'chat' && agentMode && allMessages.length > 0 && (
        <div className="mx-5 mb-4 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-lg flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300">
          <Zap size={12} className="mt-0.5 shrink-0 text-amber-500 animate-pulse" />
          <p className="text-[10px] text-amber-800 leading-tight font-medium">
            <strong>Chế độ Agent:</strong> Đang sử dụng Tool Calling để thực thi các yêu cầu phức tạp.
          </p>
        </div>
      )}

      {/* Refined Input Area */}
      <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.05)]">
        <div className="relative group transition-all duration-300">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agentMode ? 'Yêu cầu agent thực hiện...' : 'Hỏi về tài liệu nội bộ...'}
            className="min-h-[50px] max-h-[140px] w-full bg-slate-50/50 border-slate-200 rounded-2xl py-3.5 pl-4 pr-12 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 resize-none custom-scrollbar"
            disabled={isStreaming}
            rows={1}
          />
          <div className="absolute right-2 bottom-2">
            <Button
              size="icon"
              className={cn(
                'h-9 w-9 rounded-xl shadow-lg transition-all duration-300 transform active:scale-95',
                agentMode
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-amber-200/50'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-200/50'
              )}
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
            >
              {isStreaming ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 opacity-60">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                {agentMode ? 'Tool Calling enabled' : 'Gemini AI Assistant'}
            </p>
        </div>
      </div>
    </div>
  );
}