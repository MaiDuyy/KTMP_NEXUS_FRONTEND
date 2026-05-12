// src/redux/feature/uploadApi.ts
// API endpoints cho Upload files

import { apiSlice } from "../api/baseApi";

export interface UploadResponse {
  message: string;
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
}

export interface FileServiceResponse {
  success: boolean;
  message: string;
  file: {
    id: string;
    url: string;
    mimeType: string;
    originalName: string;
    size: number;
    classification?: string;
  };
}

export const uploadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Upload single file (general)
    uploadFile: builder.mutation<UploadResponse, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),

    // Upload avatar (POST /api/upload/avatar)
    uploadAvatar: builder.mutation<UploadResponse, FormData>({
      query: (formData) => {
        return {
          url: "/upload/avatar",
          method: "POST",
          body: formData,
        };
      },
    }),

    // Upload group avatar (POST /api/upload/avatar)
    uploadGroupAvatar: builder.mutation<UploadResponse, FormData>({
      query: (formData) => {
        return {
          url: "/upload/avatar",
          method: "POST",
          body: formData,
        };
      },
    }),

    // Upload workspace icon (POST /upload/workspace-icon)
    uploadWorkspaceIcon: builder.mutation<UploadResponse, FormData>({
      query: (formData) => ({
        url: "/upload/workspace-icon",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Workspaces"],
    }),

    // Upload chat media (images, videos, files)
    uploadChatMedia: builder.mutation<FileServiceResponse, FormData>({
      query: (formData) => ({
        url: "/upload/chat",
        method: "POST",
        body: formData,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useUploadFileMutation,
  useUploadAvatarMutation,
  useUploadGroupAvatarMutation,
  useUploadWorkspaceIconMutation,
  useUploadChatMediaMutation,
} = uploadApi;

