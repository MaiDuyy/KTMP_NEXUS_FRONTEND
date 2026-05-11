import React from "react";
import { Pin } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials, avatarColor } from "../shared/utils";

interface PinnedTabProps {
    pinnedMessages: any[];
    onMessageClick?: (messageId: string) => void;
}

export function PinnedTab({ pinnedMessages, onMessageClick }: PinnedTabProps) {
    if (pinnedMessages.length === 0) {
        return <div className="text-center py-16 text-sm text-slate-400">Chưa có tin nhắn ghim</div>;
    }

    return (
        <div className="space-y-3">
            {pinnedMessages.map((msg: any, i: number) => (
                <div
                    key={msg.id || i}
                    className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors cursor-pointer"
                    onClick={() => onMessageClick?.(msg.id)}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 rounded-md">
                                <AvatarFallback className={cn("rounded-md text-[10px] font-semibold", avatarColor(msg.sender?.name || ""))}>
                                    {getInitials(msg.sender?.name || "")}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[12px] font-medium text-slate-700">{msg.sender?.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                            {msg.time && format(new Date(msg.time), "dd/MM/yyyy", { locale: vi })}
                        </span>
                    </div>
                    <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <Pin className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] text-blue-500 font-medium">Đã ghim</span>
                    </div>
                </div>
            ))}
        </div>
    );
}