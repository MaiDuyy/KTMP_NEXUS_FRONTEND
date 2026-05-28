// src/services/socket.service.ts
// Socket.IO client service

import { io, Socket } from "socket.io-client";
import { Message, TypingEvent, MessageReadEvent, UserOnlineEvent, MessageReactedEvent, Notification } from "@/src/type/chat.types";

// Event types cho recalled và pinned
export interface MessageRecalledEvent {
  id: string;
  messageId: string;
  chatId: string;
  userId: string;
  userName: string;
}

export interface MessagePinnedEvent {
  id: string ;
  messageId: string;
  chatId: string;
  pin: boolean;
  userId: string;
  userName: string;
}

export interface MessageBlockedEvent {
  chatId: string;
  isBlockedByMe: boolean;
  message: string;
}

// Friend events
export interface FriendRequestReceivedEvent {
  id: string;
  sender: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

export interface FriendRequestAcceptedEvent {
  friendId: string;
  user: { id: string; name: string; avatar: string | null };
  chatId: string;
  createdAt: string;
}

export interface FriendUnfriendedEvent {
  friendId: string;
}
export interface FriendRequestRejectedEvent {
  requestId: string;
  receiverId: string;
}
export interface FriendRequestCancelledEvent {
  requestId: string;
  senderId: string;
}
export interface FriendBlockedEvent {
  blockedId?: string;
  blockerId?: string;
}
export interface FriendUnblockedEvent {
  blockedId: string;
}

// Document events
export interface DocumentStatusChangedEvent {
  documentId: number;
  status: string;
}

export interface CompilationPlanStatusChangedEvent {
  planId: number;
  sourceDocumentId: number;
  status: string;
  workspaceId: string;
}

export interface WikiDraftStatusChangedEvent {
  draftId: number;
  title: string;
  slug: string;
  status: string;
  workspaceId: string;
}

// Socket URL - từ environment variable
const getSocketUrl = (): string => {
  return process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
};

let socket: Socket | null = null;
const messageListeners: Set<(data: { message: Message; chatId: string; tempId?: string; workspaceId?: string }) => void> = new Set();


export interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: (attempt: number) => void;
  onNewMessage?: (data: { message: Message; chatId: string; tempId?: string; workspaceId?: string }) => void;
  onTypingStart?: (data: TypingEvent) => void;
  onTypingStop?: (data: { chatId: string; userId: string }) => void;
  onMessageRead?: (data: MessageReadEvent) => void;
  onMessageReacted?: (data: MessageReactedEvent) => void;
  onMessageRecalled?: (data: MessageRecalledEvent) => void;
  onMessagePinned?: (data: MessagePinnedEvent) => void;
  onMessageBlocked?: (data: MessageBlockedEvent) => void;
  onUserOnline?: (data: UserOnlineEvent) => void;
  onUserOffline?: (data: UserOnlineEvent) => void;
  onUsersOnline?: (data: { userIds: string[] }) => void;
  onInitialOnlineUsers?: (userIds: string[]) => void;
  onNotification?: (data: Notification) => void;
  onMention?: (data: any) => void;
  onMentionBroadcast?: (data: any) => void;
  onError?: (error: { message: string }) => void;
  // Friend events
  onFriendRequestReceived?: (data: FriendRequestReceivedEvent) => void;
  onFriendRequestSent?: (data: { requestId: string; receiverId: string }) => void;
  onFriendRequestAccepted?: (data: FriendRequestAcceptedEvent) => void;
  onFriendUnfriended?: (data: FriendUnfriendedEvent) => void;
  onFriendRequestRejected?: (data: FriendRequestRejectedEvent) => void;
  onFriendRequestCancelled?: (data: FriendRequestCancelledEvent) => void;
  onFriendBlocked?: (data: FriendBlockedEvent) => void;
  onFriendUnblocked?: (data: FriendUnblockedEvent) => void;
  onUserAvatarUpdated?: (data: { userId: string; avatar: string }) => void;
  onChatDeleted?: (data: { chatId: string }) => void;
  onChatMemberRemoved?: (data: { chatId: string; isSelfLeave: boolean }) => void;
  onChatMemberUpdated?: (data: { chatId: string; memberId: string; action: string; newRole?: string }) => void;
  onChatRoleUpdated?: (data: { chatId: string; memberId: string; newRole: string }) => void;
  onChatUpdated?: (data: { chatId: string; [key: string]: any }) => void;
  onChatNew?: (data: { chatId: string; [key: string]: any }) => void;
  onChannelNew?: (data: { workspaceId: string; channel: any }) => void;
  onChannelUpdated?: (data: { channelId: string; workspaceId: string; [key: string]: any }) => void;
  onChannelDeleted?: (data: { channelId: string; workspaceId: string }) => void;
  onChannelMemberUpdated?: (data: { channelId: string; userId: string; action: string }) => void;
  onChannelMemberRemoved?: (data: { channelId: string; userId: string }) => void;
  onChannelArchived?: (data: { channelId: string; workspaceId: string }) => void;
  onJoinRequestNew?: (data: { chatId: string; accountId: string; requestId: string }) => void;
  onJoinRequestUpdated?: (data: { chatId: string; accountId: string; status: string }) => void;
  onTaskNew?: (data: { chatId: string; [key: string]: any }) => void;
  onTaskUpdated?: (data: { chatId: string; taskId: string; [key: string]: any }) => void;
  onTaskDeleted?: (data: { chatId: string; taskId: string; [key: string]: any }) => void;
  onDocumentStatusChanged?: (data: DocumentStatusChangedEvent) => void;
  onCompilationPlanStatusChanged?: (data: CompilationPlanStatusChangedEvent) => void;
  onWikiDraftStatusChanged?: (data: WikiDraftStatusChangedEvent) => void;
  onChatCallStatus?: (data: { chatId: string; roomName: string | null; isActive: boolean; [key: string]: any }) => void;
  onPollUpdated?: (data: { chatId: string; pollId: string; options: any[]; totalVotes: number; endsAt?: string | null; isExpired?: boolean }) => void;
  onCallActiveStatus?: (data: { chatId: string; isActive: boolean; roomName?: string; [key: string]: any }) => void;
  onWorkspaceInvite?: (data: { workspaceName: string; role: string; token: string; inviterId: string; timestamp: string }) => void;
  onWorkspaceDissolved?: (data: { workspaceId: string; dissolvedBy: string }) => void;
  onWorkspaceRestored?: (data: { workspaceId: string; restoredBy: string }) => void;
  onWorkspaceMemberLeft?: (data: { workspaceId: string; userId: string; reason: string; kickedBy?: string }) => void;
  onWorkspaceMemberUpdated?: (data: { workspaceId: string; userId: string; action: string; role?: string; reason?: string }) => void;
  onWorkspaceDeleted?: (data: { workspaceId: string }) => void;
  onWorkspaceInviteRejected?: (data: { workspaceId: string; email: string }) => void;
  onWorkspaceInviteAccepted?: (data: { workspaceId: string; userId: string }) => void;
  onWorkspaceInviteCancelled?: (data: { workspaceId: string }) => void;
  onWorkspaceOwnerTransferred?: (data: { workspaceId: string; oldOwnerId: string; newOwnerId: string }) => void;
  onWorkspaceUpdated?: (data: { workspaceId: string; updates: { name?: string; description?: string; icon?: string; isPublic?: boolean }; updatedBy?: string }) => void;
  onSystemBroadcast?: (data: { title: string; body: string; type: string; data?: any; timestamp: string }) => void;
  onIncomingCall?: (data: any) => void;
  onCallRinging?: (data: any) => void;
  onCallStartInfo?: (data: any) => void;
  onCallDeclined?: (data: any) => void;
  onCallEnded?: (data: any) => void;
  onCallBusy?: (data: any) => void;
  onCallActiveSync?: (data: any) => void;
  onDepartmentMemberAdded?: (data: { departmentId: string; userId: string; role: string }) => void;
  onDepartmentMemberRemoved?: (data: { departmentId: string; userId: string }) => void;
}

