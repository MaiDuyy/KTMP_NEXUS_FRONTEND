"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGetChatByIdQuery, useMarkChatAsReadMutation } from "@/src/redux/feature/chatApi";
import { useGetMessagesQuery, useSendMessageMutation } from "@/src/redux/feature/messageApi";
import { useUploadFileMutation } from "@/src/redux/feature/userApi";
import { Message } from "@/src/type/chat.types";
import { useAppSelector } from "@/src/redux/hooks";
import { socketService } from "@/src/services/socket.service";
import {
    useRealtimeChat,
    useChatRoom,
    useIsUserOnline,
} from "@/src/hooks/useRealtimeChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Phone,
    Video,
    Send,
    Image as ImageIcon,
    Paperclip,
    Smile,
    ArrowLeft,
    Reply,
    Trash2,
    X,
    File,
    Loader2,
    Info,
    Search,
    Sparkles,
    Bold,
    Italic,
    Link2,
    List as ListIcon,
    Mic,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import MessageBubble from "./message-bubble";
import EmojiPicker from "./emoji-picker";
import ChatInfoPanel from "./chat-info-panel";
import GroupSettingsPanel from "./group-settings-panel";

interface ChatWindowProps {
    chatId: string;
    onClose: () => void;
    typingUsers: { userId: string; userName: string }[];
    onlineUsers: Set<string>;
}

