"use client";

import React, { useState } from "react";
import { Message } from "@/src/type/chat.types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Reply,
    Copy,
    Trash2,
    RotateCcw,
    Pin,
    Forward,
    MoreHorizontal,
    Smile,
    Loader2,
    Phone,
    Video,
    PhoneOff,
    PhoneMissed,
    Check,
    CheckCheck,
    Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    useDeleteMessageForMeMutation,
    useRecallMessageMutation,
    useReactMessageMutation,
    useTogglePinMessageMutation,
} from "@/src/redux/feature/messageApi";
import { socketService } from "@/src/services/socket.service";
import { getAvatarUrl, getMediaUrl } from "@/src/utils/image-utils";
import PollMessageBubble from "./poll-message-bubble";
import TaskMessageBubble from "./task-message-bubble";
import { MessageSnippet } from "./message-snippet";

// Common emojis for quick reactions
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface MessageBubbleProps {
    message: Message;
    chatId: string;
    isGroup: boolean;
    participantCount?: number;
    showAvatar: boolean;
    onReply: () => void;
    onMessageDeleted?: (messageId: string) => void;
    onMessageUpdated?: (messageId: string) => void;
    readReceipts?: any[];
}

export default function MessageBubble({
    message,
    chatId,
    isGroup,
    participantCount = 0,
    showAvatar,
    onReply,
    onMessageDeleted,
    onMessageUpdated,
    readReceipts,
}: MessageBubbleProps) {
    const isMe = message.isMe;
    const isCall = message.type.startsWith('call_');
    const isAI = message.senderId === '00000000-0000-0000-0000-000000000000' || message.sender?.id === '00000000-0000-0000-0000-000000000000';
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRecallDialog, setShowRecallDialog] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [messages, setMessages] = useState([]);
    // API mutations
    const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageForMeMutation();
    const [recallMessage, { isLoading: isRecalling }] = useRecallMessageMutation();
    const [reactMessage, { isLoading: isReacting }] = useReactMessageMutation();
    const [togglePin, { isLoading: isPinning }] = useTogglePinMessageMutation();

    const handleCopy = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content);
            toast.success("Đã sao chép tin nhắn");
        }
    };

    // Handle delete message (for me only) - Chỉ API, không cần realtime
    const handleDelete = async () => {
        try {
            // socketService.recallMessage(message.id, chatId);
            await deleteMessage(message.id).unwrap();
            toast.success("Đã xóa tin nhắn");
            setShowDeleteDialog(false);
            onMessageDeleted?.(message.id);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi xóa tin nhắn");
        }
    };


    // Handle recall message (delete for everyone) - Socket cho realtime
    const handleRecall = async () => {
        try {
            // Sử dụng socket để realtime với người khác
            socketService.recallMessage(message.id, chatId);
            await recallMessage(message.id).unwrap();
            toast.success("Đã thu hồi tin nhắn");
            setShowRecallDialog(false);
            onMessageUpdated?.(message.id);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi thu hồi tin nhắn");
        }
    };

    // Handle react to message - Socket cho realtime
    const handleReact = async (emoji: string) => {
        try {
            // Sử dụng socket để realtime với người khác
            socketService.reactMessage(message.id, chatId, emoji);
            await reactMessage({ messageId: message.id, emoji, chatId }).unwrap();
            setShowReactions(false);
            toast.success(`Đã thêm ${emoji}`);
            onMessageUpdated?.(message.id);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi reaction");
        }
    };

    // Handle pin/unpin message - Realtime handled by backend + socket listener
    const handleTogglePin = async () => {
        try {
            await togglePin({ messageId: message.id, chatId }).unwrap();
            toast.success(message.pin ? "Đã bỏ ghim tin nhắn" : "Đã ghim tin nhắn");
            onMessageUpdated?.(message.id);
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi ghim tin nhắn");
        }
    };

    const initials = (name?: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Calculate read status
    const getReadStatus = () => {
        // Chỉ hiện cho tin nhắn của tôi
        if (!isMe) return null;

        // Trạng thái Loading/Data missing
        if (!readReceipts) {
            return <div className="flex items-center ml-1 opacity-50"><Loader2 className="h-2.5 w-2.5 animate-spin" /></div>;
        }

        // Lọc bỏ chính mình khỏi danh sách receipts
        const otherReceipts = Array.isArray(readReceipts)
            ? readReceipts.filter(r => r.userId !== (message.senderId || message.sender?.id))
            : [];

        // Tìm những người thực sự đã đọc tin nhắn này (readAt >= time của tin nhắn)
        const readers = otherReceipts.filter(r => {
            const readAt = new Date(r.readAt).getTime();
            const msgTime = new Date(message.time).getTime();
            return readAt >= (msgTime - 1000); // Cho phép sai số 1 giây
        });

        const isRead = readers.length > 0;

        if (isGroup) {
            const unreadCount = Math.max(0, participantCount - readers.length - 1); // -1 for sender
            if (isRead) {
                return (
                    <span className="text-[10px] text-blue-100/90 ml-1 flex items-center gap-0.5 font-medium whitespace-nowrap">
                        <CheckCheck className="h-3 w-3 text-sky-200" />
                        {readers.length} đã xem {unreadCount > 0 && `• ${unreadCount} chưa xem`}
                    </span>
                );
            }
            return (
                <span className="text-[10px] text-blue-200/60 ml-1 flex items-center gap-0.5 whitespace-nowrap">
                    <Check className="h-3 w-3" />
                    Đã gửi {unreadCount > 0 && `• ${unreadCount} chưa xem`}
                </span>
            );
        }

        // Với chat 1-1
        if (isRead) {
            return (
                <span className="text-[10px] text-sky-100 ml-1 flex items-center gap-0.5 font-medium">
                    <CheckCheck className="h-3 w-3 text-sky-300" />
                    Đã xem
                </span>
            );
        }

        return (
            <span className="text-[10px] text-blue-200/70 ml-1 flex items-center gap-0.5">
                <Check className="h-3 w-3" />
                Đã gửi
            </span>
        );
    };
    const renderContent = (msg: any, isReply = false) => {
        if (msg.destroy) {
            return (
                <p className={`italic opacity-60 ${isReply ? "text-[10px]" : "text-sm"}`}>
                    Tin nhắn đã bị thu hồi
                </p>
            );
        }


        const parseMentions = (content: string) => {
            if (!content) return content;
            
            const mentionRegex = /@\[([^\]]+)\]\(([a-zA-Z0-9_-]+)\)/g;
            const parts: (string | React.ReactNode)[] = [];
            let lastIndex = 0;
            let match;

            while ((match = mentionRegex.exec(content)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(content.substring(lastIndex, match.index));
                }

                const name = match[1];
                const userId = match[2];

                const handleMentionClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("chat:open_profile", { detail: { userId } }));
                };

                parts.push(
                    <span 
                        key={`${userId}-${match.index}`} 
                        onClick={handleMentionClick}
                        className={cn(
                            "font-bold cursor-pointer hover:underline px-1 rounded-md transition-colors",
                            isMe 
                                ? "text-blue-100 bg-blue-400/30 hover:bg-blue-400/50" 
                                : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        )}
                    >
                        @{name}
                    </span>
                );

                lastIndex = mentionRegex.lastIndex;
            }

            if (lastIndex < content.length) {
                parts.push(content.substring(lastIndex));
            }

            return parts.map((part, i) => {
                if (typeof part === 'string') {
                    const subParts: (string | React.ReactNode)[] = [];
                    const broadcastRegex = /@(here|channel|all|everyone)\b/gi;
                    let subMatch;
                    let subLastIndex = 0;
                    
                    while ((subMatch = broadcastRegex.exec(part)) !== null) {
                        if (subMatch.index > subLastIndex) {
                            subParts.push(part.substring(subLastIndex, subMatch.index));
                        }
                        subParts.push(
                            <span key={`broadcast-${i}-${subMatch.index}`} className="font-bold text-orange-400">
                                @{subMatch[1]}
                            </span>
                        );
                        subLastIndex = broadcastRegex.lastIndex;
                    }
                    if (subLastIndex < part.length) {
                        subParts.push(part.substring(subLastIndex));
                    }
                    return subParts.length > 0 ? subParts : part;
                }
                return part;
            }).flat();
        };

        switch (msg.type) {
            case "poll":
                if (isReply) {
                    return <span className="text-xs opacity-80">📊 [Khảo sát]</span>;
                }
                return <PollMessageBubble pollId={msg.content || ""} isMe={isMe} />;

            case "task":
                if (isReply) {
                    return <span className="text-xs opacity-80">📋 [Kế hoạch]</span>;
                }
                return <TaskMessageBubble taskId={msg.content || ""} chatId={chatId} isMe={isMe} />;

            case "text":
                return (
                    <p className={isReply ? "text-xs truncate opacity-80" : "whitespace-pre-wrap break-words"}>
                        {parseMentions(msg.content)}
                    </p>
                );

            case "image": {
                const imageUrl = getMediaUrl(msg.content);

                // Giao diện thu nhỏ cho phần Reply
                if (isReply) {
                    return (
                        <div className="flex items-center gap-2 mt-1">
                            <img src={imageUrl} alt="Thumbnail" className="w-8 h-8 rounded object-cover" />
                            <span className="text-xs opacity-80">[Hình ảnh]</span>
                        </div>
                    );
                }

                // Giao diện cho tin nhắn chính
                return (
                    <div className="rounded-lg overflow-hidden max-w-xs mt-1">
                        <img
                            src={imageUrl}
                            alt={msg.file?.name || "Shared image"}
                            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(imageUrl, "_blank")}
                        />
                    </div>
                );
            }

            case "video": {
                const videoUrl = getMediaUrl(msg.content);

                if (isReply) {
                    return (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 bg-black/20 rounded flex items-center justify-center text-xs">▶️</div>
                            <span className="text-xs opacity-80">[Video]</span>
                        </div>
                    );
                }

                return (
                    <div className="rounded-lg overflow-hidden max-w-xs mt-1">
                        <video src={videoUrl} controls className="w-full h-auto" />
                    </div>
                );
            }

            case "file":
                if (isReply) {
                    return (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-xs">📎</div>
                            <span className="text-xs truncate opacity-80">{msg.file?.name || "Tệp đính kèm"}</span>
                        </div>
                    );
                }

                return (
                    <a
                        href={msg.content || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={msg.file?.name}
                        className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors mt-1"
                    >
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">
                            📎
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{msg.file?.name || "File"}</p>
                            <p className="text-xs opacity-70">{msg.file?.size || ""}</p>
                        </div>
                    </a>
                );

            case "sticker":
            case "gif":
                if (isReply) {
                    return (
                        <div className="flex items-center gap-2 mt-1">
                            <img src={msg.content || ""} alt="Sticker" className="w-8 h-8 object-contain" />
                            <span className="text-xs opacity-80">[{msg.type === "gif" ? "GIF" : "Sticker"}]</span>
                        </div>
                    );
                }

                return (
                    <img
                        src={msg.content || ""}
                        alt={`${msg.type} attachment`}
                        className="w-32 h-32 object-contain mt-1"
                    />
                );

            case "system":
                return !isReply && (
                    <p className="text-sm text-gray-500 italic text-center">
                        {msg.content}
                    </p>
                );

            case "call_participant_joined":
            case "call_participant_left": {
                const isJoined = msg.type === "call_participant_joined";
                let participantMeta: { callerName?: string } = {};
                try { participantMeta = msg.content ? JSON.parse(msg.content) : {}; } catch { }
                const participantName = participantMeta.callerName || msg.sender?.name || "Ai đó";
                return (
                    <div className="flex items-center justify-center gap-2 py-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isJoined ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}>
                            <Phone size={12} />
                        </div>
                        <span className={`text-[11px] font-medium ${
                            isJoined ? "text-emerald-600" : "text-slate-500"
                        }`}>
                            <span className="font-bold">{participantName}</span> {isJoined ? "đã tham gia cuộc gọi" : "đã rời cuộc gọi"}
                        </span>
                    </div>
                );
            }

            case "call_started":
            case "call_ended":
            case "call_missed":
            case "call_declined":
            case "call_cancelled": {
                let callMeta: { isVideo?: boolean; duration?: number; callerName?: string } = {};
                try { callMeta = msg.content ? JSON.parse(msg.content) : {}; } catch { }
                const isVideoCall = callMeta.isVideo ?? false;
                const durationSec = callMeta.duration ?? 0;
                const durationStr = durationSec > 0 ? `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, "0")}` : null;
                const callerDisplayName = callMeta.callerName || msg.sender?.name || "Ai đó";

                const isMissed = msg.type === "call_missed" || msg.type === "call_declined";

                const handleCallback = () => {
                    const partner = message.senderId === '00000000-0000-0000-0000-000000000000' 
                        ? null
                        : message.sender;

                    window.dispatchEvent(
                        new CustomEvent("open-call-modal", {
                            detail: {
                                chatId: chatId,
                                isVideo: isVideoCall,
                                chatName: partner?.name || "Cuộc gọi",
                                chatAvatar: partner?.avatar,
                                targetUserId: partner?.id,
                                callType: isGroup ? "group" : "private",
                            },
                        })
                    );
                };

                let label = "";
                let subLabel = "";
                let IconComponent = Phone;
                let colorClass = "text-blue-600";

                if (isGroup) {
                    if (msg.type === "call_started") {
                        label = "Cuộc gọi nhóm";
                        subLabel = `${callerDisplayName} đã bắt đầu cuộc gọi`;
                        IconComponent = isVideoCall ? Video : Phone;
                        colorClass = "text-blue-600";
                    } else if (msg.type === "call_ended") {
                        label = "Cuộc gọi nhóm đã kết thúc";
                        subLabel = durationStr ? `Thời lượng: ${durationStr}` : "Cuộc gọi đã kết thúc";
                        IconComponent = isVideoCall ? Video : Phone;
                        colorClass = "text-emerald-600";
                    } else if (msg.type === "call_missed" || msg.type === "call_cancelled" || msg.type === "call_declined") {
                        label = "Cuộc gọi nhóm đã kết thúc";
                        subLabel = "Không có người tham gia";
                        IconComponent = PhoneOff;
                        colorClass = "text-slate-600";
                    }
                } else {
                    if (msg.type === "call_started") {
                        label = isVideoCall ? "Cuộc gọi video" : "Cuộc gọi thoại";
                        subLabel = `${callerDisplayName} đã bắt đầu cuộc gọi`;
                        IconComponent = isVideoCall ? Video : Phone;
                    } else if (msg.type === "call_ended") {
                        label = isVideoCall ? "Cuộc gọi video" : "Cuộc gọi thoại";
                        subLabel = `${callerDisplayName} đã kết thúc cuộc gọi`;
                        IconComponent = isVideoCall ? Video : Phone;
                        colorClass = "text-emerald-600";
                    } else if (msg.type === "call_missed") {
                        label = "Cuộc gọi nhỡ";
                        subLabel = `${callerDisplayName} đã gọi nhưng không có ai trả lời`;
                        IconComponent = PhoneMissed;
                        colorClass = "text-red-600";
                    } else if (msg.type === "call_declined") {
                        label = "Cuộc gọi bị từ chối";
                        subLabel = `${callerDisplayName} đã gọi`;
                        IconComponent = PhoneOff;
                        colorClass = "text-orange-600";
                    } else if (msg.type === "call_cancelled") {
                        label = "Cuộc gọi đã hủy";
                        subLabel = `${callerDisplayName} đã hủy cuộc gọi`;
                        IconComponent = PhoneOff;
                        colorClass = "text-slate-600";
                    }
                }

                return (
                    <div className="flex flex-col gap-2 py-1">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-100", colorClass)}>
                                <IconComponent size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">{label}</span>
                                <span className="text-[11px] text-slate-500">{subLabel}</span>
                                {durationStr && <span className="text-[10px] text-slate-400 font-medium">Thời gian: {durationStr}</span>}
                            </div>
                        </div>
                        
                        {isMissed && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCallback}
                                className="h-7 px-3 text-[11px] font-bold bg-white/50 hover:bg-blue-50 text-blue-600 border-blue-100 rounded-lg w-fit flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                            >
                                {isVideoCall ? <Video size={12} /> : <Phone size={12} />}
                                Gọi lại ngay
                            </Button>
                        )}
                    </div>
                );
            }

            default:
                return <p className="text-xs italic opacity-70">[{msg.type}]</p>;
        }
    };

    // System message
    if (message.type === "system") {
        return (
            <div className="flex justify-center my-2">
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                    {message.content}
                </span>
            </div>
        );
    }

    // Call events — render as centered pill, not inside the full bubble/ContextMenu
    if (isCall) {
        return (
            <div className="flex justify-center my-1.5">
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm px-4 py-2 max-w-xs w-fit">
                    {renderContent(message, false)}
                    <p className="text-[9px] text-slate-400 text-center mt-1">
                        {format(new Date(message.time), "HH:mm")}
                    </p>
                </div>
            </div>
        );
    }


    const imageUrl = getAvatarUrl(message.sender?.avatar, message.sender?.name);

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        id={`message-${message.id}`}
                        className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"
                            }`}
                    >
                        {/* Avatar */}
                        {!isMe && (
                            <div className="w-7 flex-shrink-0">
                                {showAvatar ? (
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={imageUrl || undefined} />
                                        <AvatarFallback className={cn(
                                            "text-white text-[10px]",
                                            isAI ? "bg-gradient-to-br from-indigo-500 to-indigo-700" : "bg-gradient-to-br from-purple-400 to-purple-600"
                                        )}>
                                            {isAI ? <Sparkles size={10} /> : initials(message.sender?.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : null}
                            </div>
                        )}

                        {/* Message bubble */}
                        <div
                            className={`max-w-[85%] ${isMe
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md mb-0.5"
                                : isAI
                                    ? "bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 text-slate-800 rounded-2xl rounded-bl-md shadow-sm mb-0.5"
                                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md shadow-sm mb-0.5"
                                }`}
                        >
                            {/* Reply preview */}
                            {message.replyTo && (
                                <div
                                    className={`px-3 pt-2 pb-2 ${isMe
                                        ? "border-l-2 border-white/50 ml-3"
                                        : "border-l-2 border-blue-500 ml-3"
                                        }`}
                                >
                                    <p className={`text-xs font-bold ${isMe ? "text-blue-200" : "text-blue-600"}`}>
                                        {message.replyTo.sender?.name || "Người dùng"}
                                    </p>
                                    <div className={`text-xs truncate ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                                        <MessageSnippet 
                                            type={message.replyTo.type} 
                                            content={message.replyTo.content} 
                                            file={(message.replyTo as any).file} 
                                            chatId={chatId}
                                            className="text-xs"
                                            iconClassName={`h-3.5 w-3.5 inline-block align-middle shrink-0 mr-1 ${
                                                isMe ? "text-blue-200" : "text-slate-500"
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Sender name — always visible for incoming messages */}
                            {!isMe && message.sender?.name && (
                                <p className={`px-3 pt-2 text-xs font-bold flex items-center gap-1 ${isAI ? "text-indigo-600" : "text-blue-600 dark:text-blue-400"}`}>
                                    {isAI && <Sparkles size={12} className="text-indigo-500" />}
                                    {message.sender.name}
                                </p>
                            )}

                            {/* Content */}
                            <div className="px-2.5 py-1.5 text-[13px] tracking-tight">{renderContent(message, false)}</div>

                            {/* Time & reactions */}
                            <div
                                className={`px-2.5 pb-1.5 flex items-center gap-1.5 ${isMe ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <span className={`text-[9px] font-medium ${isMe ? "text-blue-100/80" : "text-slate-400"}`}>
                                    {format(new Date(message.time), "HH:mm")}
                                </span>

                                {isMe && getReadStatus()}

                                {/* Reactions */}
                                {message.reactions && message.reactions.length > 0 && (
                                    <div className="flex items-center -space-x-1">
                                        {message.reactions.map((reaction) => (
                                            <span
                                                key={reaction.emoji} // Dùng emoji làm key thay vì index
                                                className="flex items-center gap-1 text-sm bg-white dark:bg-gray-600 rounded-full px-2 py-0.5 shadow-sm cursor-pointer hover:scale-110 transition-transform border border-gray-100 dark:border-gray-500"
                                                onClick={() => handleReact(reaction.emoji)}
                                            >
                                                <span>{reaction.emoji}</span>
                                                {/* Luôn hiện số lượng nếu bạn muốn giống Telegram/Zalo, hoặc giữ > 1 tùy bạn */}
                                                {reaction.count > 0 && (
                                                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-300">
                                                        {reaction.count}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Pin indicator */}
                                {message.pin && (
                                    <Pin className={`h-3 w-3 ${isMe ? "text-blue-200" : "text-blue-500"}`} />
                                )}
                            </div>
                        </div>

                        {/* Quick actions */}
                        {!message.destroy && (
                            <div
                                className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isMe ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    onClick={onReply}
                                >
                                    <Reply className="h-3.5 w-3.5" />
                                </Button>

                                {/* Quick reaction button */}
                                <Popover open={showReactions} onOpenChange={setShowReactions}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            disabled={isReacting}
                                        >
                                            {isReacting ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Smile className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2" side="top">
                                        <div className="flex gap-1">
                                            {QUICK_REACTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    className="text-xl hover:scale-125 transition-transform p-1"
                                                    onClick={() => handleReact(emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent>
                    {!message.destroy && (
                        <ContextMenuItem onClick={onReply}>
                            <Reply className="h-4 w-4 mr-2" />
                            Trả lời
                        </ContextMenuItem>
                    )}
                    {!message.destroy && (
                        <>
                            <ContextMenuItem onClick={handleCopy}>
                                <Copy className="h-4 w-4 mr-2" />
                                Sao chép
                            </ContextMenuItem>
                            <ContextMenuItem>
                                <Forward className="h-4 w-4 mr-2" />
                                Chuyển tiếp
                            </ContextMenuItem>
                        </>
                    )}

                    <ContextMenuSeparator />

                    {!message.destroy && (
                        <ContextMenuItem onSelect={(e) => e.preventDefault()}>
                            <Smile className="h-4 w-4 mr-2" />
                            React
                            <div className="ml-auto flex gap-1">
                                {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
                                    <button
                                        key={emoji}
                                        className="text-sm hover:scale-125 transition-transform"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReact(emoji);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </ContextMenuItem>
                    )}

                    {!message.destroy && (
                        <ContextMenuItem onClick={handleTogglePin} disabled={isPinning}>
                            {isPinning ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Pin className="h-4 w-4 mr-2" />
                            )}
                            {message.pin ? "Bỏ ghim" : "Ghim"}
                        </ContextMenuItem>
                    )}

                    <ContextMenuSeparator />

                    {isMe && !message.destroy && (
                        <ContextMenuItem
                            className="text-orange-600"
                            onClick={() => setShowRecallDialog(true)}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Thu hồi
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        className="text-red-600"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa tin nhắn?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tin nhắn sẽ bị xóa khỏi hội thoại của bạn. Người khác vẫn có thể thấy tin nhắn này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Recall confirmation dialog */}
            <AlertDialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Thu hồi tin nhắn?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tin nhắn sẽ bị xóa với tất cả mọi người trong hội thoại.
                            Bạn chỉ có thể thu hồi tin nhắn trong vòng 24 giờ.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRecall}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={isRecalling}
                        >
                            {isRecalling ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Thu hồi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
