// src/redux/feature/knowledgeApi.ts
// Knowledge API endpoints directly wrapping Spring Boot AI microservice response data

import { apiSlice } from '../api/baseApi';

// Wrapper for backend { success: boolean, data: T } responses (or Spring's direct raw structures)
// Note: Some of Spring's APIs might respond with direct arrays/objects without `{success, data}`.
// I'll adjust based on typical Spring vs Node responses. 
// Assuming Spring uses standard raw responses like `ResponseEntity.ok(body)`, no wrapper unwrapping is needed.

// ============= Types matching Spring Boot Entity =============

export interface Document {
  id: number;
  userId: string;
  fileName: string;
  fileSize: number;
  filePath?: string;
  documentType: 'pdf' | 'docx' | 'txt' | string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  errorMessage?: string;
  securityClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id?: number;
  chunkIndex: number;
  chunkTitle: string;
  text: string;
  tokenCount: number;
  charCount: number;
  similarity?: number;
}

export interface DocumentChunksResponse {
  documentId: number;
  fileName: string;
  totalChunks: number;
  chunks: DocumentChunk[];
}

export interface DocumentUploadResponse {
  documentId: number;
  fileName: string;
  status: string;
  message: string;
}

export interface DocumentStatsDTO {
  documentId: number;
  fileName: string;
  status: string;
  totalChunks: number;
  totalTokens: number;
  totalCharacters: number;
  avgTokensPerChunk: number;
  avgCharsPerChunk: number;
}

export interface ChunkSearchResult {
  documentId: number;
  fileName: string;
  chunkIndex: number;
  chunkTitle: string;
  text: string;
  similarity: number;
  tokenCount: number;
}

export interface ChunkSearchResponse {
  query: string;
  totalResults: number;
  chunks: ChunkSearchResult[];
}

export interface ChunkSearchRequest {
  query: string;
  topK?: number;
  minSimilarity?: number;
}

// Chat types removed and delegated to aiApi.ts

// ============= API Endpoints =============

export const knowledgeApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // ============= DOCUMENTS (Direct to Spring AI) =============

    getDocuments: builder.query<Document[], void>({
      query: () => '/documents',
      providesTags: ['Documents'],
    }),

    getDocumentById: builder.query<Document, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Documents', id }],
    }),

    uploadDocument: builder.mutation<DocumentUploadResponse, FormData>({
      query: (formData) => ({
        url: '/documents/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Documents'],
    }),

    deleteDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Documents'],
    }),

    getDocumentChunks: builder.query<DocumentChunksResponse, string>({
      query: (id) => `/documents/${id}/chunks`,
      providesTags: ['Chunks'],
    }),

    getDocumentChunk: builder.query<DocumentChunk, { id: string; chunkIndex: number }>({
      query: ({ id, chunkIndex }) => `/documents/${id}/chunks/${chunkIndex}`,
    }),

    getDocumentStats: builder.query<DocumentStatsDTO, string>({
      query: (id) => `/documents/${id}/stats`,
    }),

    searchChunks: builder.mutation<ChunkSearchResponse, ChunkSearchRequest>({
      query: (body) => ({
        url: '/documents/search',
        method: 'POST',
        body,
      }),
    }),

    updateDocumentMetadata: builder.mutation<Document, { id: string | number; securityClassification?: string; tags?: string[] }>({
      query: ({ id, ...body }) => ({
        url: `/documents/${id}/metadata`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Documents', id }, 'Documents'],
    }),

    approveDocument: builder.mutation<Document, string | number>({
      query: (id) => ({
        url: `/documents/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Documents', id }, 'Documents'],
    }),

    // Chat endpoints moved down to aiApi.ts
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentChunksQuery,
  useGetDocumentChunkQuery,
  useGetDocumentStatsQuery,
  useSearchChunksMutation,
  useUpdateDocumentMetadataMutation,
  useApproveDocumentMutation,
} = knowledgeApi;
