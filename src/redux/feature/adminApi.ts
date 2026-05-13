// src/redux/feature/adminApi.ts
// Admin API endpoints for user and organization management

import { apiSlice } from '../api/baseApi';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  status?: string;
  isOnline: boolean;
  isActive: boolean;
  lastSeen?: string;
  department?: string;
  position?: string;
  role?: string;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role?: string;
  department?: string;
  invitedBy: string;
  inviterName?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface OrgSettings {
  id: string;
  name: string;
  logo?: string;
  domain?: string;
  defaultRole?: string;
  allowSignup: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  mfaRequired: boolean;
  allowedEmailDomains?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  maxWorkspaces: number;
  maxMembers: number;
  plan: string;
  _count?: {
    members: number;
  };
  createdAt: string;
}

// Request types
export interface UserFilters {
  search?: string;
  department?: string;
  role?: string;
  isActive?: boolean;
  cursor?: string;
  limit?: number;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password?: string;
  phone?: string;
  department?: string;
  position?: string;
  roleId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface InviteUserRequest {
  email: string;
  role?: string;
  department?: string;
  message?: string;
}

export interface UpdateOrgSettingsRequest {
  name?: string;
  logo?: string;
  domain?: string;
  defaultRole?: string;
  allowSignup?: boolean;
  requireEmailVerification?: boolean;
  sessionTimeout?: number;
  passwordPolicy?: Partial<OrgSettings['passwordPolicy']>;
  mfaRequired?: boolean;
  allowedEmailDomains?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  total: number;
}

// Admin API using apiSlice.injectEndpoints
export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============= USER MANAGEMENT =============

    // List users
    listUsers: builder.query<PaginatedResponse<User>, UserFilters | void>({
      query: (filters) => ({
        url: '/users',
        params: filters || {},
      }),
      transformResponse: (response: { 
        success: boolean; 
        users: User[]; 
        total: number; 
        page?: number; 
        totalPages?: number 
      }) => ({
        items: response.users || [],
        total: response.total || 0,
        nextCursor: undefined, // Backend uses page-based pagination
      }),
      providesTags: ['Users'],
    }),

    // Get user by ID
    getUserById: builder.query<{ user: User }, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Users', id }],
    }),

    // Create user
    createUser: builder.mutation<{ user: User }, CreateUserRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Users'],
    }),

    // Update user
    updateUser: builder.mutation<{ user: User }, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Users', id }, 'Users'],
    }),

    // Delete user
    deleteUser: builder.mutation<{ message: string }, { id: string; anonymize?: boolean }>({
      query: ({ id, anonymize }) => ({
        url: `/users/${id}`,
        method: 'DELETE',
        params: anonymize ? { anonymize: 'true' } : {},
      }),
      invalidatesTags: ['Users'],
    }),

    // Update user role
    updateUserRole: builder.mutation<{ message: string }, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['Users', 'Roles'],
    }),

    // Suspend user
    suspendUser: builder.mutation<{ success: boolean; message: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/users/${id}/suspend`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Users'],
    }),

    // Unsuspend user
    unsuspendUser: builder.mutation<{ success: boolean; message: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/users/${id}/unsuspend`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Users'],
    }),


    // ============= ORG SETTINGS =============
    getOrgSettings: builder.query<{ success: boolean; settings: any }, void>({
      query: () => '/org-settings',
      providesTags: ['OrgSettings'],
    }),

    updateOrgSettings: builder.mutation<{ success: boolean; settings: any; message: string }, any>({
      query: (body) => ({
        url: '/org-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['OrgSettings'],
    }),

    // ============= INVITATIONS =============


    // List invitations
    listInvitations: builder.query<{ invitations: Invitation[] }, { status?: string } | void>({
      query: (params) => ({
        url: '/invitations',
        params: params || {},
      }),
      providesTags: ['Invitations'],
    }),

    // Invite user
    inviteUser: builder.mutation<{ invitation: Invitation }, InviteUserRequest>({
      query: (body) => ({
        url: '/invitations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invitations'],
    }),

    // Resend invitation
    resendInvitation: builder.mutation<{ invitation: Invitation }, string>({
      query: (id) => ({
        url: `/invitations/${id}/resend`,
        method: 'POST',
      }),
      invalidatesTags: ['Invitations'],
    }),

    // Cancel invitation
    cancelInvitation: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/invitations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invitations'],
    }),

    // ============= ORG SETTINGS =============
    // ============= STATISTICS =============

    // Get admin dashboard stats
    getAdminStats: builder.query<{
      totalUsers: number;
      activeUsers: number;
      pendingInvitations: number;
      totalMessages: number;
      totalWorkspaces: number;
      fileStorageUsage: number;
      roleDistribution: Array<{ role: string; count: number }>;
      departmentDistribution: Array<{ department: string; count: number }>;
      userGrowth: Array<{ date: string; count: number }>;
      messageActivity: Array<{ date: string; count: number }>;
      recentActivity: Array<{
        type: string;
        description: string;
        timestamp: string;
      }>;
    }, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),
    
    // Send global broadcast
    sendBroadcast: builder.mutation<{ success: boolean; message: string }, { title: string; body: string; type?: string }>({
      query: (data) => ({
        url: '/admin/broadcast',
        method: 'POST',
        body: data,
      }),
    }),
    
    // ============= ORGANIZATION MANAGEMENT =============
    
    // List organizations
    listOrganizations: builder.query<PaginatedResponse<Organization>, { page?: number; limit?: number; search?: string } | void>({
      query: (params) => ({
        url: '/admin/organizations',
        params: params || {},
      }),
      transformResponse: (response: { 
        success: boolean; 
        organizations: Organization[]; 
        total: number; 
      }) => ({
        items: response.organizations || [],
        total: response.total || 0,
      }),
      providesTags: ['Organizations'],
    }),

    // Update organization quota
    updateOrgQuota: builder.mutation<{ success: boolean; message: string }, { orgId: string; maxWorkspaces: number }>({
      query: ({ orgId, maxWorkspaces }) => ({
        url: `/admin/organizations/${orgId}/quota`,
        method: 'PATCH',
        body: { maxWorkspaces },
      }),
      invalidatesTags: ['Organizations'],
    }),
    
    // Update user quota
    updateUserQuota: builder.mutation<{ success: boolean; message: string }, { userId: string; maxWorkspaces: number }>({
      query: ({ userId, maxWorkspaces }) => ({
        url: `/admin/users/${userId}/quota`,
        method: 'PATCH',
        body: { maxWorkspaces },
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  // Users
  useListUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
  // Invitations
  useListInvitationsQuery,
  useInviteUserMutation,
  useResendInvitationMutation,
  useCancelInvitationMutation,
  // Org Settings
  useGetOrgSettingsQuery,
  useUpdateOrgSettingsMutation,
  // Stats
  useGetAdminStatsQuery,
  // Broadcast
  useSendBroadcastMutation,
  // Organizations
  useListOrganizationsQuery,
  useUpdateOrgQuotaMutation,
  useUpdateUserQuotaMutation,
  // Lazy
  useLazyListUsersQuery,
  useLazyGetUserByIdQuery,
} = adminApi;
