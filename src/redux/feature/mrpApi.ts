// src/redux/feature/mrpApi.ts
// Redux Toolkit Query endpoints for upgraded MRP Pipeline & Wiki Page Review and Drafts workflow.

import { apiSlice } from '../api/baseApi';

export interface SourceCompilationPlan {
  id: number;
  sourceDocumentId: number;
  planJson: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'DONE' | string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WikiPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  workspaceId: string;
  tags?: string;
  pageType?: string;
  summary?: string;
  sourceDocumentId?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  links?: string[];
}

export interface WikiPageDraft {
  id: number;
  wikiPageId?: number;
  slug: string;
  title: string;
  pageType?: string;
  content: string;
  summary?: string;
  tags?: string;
  workspaceId: string;
  authorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'WITHDRAWN';
  note?: string;
  reviewerNote?: string;
  baseVersion?: number;
  revisionRound: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
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

export const mrpApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Khởi tạo quy trình compile MRP
    compileDocument: builder.mutation<SourceCompilationPlan, { documentId: number; workspaceId?: string; autoApprove?: boolean }>({
      query: ({ documentId, workspaceId = 'default-workspace', autoApprove = false }) => ({
        url: `/mrp/compile?documentId=${documentId}&workspaceId=${workspaceId}&autoApprove=${autoApprove}`,
        method: 'POST',
      }),
      invalidatesTags: ['Documents', 'Tasks'],
    }),

    // Phê duyệt Kế hoạch biên soạn
    approvePlan: builder.mutation<{ message: string }, { planId: number; workspaceId?: string; runAutoApproveDrafts?: boolean }>({
      query: ({ planId, workspaceId = 'default-workspace', runAutoApproveDrafts = false }) => ({
        url: `/mrp/plan/${planId}/approve?workspaceId=${workspaceId}&runAutoApproveDrafts=${runAutoApproveDrafts}`,
        method: 'POST',
      }),
      invalidatesTags: ['Documents', 'Tasks'],
    }),

    // Lấy tất cả bản thảo đang chờ duyệt (Hỗ trợ phân trang server-side)
    getPendingDrafts: builder.query<PaginatedResponse<WikiPageDraft> | WikiPageDraft[], { page?: number; size?: number } | void>({
      query: (params) => {
        let url = '/mrp/drafts';
        if (params && params.page !== undefined && params.size !== undefined) {
          url += `?page=${params.page}&size=${params.size}`;
        }
        return url;
      },
      providesTags: ['Tasks'],
    }),

    // Lấy bản thảo theo workspace
    getDraftsByWorkspace: builder.query<WikiPageDraft[], string>({
      query: (workspaceId) => `/mrp/drafts/workspace/${workspaceId}`,
      providesTags: ['Tasks'],
    }),

    // Phê duyệt bản thảo
    approveDraft: builder.mutation<WikiPageDraft, number>({
      query: (draftId) => ({
        url: `/mrp/drafts/${draftId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Tasks', 'Documents'],
    }),

    // Từ chối bản thảo
    rejectDraft: builder.mutation<WikiPageDraft, { draftId: number; note: string }>({
      query: ({ draftId, note }) => ({
        url: `/mrp/drafts/${draftId}/reject`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['Tasks'],
    }),

    // Yêu cầu sửa đổi bản thảo
    requestChangesOnDraft: builder.mutation<WikiPageDraft, { draftId: number; note: string }>({
      query: ({ draftId, note }) => ({
        url: `/mrp/drafts/${draftId}/request-changes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['Tasks'],
    }),

    // Lấy danh sách trang Wiki chính thức (Hỗ trợ phân trang server-side)
    getWikiPages: builder.query<PaginatedResponse<WikiPage> | WikiPage[], { workspaceId?: string; page?: number; size?: number }>({
      query: ({ workspaceId = 'default-workspace', page, size } = {}) => {
        let url = `/mrp/wiki?workspaceId=${workspaceId}`;
        if (page !== undefined && size !== undefined) {
          url += `&page=${page}&size=${size}`;
        }
        return url;
      },
      providesTags: ['Documents'],
    }),

    // Lấy danh sách metadata siêu nhẹ của toàn bộ Wiki (Dành cho Tree, Graph, Stats)
    getWikiPagesMetadata: builder.query<WikiPage[], { workspaceId?: string }>({
      query: ({ workspaceId = 'default-workspace' } = {}) => `/mrp/wiki/metadata?workspaceId=${workspaceId}`,
      providesTags: ['Documents'],
    }),

    // Lấy trang Wiki theo slug
    getWikiPageBySlug: builder.query<WikiPage, { slug: string; workspaceId?: string }>({
      query: ({ slug, workspaceId = 'default-workspace' }) => `/mrp/wiki/slug/${slug}?workspaceId=${workspaceId}`,
      providesTags: (_r, _e, { slug }) => [{ type: 'Documents', id: slug }],
    }),

    // Lấy trang Wiki theo ID
    getWikiPageById: builder.query<WikiPage, number>({
      query: (id) => `/mrp/wiki/id/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Documents', id }],
    }),

    // Lấy danh sách tất cả các kế hoạch biên soạn (Hỗ trợ phân trang server-side)
    getCompilationPlans: builder.query<PaginatedResponse<SourceCompilationPlan> | SourceCompilationPlan[], { page?: number; size?: number } | void>({
      query: (params) => {
        let url = '/mrp/plans';
        if (params && params.page !== undefined && params.size !== undefined) {
          url += `?page=${params.page}&size=${params.size}`;
        }
        return url;
      },
      providesTags: ['Tasks'],
    }),

    // Lấy chi tiết một kế hoạch biên soạn
    getPlanById: builder.query<SourceCompilationPlan, number>({
      query: (planId) => `/mrp/plans/${planId}`,
      providesTags: (_r, _e, planId) => [{ type: 'Tasks', id: planId }],
    }),
  }),
});

export const {
  useCompileDocumentMutation,
  useApprovePlanMutation,
  useGetPendingDraftsQuery,
  useGetDraftsByWorkspaceQuery,
  useApproveDraftMutation,
  useRejectDraftMutation,
  useRequestChangesOnDraftMutation,
  useGetWikiPagesQuery,
  useGetWikiPagesMetadataQuery,
  useGetWikiPageBySlugQuery,
  useGetWikiPageByIdQuery,
  useGetCompilationPlansQuery,
  useGetPlanByIdQuery,
} = mrpApi;
