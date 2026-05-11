// src/redux/feature/notificationApi.ts
// API endpoints cho Notification system

import { apiSlice } from "../api/baseApi";
import { NotificationsResponse } from "@/src/type/chat.types";

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy thông báo
    getNotifications: builder.query<NotificationsResponse, { limit?: number; cursor?: string; unreadOnly?: boolean } | void>({
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

    // Đánh dấu đã đọc
    markNotificationAsRead: builder.mutation<{ message: string }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Đánh dấu tất cả đã đọc
    markAllAsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Xóa thông báo
    deleteNotification: builder.mutation<{ message: string }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // Xóa tất cả
    clearAllNotifications: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/notifications",
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
} = notificationApi;
