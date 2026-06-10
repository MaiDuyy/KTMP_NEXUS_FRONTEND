import { apiSlice } from "../api/baseApi";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  slug: string;
  myRole: string;
  memberCount: number;
  channelCount: number;
  updatedAt: string;
  departmentId?: string;
}

export const workspaceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserWorkspaces: builder.query<Workspace[], void>({
      query: () => "/workspaces",
      transformResponse: (response: { success: boolean; workspaces: Workspace[] }) => response.workspaces,
      providesTags: ["Workspaces"],
    }),
    getWorkspacesByDepartment: builder.query<Workspace[], string>({
      query: (departmentId) => `/workspaces?departmentId=${departmentId}`,
      transformResponse: (response: { success: boolean; workspaces: Workspace[] }) => response.workspaces,
      providesTags: ["Workspaces"],
    }),
    getDissolvedWorkspaces: builder.query<Workspace[], void>({
      query: () => "/workspaces/dissolved",
      transformResponse: (response: { success: boolean; workspaces: Workspace[] }) => response.workspaces,
      providesTags: ["Workspaces"],
    }),
    createWorkspace: builder.mutation<Workspace, any>({
      query: (body) => ({
        url: "/workspaces",
        method: "POST",
        body,
      }),
      transformResponse: (response: { success: boolean; workspace: Workspace }) => response.workspace,
      invalidatesTags: ["Workspaces"],
    }),
    addWorkspaceMember: builder.mutation<any, { workspaceId: string; targetUserId: string; role: string }>({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/members`,
        method: "POST",
        body,
      }),
    }),
    sendInvite: builder.mutation<any, { workspaceId: string; email: string; role: string; userId?: string }>({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/invites`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkspaceInvites"],
    }),
    validateInviteToken: builder.query<{ success: boolean; invite: any }, string>({
      query: (token) => `/workspaces/invites/validate/${token}`,
    }),
    acceptInvite: builder.mutation<any, { token: string; name?: string; password?: string; gender?: string }>({
      query: (body) => ({
        url: `/workspaces/invites/accept`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workspaces"],
    }),
    joinInvite: builder.mutation<any, { token: string }>({
      query: (body) => ({
        url: `/workspaces/invites/join`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workspaces"],
    }),
    rejectInvite: builder.mutation<any, { token: string }>({
      query: (body) => ({
        url: `/workspaces/invites/reject`,
        method: "POST",
        body,
      }),
    }),
    getWorkspaceMembers: builder.query<{ items: any[]; total: number }, { workspaceId: string; page?: number; limit?: number }>({
      query: ({ workspaceId, page = 1, limit = 50 }) => `/workspaces/${workspaceId}/members?page=${page}&limit=${limit}`,
      providesTags: ["WorkspaceMembers"],
    }),
    getWorkspaceInvites: builder.query<any[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/invites`,
      transformResponse: (response: { success: boolean; invitations: any[] }) => response.invitations,
      providesTags: ["WorkspaceInvites"],
    }),
    cancelInvite: builder.mutation<any, string>({
      query: (inviteId) => ({
        url: `/workspaces/invites/${inviteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkspaceInvites"],
    }),
    resendInvite: builder.mutation<any, string>({
      query: (inviteId) => ({
        url: `/workspaces/invites/${inviteId}/resend`,
        method: "POST",
      }),
      invalidatesTags: ["WorkspaceInvites"],
    }),
    updateWorkspaceMemberRole: builder.mutation<any, { workspaceId: string; targetUserId: string; role: string }>({
      query: ({ workspaceId, targetUserId, ...body }) => ({
        url: `/workspaces/${workspaceId}/members/${targetUserId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WorkspaceMembers"],
    }),
    removeWorkspaceMember: builder.mutation<any, { workspaceId: string; targetUserId: string }>({
      query: ({ workspaceId, targetUserId }) => ({
        url: `/workspaces/${workspaceId}/members/${targetUserId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkspaceMembers", "Workspaces"],
    }),
    deleteWorkspace: builder.mutation<any, string>({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workspaces"],
    }),
    dissolveWorkspace: builder.mutation<any, { workspaceId: string; workspaceNameConfirm: string }>({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/dissolve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workspaces"],
    }),
    restoreWorkspace: builder.mutation<any, string>({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Workspaces"],
    }),
    leaveWorkspace: builder.mutation<any, string>({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}/leave`,
        method: "POST",
      }),
      invalidatesTags: ["Workspaces"],
    }),
    updateWorkspace: builder.mutation<Workspace, { workspaceId: string; name?: string; description?: string; icon?: string; slug?: string; departmentId?: string | null }>({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Workspaces"],
    }),
    transferOwnership: builder.mutation<any, { workspaceId: string; targetUserId: string }>({
      query: ({ workspaceId, targetUserId }) => ({
        url: `/workspaces/${workspaceId}/transfer-ownership`,
        method: "POST",
        body: { targetUserId },
      }),
      invalidatesTags: ["Workspaces", "WorkspaceMembers"],
    }),
    getWorkspaceStats: builder.query<any, string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/stats`,
      providesTags: ["Workspaces", "WorkspaceMembers"],
    }),
  }),
});

export const { 
  useGetUserWorkspacesQuery, 
  useGetDissolvedWorkspacesQuery,
  useGetWorkspacesByDepartmentQuery,
  useCreateWorkspaceMutation,
  useAddWorkspaceMemberMutation,
  useSendInviteMutation,
  useValidateInviteTokenQuery,
  useAcceptInviteMutation,
  useJoinInviteMutation,
  useRejectInviteMutation,
  useGetWorkspaceInvitesQuery,
  useCancelInviteMutation,
  useResendInviteMutation,
  useGetWorkspaceMembersQuery,
  useUpdateWorkspaceMemberRoleMutation,
  useRemoveWorkspaceMemberMutation,
  useDeleteWorkspaceMutation,
  useDissolveWorkspaceMutation,
  useRestoreWorkspaceMutation,
  useLeaveWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useTransferOwnershipMutation,
  useGetWorkspaceStatsQuery,
} = workspaceApi;