// Kết nối socket
export const connectSocket = (token: string, callbacks?: SocketCallbacks): Socket => {
  // Ngắt kết nối cũ nếu có
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const socketUrl = getSocketUrl();
  console.log("[Socket] Connecting to:", socketUrl);
  console.log("[Socket] Token (first 20 chars):", token?.substring(0, 20) + "...");

  // Kết nối đến root namespace "/"
  socket = io(socketUrl, {
    path: "/socket.io", // Đường dẫn mặc định của Socket.IO
    auth: { token }, // Keep for fallback if backend checks it occasionally, though usually unused with HttpOnly
    withCredentials: true, // IMPORTANT for HttpOnly cookie passing
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity, // Thử lại vô hạn lần
    reconnectionDelay: 1000, // Thời gian chờ ban đầu giữa các lần thử
    reconnectionDelayMax: 5000, // Thời gian chờ tối đa
    randomizationFactor: 0.5,
    timeout: 60000, // Tăng timeout để tránh lỗi trong mạng chậm
    forceNew: true, // Tạo kết nối mới
  });

  // Event handlers
  socket.on("connect", () => {
    console.log("[Socket] ✅ Connected:", socket?.id);
    callbacks?.onConnect?.();
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] ❌ Disconnected:", reason);
    callbacks?.onDisconnect?.();
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] ⚠️ Connection error:", error.message);
    if (error.message === 'xhr poll error') {
      console.error("[Socket] ⚠️ Network error - is the server running at", socketUrl, "?");
    }
    if (error.message === 'Authentication required' || error.message === 'jwt malformed') {
      console.error("[Socket] ⚠️ Auth error - please check your token or login again.");
    }
    callbacks?.onError?.({ message: error.message });
  });

  socket.on("reconnect", (attempt) => {
    console.log("[Socket] 🔄 Reconnected after", attempt, "attempts");
    callbacks?.onReconnect?.(attempt);
  });

  socket.on("reconnect_error", (error) => {
    console.error("[Socket] ⚠️ Reconnect error:", error.message);
  });

  // Message events
  socket.on("message:new", (data) => {
    console.log("[Socket] 📩 New message:", data);
    callbacks?.onNewMessage?.(data);
    messageListeners.forEach((l) => l(data));
  });


  // Typing events
  socket.on("typing:start", (data) => {
    console.log("[Socket] ⌨️ Typing start:", data);
    callbacks?.onTypingStart?.(data);
  });

  socket.on("typing:stop", (data) => {
    console.log("[Socket] ⌨️ Typing stop:", data);
    callbacks?.onTypingStop?.(data);
  });

  // Read events
  socket.on("message:read", (data) => {
    console.log("[Socket] 👁️ Message read:", data);
    callbacks?.onMessageRead?.(data);
  });

  // Reaction events
  socket.on("message:reacted", (data) => {
    console.log("[Socket] ❤️ Message reacted:", data);
    callbacks?.onMessageReacted?.(data);
  });

  // Recalled events
  socket.on("message:recalled", (data) => {
    console.log("[Socket] 🔄 Message recalled:", data);
    callbacks?.onMessageRecalled?.(data);
  });

  // Pinned events
  socket.on("message:pinned", (data) => {
    console.log("[Socket] 📌 Message pinned:", data);
    callbacks?.onMessagePinned?.(data);
  });

  // Online/Offline events
  socket.on("user:online", (data) => {
    console.log("[Socket] 🟢 User online:", data);
    callbacks?.onUserOnline?.(data);
  });

  socket.on("user:offline", (data) => {
    console.log("[Socket] 🔴 User offline:", data);
    callbacks?.onUserOffline?.(data);
  });

  socket.on("user:avatar:updated", (data) => {
    console.log("[Socket] 👤 User avatar updated:", data);
    callbacks?.onUserAvatarUpdated?.(data);
  });

  // Danh sách users online (nhận khi connect)
  socket.on("users:online", (data) => {
    console.log("[Socket] 📋 Online users list:", data);
    callbacks?.onUsersOnline?.(data);
  });

  socket.on("notification:new", (data) => {
    console.log("[Socket] 🔔 New notification:", data);
    callbacks?.onNotification?.(data);
  });

  socket.on("mention:new", (data) => {
    console.log("[Socket] @ New mention:", data);
    callbacks?.onMention?.(data);
  });

  socket.on("mention:broadcast", (data) => {
    console.log("[Socket] @ Mention broadcast:", data);
    callbacks?.onMentionBroadcast?.(data);
  });

  // Error events
  socket.on("error", (data) => {
    console.error("[Socket] ❗ Error:", data);
    callbacks?.onError?.(data);
  });

  // Blocked message events
  socket.on("message:blocked", (data) => {
    console.log("[Socket] 🚫 Message blocked:", data);
    callbacks?.onMessageBlocked?.(data);
  });

  socket.on("friend:request:received", (data) => {
    console.log("[Socket] 👥 Friend request received:", data);
    callbacks?.onFriendRequestReceived?.(data);
  });

  socket.on("friend:request:sent", (data) => {
    console.log("[Socket] 📤 Friend request sent (sync other tabs):", data);
    callbacks?.onFriendRequestSent?.(data);
  });

  socket.on("friend:request:accepted", (data) => {
    console.log("[Socket] ✅ Friend request accepted:", data);
    callbacks?.onFriendRequestAccepted?.(data);
  });

  socket.on("friend:unfriended", (data) => {
    console.log("[Socket] ❌ Friend unfriended:", data);
    callbacks?.onFriendUnfriended?.(data);
  });

  socket.on("friend:request:rejected", (data) => {
    console.log("[Socket] 🚫 Friend request rejected:", data);
    callbacks?.onFriendRequestRejected?.(data);
  });

  socket.on("friend:request:cancelled", (data) => {
    console.log("[Socket] ↩️ Friend request cancelled:", data);
    callbacks?.onFriendRequestCancelled?.(data);
  });

  socket.on("friend:blocked", (data) => {
    console.log("[Socket] 🚫 User blocked:", data);
    callbacks?.onFriendBlocked?.(data);
  });

  socket.on("friend:unblocked", (data) => {
    console.log("[Socket] ✅ User unblocked:", data);
    callbacks?.onFriendUnblocked?.(data);
  });

  // Group lifecycle events
  socket.on("chat:deleted", (data) => {
    console.log("[Socket] 🗑️ Chat deleted:", data);
    callbacks?.onChatDeleted?.(data);
  });

  socket.on("chat:member_removed", (data) => {
    console.log("[Socket] 🚪 Member removed from chat:", data);
    callbacks?.onChatMemberRemoved?.(data);
  });

  socket.on("chat:member_updated", (data) => {
    console.log("[Socket] 👥 Chat member updated:", data);
    callbacks?.onChatMemberUpdated?.(data);
  });

  socket.on("chat:role_updated", (data) => {
    console.log("[Socket] 🛡️ Member role updated:", data);
    callbacks?.onChatRoleUpdated?.(data);
  });
  
  socket.on("chat:updated", (data) => {
    console.log("[Socket] 🔄 Chat updated:", data);
    callbacks?.onChatUpdated?.(data);
  });

  socket.on("chat:new", (data) => {
    console.log("[Socket] ✨ New chat created:", data);
    callbacks?.onChatNew?.(data);
  });

  // Channel lifecycle events
  socket.on("channel:new", (data) => {
    console.log("[Socket] 📣 Channel created:", data);
    callbacks?.onChannelNew?.(data);
  });

  socket.on("channel:updated", (data) => {
    console.log("[Socket] 🔄 Channel updated:", data);
    callbacks?.onChannelUpdated?.(data);
  });

  socket.on("channel:deleted", (data) => {
    console.log("[Socket] 🗑️ Channel deleted:", data);
    callbacks?.onChannelDeleted?.(data);
  });

  socket.on("channel:member_updated", (data) => {
    console.log("[Socket] 👥 Channel member updated:", data);
    callbacks?.onChannelMemberUpdated?.(data);
  });

  socket.on("channel:member_removed", (data) => {
    console.log("[Socket] 🚪 Channel member removed:", data);
    callbacks?.onChannelMemberRemoved?.(data);
  });

  socket.on("channel:archived", (data) => {
    console.log("[Socket] 📦 Channel archived:", data);
    callbacks?.onChannelArchived?.(data);
  });

  socket.on("chat:join_request:new", (data) => {
    console.log("[Socket] 📩 New join request:", data);
    callbacks?.onJoinRequestNew?.(data);
  });

  socket.on("chat:join_request:updated", (data) => {
    console.log("[Socket] ✅ Join request updated:", data);
    callbacks?.onJoinRequestUpdated?.(data);
  });

  socket.on("task:new", (data) => {
    console.log("[Socket] ✅ New task created:", data);
    callbacks?.onTaskNew?.(data);
  });

  socket.on("task:updated", (data) => {
    console.log("[Socket] ✅ Task updated:", data);
    callbacks?.onTaskUpdated?.(data);
  });

  socket.on("task:deleted", (data) => {
    console.log("[Socket] 🗑️ Task deleted:", data);
    callbacks?.onTaskDeleted?.(data);
  });

  socket.on("document:status_changed", (data) => {
    console.log("[Socket] 📄 Document status changed:", data);
    callbacks?.onDocumentStatusChanged?.(data);
  });

  socket.on("compilation_plan:status_changed", (data) => {
    console.log("[Socket] 📋 Compilation plan status changed:", data);
    callbacks?.onCompilationPlanStatusChanged?.(data);
  });

  socket.on("wiki_draft:status_changed", (data) => {
    console.log("[Socket] 📄 Wiki draft status changed:", data);
    callbacks?.onWikiDraftStatusChanged?.(data);
  });

  socket.on("chat:call_status", (data) => {
    console.log("[Socket] 📞 Chat call status changed:", data);
    callbacks?.onChatCallStatus?.(data);
  });

  socket.on("poll:updated", (data) => {
    console.log("[Socket] 📊 Poll updated:", data);
    callbacks?.onPollUpdated?.(data);
  });

  socket.on("call:active_status", (data) => {
    console.log("[Socket] 📞 Call active status received:", data);
    callbacks?.onCallActiveStatus?.(data);
  });

  socket.on("workspace:invite:new", (data) => {
    console.log("[Socket] 🏢 New workspace invite:", data);
    callbacks?.onWorkspaceInvite?.(data);
  });

  socket.on("workspace:dissolved", (data) => {
    console.log("[Socket] 🏢 Workspace dissolved:", data);
    callbacks?.onWorkspaceDissolved?.(data);
  });

  socket.on("workspace:restored", (data) => {
    console.log("[Socket] 🏢 Workspace restored:", data);
    callbacks?.onWorkspaceRestored?.(data);
  });

  socket.on("workspace:member:left", (data) => {
    console.log("[Socket] 🚪 Left/Kicked from workspace:", data);
    callbacks?.onWorkspaceMemberLeft?.(data);
  });

  socket.on("workspace:member:updated", (data) => {
    console.log("[Socket] 👥 Workspace member updated:", data);
    callbacks?.onWorkspaceMemberUpdated?.(data);
  });

  socket.on("workspace:deleted", (data) => {
    console.log("[Socket] 🗑️ Workspace deleted:", data);
    callbacks?.onWorkspaceDeleted?.(data);
  });

  socket.on("workspace:invite:rejected", (data) => {
    console.log("[Socket] 🚫 Workspace invite rejected:", data);
    callbacks?.onWorkspaceInviteRejected?.(data);
  });

  socket.on("workspace:invite:accepted", (data) => {
    console.log("[Socket] ✅ Workspace invite accepted:", data);
    callbacks?.onWorkspaceInviteAccepted?.(data);
  });

  socket.on("workspace:invite:cancelled", (data) => {
    console.log("[Socket] ↩️ Workspace invite cancelled:", data);
    callbacks?.onWorkspaceInviteCancelled?.(data);
  });

  socket.on("workspace:owner:transferred", (data) => {
    console.log("[Socket] 👑 Workspace owner transferred:", data);
    callbacks?.onWorkspaceOwnerTransferred?.(data);
  });

  socket.on("workspace:updated", (data) => {
    console.log("[Socket] 🔄 Workspace updated:", data);
    callbacks?.onWorkspaceUpdated?.(data);
  });
  
  socket.on("system:broadcast", (data) => {
    console.log("[Socket] 📢 System broadcast:", data);
    callbacks?.onSystemBroadcast?.(data);
  });

  // Call events
  socket.on("call:incoming", (data) => {
    console.log("[Socket] 📞 Incoming call:", data);
    callbacks?.onIncomingCall?.(data);
  });

  socket.on("call:ringing", (data) => {
    callbacks?.onCallRinging?.(data);
  });

  socket.on("call:start_info", (data) => {
    callbacks?.onCallStartInfo?.(data);
  });

  socket.on("call:declined", (data) => {
    callbacks?.onCallDeclined?.(data);
  });

  socket.on("call:ended", (data) => {
    callbacks?.onCallEnded?.(data);
  });

  socket.on("call:busy", (data) => {
    callbacks?.onCallBusy?.(data);
  });

  socket.on("call:active_sync", (data) => {
    console.log("[Socket] 📞 Received call:active_sync:", data);
    callbacks?.onCallActiveSync?.(data);
  });

  socket.on("department:member_added", (data) => {
    console.log("[Socket] 🏢 Department member added:", data);
    callbacks?.onDepartmentMemberAdded?.(data);
  });

  socket.on("department:member_removed", (data) => {
    console.log("[Socket] 🏢 Department member removed:", data);
    callbacks?.onDepartmentMemberRemoved?.(data);
  });

  return socket;
};

