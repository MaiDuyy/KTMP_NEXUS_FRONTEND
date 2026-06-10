"use client";

import { MessageSquare } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-[#111113] transition-colors duration-200">
      <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-zinc-600 max-w-md px-6 text-center">
        <div className="p-4 border border-slate-200/80 dark:border-white/[0.04] bg-white dark:bg-[#19191B] rounded-[2px] shadow-sm">
          <MessageSquare size={32} className="text-slate-400 dark:text-zinc-500" strokeWidth={1.5} />
        </div>
        <p className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-2">
          Hệ thống Chat
        </p>
        <p className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 leading-relaxed">
          Chọn một cuộc trò chuyện cá nhân hoặc kênh thảo luận nhóm từ danh sách bên trái để bắt đầu chia sẻ tin nhắn, tệp tin và thực hiện cuộc gọi thời gian thực.
        </p>
      </div>
    </div>
  );
}
