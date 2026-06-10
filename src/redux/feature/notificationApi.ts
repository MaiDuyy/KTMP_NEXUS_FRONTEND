// src/redux/feature/notificationApi.ts
// API endpoints cho Notification system

import { apiSlice } from "../api/baseApi";
import { NotificationsResponse, NotificationType } from "@/src/type/chat.types";

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy thông báo (có filter theo type/unreadOnly)
    getNotifications: builder.query<NotificationsResponse, { limit?: number; cursor?: string; unreadOnly?: boolean; type?: NotificationType } | void>({
      query: (params) => ({
        url: "/notifications",
        params: params || {},
      }),
      providesTags: ["Notifications"],
    }),

    // Đếm thông báo chưa đọc
    getUnreadCount: builder.query<{ unreadCount: number }, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),

    // Đánh dấu đã đọc (PATCH — khớp với backend)
    markNotificationAsRead: builder.mutation<{ success: boolean }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Đánh dấu tất cả đã đọc (PATCH — khớp với backend)
    markAllAsRead: builder.mutation<{ success: boolean; count: number }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Xóa một thông báo
    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Xóa tất cả thông báo
    clearAllNotifications: builder.mutation<{ success: boolean; count: number }, void>({
      query: () => ({
        url: "/notifications",
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Xóa thông báo đã đọc
    clearReadNotifications: builder.mutation<{ success: boolean; count: number }, void>({
      query: () => ({
        url: "/notifications/read",
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Xóa thông báo theo danh mục/type
    deleteNotificationsByCategory: builder.mutation<{ success: boolean; count: number }, NotificationType>({
      query: (type) => ({
        url: `/notifications/category/${type}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useClearReadNotificationsMutation,
  useDeleteNotificationsByCategoryMutation,
} = notificationApi;