// Ngắt kết nối
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Lấy socket instance
export const getSocket = (): Socket | null => socket;

// Gửi tin nhắn
export const sendMessage = (data: {
  chatId: string;
  content?: string;
  type?: string;
  replyToId?: string;
  tempId?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
}) => {
  socket?.emit("message:send", data);
};

// Bắt đầu gõ
export const startTyping = (chatId: string) => {
  socket?.emit("typing:start", { chatId });
};

// Dừng gõ
export const stopTyping = (chatId: string) => {
  socket?.emit("typing:stop", { chatId });
};

// Đánh dấu đã đọc (Scalable Flow)
export const markRead = (chatId: string, messageId?: string) => {
  socket?.emit("message:mark_as_read", { chatId, messageId });
};

// React tin nhắn
export const reactMessage = (messageId: string, chatId: string, emoji: string) => {
  socket?.emit("message:react", { messageId, chatId, emoji });
};

// Thu hồi tin nhắn
export const recallMessage = (messageId: string, chatId: string) => {
  socket?.emit("message:recall", { messageId, chatId });
};

// Xóa tin nhắn
export const deleteMessage = (messageId: string, chatId: string) => {
  socket?.emit("message:delete", { messageId, chatId });
};

// Ghim/bỏ ghim tin nhắn
export const pinMessage = (messageId: string, chatId: string) => {
  socket?.emit("message:pin", { messageId, chatId });
};

