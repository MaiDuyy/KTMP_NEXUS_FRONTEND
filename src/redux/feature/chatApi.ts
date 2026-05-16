// src/redux/feature/chatApi.ts
// API endpoints cho Chat system

import { apiSlice } from "../api/baseApi";
import {
  ChatsResponse,
  ChatDetailsResponse,
  Chat,
  ChatDetails,
  ChatParticipant,
} from "@/src/type/chat.types";

// ===== Helper: Resolve displayName & displayAvatar from participants =====

/** Get current userId from localStorage (set by auth) */
function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.id || null;
    }
  } catch {}
  return null;
}

/** Find the "other" participant in a 1-1 chat */
function findPartner(participants: ChatParticipant[], currentUserId: string | null): ChatParticipant | null {
  if (!participants || participants.length === 0) return null;
  if (!currentUserId) return participants[0] || null;
  return participants.find((p) => p.accountId !== currentUserId) || participants[0] || null;
}

/** Enrich a Chat object with displayName & displayAvatar */
function enrichChat(chat: Chat): Chat {
  const currentUserId = getCurrentUserId();
  if (!chat.isGroup) {
    const partner = findPartner(chat.participants, currentUserId);
    return {
      ...chat,
      // For 1-1 chats: override name/avatar with partner's info
      name: partner?.name || chat.name || "Unknown User",
      avatar: partner?.avatar || chat.avatar,
    };
  }
  return chat;
}

/** Enrich a ChatDetails object with displayName & displayAvatar */
function enrichChatDetails(chat: ChatDetails): ChatDetails {
  const currentUserId = getCurrentUserId();
  if (!chat.isGroup) {
    const partner = findPartner(chat.participants, currentUserId);
    return {
      ...chat,
      name: partner?.name || chat.name || "Unknown User",
      avatar: partner?.avatar || chat.avatar,
    };
  }
  return chat;
}

