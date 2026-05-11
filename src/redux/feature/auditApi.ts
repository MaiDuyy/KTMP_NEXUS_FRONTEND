// src/redux/feature/auditApi.ts
// Full Audit API endpoints for security monitoring

import { apiSlice } from '../api/baseApi';

// Types
export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
}

export interface DMAccessLog {
  id: string;
  accessorId: string;
  accessorName?: string;
  targetUserId: string;
  targetUserName?: string;
  chatId: string;
  reason: string;
  approvedBy?: string;
  accessedAt: string;
  expiresAt?: string;
}

export interface SecurityAlert {
  id: string;
  type: 'SUSPICIOUS_LOGIN' | 'DATA_EXFIL' | 'PERMISSION_ABUSE' | 'BRUTE_FORCE' | 'POLICY_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userName?: string;
  description: string;
  details?: Record<string, unknown>;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditReport {
  id: string;
  type: 'USER_ACTIVITY' | 'ACCESS_SUMMARY' | 'SECURITY_INCIDENTS' | 'COMPLIANCE';
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  status: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
  fileUrl?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}

export interface DMAccessFilters {
  accessorId?: string;
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}

export interface AlertFilters {
  type?: string;
  severity?: string;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  total: number;
}

export interface CreateDMAccessRequest {
  targetUserId: string;
  chatId: string;
  reason: string;
}

export interface CreateAlertRequest {
  type: SecurityAlert['type'];
  severity: SecurityAlert['severity'];
  userId?: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface CreateReportRequest {
  type: AuditReport['type'];
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

// Audit API using apiSlice.injectEndpoints
export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============= AUDIT LOGS =============

    // Get audit logs with filters
    getAuditLogs: builder.query<PaginatedResponse<AuditLog>, AuditFilters>({
      query: (filters) => ({
        url: '/audit/logs',
        params: filters,
      }),
      providesTags: ['AuditLogs'],
    }),

    // Get single audit log
    getAuditLogById: builder.query<{ log: AuditLog }, string>({
      query: (id) => `/audit/logs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AuditLogs', id }],
    }),

    // Get user's audit logs
    getUserAuditLogs: builder.query<PaginatedResponse<AuditLog>, { userId: string; filters?: AuditFilters }>({
      query: ({ userId, filters }) => ({
        url: `/audit/users/${userId}/logs`,
        params: filters,
      }),
      providesTags: ['AuditLogs'],
    }),

    // Get resource audit logs
    getResourceAuditLogs: builder.query<PaginatedResponse<AuditLog>, { resource: string; resourceId: string; filters?: AuditFilters }>({
      query: ({ resource, resourceId, filters }) => ({
        url: `/audit/resources/${resource}/${resourceId}/logs`,
        params: filters,
      }),
      providesTags: ['AuditLogs'],
    }),

    // Create audit log
    createAuditLog: builder.mutation<{ log: AuditLog }, Partial<AuditLog>>({
      query: (body) => ({
        url: '/audit/logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuditLogs'],
    }),

    // ============= DM ACCESS LOGS =============

    // Get DM access logs
    getDMAccessLogs: builder.query<PaginatedResponse<DMAccessLog>, DMAccessFilters>({
      query: (filters) => ({
        url: '/audit/dm-access',
        params: filters,
      }),
      providesTags: ['DMAccess'],
    }),

    // Log DM access (audit preflight)
    logDMAccess: builder.mutation<{ log: DMAccessLog; allowed: boolean }, CreateDMAccessRequest>({
      query: (body) => ({
        url: '/audit/dm-access',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DMAccess'],
    }),

    // ============= SECURITY ALERTS =============

    // Get security alerts
    getSecurityAlerts: builder.query<PaginatedResponse<SecurityAlert>, AlertFilters>({
      query: (filters) => ({
        url: '/audit/alerts',
        params: filters,
      }),
      providesTags: ['SecurityAlerts'],
    }),

    // Create security alert
    createSecurityAlert: builder.mutation<{ alert: SecurityAlert }, CreateAlertRequest>({
      query: (body) => ({
        url: '/audit/alerts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SecurityAlerts'],
    }),

    // Resolve security alert
    resolveSecurityAlert: builder.mutation<{ alert: SecurityAlert }, { id: string; resolution?: string }>({
      query: ({ id, resolution }) => ({
        url: `/audit/alerts/${id}/resolve`,
        method: 'PUT',
        body: { resolution },
      }),
      invalidatesTags: ['SecurityAlerts'],
    }),

    // ============= AUDIT REPORTS =============

    // Get audit reports
    getAuditReports: builder.query<PaginatedResponse<AuditReport>, { cursor?: string; limit?: number }>({
      query: (params) => ({
        url: '/audit/reports',
        params,
      }),
      providesTags: ['AuditReports'],
    }),

    // Create audit report
    createAuditReport: builder.mutation<{ report: AuditReport }, CreateReportRequest>({
      query: (body) => ({
        url: '/audit/reports',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuditReports'],
    }),
  }),
});

export const {
  // Audit Logs
  useGetAuditLogsQuery,
  useGetAuditLogByIdQuery,
  useGetUserAuditLogsQuery,
  useGetResourceAuditLogsQuery,
  useCreateAuditLogMutation,
  // DM Access
  useGetDMAccessLogsQuery,
  useLogDMAccessMutation,
  // Security Alerts
  useGetSecurityAlertsQuery,
  useCreateSecurityAlertMutation,
  useResolveSecurityAlertMutation,
  // Reports
  useGetAuditReportsQuery,
  useCreateAuditReportMutation,
} = auditApi;