// Join chat room
export const joinChat = (chatId: string) => {
  socket?.emit("chat:join", { chatId });
};

// Leave chat room
export const leaveChat = (chatId: string) => {
  socket?.emit("chat:leave", { chatId });
};

// Check active call status for a specific chat
export const checkCallStatus = (chatId: string) => {
  socket?.emit("call:check", { chatId });
};

// Check if there is ANY active call for the current user (Global Sync)
export const checkActiveCall = () => {
  console.log("[Socket] 📞 Emitting call:check_active for state sync...");
  socket?.emit("call:check_active");
};

// Đăng ký listener cho tin nhắn mới
export const onMessageNew = (listener: (data: { message: Message; chatId: string; tempId?: string }) => void) => {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
};




// ===== AI Assistant (Phase 1) =====

/**
 * Send an AI query to the ws-gateway.
 * The gateway streams tokens back via `ai:thinking`, `ai:token`, `ai:done`, `ai:error`.
 */
export const sendAIQuery = (chatId: string, message: string, conversationId?: number) => {
  socket?.emit('chat:ai_query', { chatId, message, conversationId });
};

// ===== AI Agent (Phase 2 — Tool Calling) =====

/**
 * Send an agent query — Gemini will autonomously call tools (search, summarize, create_task...)
 * before composing a response. Same streaming events as Phase 1 but with mode: 'agent'.
 */
export const sendAgentQuery = (chatId: string, message: string, conversationId?: number, workspaceId?: string) => {
  socket?.emit('chat:agent_query', { chatId, message, conversationId, workspaceId });
};

export const socketService = {
  connectSocket,
  disconnectSocket,
  getSocket,
  sendMessage,
  startTyping,
  stopTyping,
  markRead,
  reactMessage,
  recallMessage,
  pinMessage,
  joinChat,
  leaveChat,
  checkCallStatus,
  checkActiveCall,
  onMessageNew,
  // AI Phase 1
  sendAIQuery,
  // AI Phase 2
  sendAgentQuery,
};

