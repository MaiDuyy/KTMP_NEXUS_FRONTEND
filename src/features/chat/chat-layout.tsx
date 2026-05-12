"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/src/redux/hooks";
import { Chat, Message, Notification } from "@/src/type/chat.types";
import { socketService, connectSocket, disconnectSocket } from "@/src/services/socket.service";
import ChatSidebar from "./chat-sidebar";
import ChatWindow from "./chat-window";
import { toast } from "sonner";

export default function ChatLayout() {
    // Lưu ý: authSlice lưu token là `token`, không phải `accessToken`
    const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; userName: string }[]>>({});
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Use ref to track selected chat for socket callbacks
    const selectedChatIdRef = useRef<string | null>(null);

    // Keep ref in sync
    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    // Kết nối Socket - chỉ phụ thuộc vào auth state
    useEffect(() => {
        if (!isAuthenticated || !token) {
            disconnectSocket();
            setIsConnected(false);
            return;
        }

        console.log("[ChatLayout] Setting up socket connection with token...");

        const callbacks = {
            onConnect: () => {
                setIsConnected(true);
                console.log("[ChatLayout] ✅ Socket connected");
            },
            onDisconnect: () => {
                setIsConnected(false);
                console.log("[ChatLayout] ❌ Socket disconnected");
            },
            onNewMessage: (data: { message: Message; chatId: string }) => {
                console.log("[ChatLayout] 📩 New message received:", data.chatId);

                // Emit custom event để ChatWindow có thể lắng nghe
                window.dispatchEvent(
                    new CustomEvent("socket:message:new", { detail: data })
                );

                // Nếu không phải tin nhắn của mình và không đang xem chat đó
                if (!data.message.isMe && data.chatId !== selectedChatIdRef.current) {
                    toast.info(`${data.message.sender.name}: ${data.message.content?.substring(0, 50) || "Đã gửi một file"}`);
                }
            },
            onTypingStart: (data: { chatId: string; userId: string; userName: string }) => {
                setTypingUsers((prev) => {
                    const chatTypers = prev[data.chatId] || [];
                    if (!chatTypers.find((t) => t.userId === data.userId)) {
                        return {
                            ...prev,
                            [data.chatId]: [...chatTypers, { userId: data.userId, userName: data.userName }],
                        };
                    }
                    return prev;
                });
            },
            onTypingStop: (data: { chatId: string; userId: string }) => {
                setTypingUsers((prev) => {
                    const chatTypers = prev[data.chatId] || [];
                    return {
                        ...prev,
                        [data.chatId]: chatTypers.filter((t) => t.userId !== data.userId),
                    };
                });
            },
            onUserOnline: (data: { userId: string }) => {
                console.log("[ChatLayout] 🟢 User online:", data.userId);
                setOnlineUsers((prev) => new Set([...prev, data.userId]));
            },
            onUserOffline: (data: { userId: string }) => {
                console.log("[ChatLayout] 🔴 User offline:", data.userId);
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(data.userId);
                    return newSet;
                });
            },
            // Nhận danh sách bạn bè online khi kết nối
            onUsersOnline: (data: { userIds: string[] }) => {
                console.log("[ChatLayout] 📋 Online friends list:", data.userIds);
                setOnlineUsers(new Set(data.userIds));
            },
            // Message recalled event
            onMessageRecalled: (data: { messageId: string; chatId: string; userId: string; userName: string }) => {
                console.log("[ChatLayout] 🔄 Message recalled:", data);
                window.dispatchEvent(
                    new CustomEvent("socket:message:recalled", { detail: data })
                );
            },
            // Message pinned event
            onMessagePinned: (data: { messageId: string; chatId: string; pin: boolean; userId: string; userName: string }) => {
                console.log("[ChatLayout] 📌 Message pinned:", data);
                window.dispatchEvent(
                    new CustomEvent("socket:message:pinned", { detail: data })
                );
            },
            // Message reacted event
            onMessageReacted: (data: { messageId: string; userId: string; userName: string; emoji: string; action: string }) => {
                console.log("[ChatLayout] ❤️ Message reacted:", data);
                window.dispatchEvent(
                    new CustomEvent("socket:message:reacted", { detail: data })
                );
            },
            onNotification: (data: Notification) => {
                console.log("[ChatLayout] 🔔 Notification:", data);
                toast.info(data.title, {
                    description: data.body,
                });
            },
            onMessageBlocked: (data: { chatId: string; isBlockedByMe: boolean; message: string }) => {
                console.log("[ChatLayout] 🚫 Message blocked:", data);
                toast.error(data.message);
                window.dispatchEvent(
                    new CustomEvent("socket:message:blocked", { detail: data })
                );
            },
            // Friend events
            onFriendRequestReceived: (data: { id: string; sender: { name: string } }) => {
                console.log("[ChatLayout] 👥 Friend request received:", data);
                toast.info(`${data.sender.name} đã gửi lời mời kết bạn`, {
                    description: "Nhấn để xem chi tiết",
                    duration: 5000,
                });
                window.dispatchEvent(
                    new CustomEvent("socket:friend:request:received", { detail: data })
                );
            },
            onFriendRequestAccepted: (data: { user: { name: string }; chatId: string }) => {
                console.log("[ChatLayout] ✅ Friend request accepted:", data);
                toast.success(`${data.user.name} đã chấp nhận lời mời kết bạn!`, {
                    duration: 4000,
                });
                window.dispatchEvent(
                    new CustomEvent("socket:friend:request:accepted", { detail: data })
                );
            },
            onFriendRemoved: (data: { userName: string }) => {
                console.log("[ChatLayout] ❌ Friend removed:", data);
                window.dispatchEvent(
                    new CustomEvent("socket:friend:removed", { detail: data })
                );
            },
            onError: (error: { message: string }) => {
                console.error("[ChatLayout] ⚠️ Socket error:", error.message);
            },
        };

        connectSocket(token, callbacks);

        return () => {
            console.log("[ChatLayout] Cleaning up socket...");
            disconnectSocket();
        };
    }, [isAuthenticated, token]); // Không có selectedChatId

    // Handle chat selection
    const handleSelectChat = useCallback((chatId: string) => {
        // Leave room cũ
        if (selectedChatId) {
            socketService.leaveChat(selectedChatId);
        }
        // Join room mới
        socketService.joinChat(chatId);
        setSelectedChatId(chatId);
    }, [selectedChatId]);

    // Handle close chat
    const handleCloseChat = useCallback(() => {
        if (selectedChatId) {
            socketService.leaveChat(selectedChatId);
        }
        setSelectedChatId(null);
    }, [selectedChatId]);

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                        Vui lòng đăng nhập để sử dụng Chat
                    </h1>
                    <a
                        href="/auth/sign-in"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Đăng nhập
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <ChatSidebar
                selectedChatId={selectedChatId}
                onSelectChat={handleSelectChat}
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                isConnected={isConnected}
            />

            {/* Main Chat Window */}
            <div className="flex-1 flex">
                {selectedChatId ? (
                    <ChatWindow
                        chatId={selectedChatId}
                        onClose={handleCloseChat}
                        typingUsers={typingUsers[selectedChatId] || []}
                        onlineUsers={onlineUsers}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                        <div className="text-center">
                            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg
                                    className="w-16 h-16 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                Chào mừng đến với ZaChat
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu một cuộc trò chuyện mới
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
