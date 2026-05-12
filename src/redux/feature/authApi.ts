
import { apiSlice } from "../api/baseApi";
import { AuthResponse, LoginPhoneRequest, LoginRequest, RegisterRequest, RegisterOrgRequest } from "@/src/type/auth.types";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/signin",
        method: "POST",
        body: credentials,
      }),
    }),
    loginWithPhone: builder.mutation<AuthResponse, LoginPhoneRequest>({
      query: (credentials) => ({
        url: "/auth/signin-phone",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<{ message: string; user: any }, RegisterRequest>({
      query: (data) => ({
        url: "/auth/signup",
        method: "POST",
        body: data,
      }),
    }),
    registerOrganization: builder.mutation<{ message: string; user: any; organization: any }, RegisterOrgRequest>({
      query: (data) => ({
        url: "/auth/register-organization",
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation<void, { deviceId?: string }>({
      query: (body) => ({
        url: "/auth/signout",
        method: "POST",
        body,
      }),
    }),
    checkAuth: builder.query<{ authenticated: boolean; user: any }, void>({
      query: () => "/auth/check",
    }),
  }),
});

export const { 
  useLoginMutation, 
  useLoginWithPhoneMutation, 
  useRegisterMutation, 
  useRegisterOrganizationMutation,
  useLogoutMutation,
  useCheckAuthQuery
} = authApi;