// src/redux/feature/accountApi.ts
// API endpoints cho quản lý tài khoản - avatar, status, thông tin

import { apiSlice } from "../api/baseApi";
import {
  AccountDetails,
  UpdateAccountRequest,
  UpdateStatusRequest,
  UpdateOnlineStatusRequest,
  SelectAvatarRequest,
  AvatarHistoryResponse,
  UploadAvatarResponse,
  UserActivityStatus,
  User,
} from "@/src/type/auth.types";

export const accountApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy thông tin tài khoản
    getAccountDetails: builder.query<{ user: AccountDetails }, void>({
      query: () => "/users/account",
      providesTags: ["User"],
    }),

    // Cập nhật thông tin tài khoản
    updateAccount: builder.mutation<{ message: string; user: User }, UpdateAccountRequest>({
      query: (data) => ({
        url: "/users/account",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User", "Chats"],
    }),

    // Upload avatar (FormData)
    uploadAvatar: builder.mutation<UploadAvatarResponse, FormData>({
      query: (formData) => ({
        url: "/upload/avatar",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["User", "Chats"],
    }),

    // Xóa avatar
    deleteAvatar: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/upload/avatar",
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Chats"],
    }),

    // Lấy lịch sử avatar
    getAvatarHistory: builder.query<AvatarHistoryResponse, void>({
      query: () => "/users/profile",
    }),

    // Chọn avatar từ lịch sử
    selectAvatar: builder.mutation<{ message: string; avatar: string }, SelectAvatarRequest>({
      query: (data) => ({
        url: "/users/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User", "Chats"],
    }),

    // Cập nhật trạng thái (status text)
    updateStatus: builder.mutation<{ message: string; status: string | null }, UpdateStatusRequest>({
      query: (data) => ({
        url: "/users/status",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Cập nhật online/offline
    updateOnlineStatus: builder.mutation<
      { message: string; isOnline: boolean; lastSeen: string },
      UpdateOnlineStatusRequest
    >({
      query: (data) => ({
        url: "/users/online-status",
        method: "PUT",
        body: data,
      }),
    }),

    // Heartbeat
    heartbeat: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/users/heartbeat",
        method: "POST",
      }),
    }),

    // Lấy trạng thái hoạt động của user khác
    getUserActivityStatus: builder.query<UserActivityStatus, string>({
      query: (userId) => `/users/${userId}/status`,
    }),
  }),
});

export const {
  useGetAccountDetailsQuery,
  useUpdateAccountMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useGetAvatarHistoryQuery,
  useSelectAvatarMutation,
  useUpdateStatusMutation,
  useUpdateOnlineStatusMutation,
  useHeartbeatMutation,
  useGetUserActivityStatusQuery,
} = accountApi;