export default function ChatWindow({
    chatId,
    onClose,
    typingUsers,
    onlineUsers,
}: ChatWindowProps) {
    const { user } = useAppSelector((state) => state.auth);
    const [messageInput, setMessageInput] = useState("");
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    // Real-time: join room + connection status
    const { isConnected } = useRealtimeChat();
    useChatRoom(chatId);

    // API queries
    const { data: chatData, isLoading: chatLoading } = useGetChatByIdQuery(chatId);
    const { data: messagesData, isLoading: messagesLoading } = useGetMessagesQuery(
        { chatId, limit: 50 },
        { pollingInterval: 0 } // RTK Query cache invalidation handles refresh
    );
    const [markAsRead] = useMarkChatAsReadMutation();
    const [uploadFile] = useUploadFileMutation();
    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

    const chat = chatData?.chat;
    // RTK Query tự cập nhật khi cache invalidated — không cần localMessages
    const allMessages = messagesData?.messages || [];

    // Get partner info for private chat (enrichChatDetails already set chat.name/avatar)
    const partner = !chat?.isGroup
        ? chat?.participants?.find((p) => p.accountId !== user?.id) || chat?.participants?.[0]
        : null;
    const partnerId = partner?.accountId;
    // Dùng hook realtime thay vì Set từ props
    const isOnline = useIsUserOnline(partnerId);

    // Debug log
    console.log("[ChatWindow] Debug:", {
        chatId,
        isGroup: chat?.isGroup,
        partner: partner ? { id: partnerId, name: partner.name } : null,
        isOnline,
        isConnected,
    });

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Mark as read when opening chat
    useEffect(() => {
        markAsRead(chatId);
        socketService.markRead(chatId);
    }, [chatId, markAsRead]);

    // NOTE: Không cần lắng nghe window custom events nữa.
    // useChatRoom() đã join socket room, backend broadcast NATS → WS → RTK Query
    // invalidatesTags tự động refetch messagesData khi có tin nhắn mới.

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [allMessages, scrollToBottom]);

    // Handle typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessageInput(e.target.value);

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socketService.startTyping(chatId);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socketService.stopTyping(chatId);
        }, 1500);
    };

    // Send message via REST API → backend saves to DB → publishes NATS → WS Gateway broadcasts
    // RTK Query invalidatesTags tự refetch → UI cập nhật real-time
    const handleSend = async () => {
        const content = messageInput.trim();
        if (!content || !user || sending) return;

        setMessageInput("");
        setReplyTo(null);

        // Stop typing
        if (isTypingRef.current) {
            isTypingRef.current = false;
            socketService.stopTyping(chatId);
        }

        try {
            await sendMessage({
                chatId,
                data: {
                    content,
                    type: "text",
                    replyToId: replyTo?.id,
                },
            }).unwrap();
        } catch (err) {
            console.error("[ChatWindow] Failed to send message:", err);
            toast.error("Gửi tin nhắn thất bại");
        }
    };

    // Handle file select
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const maxSize = 10 * 1024 * 1024;
        const validFiles = files.filter((file) => {
            if (file.size > maxSize) {
                toast.error(`File ${file.name} quá lớn (tối đa 10MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setSelectedFiles(validFiles);
            if (type === "image" && validFiles[0].type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => setFilePreview(reader.result as string);
                reader.readAsDataURL(validFiles[0]);
            } else {
                setFilePreview(null);
            }
        }

        e.target.value = "";
    };

    const clearSelectedFiles = () => {
        setSelectedFiles([]);
        setFilePreview(null);
    };

    // Send file message — only upload, message is auto-created by chat-service NATS subscriber
    const handleSendFile = async () => {
        if (selectedFiles.length === 0 || !user) return;

        setIsUploading(true);

        try {
            const file = selectedFiles[0];
            await uploadFile({ file, type: "chat" }).unwrap();

            // NOTE: Do NOT call sendMessage() here!
            // The file-service publishes a NATS event (CHAT_FILE_UPLOADED) after upload,
            // and the chat-service's file subscriber automatically creates the message.

            clearSelectedFiles();
            toast.success("Gửi file thành công!");
        } catch (error: any) {
            toast.error(error?.data?.message || "Lỗi upload file");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle emoji select
    const handleEmojiSelect = (emoji: string) => {
        setMessageInput((prev) => prev + emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    // Handle key down
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Group messages by date
    const groupedMessages = allMessages.reduce<{ date: string; messages: Message[] }[]>((groups, message) => {
        const messageDate = new Date(message.time);
        let dateLabel = format(messageDate, "dd/MM/yyyy");

        if (isToday(messageDate)) {
            dateLabel = "Hôm nay";
        } else if (isYesterday(messageDate)) {
            dateLabel = "Hôm qua";
        }

        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === dateLabel) {
            lastGroup.messages.push(message);
        } else {
            groups.push({ date: dateLabel, messages: [message] });
        }
        return groups;
    }, []);

    // Status text
    const getStatusText = () => {
        if (typingUsers.length > 0) {
            return chat?.isGroup
                ? `${typingUsers.map((u) => u.userName).join(", ")} đang gõ...`
                : "Đang gõ...";
        }
        if (chat?.isGroup) return `${chat.participants.length} thành viên`;
        if (isOnline) return "● Đang hoạt động";
        if (partner?.lastSeen) {
            return `Hoạt động ${formatDistanceToNow(new Date(partner.lastSeen), { addSuffix: true, locale: vi })}`;
        }
        return "Offline";
    };

    if (chatLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <p className="text-slate-400">Không tìm thấy cuộc trò chuyện</p>
            </div>
        );
    }

    // enrichChatDetails already resolved name/avatar for 1-1 chats
    const displayName = chat.name || "Chat";
    const displayAvatar = chat.avatar;
    const initials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex-1 flex flex-col h-screen bg-white relative">

            {/* Audited Access Banner for Admins */}
            {!chat.isGroup && (user?.role === "SUPER_ADMIN" || user?.role === "WORKSPACE_MANAGER") && (
                <div className="bg-amber-100 text-amber-800 text-xs font-bold px-4 py-2 text-center border-b border-amber-200 shadow-sm z-10 w-full">
                    ⚠️ AUDITED ACCESS: You are viewing a direct message room under Admin privileges. Actions are logged.
                </div>
            )}

            {/* Connection indicator */}
            {!isConnected && (
                <div className="bg-red-50 text-red-600 text-xs px-4 py-1.5 text-center border-b border-red-200 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Đang kết nối lại...
                </div>
            )}

            {/* Header */}
            <header className="h-14 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-8 w-8 text-slate-500"
                        onClick={onClose}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {/* Avatar with online dot */}
                    <div className="relative">
                        <Avatar className="h-8 w-8 ring-2 ring-white">
                            <AvatarImage src={displayAvatar || undefined} alt={displayName} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {!chat.isGroup && isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                    </div>

                    {/* Name & status */}
                    <div>
                        <h3 className="font-bold text-slate-900 text-[15px] leading-tight">{displayName}</h3>
                        <p className={`text-[11px] font-medium leading-tight ${typingUsers.length > 0
                                ? "text-blue-500"
                                : isOnline && !chat.isGroup
                                    ? "text-emerald-500"
                                    : "text-slate-400"
                            }`}>
                            {getStatusText()}
                        </p>
                    </div>
                </div>

                {/* Search bar */}
                <div className="flex-1 max-w-md mx-6 relative hidden sm:block">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <Input
                        placeholder="Search messages, files..."
                        className="pl-9 pr-12 bg-slate-50 border-0 h-9 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-blue-100"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-400 font-bold bg-white pointer-events-none">
                        ⌘K
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hidden sm:flex">
                        <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hidden sm:flex">
                        <Video size={18} />
                    </Button>
                    <div className="h-4 w-[1px] bg-slate-100 mx-1 hidden sm:block" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        onClick={() => {
                            if (chat?.isGroup) {
                                setShowGroupSettings(true);
                            } else {
                                setShowInfoPanel(true);
                            }
                        }}
                        title={chat?.isGroup ? "Cài đặt nhóm" : "Thông tin cuộc trò chuyện"}
                    >
                        <Info size={18} />
                    </Button>
                </div>
            </header>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-white">
                {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : allMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                        <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                        <p>Chưa có tin nhắn nào</p>
                        <p className="text-sm mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.date}>
                            {/* Date separator */}
                            <div className="flex items-center justify-center my-4">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500 font-medium">
                                    {group.date}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className="space-y-2">
                                {group.messages.map((message, idx) => {
                                    const msgSender = chat?.participants?.find((p) => p.accountId === (message.senderId || message.sender?.id));
                                    const patchedMessage = {
                                        ...message,
                                        sender: {
                                            id: msgSender?.accountId || message.senderId || message.sender?.id || '',
                                            name: msgSender?.name || message.sender?.name || 'Unknown User',
                                            avatar: msgSender?.avatar || message.sender?.avatar || '',
                                        }
                                    };

                                    return (
                                    <MessageBubble
                                        key={patchedMessage.id}
                                        message={patchedMessage}
                                        isGroup={chat.isGroup}
                                        showAvatar={
                                            !patchedMessage.isMe &&
                                            (idx === 0)
                                        }
                                        onReply={() => setReplyTo(patchedMessage)}
                                    />
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm pl-2">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs">
                            {chat?.isGroup
                                ? `${typingUsers.map((u) => u.userName).join(", ")} đang gõ...`
                                : "Đang gõ..."}
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                    <Reply className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0 border-l-2 border-blue-500 pl-2">
                        <p className="text-xs text-blue-600 font-medium">
                            {replyTo.isMe ? "Bạn" : replyTo.sender.name}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                            {replyTo.content || `[${replyTo.type}]`}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-slate-600"
                        onClick={() => setReplyTo(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <div className="px-6 py-3 bg-white border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
                        ) : (
                            <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center">
                                <File className="h-7 w-7 text-slate-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{selectedFiles[0].name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={clearSelectedFiles}
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <button
                            onClick={handleSendFile}
                            disabled={isUploading}
                            className="h-9 px-4 bg-[#135bec] hover:bg-[#0f4bbd] disabled:opacity-50 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>Send <Send size={14} /></>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Rich Text Composer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white">
                {/* Hidden file inputs */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "image")}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "file")}
                />

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                    {/* Toolbar */}
                    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-50 overflow-x-auto no-scrollbar">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0"><Bold size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0"><Italic size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0"><Link2 size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0"><ListIcon size={16} /></Button>
                        <div className="h-4 w-[1px] bg-slate-100 mx-1 flex-shrink-0" />

                        {/* Emoji */}
                        <div className="relative flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <Smile size={16} />
                            </Button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 z-50">
                                    <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                                </div>
                            )}
                        </div>

                        {/* Image upload */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0"
                            onClick={() => imageInputRef.current?.click()}
                            title="Gửi ảnh"
                        >
                            <ImageIcon size={16} />
                        </Button>

                        {/* File upload */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 flex-shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            title="Gửi file"
                        >
                            <Paperclip size={16} />
                        </Button>

                        <button className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100 flex-shrink-0">
                            <Sparkles size={14} className="animate-pulse" />
                            Ask AI
                        </button>
                    </div>

                    {/* Textarea */}
                    <div className="p-4 min-h-[80px]">
                        <textarea
                            ref={inputRef}
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`Nhập tin nhắn cho ${displayName}...`}
                            className="w-full resize-none border-0 focus:ring-0 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
                            rows={2}
                        />
                    </div>

                    {/* Footer bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 rounded-b-xl border-t border-slate-50">
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                            <div className="flex items-center gap-1.5">
                                <Mic size={14} /> Voice Clip
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mr-2 hidden sm:block">
                                Press ↵ to send
                            </span>
                            <button
                                onClick={handleSend}
                                disabled={!messageInput.trim() || sending}
                                className="h-9 px-4 bg-[#135bec] hover:bg-[#0f4bbd] disabled:opacity-50 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <></>}
                                Send
                                {!sending && <Send size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-2 text-center text-[10px] text-slate-300 font-medium">
                    OTT Enterprise Collaboration Chat • Secure & Encrypted
                </div>
            </div>

            {/* Chat Info Panel */}
            <ChatInfoPanel
                chatId={chatId}
                chatName={displayName}
                isOpen={showInfoPanel}
                onClose={() => setShowInfoPanel(false)}
                onMessageClick={(messageId) => {
                    setShowInfoPanel(false);
                }}
            />

            {/* Group Settings Panel */}
            {chat?.isGroup && (
                <GroupSettingsPanel
                    chatId={chatId}
                    isOpen={showGroupSettings}
                    onClose={() => setShowGroupSettings(false)}
                    currentUserId={user?.id}
                />
            )}
        </div>
    );
}