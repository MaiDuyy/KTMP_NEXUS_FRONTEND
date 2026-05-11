// src/redux/feature/otpApi.ts
// API endpoints cho OTP - kết hợp auth service + notification service routes

import { apiSlice } from "../api/baseApi";

// Response types
interface OtpSuccessResponse {
  success: boolean;
  message: string;
  resendAvailableIn?: number;
}

// ==========================================
// Auth Service OTP routes (email verification after signup)
// Gateway: /api/auth/verify-otp, /api/auth/resend-otp
// ==========================================
// Notification Service OTP routes (forgot password, generic OTP)
// Gateway: /api/otp/request, /api/otp/resend, /api/otp/verify
// ==========================================

export const otpApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // === AUTH SERVICE: Verify email OTP (sau signup) ===
    verifyEmailOTP: builder.mutation<OtpSuccessResponse, { email: string; code: string }>({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data,
      }),
    }),

    // === AUTH SERVICE: Resend verification OTP ===
    resendVerificationOTP: builder.mutation<OtpSuccessResponse, { email: string }>({
      query: (data) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: data,
      }),
    }),

    // === NOTIFICATION SERVICE: Send OTP (forgot password, etc.) ===
    sendVerificationOTP: builder.mutation<OtpSuccessResponse, { email: string }>({
      query: (data) => ({
        url: "/otp/request",
        method: "POST",
        body: { ...data, type: "VERIFY_EMAIL" },
      }),
    }),

    sendForgotPasswordOTP: builder.mutation<OtpSuccessResponse, { email: string }>({
      query: (data) => ({
        url: "/otp/request",
        method: "POST",
        body: { ...data, type: "RESET_PASSWORD" },
      }),
    }),

    // === NOTIFICATION SERVICE: Reset password with OTP ===
    resetPasswordWithOTP: builder.mutation<OtpSuccessResponse, { email: string; code: string; newPassword: string }>({
      query: (data) => ({
        url: "/otp/verify",
        method: "POST",
        body: { email: data.email, otpCode: data.code, type: "RESET_PASSWORD" },
      }),
    }),

    // === NOTIFICATION SERVICE: Resend OTP (generic) ===
    resendOTP: builder.mutation<OtpSuccessResponse, { email: string; type: "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL" }>({
      query: (data) => ({
        url: "/otp/resend",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useVerifyEmailOTPMutation,
  useResendVerificationOTPMutation,
  useSendVerificationOTPMutation,
  useSendForgotPasswordOTPMutation,
  useResetPasswordWithOTPMutation,
  useResendOTPMutation,
} = otpApi;
