// src/hooks/useRealtimeChat.ts
// Central WebSocket hook with React Context for sharing socket state across the app

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinChat,
  leaveChat,
} from "@/src/services/socket.service";
import type { SocketCallbacks } from "@/src/services/socket.service";
import { apiSlice } from "@/src/redux/api/baseApi";
import { messageApi } from "@/src/redux/feature/messageApi";
import { chatApi } from "@/src/redux/feature/chatApi";
import { adminApi } from "@/src/redux/feature/adminApi";
import { toast } from "sonner";
import { store } from "@/src/redux/store";

// ===== Context Types =====

interface TypingUser {
  userId: string;
  userName: string;
}

export interface RealtimeChatContextValue {
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, TypingUser[]>; // chatId -> typing users
  joinChatRoom: (chatId: string) => void;
  leaveChatRoom: (chatId: string) => void;
}

const RealtimeChatContext = createContext<RealtimeChatContextValue>({
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  joinChatRoom: () => {},
  leaveChatRoom: () => {},
});

// ===== Provider Component =====

export function RealtimeChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const auth = useSelector((state: any) => state.auth);
  const isAuthenticated = auth?.isAuthenticated;
  const accessToken = auth?.token;
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser[]>>(
    new Map()
  );
  const isConnectedRef = useRef(false);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Remove typing user after timeout
  const removeTyping = useCallback((chatId: string, userId: string) => {
    setTypingUsers((prev) => {
      const updated = new Map(prev);
      const chatUsers = (updated.get(chatId) || []).filter(
        (u) => u.userId !== userId
      );
      if (chatUsers.length === 0) {
        updated.delete(chatId);
      } else {
        updated.set(chatId, chatUsers);
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (isConnectedRef.current) {
        disconnectSocket();
        isConnectedRef.current = false;
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
      }
      return;
    }

    if (isConnectedRef.current && accessToken) return;

    const callbacks: SocketCallbacks = {
      onConnect: () => {
        console.log("[RealtimeChat] ✅ Socket connected");
        isConnectedRef.current = true;
        setIsConnected(true);
      },

      onDisconnect: () => {
        console.log("[RealtimeChat] ❌ Socket disconnected");
        isConnectedRef.current = false;
        setIsConnected(false);
      },

      onReconnect: (attempt) => {
        console.log("[RealtimeChat] 🔄 Socket reconnected after attempt:", attempt);
        isConnectedRef.current = true;
        setIsConnected(true);
        // Refresh API state in case we missed events while disconnected
        dispatch(apiSlice.util.invalidateTags(["Chats", "Messages", "Friends"]));
      },

      // ====== Message Events ======

      onNewMessage: (data) => {
        console.log("[RealtimeChat] 📩 New message received in chatId:", data.chatId, data.message);
        
        const authUser = store.getState().auth?.user;
        const senderId = data.message.senderId || data.message.sender?.id;
        const isMyMessage = senderId === authUser?.id;

        // Hiển thị toast thông báo nếu tin nhắn đến từ cuộc trò chuyện khác
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isCurrentChat = currentPath.includes(data.chatId);
        
        if (!isCurrentChat && !isMyMessage) {
           toast.info(`Tin nhắn mới từ ${data.message.sender?.name || 'Ai đó'}`, {
               description: data.message.type === 'text' ? data.message.content : `[${data.message.type}]`,
               duration: 4000,
           });
        }

        // Enrich message with isMe flag before pushing to cache
        const enrichedMessage = { ...data.message, isMe: isMyMessage };

        // Optimistically update both cache variants so UI reflects instantly
        const updateArgs = [
          { chatId: data.chatId, limit: 50 },
          { chatId: data.chatId }
        ];

        updateArgs.forEach(args => {
          dispatch(
            messageApi.util.updateQueryData("getMessages", args as any, (draft) => {
              if (draft && draft.messages) {
                const exists = draft.messages.find((m) => m.id === enrichedMessage.id);
                if (!exists) {
                  draft.messages.push(enrichedMessage);
                }
              }
            })
          );
        });

        // Invalidate only Chats so the sidebar re-fetches and re-sorts.
        // Do NOT invalidate Messages here — updateQueryData already handles the
        // optimistic push and a concurrent refetch would race-overwrite it.
        dispatch(apiSlice.util.invalidateTags(["Chats"]));

        // DISPATCH GLOBAL EVENT for local state sync
        window.dispatchEvent(new CustomEvent("chat:new_message", { 
          detail: { ...enrichedMessage, chatId: data.chatId } 
        }));
      },

      onMessageRecalled: (data) => {
        console.log("[RealtimeChat] 🔄 Message recalled:", data.chatId);
        const targetChatId = data.chatId;
        
        if (targetChatId) {
            dispatch(
              messageApi.util.updateQueryData("getMessages", { chatId: targetChatId, limit: 50 }, (draft) => {
                if (draft && draft.messages) {
                  const targetId = data.messageId || data.id;
                  const msg = draft.messages.find((m) => m.id === targetId);
                  if (msg) {
                    msg.content = 'Tin nhắn đã bị thu hồi';
                    msg.destroy = true;
                  }
                }
              })
            );
        }
        dispatch(apiSlice.util.invalidateTags(["Messages"])); // Fallback to ensure UI updates

        // DISPATCH GLOBAL EVENT
        window.dispatchEvent(new CustomEvent("chat:message_recalled", {
          detail: { chatId: targetChatId, messageId: data.messageId || data.id }
        }));
      },

      onMessagePinned: (data) => {
        console.log("[RealtimeChat] 📌 Message pinned event:", data.chatId, data.messageId, data.pin);
        
        if (data.chatId) {
          const updateArgs = [
            { chatId: data.chatId, limit: 50 },
            { chatId: data.chatId }
          ];

          updateArgs.forEach(args => {
            dispatch(
              messageApi.util.updateQueryData("getMessages", args as any, (draft) => {
                if (draft && draft.messages) {
                  const targetId = data.messageId || data.id;
                  const msg = draft.messages.find((m) => m.id === targetId);
                  if (msg) {
                    msg.pin = data.pin;
                  }
                }
              })
            );
          });
          
          // Invalidate pinned list only, avoid invalidating the whole message list
          dispatch(apiSlice.util.invalidateTags([{ type: "PinnedMessages", id: data.chatId }]));

          // DISPATCH GLOBAL EVENT
          window.dispatchEvent(new CustomEvent("chat:message_pinned", {
            detail: { ...data, messageId: data.messageId || data.id }
          }));
        }
      },

      onNotification: (data: any) => {
        console.log("[RealtimeChat] 🔔 New notification:", data);
        
        // Invalidate notifications tags to update Bell count and panel
        dispatch(apiSlice.util.invalidateTags(["Notifications"] as any));

        // Show toast for generic notifications that don't have their own specific handlers
        // (Friend requests and workspace invites already have their own toasts)
        const specificTypes = ['FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'WORKSPACE_INVITE', 'NEW_MESSAGE'];
        if (!specificTypes.includes(data.type)) {
          toast.info(data.title || "Thông báo mới", {
            description: data.body,
            duration: 5000,
          });
        }
      },

      onMessageRead: (data) => {
        console.log("[RealtimeChat] 👁️ Message read event:", data);
        
        if (data.chatId && data.userId) {
          // Optimistically update read receipts cache
          dispatch(
            chatApi.util.updateQueryData("getChatReadReceipts", data.chatId, (draft) => {
              if (Array.isArray(draft)) {
                const existingIndex = draft.findIndex((r: any) => r.userId === data.userId);
                const now = new Date().toISOString();
                
                if (existingIndex !== -1) {
                  draft[existingIndex] = { ...draft[existingIndex], readAt: now };
                } else {
                  draft.push({ userId: data.userId, readAt: now });
                }
              }
            })
          );
        }

        // Still invalidate Chats to update unread badges across the app
        dispatch(apiSlice.util.invalidateTags(["Chats"]));

        // DISPATCH GLOBAL EVENT
        window.dispatchEvent(new CustomEvent("chat:message_read", {
          detail: data
        }));
      },
      
      onMessageReacted: (data) => {
        console.log("[RealtimeChat] ❤️ Message reacted", data);
        
        if (data.chatId) {
            dispatch(
              messageApi.util.updateQueryData("getMessages", { chatId: data.chatId, limit: 50 }, (draft) => {
                if (draft && draft.messages) {
                  const msg = draft.messages.find((m) => m.id === data.messageId);
                  if (msg) {
                    if (!msg.reactions) msg.reactions = [];
                    const existReaction = msg.reactions.find((r) => r.emoji === data.emoji);
                    
                    if (data.action === "added" || data.action === "changed" || !data.action) {
                      if (existReaction) {
                        if (!existReaction.users) existReaction.users = [];
                        const udx = existReaction.users.findIndex((u) => u.id === data.userId || u.name === data.userName);
                        if (udx === -1) {
                            existReaction.users.push({ id: data.userId || "me", name: data.userName || "User" });
                            existReaction.count += 1;
                        }
                      } else {
                        msg.reactions.push({
                          emoji: data.emoji,
                          count: 1,
                          users: [{ id: data.userId || "me", name: data.userName || "User" }],
                        });
                      }
                    } else if (data.action === "removed") {
                      if (existReaction) {
                        existReaction.count -= 1;
                        if (existReaction.users) {
                            existReaction.users = existReaction.users.filter((u) => u.id !== data.userId && u.name !== data.userName);
                        }
                        if (existReaction.count <= 0) {
                          msg.reactions = msg.reactions.filter((r) => r.emoji !== data.emoji);
                        }
                      }
                    }
                  }
                }
              })
            );
        }
        dispatch(apiSlice.util.invalidateTags(["Messages"]));

        // DISPATCH GLOBAL EVENT
        window.dispatchEvent(new CustomEvent("chat:message_reacted", {
          detail: data
        }));
      },

      // ====== Typing Events ======

      onTypingStart: (data) => {
        const { chatId, userId, userName } = data;
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          const chatUsers = updated.get(chatId) || [];
          if (!chatUsers.some((u) => u.userId === userId)) {
            updated.set(chatId, [...chatUsers, { userId, userName }]);
          }
          return updated;
        });

        // Auto-remove after 3s if no stop event
        const key = `${chatId}:${userId}`;
        const existing = typingTimeoutsRef.current.get(key);
        if (existing) clearTimeout(existing);
        typingTimeoutsRef.current.set(
          key,
          setTimeout(() => removeTyping(chatId, userId), 3000)
        );
      },

      onTypingStop: (data) => {
        const { chatId, userId } = data;
        removeTyping(chatId, userId);

        const key = `${chatId}:${userId}`;
        const existing = typingTimeoutsRef.current.get(key);
        if (existing) {
          clearTimeout(existing);
          typingTimeoutsRef.current.delete(key);
        }
      },

      // ====== Online/Offline Events ======



      onUserOnline: (data) => {
        console.log("[RealtimeChat] 🟢 User online:", data.userId);
        setOnlineUsers((prev) => new Set([...prev, data.userId]));
        
        // Cập nhật cache adminApi nếu có
        dispatch(
          adminApi.util.updateQueryData("listUsers", undefined as any, (draft) => {
            if (draft && draft.items) {
              const user = draft.items.find((u) => u.id === data.userId);
              if (user) {
                user.isOnline = true;
              }
            }
          })
        );
      },

      onUserOffline: (data) => {
        console.log("[RealtimeChat] 🔴 User offline:", data.userId);
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });

        // Cập nhật cache adminApi nếu có
        dispatch(
          adminApi.util.updateQueryData("listUsers", undefined as any, (draft) => {
            if (draft && draft.items) {
              const user = draft.items.find((u) => u.id === data.userId);
              if (user) {
                user.isOnline = false;
                user.lastSeen = new Date().toISOString();
              }
            }
          })
        );
      },

      onUserAvatarUpdated: (data) => {
        console.log("[RealtimeChat] 👤 User avatar updated:", data.userId);
        // Invalidate tags to refetch the sidebar, profiles, and chat list
        dispatch(apiSlice.util.invalidateTags(["User", "Chats"]));
      },

      onChatDeleted: (data) => {
        console.log("[RealtimeChat] 🗑️ Chat deleted:", data.chatId);
        dispatch(apiSlice.util.invalidateTags(["Chats"]));
        
        // If user is currently in this chat, redirect to home
        if (typeof window !== 'undefined' && window.location.pathname.includes(data.chatId)) {
          toast.error("Nhóm này đã bị giải tán bởi trưởng nhóm.");
          router.replace("/chat"); 
        }
      },

      onChatMemberRemoved: (data) => {
        console.log("[RealtimeChat] 🚪 Member removed from chat:", data.chatId);
        dispatch(apiSlice.util.invalidateTags(["Chats"]));

        // If user is the one removed and currently in this chat, redirect
        const authUser = store.getState().auth?.user;
        if (typeof window !== 'undefined' && window.location.pathname.includes(data.chatId)) {
          if (!data.isSelfLeave) {
            toast.error("Bạn đã bị xóa khỏi nhóm chat.");
          }
          router.replace("/chat");
        }
      },

      onChatMemberUpdated: (data) => {
        console.log("[RealtimeChat] 👥 Chat member updated:", data.chatId);
        // Just refetch chat details to update members list UI if user is looking at it
        dispatch(apiSlice.util.invalidateTags([{ type: "Chats", id: data.chatId }]));
      },

      onChatRoleUpdated: (data) => {
        console.log("[RealtimeChat] 🛡️ Member role updated in chat:", data.chatId);
        // Invalidate tags so the UI reflects the new role (buttons availability etc)
        dispatch(apiSlice.util.invalidateTags([{ type: "Chats", id: data.chatId }, "Chats"]));
        
        // If it's the current user whose role was updated, we might want to show a toast
        const authUser = store.getState().auth?.user;
        if (data.memberId === authUser?.id) {
           toast.info(`Vai trò của bạn trong nhóm đã được thay đổi thành ${data.newRole === 'CHANNEL_OWNER' ? 'Trưởng nhóm' : data.newRole === 'CHANNEL_MODERATOR' ? 'Phó nhóm' : 'Thành viên'}`);
        }
      },

      onChatUpdated: (data) => {
        console.log("[RealtimeChat] 🔄 Chat info updated:", data.chatId);
        dispatch(apiSlice.util.invalidateTags([{ type: "Chats", id: data.chatId }, "Chats"]));
      },

      onJoinRequestNew: (data) => {
        console.log("[RealtimeChat] 📩 New join request:", data.chatId);
        // Invalidate chat details to update joinRequests count/list (for admins)
        dispatch(apiSlice.util.invalidateTags([{ type: "Chats", id: data.chatId }]));
      },

      onJoinRequestUpdated: (data) => {
        console.log("[RealtimeChat] ✅ Join request updated:", data.chatId);
        dispatch(apiSlice.util.invalidateTags([{ type: "Chats", id: data.chatId }]));
      },

      onTaskNew: (data) => {
        console.log("[RealtimeChat] ✅ New task created:", data.chatId);
        dispatch(apiSlice.util.invalidateTags([{ type: "Tasks" as any, id: data.chatId }]));
      },

      onTaskUpdated: (data) => {
        console.log("[RealtimeChat] ✅ Task updated:", data.chatId);
        dispatch(apiSlice.util.invalidateTags([{ type: "Tasks" as any, id: data.chatId }]));
      },

      onUsersOnline: (data) => {
        console.log(
          "[RealtimeChat] 📋 Online users list:",
          data.userIds?.length
        );
        setOnlineUsers(new Set(data.userIds));
      },

      onFriendRequestReceived: (data) => {
        console.log("[RealtimeChat] 👥 Friend request received:", data);
        toast.info(`Lời mời kết bạn mới từ ${data.sender?.name || 'Ai đó'}`, {
          description: "Nhấn vào tab Bạn bè để xem chi tiết.",
          duration: 5000,
        });
        // Invalidate tags so the friends list / requests UI updates
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Notifications"] as any));
      },

      // onFriendRequestSent: (data) => {
      //   console.log("[RealtimeChat] 📤 Friend request sent (sync other tabs):", data);
        
      //   // Show toast for sender (User A)
      //   // We can check if it's not the current tab by comparing requestId if we tracked it,
      //   // but showing it on all tabs is usually fine or we can skip if it's redundant.
      //   toast.success(`Đã gửi lời mời kết bạn cho ${data.receiverName || 'người dùng'}`);
        
      //   // Invalidate tags
      //   dispatch(apiSlice.util.invalidateTags(["FriendRequests", "Friends"] as any));
      // },
      onFriendRequestSent: (data) => {
        console.log("[RealtimeChat] 📤 Friend request sent (sync other tabs):", data);
        dispatch(apiSlice.util.invalidateTags(["FriendRequests"]));
      },

      onFriendRequestAccepted: (data) => {
        console.log("[RealtimeChat] ✅ Friend request accepted:", data);
        toast.success(`${data.user?.name || 'Ai đó'} đã chấp nhận lời mời kết bạn!`, {
          duration: 5000,
        });
        // Invalidate tags
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Chats", "Notifications"] as any));
      },

      onFriendUnfriended: (data) => {
        console.log("[RealtimeChat] ❌ Unfriended:", data);
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Chats"]));
      },

      onFriendRequestRejected: (data) => {
        console.log("[RealtimeChat] 🚫 Friend request rejected:", data);
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Notifications"] as any));
      },

      onFriendRequestCancelled: (data) => {
        console.log("[RealtimeChat] ↩️ Friend request cancelled:", data);
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Notifications"] as any));
      },

      onFriendBlocked: (data) => {
        console.log("[RealtimeChat] 🚫 User blocked:", data);
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Chats"]));
      },

      onFriendUnblocked: (data) => {
        console.log("[RealtimeChat] ✅ User unblocked:", data);
        dispatch(apiSlice.util.invalidateTags(["Friends", "FriendRequests", "Chats"]));
      },

      onDocumentStatusChanged: (data) => {
        console.log("[RealtimeChat] 📄 Document status changed:", data);
        dispatch(apiSlice.util.invalidateTags(["Documents"]));
        if (data.status === 'READY') {
           toast.success(`Tài liệu #${data.documentId} đã được xử lý xong và đưa hướng vào Vector Database!`);
        } else if (data.status === 'ERROR' || data.status === 'FAILED') {
           toast.error(`Xử lý tài liệu #${data.documentId} thất bại.`);
        }
      },

      onChatCallStatus: (data) => {
        console.log("[RealtimeChat] 📞 Chat call status changed:", data);
        window.dispatchEvent(new CustomEvent("chat:call_status", { detail: data }));
      },

      onCallActiveStatus: (data) => {
        console.log("[RealtimeChat] 📞 Call active status received:", data);
        window.dispatchEvent(new CustomEvent("call:active_status", { detail: data }));
      },
      
      onWorkspaceInvite: (data) => {
        console.log("[RealtimeChat] 🏢 New workspace invite:", data);
        toast.success(`Bạn nhận được lời mời tham gia Workspace: ${data.workspaceName}`, {
          description: `Vai trò: ${data.role}. Nhấn để tham gia!`,
          duration: 10000,
          action: {
            label: "Tham gia ngay",
            onClick: () => router.push(`/invite?token=${data.token}`)
          }
        });
        
        // Invalidate workspaces tag if we have one (to refresh sidebars/lists)
        dispatch(apiSlice.util.invalidateTags(["Workspaces", "Notifications"] as any));
      },

      onWorkspaceDissolved: (data) => {
        console.log("[RealtimeChat] 🏢 Workspace dissolved:", data.workspaceId);
        toast.error("Không gian làm việc này đã bị giải tán bởi chủ sở hữu.");
        
        // Invalidate workspaces to update sidebar/lists
        dispatch(apiSlice.util.invalidateTags(["Workspaces"] as any));

        // If user is currently in this workspace, redirect to dashboard
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath.includes(`/chat`) && currentPath.includes(data.workspaceId)) {
           router.replace("/dashboard");
        }
      },

      onWorkspaceRestored: (data) => {
        console.log("[RealtimeChat] 🏢 Workspace restored:", data.workspaceId);
        toast.success("Một không gian làm việc của bạn đã được khôi phục thành công.");
        
        dispatch(apiSlice.util.invalidateTags(["Workspaces"] as any));
      },

      onWorkspaceMemberLeft: (data) => {
        console.log("[RealtimeChat] 🚪 Member removed from workspace:", data.workspaceId);
        dispatch(apiSlice.util.invalidateTags(["Workspaces"] as any));

        // If user is the one removed and currently in this workspace, redirect
        const authUser = store.getState().auth?.user;
        if (data.userId === authUser?.id) {
          if (data.reason === 'KICKED') {
            toast.error("Bạn đã bị xóa khỏi không gian làm việc.");
          } else {
            toast.info("Bạn đã rời khỏi không gian làm việc.");
          }
          
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          if (currentPath.includes(`/chat`) && currentPath.includes(data.workspaceId)) {
            router.replace("/dashboard");
          }
        }
      },

      onWorkspaceMemberUpdated: (data) => {
        console.log("[RealtimeChat] 👥 Workspace member updated:", data.workspaceId);
        // Refresh workspace members list if needed
        dispatch(apiSlice.util.invalidateTags([
          "Workspaces", 
          "WorkspaceMembers" as any, 
          { type: "Workspaces" as any, id: data.workspaceId }
        ]));
        if (data.action === 'role_updated') {
           const authUser = store.getState().auth?.user;
           if (data.userId === authUser?.id) {
              toast.info(`Vai trò của bạn đã được thay đổi thành: ${data.role}`);
           }
        }
      },

      onWorkspaceInviteRejected: (data) => {
        console.log("[RealtimeChat] 🚫 Workspace invite rejected:", data);
        toast.info(`Lời mời gửi tới ${data.email} đã bị từ chối.`);
        dispatch(apiSlice.util.invalidateTags(["WorkspaceInvites" as any, "Workspaces" as any]));
      },

      onWorkspaceInviteAccepted: (data) => {
        console.log("[RealtimeChat] ✅ Workspace invite accepted:", data);
        toast.success(`Một thành viên mới đã tham gia Workspace.`);
        dispatch(apiSlice.util.invalidateTags(["WorkspaceInvites" as any, "WorkspaceMembers" as any, "Workspaces" as any]));
      },

      onWorkspaceInviteCancelled: (data) => {
        console.log("[RealtimeChat] ↩️ Workspace invite cancelled:", data);
        dispatch(apiSlice.util.invalidateTags(["WorkspaceInvites" as any]));
      },

      onWorkspaceDeleted: (data) => {
        console.log("[RealtimeChat] 🗑️ Workspace deleted:", data.workspaceId);
        toast.error("Không gian làm việc này đã bị xóa vĩnh viễn.");
        
        dispatch(apiSlice.util.invalidateTags(["Workspaces"] as any));

        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath.includes(`/chat`) && currentPath.includes(data.workspaceId)) {
           router.replace("/dashboard");
        }
      },

      onWorkspaceOwnerTransferred: (data) => {
        console.log("[RealtimeChat] 👑 Workspace owner transferred:", data.workspaceId);
        
        // Invalidate tags to refresh roles and owner info
        dispatch(apiSlice.util.invalidateTags(["Workspaces", "WorkspaceMembers"] as any));

        const authUser = store.getState().auth?.user;
        if (data.newOwnerId === authUser?.id) {
          toast.success("Chúc mừng! Bạn đã trở thành Chủ sở hữu mới của Workspace này.");
        } else if (data.oldOwnerId === authUser?.id) {
          toast.info("Bạn đã chuyển giao quyền sở hữu Workspace và hiện là Quản trị viên.");
        }
      },

      onWorkspaceUpdated: (data) => {
        console.log("[RealtimeChat] 🔄 Workspace updated:", data.workspaceId, data.updates);
        // Invalidate so all components re-fetch: sidebar icon, settings page header, workspace list
        dispatch(apiSlice.util.invalidateTags([
          "Workspaces",
          { type: "Workspaces" as any, id: data.workspaceId },
        ]));
      },

      onSystemBroadcast: (data) => {
        console.log("[RealtimeChat] 📢 System broadcast received:", data);
        
        const typeStyles: Record<string, string> = {
          MAINTENANCE: 'bg-amber-100 text-amber-900 border-amber-200',
          ALERT: 'bg-red-100 text-red-900 border-red-200',
          ANNOUNCEMENT: 'bg-blue-100 text-blue-900 border-blue-200',
        };

        toast.message(data.title, {
          description: data.body,
          duration: data.type === 'ALERT' ? 30000 : 15000, // Show longer for alerts
          className: typeStyles[data.type] || typeStyles.ANNOUNCEMENT,
        });

        // Invalidate notifications to show the new broadcast record in history
        dispatch(apiSlice.util.invalidateTags(["Notifications"] as any));
      },

      onError: (error) => {
        console.error("[RealtimeChat] ❗ Error:", error.message);
      },
    };

    // Connect with token from Redux
    connectSocket(accessToken || "", callbacks);

    return () => {
      // Cleanup typing timeouts
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [isAuthenticated, accessToken, dispatch, removeTyping]);

  // Cleanup on full unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
      isConnectedRef.current = false;
    };
  }, []);

  const joinChatRoom = useCallback((chatId: string) => {
    joinChat(chatId);
  }, []);

  const leaveChatRoom = useCallback((chatId: string) => {
    leaveChat(chatId);
  }, []);

  const value: RealtimeChatContextValue = {
    isConnected,
    onlineUsers,
    typingUsers,
    joinChatRoom,
    leaveChatRoom,
  };

  return React.createElement(
    RealtimeChatContext.Provider,
    { value },
    children
  );
}

// ===== Hook to consume context =====

export function useRealtimeChat(): RealtimeChatContextValue {
  return useContext(RealtimeChatContext);
}

// ===== Hook for chat room subscription =====

export function useChatRoom(chatId: string | undefined) {
  const { joinChatRoom, leaveChatRoom, isConnected } = useRealtimeChat();

  useEffect(() => {
    if (!chatId || !isConnected) return;
    joinChatRoom(chatId);
    return () => leaveChatRoom(chatId);
  }, [chatId, joinChatRoom, leaveChatRoom, isConnected]);
}

// ===== Hook for typing users in a specific chat =====

export function useTypingUsers(chatId: string): TypingUser[] {
  const { typingUsers } = useRealtimeChat();
  return typingUsers.get(chatId) || [];
}

// ===== Hook for online status of a specific user =====

export function useIsUserOnline(userId: string | undefined): boolean {
  const { onlineUsers } = useRealtimeChat();
  if (!userId) return false;
  return onlineUsers.has(userId);
}
