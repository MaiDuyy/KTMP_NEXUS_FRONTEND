import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
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
        // Gọi API refresh token (server đọc refreshToken từ cookie)
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh-token",
            method: "POST",
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Refresh thành công - server đã set cookie mới
          const data = refreshResult.data as { accessToken: string; refreshToken: string };
          
          // Dispatch để cập nhật state (không lưu token, chỉ mark authenticated)
          api.dispatch(tokenReceived(data));
          
          // Retry request ban đầu với cookie mới
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh thất bại -> Force logout
          api.dispatch(logOut());
        }
      } finally {
        release();
      }
    }
  }

  // 3. Nếu lỗi 403 (Forbidden) -> Không có quyền trong Workspace
  if (result.error && result.error.status === 403) {
    toast.error("Bạn không có quyền thực hiện hành động này trong Workspace này!");
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
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
    // Dashboard
    "Dashboard",
    "DashboardHealth",
    "DashboardTasks",
    // Workspace
    "WorkspaceInvites",
    "WorkspaceMembers",
    "Organizations"
  ],
  endpoints: () => ({}),
});