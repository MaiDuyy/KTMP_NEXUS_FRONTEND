// src/redux/feature/messageApi.ts
// API endpoints cho Message system

import { apiSlice } from "../api/baseApi";
import {
  MessagesResponse,
  Message,
  SendMessageRequest,
} from "@/src/type/chat.types";

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

export const messageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy tin nhắn
    // Real-time updates handled by RealtimeChatProvider invalidating "Messages" tags
    getMessages: builder.query<MessagesResponse, { chatId: string; cursor?: string; limit?: number }>({
      query: ({ chatId, cursor, limit }) => ({
        url: `/messages/${chatId}`,
        params: { cursor, limit },
      }),
      transformResponse: (response: MessagesResponse) => {
        const currentUserId = getCurrentUserId();
        return {
          ...response,
          messages: response.messages.map(m => ({
            ...m,
            isMe: m.senderId === currentUserId || m.sender?.id === currentUserId
          }))
        };
      },
      providesTags: (_result, _error, { chatId }) => [{ type: "Messages", id: chatId }],
    }),


    // Gửi tin nhắn
    sendMessage: builder.mutation<{ message: Message }, { chatId: string; data: SendMessageRequest }>({
      query: ({ chatId, data }) => ({
        url: `/messages/${chatId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Messages", id: chatId },
        "Chats",
      ],
    }),

    // Tìm kiếm tin nhắn
    searchMessages: builder.query<{ messages: Message[] }, { chatId: string; q: string }>({
      query: ({ chatId, q }) => `/messages/${chatId}/search?q=${encodeURIComponent(q)}`,
    }),

    // Lấy media
    getMediaMessages: builder.query<{ media: Message[] }, { chatId: string; type?: "image" | "video" | "file" | "all" }>({
      query: ({ chatId, type }) => ({
        url: `/messages/${chatId}/media`,
        params: { type },
      }),
    }),

    // Lấy tin nhắn đã ghim
    getPinnedMessages: builder.query<{ pinnedMessages: Message[] }, string>({
      query: (chatId) => `/messages/${chatId}/pinned`,
      providesTags: (_result, _error, chatId) => [{ type: "PinnedMessages", id: chatId }],
    }),

    // Xóa tin nhắn cho mình
    deleteMessageForMe: builder.mutation<{ message: string }, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}`,
        method: "DELETE",
      }),
    }),

    // Thu hồi tin nhắn
    recallMessage: builder.mutation<{ message: string }, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}/recall`,
        method: "DELETE",
      }),
    }),

    reactMessage: builder.mutation<{ message: string; action: string; emoji?: string }, { messageId: string; emoji: string; chatId: string }>({
      query: ({ messageId, emoji }) => ({
        url: `/messages/${messageId}/react`,
        method: "POST",
        body: { emoji },
      }),
      async onQueryStarted({ messageId, emoji, chatId }, { dispatch, queryFulfilled }) {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) return;

        const updateArgs = [{ chatId, limit: 50 }, { chatId }];
        const patches = updateArgs.map(args => 
          dispatch(
            messageApi.util.updateQueryData("getMessages", args as any, (draft) => {
              if (draft && draft.messages) {
                const msg = draft.messages.find((m) => m.id === messageId);
                if (msg) {
                  if (!msg.reactions) msg.reactions = [];
                  const existIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
                  
                  if (existIdx !== -1) {
                    const reaction = msg.reactions[existIdx];
                    if (!reaction.users) reaction.users = [];
                    const userIdx = reaction.users.findIndex(u => u.id === currentUserId);
                    
                    if (userIdx === -1) {
                      reaction.users.push({ id: currentUserId, name: "Me" });
                    }
                    reaction.count++;
                  } else {
                    // Create new emoji group
                    msg.reactions.push({
                      emoji,
                      count: 1,
                      users: [{ id: currentUserId, name: "Me" }]
                    });
                  }
                }
              }
            })
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach(patch => patch.undo());
        }
      },
    }),

    // Ghim/bỏ ghim tin nhắn
    togglePinMessage: builder.mutation<{ message: string; pin: boolean }, { messageId: string; chatId: string }>({
      query: ({ messageId }) => ({
        url: `/messages/${messageId}/pin`,
        method: "PUT",
      }),
      async onQueryStarted({ messageId, chatId }, { dispatch, queryFulfilled }) {
        const updateArgs = [
          { chatId, limit: 50 },
          { chatId }
        ];

        const patches = updateArgs.map(args => 
          dispatch(
            messageApi.util.updateQueryData("getMessages", args as any, (draft) => {
              if (draft && draft.messages) {
                const msg = draft.messages.find((m) => m.id === messageId);
                if (msg) {
                  msg.pin = !msg.pin; // Optimistically toggle
                }
              }
            })
          )
        );

        try {
          await queryFulfilled;
          // Successfully updated on server
          dispatch(apiSlice.util.invalidateTags([{ type: "PinnedMessages", id: chatId }]));
        } catch {
          // If error, rollback patches
          patches.forEach(patch => patch.undo());
        }
      },
    }),

    // Chuyển tiếp tin nhắn (Backend Alignment)
    forwardMessage: builder.mutation<{ message: Message }, { targetChatId: string; originalMessageId: string }>({
      query: ({ targetChatId, originalMessageId }) => ({
        url: `/messages/forward`,
        method: "POST",
        body: { targetChatId, originalMessageId },
      }),
      invalidatesTags: (_result, _error, { targetChatId }) => [
        { type: "Messages", id: targetChatId },
        "Chats",
      ],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useSearchMessagesQuery,
  useLazySearchMessagesQuery,
  useGetMediaMessagesQuery,
  useGetPinnedMessagesQuery,
  useDeleteMessageForMeMutation,
  useRecallMessageMutation,
  useReactMessageMutation,
  useTogglePinMessageMutation,
  useForwardMessageMutation,
} = messageApi;
