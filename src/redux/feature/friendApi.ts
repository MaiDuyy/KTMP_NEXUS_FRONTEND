// src/redux/feature/friendApi.ts
// API endpoints cho Friend system

import { apiSlice } from "../api/baseApi";
import {
  FriendsListResponse,
  FriendRequestsResponse,
  SearchUsersResponse,
  BlockedUser,
} from "@/src/type/chat.types";

export const friendApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy danh sách bạn bè
    getFriends: builder.query<FriendsListResponse, { search?: string; online?: boolean } | void>({
      query: (params) => ({
        url: "/friends",
        params: params || {},
      }),
      providesTags: ["Friends"],
    }),

    // Tìm kiếm người dùng
    searchUsers: builder.query<SearchUsersResponse, string>({
      query: (q) => `/friends/search?q=${encodeURIComponent(q)}`,
    }),

    // Lấy lời mời đã nhận
    getReceivedRequests: builder.query<FriendRequestsResponse, void>({
      query: () => "/friends/requests/received",
      providesTags: ["FriendRequests"],
    }),

    // Lấy lời mời đã gửi
    getSentRequests: builder.query<FriendRequestsResponse, void>({
      query: () => "/friends/requests/sent",
      providesTags: ["FriendRequests"],
    }),

    // Gửi lời mời kết bạn
    sendFriendRequest: builder.mutation<{ message: string }, { receiverId: string }>({
      query: (body) => ({
        url: "/friends/request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FriendRequests"],
    }),

    // Chấp nhận lời mời
    acceptFriendRequest: builder.mutation<{ message: string; chatId: string }, string>({
      query: (requestId) => ({
        url: `/friends/accept/${requestId}`,
        method: "POST",
      }),
      invalidatesTags: ["Friends", "FriendRequests", "Chats"],
    }),

    // Từ chối lời mời
    rejectFriendRequest: builder.mutation<{ message: string }, string>({
      query: (requestId) => ({
        url: `/friends/reject/${requestId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FriendRequests"],
    }),

    // Hủy lời mời đã gửi
    cancelFriendRequest: builder.mutation<{ message: string }, string>({
      query: (requestId) => ({
        url: `/friends/cancel/${requestId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FriendRequests"],
    }),

    // Hủy kết bạn
    unfriend: builder.mutation<{ message: string }, string>({
      query: (friendId) => ({
        url: `/friends/${friendId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Friends"],
    }),

    // Chặn người dùng
    blockUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `/friends/block/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Friends", "Blocked"],
    }),

    // Bỏ chặn
    unblockUser: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `/friends/unblock/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Blocked"],
    }),

    // Lấy danh sách người bị chặn
    getBlockedUsers: builder.query<{ blockedUsers: BlockedUser[] }, void>({
      query: () => "/friends/blocked",
      providesTags: ["Blocked"],
    }),
  }),
});

export const {
  useGetFriendsQuery,
  useSearchUsersQuery,
  useLazySearchUsersQuery,
  useGetReceivedRequestsQuery,
  useGetSentRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useUnfriendMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockedUsersQuery,
} = friendApi;
