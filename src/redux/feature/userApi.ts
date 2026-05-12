// src/redux/feature/userApi.ts
// API endpoints cho User profile và settings

import { apiSlice } from "../api/baseApi";
import { User } from "@/src/type/auth.types";

interface UpdateProfileResponse {
  message: string;
  user: User;
}

interface ChangePasswordResponse {
  message: string;
}

interface UploadResponse {
  message: string;
  url: string;
  fileType: string;
  fileName: string;
  fileSize: number;
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get profile
    getProfile: builder.query<{ user: User }, void>({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),

    // Search Company Directory
    searchDirectory: builder.query<{ users: User[] }, { searchTerm: string; workspaceId?: string }>({
      query: ({ searchTerm, workspaceId }) => {
        let url = `/users/directory?q=${encodeURIComponent(searchTerm)}`;
        if (workspaceId) url += `&workspaceId=${workspaceId}`;
        return url;
      },
    }),


    // Update profile
    updateProfile: builder.mutation<UpdateProfileResponse, FormData>({
      query: (formData) => ({
        url: "/users/profile",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),

    // Change password
    changePassword: builder.mutation<ChangePasswordResponse, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "PUT",
        body,
      }),
    }),

    // Upload file (avatar, chat attachments)
    uploadFile: builder.mutation<any, { file: File; type: "avatar" | "chat" | "group"; chatId?: string }>({
      query: ({ file, type, chatId }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (chatId) formData.append("chatId", chatId);
        return {
          url: `/upload/${type}`,
          method: "POST",
          body: formData,
        };
      },
    }),

    // Upload multiple files
    uploadFiles: builder.mutation<{ files: UploadResponse[] }, { files: File[]; type: "chat" }>({
      query: ({ files, type }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("type", type);
        return {
          url: "/upload/multiple",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetProfileQuery,
  useSearchDirectoryQuery,
  useLazySearchDirectoryQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadFileMutation,
  useUploadFilesMutation,
} = userApi;