export const chatApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Lấy tổng số tin nhắn chưa đọc theo từng workspace
    getWorkspaceUnreadCounts: builder.query<Record<string, number>, void>({
      query: () => "/chats/unread-counts",
      transformResponse: (response: { success: boolean; counts: Record<string, number> }) => response.counts || {},
      providesTags: ["WorkspaceUnreadCounts" as any],
    }),

    // Lấy danh sách chat
    getChats: builder.query<ChatsResponse, { type?: "all" | "private" | "group"; workspaceId?: string | null } | void>({
      query: (params) => ({
        url: "/chats",
        params: params || {},
      }),
      transformResponse: (response: ChatsResponse, _meta, _arg) => {
        // Pre-compute displayName & displayAvatar, then sort by latest activity
        const enriched = response.chats?.map((chat) => enrichChat(chat)) || [];
        const sorted = [...enriched].sort((a, b) => {
          const aTime = a.lastMessage?.time || a.updatedAt || "";
          const bTime = b.lastMessage?.time || b.updatedAt || "";
          return bTime.localeCompare(aTime);
        });
        return { ...response, chats: sorted };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.chats.map(({ id }) => ({ type: "Chats" as const, id })),
              { type: "Chats", id: "LIST" },
            ]
          : [{ type: "Chats", id: "LIST" }],
    }),

    // Lấy chi tiết chat
    getChatById: builder.query<ChatDetailsResponse, string>({
      query: (chatId) => `/chats/${chatId}`,
      transformResponse: (response: ChatDetailsResponse) => {
        return {
          ...response,
          chat: enrichChatDetails(response.chat),
        };
      },
      providesTags: (_result, _error, chatId) => [{ type: "Chats", id: chatId }],
    }),

    // Tạo hoặc lấy chat 1-1
    getOrCreatePrivateChat: builder.mutation<{ chat: Chat; created: boolean }, { partnerId: string }>({
      query: (body) => ({
        url: "/chats/private",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),

    // Tạo nhóm chat
    createGroupChat: builder.mutation<{ message: string; chat: Chat }, { name: string; avatar?: string; memberIds: string[]; joinPolicy?: string }>({
      query: (body) => ({
        url: "/chats/group",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),

    // Cập nhật nhóm
    updateChat: builder.mutation<{ message: string; chat: Chat }, { chatId: string; name?: string; avatar?: string; joinPolicy?: string; isReadOnly?: boolean }>({
      query: ({ chatId, ...body }) => ({
        url: `/chats/${chatId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chats", id: chatId }],
    }),

    // Xóa chat
    deleteChat: builder.mutation<{ message: string }, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),

    // Thêm thành viên
    addMembers: builder.mutation<{ message: string }, { chatId: string; memberIds: string[] }>({
      query: ({ chatId, memberIds }) => ({
        url: `/chats/${chatId}/members`,
        method: "POST",
        body: { memberIds },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chats", id: chatId }],
    }),

    // Xóa thành viên
    removeChatMember: builder.mutation<{ message: string }, { chatId: string; memberId: string }>({
      query: ({ chatId, memberId }) => ({
        url: `/chats/${chatId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chats", id: chatId }],
    }),
    
    // Cập nhật quyền thành viên
    updateChatMemberRole: builder.mutation<{ message: string }, { chatId: string; memberId: string; role: string }>({
        query: ({ chatId, memberId, role }) => ({
            url: `/chats/${chatId}/members/${memberId}/role`,
            method: "PUT",
            body: { role },
        }),
        invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chats", id: chatId }],
    }),

    // Rời nhóm
    leaveChat: builder.mutation<{ message: string }, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}/leave`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),

    // Ghim/bỏ ghim chat
    togglePinChat: builder.mutation<{ message: string; pin: boolean }, { chatId: string; pin?: boolean }>({
      query: ({ chatId, pin }) => ({
        url: `/chats/${chatId}/pin`,
        method: "PUT",
        body: { pin },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Chats", id: chatId },
        { type: "Chats", id: "LIST" },
      ],
    }),

    // Bật/tắt thông báo
    toggleNotifyChat: builder.mutation<{ message: string; notify: boolean }, { chatId: string; notify?: boolean }>({
      query: ({ chatId, notify }) => ({
        url: `/chats/${chatId}/notify`,
        method: "PUT",
        body: { notify },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chats", id: chatId }],
    }),

    // Đánh dấu đã đọc
    markChatAsRead: builder.mutation<{ message: string }, string>({
      query: (chatId) => ({
        url: `/chats/${chatId}/read`,
        method: "PUT",
      }),
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        // Optimistic update cho danh sách chat (cả group và private)
        const patchGroup = dispatch(
          chatApi.util.updateQueryData("getChats" as any, { type: "group" }, (draft: any) => {
            const chat = draft.chats?.find((c: any) => c.id === chatId);
            if (chat) {
              chat.unreadCount = 0;
              chat.readed = true;
            }
          })
        );
        const patchPrivate = dispatch(
          chatApi.util.updateQueryData("getChats" as any, { type: "private" }, (draft: any) => {
            const chat = draft.chats?.find((c: any) => c.id === chatId);
            if (chat) {
              chat.unreadCount = 0;
              chat.readed = true;
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchGroup.undo();
          patchPrivate.undo();
        }
      },
      invalidatesTags: (_result, _error, chatId) => [
        { type: "Chats", id: chatId },
        "WorkspaceUnreadCounts" as any
      ],
    }),

    // Lấy danh sách Read Receipts của chat
    getChatReadReceipts: builder.query<any[], string>({
      query: (chatId) => `/chats/${chatId}/receipts`,
      transformResponse: (response: { success: boolean; receipts: any[] }) => response.receipts || [],
      providesTags: (result, _error, chatId) => 
        result 
          ? [...result.map(({ userId }) => ({ type: "ReadReceipts" as const, id: `${chatId}-${userId}` })), { type: "ReadReceipts", id: chatId }]
          : [{ type: "ReadReceipts", id: chatId }],
    }),

    // Get LiveKit Token for calls
    getLiveKitToken: builder.mutation<{ success: boolean; token: string }, string>({
      query: (chatId) => `/chats/${chatId}/call/token`,
    }),

    // Join Group (Public/Approval)
    joinGroup: builder.mutation<{ status: string }, string>({
        query: (chatId) => ({
            url: `/chats/${chatId}/join`,
            method: "POST",
        }),
        invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),

    // Approve Join Request
    approveJoinRequest: builder.mutation<{ success: boolean }, { chatId: string; targetAccountId: string; approve: boolean }>({
        query: ({ chatId, targetAccountId, approve }) => ({
            url: `/chats/${chatId}/join-requests/${targetAccountId}/approve`,
            method: "POST",
            body: { approve },
        }),
        invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chats", id: chatId }],
    }),

    // Get Tasks
    getTasks: builder.query<{ success: boolean; tasks: any[] }, string>({
        query: (chatId) => `/chats/${chatId}/tasks`,
        providesTags: (_result, _error, chatId) => [{ type: "Tasks" as any, id: chatId }],
    }),

    // Create Task
    createTask: builder.mutation<any, { chatId: string; title: string; description?: string; deadlineAt?: string; startAt?: string; assigneeIds?: string[] }>({
        query: ({ chatId, ...body }) => ({
            url: `/chats/${chatId}/tasks`,
            method: "POST",
            body,
        }),
        invalidatesTags: (_result, _error, { chatId }) => [{ type: "Tasks" as any, id: chatId }],
    }),

    // Update Task Status
    updateTaskStatus: builder.mutation<any, { taskId: string; status: string; chatId: string }>({
        query: ({ taskId, status }) => ({
            url: `/chats/tasks/${taskId}/status`,
            method: "PATCH",
            body: { status },
        }),
        invalidatesTags: (_result, _error, { chatId }) => [{ type: "Tasks" as any, id: chatId }],
    // Delete Task
  
    }),

      deleteTask: builder.mutation<any, { taskId: string; chatId: string }>({
        query: ({ taskId, chatId }) => ({
            url: `/chats/tasks/${taskId}?chatId=${chatId}`,
            method: "DELETE",
        }),
        invalidatesTags: (_result, _error, { chatId }) => [{ type: "Tasks" as any, id: chatId }],
            }),
  }),
});

export const {
  useGetWorkspaceUnreadCountsQuery,
  useGetChatsQuery,
  useGetChatByIdQuery,
  useGetOrCreatePrivateChatMutation,
  useCreateGroupChatMutation,
  useUpdateChatMutation,
  useDeleteChatMutation,
  useAddMembersMutation,
  useRemoveChatMemberMutation,
  useUpdateChatMemberRoleMutation,
  useLeaveChatMutation,
  useTogglePinChatMutation,
  useToggleNotifyChatMutation,
  useMarkChatAsReadMutation,
  useGetChatReadReceiptsQuery,
  useGetLiveKitTokenMutation,
  useJoinGroupMutation,
  useApproveJoinRequestMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} = chatApi;
