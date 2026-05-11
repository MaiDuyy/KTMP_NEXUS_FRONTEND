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

    // Upload chat media (images, videos, files)
    uploadChatMedia: builder.mutation<FileServiceResponse, FormData>({
      query: (formData) => {
        return {
          url: "/upload/chat", // calls api-gateway proxy '/upload/chat' -> file-service '/chat'
          method: "POST",
          body: formData, // the body MUST contain 'file' and optionally 'chatId'
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useUploadFileMutation,
  useUploadAvatarMutation,
  useUploadGroupAvatarMutation,
  useUploadChatMediaMutation,
} = uploadApi;

