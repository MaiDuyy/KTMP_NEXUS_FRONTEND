"use client";

import { MessageSquare } from "lucide-react";

import ChatLayout from "@/src/features/chat/chat-layout";
import { ChannelSidebar } from "@/src/features/chat/ChannelSidebar";
export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <MessageSquare size={48} strokeWidth={1} />
        <p className="text-lg font-medium">Select a channel or direct message to start</p>


      </div>
    </div>
  );
}
