import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError, retry } from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { logOut, tokenReceived } from "../feature/authSlice";
import { RootState } from "../store";
import { toast } from "sonner";


const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include", // Tự động gửi httpOnly cookie theo mỗi request
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token || (typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const workspaceId = (getState() as RootState).workspace.currentWorkspaceId;
    if (workspaceId) {
      headers.set("X-Workspace-Id", workspaceId);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // Đợi mutex unlock trước khi chạy request
  await mutex.waitForUnlock();
  
  // 1. Gọi request ban đầu
  let result = await baseQuery(args, api, extraOptions);

  // 2. Nếu lỗi 401 (Unauthorized) -> Token hết hạn
  if (result.error && result.error.status === 401) {
    // Kiểm tra xem có luồng nào đang refresh không
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        // Lấy refreshToken từ store hoặc localStorage để dự phòng cookie bị chặn
        const state = api.getState() as RootState;
        const refreshToken = state.auth.refreshToken || (typeof window !== 'undefined' ? localStorage.getItem("refreshToken") : null);

        if (!refreshToken) {
          // Force logout và chuyển hướng nếu không có refreshToken
          api.dispatch(logOut());
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search;
            const searchParams = new URLSearchParams();
            searchParams.set('reason', 'session_expired');
            searchParams.set('callbackUrl', currentPath);
            window.location.href = `/login?${searchParams.toString()}`;
          }
          return result;
        }

        // Gọi API refresh token
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh-token",
            method: "POST",
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Refresh thành công - server đã set cookie mới
          const data = refreshResult.data as { accessToken: string; refreshToken: string };
          
          // Dispatch để cập nhật state
          api.dispatch(tokenReceived(data));
          
          // Retry request ban đầu với token mới
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh thất bại -> Force logout và chuyển hướng về /login với thông báo lỗi
          api.dispatch(logOut());
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search;
            const searchParams = new URLSearchParams();
            searchParams.set('reason', 'session_expired');
            searchParams.set('callbackUrl', currentPath);
            window.location.href = `/login?${searchParams.toString()}`;
          }
        }
      } finally {
        release();
      }
    } else {
      // Đợi cho đến khi mutex được mở khoá (làm mới token ở request đầu tiên hoàn tất)
      await mutex.waitForUnlock();
      
      // Thử lại request ban đầu với token mới vừa được cập nhật
      result = await baseQuery(args, api, extraOptions);
    }
  }

  // 3. Nếu lỗi 403 (Forbidden) -> Không có quyền trong Workspace
  if (result.error && result.error.status === 403) {
    toast.error("Bạn không có quyền thực hiện hành động này trong Workspace này!");
  }

  return result;
};

/**
 * ⚡ NÂNG CẤP FAULT TOLERANCE: Bọc baseQueryWithReauth trong cơ chế tự động Retry của RTK Query
 * Kịch bản áp dụng: Tự động thử lại khi gặp lỗi máy chủ (5xx) hoặc lỗi mất mạng (FETCH_ERROR)
 * Độ trễ: Lần 1 chờ 3s, Lần 2 chờ 5s, Lần 3 chờ 5s trước khi dừng hẳn.
 * Đồng thời hiển thị Toast thông báo cho người dùng biết để tránh reload trang thủ công.
 */
const baseQueryWithRetry = retry(
  async (args, api, extraOptions) => {
    const result = await baseQueryWithReauth(args, api, extraOptions);
    
    // Nếu gặp lỗi
    if (result.error) {
      const status = result.error.status;
      // Chỉ tự động thử lại khi lỗi máy chủ (5xx) hoặc lỗi mạng
      if (status === 'FETCH_ERROR' || (typeof status === 'number' && status >= 500)) {
        return result; // Tiếp tục thử lại
      }
      
      // Ngắt retry ngay lập tức đối với lỗi Client (4xx) để tránh lặp vô tận
      retry.fail(result.error);
    }
    
    return result;
  },
  {
    maxRetries: 3,
    backoff: async (attempt, maxRetries) => {
      const delay = attempt === 1 ? 3000 : 5000;
      
      // Hiển thị thông báo Toast thông báo quá trình thử lại của hệ thống (Phương án B)
      toast.warning(`Kết nối mạng không ổn định. Đang tự động kết nối lại lần ${attempt}/${maxRetries}...`, {
        id: "api-retry-toast", // Dùng cố định ID để cập nhật cùng một toast, tránh spam nhiều bong bóng
        duration: delay,
      });
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
);

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    // Core
    "User",
    "Users",
    "Account",
    "Friends",
    "FriendRequests",
    "Blocked",
    // Chat
    "Chats",
    "Messages",
    "PinnedMessages",
    "Channels",
    "Threads",
    "Replies",
    "Workspaces",
    "Members",
    "Categories",
    "AIHistory",
    "SavedAnswers",
    
    // Notifications
    "Notifications",
    // RBAC
    "Roles",
    "Permissions",
    // Audit
    "AuditLogs",
    "DMAccess",
    "SecurityAlerts",
    "AuditReports",
    // Knowledge
    "Collections",
    "Documents",
    "Chunks",
    // Admin
    "AdminStats",
    "Invitations",
    "OrgSettings",
    "Departments",
    "ReadReceipts",
    "Tasks",
    "MediaMessages",
    "Polls",
    // Dashboard
    "Dashboard",
    "DashboardHealth",
    "DashboardTasks",
    // Workspace
    "WorkspaceInvites",
    "WorkspaceMembers",
    "Organizations",
    "WorkspaceUnreadCounts",
    // AI Knowledge
    "AISettings",
  ],
  endpoints: () => ({}),
});