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
  workspaceId?: string;
  fileName: string;
  fileSize: number;
  filePath?: string;
  documentType: 'pdf' | 'docx' | 'txt' | string;
  status: 'PENDING' | 'PREVIEW' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  markdownContent?: string;
  chunkCount: number;
  errorMessage?: string;
  securityClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  parserMethod?: string;
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
  markdownContent?: string;
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
  workspaceId?: string;
}

export interface AiRefactorRequest {
  mode: 'FULL_DOCUMENT' | 'PARTIAL';
  targetText?: string;
  instruction?: string;
}

export interface AiRefactorResponse {
  refactoredMarkdown: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Chat types removed and delegated to aiApi.ts

// ============= API Endpoints =============

export const knowledgeApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // ============= DOCUMENTS (Direct to Spring AI) =============

    getDocuments: builder.query<Document[] | PagedResponse<Document>, { workspaceId?: string; page?: number; size?: number } | void>({
      query: (params) => {
        const { workspaceId, page, size } = params || {};
        const targetWorkspaceId = workspaceId === undefined ? 'default-workspace' : workspaceId;
        const queryParts: string[] = [];
        if (targetWorkspaceId) {
          queryParts.push(`workspaceId=${encodeURIComponent(targetWorkspaceId)}`);
        }
        if (typeof page === 'number' && typeof size === 'number') {
          queryParts.push(`page=${page}&size=${size}`);
        }
        return queryParts.length ? `/documents?${queryParts.join('&')}` : '/documents';
      },
      providesTags: ['Documents'],
    }),

    getDocumentById: builder.query<Document, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Documents', id }],
    }),

    getRawDocument: builder.query<Blob, string>({
      query: (id) => ({
        url: `/documents/${id}/raw`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    uploadDocument: builder.mutation<DocumentUploadResponse, FormData | { formData: FormData; preview: boolean; parser?: string; workspaceId?: string }>({
      query: (arg) => {
        const formData = arg instanceof FormData ? arg : arg.formData;
        const preview = arg instanceof FormData ? false : arg.preview;
        const parser = arg instanceof FormData ? 'gemini' : (arg.parser || 'gemini');
        const workspaceId = arg instanceof FormData ? undefined : arg.workspaceId;
        let url = `/documents/upload?preview=${preview}&parser=${parser}`;
        if (workspaceId) {
          url += `&workspaceId=${encodeURIComponent(workspaceId)}`;
        }
        return {
          url,
          method: 'POST',
          body: formData,
        };
      },
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

    ingestDocument: builder.mutation<void, { id: string | number; markdownContent: string }>({
      query: ({ id, markdownContent }) => ({
        url: `/documents/${id}/ingest`,
        method: 'POST',
        body: { markdownContent },
      }),
      invalidatesTags: ['Documents', 'Chunks'],
    }),

    aiRefactorDocument: builder.mutation<AiRefactorResponse, { id: string | number; body: AiRefactorRequest }>({
      query: ({ id, body }) => ({
        url: `/documents/${id}/ai-refactor`,
        method: 'POST',
        body,
      }),
      // Refactoring changes the whole document and its chunks
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Documents', id }, 'Documents', 'Chunks'],
    }),

    // Chat endpoints moved down to aiApi.ts
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useGetRawDocumentQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentChunksQuery,
  useGetDocumentChunkQuery,
  useGetDocumentStatsQuery,
  useSearchChunksMutation,
  useUpdateDocumentMetadataMutation,
  useApproveDocumentMutation,
  useIngestDocumentMutation,
  useAiRefactorDocumentMutation,
} = knowledgeApi;
