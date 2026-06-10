import { apiSlice } from '../api/baseApi';

export interface Department {
  id: string;
  name: string;
  description?: string;
  orgId?: string;
  parentId?: string;
  managerId?: string;
  parent?: Department;
  children?: Department[];
  userRole?: string;
  memberCount: number;
  members?: DepartmentMember[];
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentMember {
  id: string;
  userId: string;
  departmentId: string;
  role?: string;
  isPrimary?: boolean;
  joinedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
export interface DbDepartment extends Department {
  _count?: {
    members: number;
  };
}

export const departmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listDepartments: builder.query<Department[], void>({
      query: () => '/departments',
      transformResponse: (response: { success: boolean; departments?: DbDepartment[]; data?: DbDepartment[] }) => {
        const list = response.departments || response.data || [];
        return list.map((dept) => ({
          ...dept,
          memberCount: dept.memberCount ?? dept._count?.members ?? 0,
        }));
      },
      providesTags: ['Departments'],
    }),

    getDepartment: builder.query<Department, string>({
      query: (id) => `/departments/${id}`,
      transformResponse: (response: { success: boolean; department?: DbDepartment; data?: DbDepartment }) => {
        const dept = response.department || response.data;
        if (!dept) return dept as unknown as Department;
        return {
          ...dept,
          memberCount: dept.memberCount ?? dept.members?.length ?? dept._count?.members ?? 0,
        };
      },
      providesTags: (_r, _e, id) => [{ type: 'Departments', id }],
    }),

    getUserDepartments: builder.query<Department[], string>({
      query: (userId) => `/users/${userId}/departments`,
      transformResponse: (response: { success: boolean; data?: DbDepartment[] }) => {
        const list = response.data || [];
        return list.map((dept) => ({
          ...dept,
          memberCount: dept.memberCount ?? dept.members?.length ?? dept._count?.members ?? 0,
        }));
      },
      providesTags: ['Departments'],
    }),

    createDepartment: builder.mutation<Department, { name: string; description?: string | null; parentId?: string | null; managerId?: string | null }>({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; department?: DbDepartment; data?: DbDepartment }) => {
        const dept = response.department || response.data;
        if (!dept) return dept as unknown as Department;
        return {
          ...dept,
          memberCount: dept.memberCount ?? dept.members?.length ?? dept._count?.members ?? 0,
        };
      },
      invalidatesTags: ['Departments'],
    }),

    updateDepartment: builder.mutation<Department, { id: string; name?: string; description?: string | null; parentId?: string | null; managerId?: string | null }>({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { success: boolean; department?: DbDepartment; data?: DbDepartment }) => {
        const dept = response.department || response.data;
        if (!dept) return dept as unknown as Department;
        return {
          ...dept,
          memberCount: dept.memberCount ?? dept.members?.length ?? dept._count?.members ?? 0,
        };
      },
      invalidatesTags: ['Departments'],
    }),

    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Departments'],
    }),

    addDepartmentMember: builder.mutation<void, { departmentId: string; userId: string; role?: string }>({
      query: ({ departmentId, userId, role }) => ({
        url: `/departments/${departmentId}/members`,
        method: 'POST',
        body: { userId, role },
      }),
      invalidatesTags: ['Departments', 'Users'],
    }),

    updateDepartmentMember: builder.mutation<void, { departmentId: string; userId: string; role: string }>({
      query: ({ departmentId, userId, role }) => ({
        url: `/departments/${departmentId}/members/${userId}`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Departments', 'Users'],
    }),

    removeDepartmentMember: builder.mutation<void, { departmentId: string; userId: string }>({
      query: ({ departmentId, userId }) => ({
        url: `/departments/${departmentId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Departments', 'Users'],
    }),

    provisionDepartmentMember: builder.mutation<unknown, { email: string; name: string; role: string; departmentId: string; departmentRole: string }>({
      query: ({ email, name, role, departmentId, departmentRole }) => ({
        url: '/users/provision',
        method: 'POST',
        body: { email, name, role, departmentId, departmentRole },
      }),
      invalidatesTags: ['Departments', 'Users'],
    }),

    inviteDepartmentMember: builder.mutation<unknown, { departmentId: string; email: string; role: string }>({
      query: ({ departmentId, email, role }) => ({
        url: `/departments/${departmentId}/invitations`,
        method: 'POST',
        body: { email, role },
      }),
      invalidatesTags: ['Departments'],
    }),

    validateDepartmentInviteToken: builder.query<unknown, string>({
      query: (token) => `/departments/invitations/validate/${token}`,
    }),

    listDepartmentInvitations: builder.query<any[], string>({
      query: (departmentId) => `/departments/${departmentId}/invitations`,
      transformResponse: (response: { success: boolean; data: any[] }) => response.data || [],
      providesTags: ['Departments'],
    }),

    acceptDepartmentInvite: builder.mutation<unknown, { token: string; name?: string; password?: string; gender?: string }>({
      query: ({ token, ...body }) => ({
        url: `/departments/invitations/accept/${token}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Departments', 'Users'],
    }),

    rejectDepartmentInvite: builder.mutation<unknown, string>({
      query: (token) => ({
        url: `/departments/invitations/reject/${token}`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useListDepartmentsQuery,
  useGetDepartmentQuery,
  useGetUserDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useAddDepartmentMemberMutation,
  useUpdateDepartmentMemberMutation,
  useRemoveDepartmentMemberMutation,
  useProvisionDepartmentMemberMutation,
  useInviteDepartmentMemberMutation,
  useValidateDepartmentInviteTokenQuery,
  useListDepartmentInvitationsQuery,
  useAcceptDepartmentInviteMutation,
  useRejectDepartmentInviteMutation,
} = departmentApi;
