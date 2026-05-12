import { apiSlice } from '../api/baseApi';

// Types for Thread APIs
export interface ThreadReply {
  id: string;
  parentId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  time: string;
  senderId: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ThreadPreview {
  parentId: string;
  replyCount: number;
  participantCount: number;
  lastReplyAt: string;
  latestReplies: ThreadReply[];
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

export interface PaginatedReplies {
  replies: ThreadReply[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface CreateReplyRequest {
  parentId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

// Thread API Slice
export const threadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create thread reply
    createReply: builder.mutation<ThreadReply, CreateReplyRequest>({
      query: ({ parentId, ...body }) => ({
        url: `/threads/${parentId}`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; reply: ThreadReply }) => response.reply,
      invalidatesTags: (_result, _error, { parentId }) => [{ type: 'Replies', id: parentId }],
    }),

    // Get thread replies with pagination
    getReplies: builder.query<PaginatedReplies, { parentId: string; cursor?: string; limit?: number }>({
      query: ({ parentId, cursor, limit }) => ({
        url: `/threads/${parentId}`,
        params: { cursor, limit },
      }),
      transformResponse: (response: { success: boolean } & PaginatedReplies) => ({
        replies: response.replies,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
        total: response.total,
      }),
      providesTags: (_result, _error, { parentId }) => [{ type: 'Replies', id: parentId }],
    }),

    // Get thread preview (latest 3 replies)
    getThreadPreview: builder.query<ThreadPreview, string>({
      query: (parentId) => `/threads/${parentId}/preview`,
      transformResponse: (response: { success: boolean; preview: ThreadPreview }) => response.preview,
      providesTags: (_result, _error, id) => [{ type: 'Threads', id }],
    }),

    // Get thread participants
    getThreadParticipants: builder.query<{ id: string; name: string; avatar?: string }[], string>({
      query: (parentId) => `/threads/${parentId}/participants`,
      transformResponse: (response: { success: boolean; participants: { id: string; name: string; avatar?: string }[] }) => response.participants,
    }),

    // Get active threads in a chat
    getActiveThreads: builder.query<ThreadPreview[], { chatId: string; limit?: number }>({
      query: ({ chatId, limit }) => ({
        url: `/threads/chat/${chatId}/active`,
        params: { limit },
      }),
      transformResponse: (response: { success: boolean; threads: ThreadPreview[] }) => response.threads,
      providesTags: ['Threads'],
    }),
  }),
});

export const {
  useCreateReplyMutation,
  useGetRepliesQuery,
  useGetThreadPreviewQuery,
  useGetThreadParticipantsQuery,
  useGetActiveThreadsQuery,
} = threadApi;
