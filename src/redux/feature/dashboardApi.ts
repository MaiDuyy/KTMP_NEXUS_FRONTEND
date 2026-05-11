import { apiSlice } from '../api/baseApi';

// Types
export interface DailyBrief {
  summary: string;
  urgentMentions: Array<{
    id: string;
    from: string;
    message: string;
    time: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    time: string;
    attendees: string[];
  }>;
}

export interface SystemHealth {
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'offline';
    ping: string;
  }>;
  timestamp: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Dashboard API Slice
export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============= DASHBOARD WIDGETS =============
    getDailyBrief: builder.query<DailyBrief, void>({
      query: () => '/dashboard/daily-brief',
      providesTags: ['Dashboard'],
    }),

    getSystemHealth: builder.query<SystemHealth, void>({
      query: () => '/dashboard/system-health',
      providesTags: ['DashboardHealth'],
    }),

    getTasks: builder.query<DashboardTask[], void>({
      query: () => '/dashboard/tasks',
      providesTags: ['DashboardTasks'],
    }),

    getRecentFiles: builder.query<Array<{ id: string; name: string; type: string; url?: string; time: string }>, void>({
      query: () => '/dashboard/recent-files',
      providesTags: ['Dashboard'],
    }),

    toggleTaskStatus: builder.mutation<void, { id: string; completed: boolean }>({
      query: (body) => ({
        url: `/dashboard/tasks/${body.id}`,
        method: 'PATCH',
        body: { completed: body.completed },
      }),
      invalidatesTags: ['DashboardTasks'],
    }),
  }),
});

export const {
  useGetDailyBriefQuery,
  useGetSystemHealthQuery,
  useGetTasksQuery,
  useGetRecentFilesQuery,
  useToggleTaskStatusMutation,
} = dashboardApi;
