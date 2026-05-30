"use client";

import React, { useState } from "react";
import { Message } from "@/src/type/chat.types";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { setForwardingMessage } from "@/src/redux/feature/workspaceSlice";
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
import { useCooldown } from "@/src/hooks";
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
    isFirst?: boolean;
    isMiddle?: boolean;
    isLast?: boolean;
    isSingle?: boolean;
    onJumpToMessage?: (messageId: string) => void;
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
    isFirst = false,
    isMiddle = false,
    isLast = false,
    isSingle = true,
    onJumpToMessage,
}: MessageBubbleProps) {
    const isMe = message.isMe;
    const dispatch = useDispatch();
    
    const handleForward = () => {
        dispatch(setForwardingMessage(message.id));
    };

    const isCall = message.type.startsWith('call_');
    const isAI = message.senderId === '00000000-0000-0000-0000-000000000000' || message.sender?.id === '00000000-0000-0000-0000-000000000000';
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRecallDialog, setShowRecallDialog] = useState(false);
    const [showReactions, setShowReactions] = useState(false);

    // Mobile swipe-to-reply touch gesture state
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchMoveX, setTouchMoveX] = useState<number>(0);
    const [isSwiping, setIsSwiping] = useState(false);

    // API mutations
    const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageForMeMutation();
    const [recallMessage, { isLoading: isRecalling }] = useRecallMessageMutation();
    const [reactMessage, { isLoading: isReacting }] = useReactMessageMutation();
    const [togglePin, { isLoading: isPinning }] = useTogglePinMessageMutation();

    const { triggerAction: triggerReactAction } = useCooldown(`chat_react_${message.id}`, {
        cooldownTimeMs: 1000, // 1 second spam protection for message reactions
        behavior: 'toast',
        toastMessage: 'Bạn thao tác thả cảm xúc quá nhanh, vui lòng chậm lại một chút.',
    });

    const handleCopy = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content);
            toast.success("Đã sao chép tin nhắn");
        }
    };

    // Swipe touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (message.destroy || isCall || message.type === 'system') return;
        setTouchStartX(e.touches[0].clientX);
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartX || !isSwiping) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartX;
        
        // Swipe to the right to reply
        if (deltaX > 0) {
            const swipeDistance = Math.min(deltaX, 60);
            setTouchMoveX(swipeDistance);
        }
    };

    const handleTouchEnd = () => {
        if (!touchStartX) return;
        
        if (touchMoveX >= 45) {
            onReply();
            if (navigator.vibrate) {
                navigator.vibrate(12);
            }
        }
        
        setTouchStartX(null);
        setTouchMoveX(0);
        setIsSwiping(false);
    };

    // Handle delete message (for me only) - Chỉ API, không cần realtime
    const handleDelete = async () => {
        try {
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
        triggerReactAction(async () => {
            try {
                socketService.reactMessage(message.id, chatId, emoji);
                await reactMessage({ messageId: message.id, emoji, chatId }).unwrap();
                setShowReactions(false);
                toast.success(`Đã thêm ${emoji}`);
                onMessageUpdated?.(message.id);
            } catch (error: any) {
                toast.error(error?.data?.message || "Lỗi reaction");
            }
        });
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
        if (!isMe) return null;

        if (!readReceipts) {
            return <div className="flex items-center ml-1 opacity-50"><Loader2 className="h-2.5 w-2.5 animate-spin" /></div>;
        }

        const otherReceipts = Array.isArray(readReceipts)
            ? readReceipts.filter(r => r.userId !== (message.senderId || message.sender?.id))
            : [];

        const readers = otherReceipts.filter(r => {
            const readAt = new Date(r.readAt).getTime();
            const msgTime = new Date(message.time).getTime();
            return readAt >= (msgTime - 1000);
        });

        const isRead = readers.length > 0;

        if (isGroup) {
            const unreadCount = Math.max(0, participantCount - readers.length - 1);
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

                if (isReply) {
                    return (
                        <div className="flex items-center gap-2 mt-1">
                            <img src={imageUrl} alt="Thumbnail" className="w-8 h-8 rounded object-cover" />
                            <span className="text-xs opacity-80">[Hình ảnh]</span>
                        </div>
                    );
                }

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
                        <div className="min-w-0 flex-1 text-left">
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
                    <p className="text-sm text-gray-550 italic text-center">
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
                        <div className={`w-6 h-6 rounded-[2px] flex items-center justify-center ${
                            isJoined ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                            <Phone size={12} />
                        </div>
                        <span className={`text-[11px] font-medium font-mono ${
                            isJoined ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-400"
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
                        <div className="flex items-center gap-3 text-left">
                            <div className={cn("w-8 h-8 rounded-[2px] flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm border border-slate-200/80 dark:border-white/[0.06]", colorClass)}>
                                <IconComponent size={16} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{label}</span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">{subLabel}</span>
                                {durationStr && <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium font-mono text-left">Thời gian: {durationStr}</span>}
                            </div>
                        </div>
                        
                        {isMissed && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCallback}
                                className="h-7 px-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/50 hover:bg-blue-50/50 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-white/[0.06] rounded-[2px] w-fit flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
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

    const getBubbleRadiusClasses = () => {
        if (isCall || message.type === 'system') return 'rounded-[2px]';
        
        if (isMe) {
            if (isSingle) return "rounded-2xl";
            if (isFirst) return "rounded-2xl rounded-br-[4px]";
            if (isMiddle) return "rounded-l-2xl rounded-r-[4px]";
            if (isLast) return "rounded-2xl rounded-tr-[4px]";
        } else {
            if (isSingle) return "rounded-2xl";
            if (isFirst) return "rounded-2xl rounded-bl-[4px]";
            if (isMiddle) return "rounded-r-2xl rounded-l-[4px]";
            if (isLast) return "rounded-2xl rounded-tl-[4px]";
        }
        return "rounded-2xl";
    };

    if (message.type === "system") {
        return (
            <div className="flex justify-center my-2">
                <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-850/80 border border-slate-200 dark:border-white/[0.06] rounded-[2px] text-xs font-mono text-slate-655 dark:text-zinc-400">
                    {message.content}
                </span>
            </div>
        );
    }

    if (isCall) {
        return (
            <div className="flex justify-center my-1.5 w-full">
                <div className="bg-white dark:bg-[#19191B] border border-slate-200/80 dark:border-white/[0.06] rounded-[2px] shadow-sm px-4 py-2 max-w-xs w-fit">
                    {renderContent(message, false)}
                    <p className="text-[9px] font-mono text-slate-400 dark:text-zinc-550 text-center mt-1">
                        {format(new Date(message.time), "HH:mm")}
                    </p>
                </div>
            </div>
        );
    }

    const imageUrl = getAvatarUrl(message.sender?.avatar, message.sender?.name);
    const spacingClass = (isFirst || isSingle) ? "mt-3" : "mt-0.5";

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        id={`message-${message.id}`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: touchMoveX > 0 ? `translateX(${touchMoveX}px)` : undefined,
                            transition: isSwiping ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)'
                        }}
                        className={cn(
                            "flex items-end gap-2 group w-full text-left relative",
                            isMe ? "flex-row-reverse" : "flex-row",
                            spacingClass
                        )}
                    >
                        {/* Hidden Reply Swipe Indicator on Mobile */}
                        {touchMoveX > 0 && (
                            <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity"
                                style={{ 
                                    width: '32px', 
                                    opacity: Math.min(touchMoveX / 45, 1)
                                }}
                            >
                                <Reply className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        )}

                        {/* Avatar Column */}
                        {!isMe && (
                            <div className="w-7 flex-shrink-0 flex items-end justify-center">
                                {showAvatar ? (
                                    <Avatar className="h-7 w-7 rounded-[2px] border border-slate-250/20 dark:border-white/[0.06] align-bottom">
                                        <AvatarImage className="rounded-[2px] object-cover" src={imageUrl || undefined} />
                                        <AvatarFallback className={cn(
                                            "text-[10px] font-mono font-bold rounded-[2px] flex items-center justify-center w-full h-full",
                                            isAI 
                                                ? "bg-slate-750 dark:bg-zinc-800 text-blue-400 border border-blue-500/20" 
                                                : "bg-slate-100 dark:bg-zinc-800 text-slate-655 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.04]"
                                        )}>
                                            {isAI ? <Sparkles size={10} /> : initials(message.sender?.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : null}
                            </div>
                        )}

                        {/* Message Bubble Container */}
                        <div
                            className={cn(
                                "max-w-[85%] transition-all duration-200 shadow-none text-left",
                                getBubbleRadiusClasses(),
                                isMe
                                    ? "bg-blue-600 dark:bg-blue-700/90 text-white border border-blue-500/20 dark:border-blue-800/40"
                                    : isAI
                                        ? "bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/[0.06] text-slate-800 dark:text-slate-200"
                                        : "bg-slate-50 dark:bg-[#19191B] text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-white/[0.04]"
                            )}
                        >
                            {/* Reply preview */}
                            {message.replyTo && (
                                <div
                                    onClick={() => message.replyTo?.id && onJumpToMessage?.(message.replyTo.id)}
                                    className={cn(
                                        "px-3 pt-2 pb-2 mr-3 text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-[2px] transition-colors duration-150",
                                        isMe
                                            ? "border-l-2 border-white/30 ml-3"
                                            : "border-l-2 border-blue-500/80 dark:border-blue-400/80 ml-3"
                                    )}
                                >
                                    <p className={`text-xs font-bold text-left ${isMe ? "text-blue-200" : "text-blue-600 dark:text-blue-400"}`}>
                                        {message.replyTo.sender?.name || "Người dùng"}
                                    </p>
                                    <div className={`text-xs truncate text-left ${isMe ? "text-blue-100" : "text-gray-500 dark:text-zinc-400"}`}>
                                        <MessageSnippet 
                                            type={message.replyTo.type} 
                                            content={message.replyTo.content} 
                                            file={(message.replyTo as any).file} 
                                            chatId={chatId}
                                            className="text-xs text-left"
                                            iconClassName={`h-3.5 w-3.5 inline-block align-middle shrink-0 mr-1 ${
                                                isMe ? "text-blue-200" : "text-slate-500 dark:text-zinc-450"
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Sender name — visible only on first/single message of cluster */}
                            {!isMe && message.sender?.name && (isFirst || isSingle) && (
                                <p className={`px-3 pt-2 text-xs font-bold flex items-center gap-1 text-left ${isAI ? "text-indigo-650 dark:text-indigo-400" : "text-blue-600 dark:text-blue-400"}`}>
                                    {isAI && <Sparkles size={12} className="text-indigo-500" />}
                                    {message.sender.name}
                                </p>
                            )}

                            {/* Content */}
                            <div className="px-2.5 py-1.5 text-[13px] tracking-tight text-left">{renderContent(message, false)}</div>

                            {/* Time & reactions */}
                            <div
                                className={cn(
                                    "px-2.5 pb-1.5 flex items-center gap-1.5",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <span className={`text-[9px] font-medium ${isMe ? "text-blue-100/80" : "text-slate-400 dark:text-zinc-500"}`}>
                                    {format(new Date(message.time), "HH:mm")}
                                </span>

                                {isMe && getReadStatus()}

                                {/* Reactions */}
                                {message.reactions && message.reactions.length > 0 && (
                                    <div className="flex items-center -space-x-1">
                                        {message.reactions.map((reaction) => (
                                            <span
                                                key={reaction.emoji}
                                                className="flex items-center gap-1 text-sm bg-white dark:bg-zinc-800 rounded-[2px] px-2 py-0.5 shadow-sm cursor-pointer hover:scale-110 transition-transform border border-slate-200/80 dark:border-white/[0.06]"
                                                onClick={() => handleReact(reaction.emoji)}
                                            >
                                                <span>{reaction.emoji}</span>
                                                {reaction.count > 0 && (
                                                    <span className="text-[10px] font-mono font-medium text-gray-500 dark:text-gray-300">
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
                                className={cn(
                                    "opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                                    isMe ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-[2px] bg-slate-100 dark:bg-zinc-800 border border-slate-200/40 dark:border-white/[0.04] hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-655 dark:text-zinc-350"
                                    onClick={onReply}
                                    title="Trả lời"
                                >
                                    <Reply className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-[2px] bg-slate-100 dark:bg-zinc-800 border border-slate-200/40 dark:border-white/[0.04] hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-655 dark:text-zinc-350"
                                    onClick={handleForward}
                                    title="Chuyển tiếp"
                                >
                                    <Forward className="h-3.5 w-3.5" />
                                </Button>

                                {/* Quick reaction button */}
                                <Popover open={showReactions} onOpenChange={setShowReactions}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-[2px] bg-slate-100 dark:bg-zinc-800 border border-slate-200/40 dark:border-white/[0.04] hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-655 dark:text-zinc-350"
                                            disabled={isReacting}
                                        >
                                            {isReacting ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Smile className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2 rounded-[2px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B]" side="top">
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
                                    className="h-7 w-7 rounded-[2px] bg-slate-100 dark:bg-zinc-800 border border-slate-200/40 dark:border-white/[0.04] hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-655 dark:text-zinc-350"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="rounded-[2px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#19191B]">
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
                            <ContextMenuItem onClick={handleForward}>
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
                            className="text-orange-655"
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

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] p-6 shadow-2xl [&>button]:rounded-[2px]">
                    <AlertDialogHeader className="text-left">
                        <AlertDialogTitle>Xóa tin nhắn?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tin nhắn sẽ bị xóa khỏi hội thoại của bạn. Người khác vẫn có thể thấy tin nhắn này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-[2px]">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 rounded-[2px]"
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

            <AlertDialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
                <AlertDialogContent className="rounded-[2px] border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#19191B] p-6 shadow-2xl [&>button]:rounded-[2px]">
                    <AlertDialogHeader className="text-left">
                        <AlertDialogTitle>Thu hồi tin nhắn?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tin nhắn sẽ bị xóa với tất cả mọi người trong hội thoại.
                            Bạn chỉ có thể thu hồi tin nhắn trong vòng 24 giờ.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-[2px]">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRecall}
                            className="bg-orange-600 hover:bg-orange-700 rounded-[2px]"
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
