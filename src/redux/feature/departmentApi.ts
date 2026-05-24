import { apiSlice } from '../api/baseApi';

export interface Department {
  id: string;
  name: string;
  description?: string;
  orgId?: string;
  memberCount: number;
  members?: DepartmentMember[];
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentMember {
  id: string;
  userId: string;
  departmentId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const departmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listDepartments: builder.query<Department[], void>({
      query: () => '/departments',
      transformResponse: (response: { success: boolean; departments: Department[] }) =>
        response.departments || (response as any).data || [],
      providesTags: ['Departments'],
    }),

    getDepartment: builder.query<Department, string>({
      query: (id) => `/departments/${id}`,
      transformResponse: (response: { success: boolean; department?: Department; data?: Department }) =>
        response.department || response.data || (response as any),
      providesTags: (_r, _e, id) => [{ type: 'Departments', id }],
    }),

    createDepartment: builder.mutation<Department, { name: string; description?: string }>({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; department: Department }) => response.department,
      invalidatesTags: ['Departments'],
    }),

    updateDepartment: builder.mutation<Department, { id: string; name?: string; description?: string }>({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { success: boolean; department: Department }) => response.department,
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
      invalidatesTags: ['Departments'],
    }),

    removeDepartmentMember: builder.mutation<void, { departmentId: string; userId: string }>({
      query: ({ departmentId, userId }) => ({
        url: `/departments/${departmentId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Departments'],
    }),
  }),
});

export const {
  useListDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useAddDepartmentMemberMutation,
  useRemoveDepartmentMemberMutation,
} = departmentApi;
