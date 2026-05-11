"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetChatsQuery } from "@/src/redux/feature/chatApi";
import {
  useGetReceivedRequestsQuery,
  useGetFriendsQuery,
} from "@/src/redux/feature/friendApi";
import { useGetUnreadCountQuery } from "@/src/redux/feature/notificationApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageCircle,
  Users,
  Bell,
  Settings,
  Plus,
  UserPlus,
} from "lucide-react";
import { getSocket } from "@/src/services/socket.service"; // 2. Import getSocket
// Components
import FriendsPanel from "./friends-panel";
import NotificationsPanel from "./notifications-panel";
import NewChatModal from "./new-chat-modal";
import { ChatItem } from "./chat-item";

interface ChatSidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  typingUsers: Record<string, { userId: string; userName: string }[]>;
  onlineUsers: Set<string>;
  isConnected: boolean;
}

type TabType = "chats" | "friends" | "notifications";

export default function ChatSidebar({
  selectedChatId,
  onSelectChat,
  typingUsers,
  onlineUsers,
  isConnected,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const router = useRouter();

  // API queries
  const {
    data: chatsData,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useGetChatsQuery();
  const { data: friendRequestsData, refetch: refetchRequests } = useGetReceivedRequestsQuery();
  const { data: notificationsData, refetch: refetchNotifications } = useGetUnreadCountQuery();
  const { data: friendsData, refetch: refetchFriends } = useGetFriendsQuery();

  const chats = chatsData?.chats || [];
  const friendRequestsCount = friendRequestsData?.requests?.length || 0;
  const unreadNotificationsCount = notificationsData?.unreadCount || 0;
  const friends = friendsData?.friends || [];

  // Tạo Set chứa ID của tất cả bạn bè
  const friendIds = useMemo(() => {
    return new Set(friends.map((f: any) => f.id));
  }, [friends]);

  // Filter chats by search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((chat) =>
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleFriendRequestGone = (data: any) => {
      console.log("[Sidebar] Request gone (Declined/Cancelled):", data);

      // Load lại danh sách lời mời nhận được (để xóa badge đỏ và xóa khỏi list)
      refetchRequests();

      // Nếu bạn hiển thị danh sách "Lời mời đã gửi", cần gọi refetchSentRequests() ở đây
    };
    // Handler: Cập nhật danh sách Chat
    const handleChatUpdate = () => {
      console.log("[Sidebar] Updating Chats...");
      refetchChats();
    };

    // Handler: Cập nhật Badge lời mời & Danh sách lời mời
    const handleFriendRequestReceived = (data: any) => {
      console.log("[Sidebar] New Friend Request:", data);
      refetchRequests(); // Load lại list request
      refetchNotifications(); // Load lại số thông báo (nếu có tính vào chuông)
    };

    // Handler: Khi đồng ý kết bạn (hoặc bên kia đồng ý mình)
    const handleFriendRequestAccepted = (data: any) => {
      console.log("[Sidebar] Friend Request Accepted:", data);
      refetchFriends(); // Load lại list bạn bè (để hiện trong tab Friends)
      refetchRequests(); // Load lại list request (để xóa cái đã accept)
      refetchChats(); // Load lại chat (nếu hệ thống tự tạo chat mới)
    };

    // Handler: Khi bị hủy kết bạn
    const handleFriendRemoved = (data: any) => {
      console.log("[Sidebar] Friend Removed:", data);
      refetchFriends(); // Xóa bạn khỏi list
      refetchChats(); // Cập nhật lại list chat (có thể mất quyền chat)
    };

    // --- LẮNG NGHE SỰ KIỆN ---

    // 1. Chat Events
    socket.on("message:new", handleChatUpdate);
    socket.on("chat:join", handleChatUpdate);

    // 2. Friend Events (QUAN TRỌNG VỚI BẠN LÚC NÀY)
    socket.on("friend:request:received", handleFriendRequestReceived);
    socket.on("friend:request:accepted", handleFriendRequestAccepted);
    socket.on("friend:removed", handleFriendRemoved);

    socket.on("friend:request:declined", handleFriendRequestGone);
    socket.on("friend:request:cancelled", handleFriendRequestGone);
    // Cleanup
    return () => {
      socket.off("message:new", handleChatUpdate);
      socket.off("chat:join", handleChatUpdate);

      socket.off("friend:request:received", handleFriendRequestReceived);
      socket.off("friend:request:accepted", handleFriendRequestAccepted);
      socket.off("friend:removed", handleFriendRemoved);
      socket.off("friend:request:declined", handleFriendRequestGone);
      socket.off("friend:request:cancelled", handleFriendRequestGone);
    };
  }, [
    refetchChats,
    refetchRequests,
    refetchFriends,
    refetchNotifications,
    isConnected,
  ]);
  return (
    <>
      <div className="w-[360px] flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ZaChat
            </h1>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                title={isConnected ? "Đã kết nối" : "Mất kết nối"}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShowNewChatModal(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => router.push("/settings")}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-9 bg-gray-100 dark:bg-gray-700 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === "chats"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <MessageCircle className="h-5 w-5 mx-auto" />
            {activeTab === "chats" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === "friends"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <div className="relative inline-block">
              <Users className="h-5 w-5" />
              {friendRequestsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1 py-0 h-4 min-w-[16px]">
                  {friendRequestsCount}
                </Badge>
              )}
            </div>
            {activeTab === "friends" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === "notifications"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            <div className="relative inline-block">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1 py-0 h-4 min-w-[16px]">
                  {unreadNotificationsCount > 99
                    ? "99+"
                    : unreadNotificationsCount}
                </Badge>
              )}
            </div>
            {activeTab === "notifications" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "chats" && (
            <>
              {chatsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                  <MessageCircle className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                  <Button
                    variant="link"
                    className="mt-2 text-blue-600"
                    onClick={() => setShowNewChatModal(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Bắt đầu chat mới
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {/* --- RENDER LIST CHAT ITEM MỚI --- */}
                  {filteredChats.map((chat) => {
                    // Tính toán props cho từng item
                    const isSelected = selectedChatId === chat.id;
                    const isTyping = typingUsers[chat.id]?.length > 0;
                    const typingUserNames = typingUsers[chat.id]
                      ?.map((u) => u.userName)
                      .join(", ");

                    let isOnline = false;
                    let isFriend = true; // Mặc định true cho group

                    // if (!chat.isGroup && chat.participants[0]) {
                    //   isOnline = onlineUsers.has(chat.participants[0].id);
                    //   // Kiểm tra xem participant có phải là bạn bè không
                    //   isFriend = friendIds.has(chat.participants[0].id);
                    // }
                    if (!chat.isGroup) {
                      const chatAny = chat as any;
                      const partnerId = chatAny.participantIds?.[0] || chatAny.participants?.[0]?.accountId || chatAny.participants?.[0]?.id;
                      if (partnerId) {
                        isOnline = onlineUsers.has(partnerId);
                        // Kiểm tra xem participant có phải là bạn bè không
                        isFriend = friendIds.has(partnerId);
                      }
                    }

                    return (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isSelected={isSelected}
                        isOnline={isOnline}
                        isTyping={isTyping}
                        typingUserNames={typingUserNames}
                        onSelectChat={onSelectChat}
                        isFriend={isFriend}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "friends" && (
            <FriendsPanel
              onlineUsers={onlineUsers}
              onStartChat={onSelectChat}
            />
          )}

          {activeTab === "notifications" && <NotificationsPanel />}
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        open={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={(chatId) => {
          setShowNewChatModal(false);
          onSelectChat(chatId);
        }}
      />
    </>
  );
}
