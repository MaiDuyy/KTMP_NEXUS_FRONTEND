// src/redux/feature/rbacApi.ts
// Full RBAC API endpoints for enterprise permission management

import { apiSlice } from '../api/baseApi';

// Types for RBAC API responses
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  isSystem: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  role: Role;
  assignedAt: string;
  assignedBy?: string;
  scope?: string;
}

export interface UserPermissions {
  userId: string;
  roles: Role[];
  permissions: string[];
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  level?: number;
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  level?: number;
  isActive?: boolean;
}

export interface AssignRoleRequest {
  roleId: string;
  scope?: string;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}

export interface CheckPermissionRequest {
  userId: string;
  permission: string;
  resourceId?: string;
}

export interface CheckRoleRequest {
  userId: string;
  role: string;
}

export interface CheckResponse {
  allowed: boolean;
  reason?: string;
}

interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// RBAC API using apiSlice.injectEndpoints
export const rbacApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============= ROLES =============
    
    // Get all roles
    getRoles: builder.query<Role[], void>({
      query: () => '/rbac/roles',
      transformResponse: (response: BackendResponse<Role[]>) => response.data || [],
      providesTags: ['Roles'],
    }),

    // Get role by ID
    getRoleById: builder.query<Role, string>({
      query: (id) => `/rbac/roles/${id}`,
      transformResponse: (response: BackendResponse<Role>) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'Roles', id }],
    }),

    // Create role
    createRole: builder.mutation<Role, CreateRoleRequest>({
      query: (body) => ({
        url: '/rbac/roles',
        method: 'POST',
        body,
      }),
      transformResponse: (response: BackendResponse<Role>) => response.data,
      invalidatesTags: ['Roles'],
    }),

    // Update role
    updateRole: builder.mutation<Role, { id: string; data: UpdateRoleRequest }>({
      query: ({ id, data }) => ({
        url: `/rbac/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: BackendResponse<Role>) => response.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Roles', id }, 'Roles'],
    }),

    // Delete role
    deleteRole: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),

    // ============= PERMISSIONS =============
    
    // Get all permissions
    getAllPermissions: builder.query<Permission[], void>({
      query: () => '/rbac/permissions',
      transformResponse: (response: BackendResponse<Permission[]>) => response.data || [],
      providesTags: ['Permissions'],
    }),

    // Assign permissions to role
    assignPermissionsToRole: builder.mutation<{ message: string }, { roleId: string; data: AssignPermissionsRequest }>({
      query: ({ roleId, data }) => ({
        url: `/rbac/roles/${roleId}/permissions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roles', 'Permissions'],
    }),

    // Remove permissions from role
    removePermissionsFromRole: builder.mutation<{ message: string }, { roleId: string; data: AssignPermissionsRequest }>({
      query: ({ roleId, data }) => ({
        url: `/rbac/roles/${roleId}/permissions`,
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Roles', 'Permissions'],
    }),

    // ============= USER ROLES =============

    // Get user's roles
    getUserRoles: builder.query<UserRole[], string>({
      query: (userId) => `/rbac/users/${userId}/roles`,
      transformResponse: (response: BackendResponse<UserRole[]>) => response.data,
      providesTags: ['Roles'],
    }),

    // Get user's permissions
    getUserPermissions: builder.query<UserPermissions, string>({
      query: (userId) => `/rbac/users/${userId}/permissions`,
      transformResponse: (response: BackendResponse<{ 
          permissions: Array<{ resource: string; action: string; scope: string }>;
          roles: string[];
          roleLevel?: number;
        }>, _meta, userId) => {
        const permissionStrings = response.data?.permissions?.map(
          (p) => `${p.resource}.${p.action}`
        ) || [];
        const roleNames = response.data?.roles || [];
        return {
          userId,
          roles: roleNames.map(name => ({ name, id: '', displayName: name, level: 0, isSystem: false, createdAt: '', updatedAt: '' } as Role)),
          permissions: permissionStrings,
        };
      },
      providesTags: ['Permissions'],
    }),

    // Assign role to user
    assignRoleToUser: builder.mutation<UserRole, { userId: string; data: AssignRoleRequest & { grantedBy: string } }>({
      query: ({ userId, data }) => ({
        url: `/rbac/users/${userId}/roles`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: BackendResponse<UserRole>) => response.data,
      invalidatesTags: ['Roles', 'Permissions'],
    }),

    // Remove role from user
    removeRoleFromUser: builder.mutation<{ message: string }, { userId: string; roleId: string; data: { revokedBy: string } }>({
      query: ({ userId, roleId, data }) => ({
        url: `/rbac/users/${userId}/roles/${roleId}`,
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Roles', 'Permissions'],
    }),

    // ============= PERMISSION CHECKS =============

    // Check permission
    checkPermission: builder.mutation<CheckResponse, CheckPermissionRequest>({
      query: (body) => ({
        url: '/rbac/check',
        method: 'POST',
        body,
      }),
      transformResponse: (response: BackendResponse<CheckResponse>) => response.data,
    }),

    // Check role
    checkRole: builder.mutation<CheckResponse, CheckRoleRequest>({
      query: (body) => ({
        url: '/rbac/check-role',
        method: 'POST',
        body,
      }),
      transformResponse: (response: BackendResponse<CheckResponse>) => response.data,
    }),
  }),
});

export const {
  // Roles
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  // Permissions
  useGetAllPermissionsQuery,
  useAssignPermissionsToRoleMutation,
  useRemovePermissionsFromRoleMutation,
  // User Roles
  useGetUserRolesQuery,
  useGetUserPermissionsQuery,
  useAssignRoleToUserMutation,
  useRemoveRoleFromUserMutation,
  // Permission Checks
  useCheckPermissionMutation,
  useCheckRoleMutation,
  // Lazy
  useLazyGetUserPermissionsQuery,
  useLazyGetUserRolesQuery,
} = rbacApi;
