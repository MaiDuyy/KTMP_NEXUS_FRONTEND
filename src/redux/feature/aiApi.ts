import { apiSlice } from '../api/baseApi';

// Types
export interface Citation {
  documentId: string;
  title: string;
  classification: string;
  sourceType: string;
  section?: string;
  relevanceScore: number;
  chunk?: string;
  /** Wiki slug — nếu có, CitationList sẽ link tới /wiki/[slug] */
  slug?: string;
}

export interface Conversation {
  id: number;
  userId: string;
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  sources?: string;
  responseTime?: number;
  createdAt: string;
}

export interface ConversationRequest {
  title: string;
  chatId: string;
}

export interface ChatRequest {
  message: string;
  conversationId: number;
}

// AI API Slice
export const aiApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============= CONVERSATIONS (Spring Chat) =============
    getConversations: builder.query<Conversation[], void>({
      query: () => '/chat/conversations',
      providesTags: ['AIHistory'],
    }),

    createConversation: builder.mutation<Conversation, ConversationRequest>({
      query: (body) => ({
        url: '/chat/conversations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AIHistory'],
    }),

    getConversationMessages: builder.query<ChatMessage[], number>({
      query: (conversationId) => `/chat/conversations/${conversationId}/messages`,
      providesTags: ['AIHistory'],
    }),

    chatWithRag: builder.mutation<ChatMessage, ChatRequest>({
      query: (body) => ({
        url: '/chat/messages',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AIHistory'],
    }),

    deleteConversation: builder.mutation<void, number>({
      query: (id) => ({
        url: `/chat/conversations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AIHistory'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useCreateConversationMutation,
  useGetConversationMessagesQuery,
  useDeleteConversationMutation,
  useChatWithRagMutation,
} = aiApi;
