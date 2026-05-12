export type RoleType = "SUPER_ADMIN" | "ADMIN" | "WORKSPACE_OWNER" | "WORKSPACE_ADMIN" | "WORKSPACE_MEMBER" | "WORKSPACE_GUEST";

// Standard backend API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  number: string;
  avatar?: string;
  status?: string;
  birthDate?: string;
  location?: string;
  gender?: string;
  role: RoleType;
  isVerified: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
  currentAvatars?: string[];
  pushToken?: string;
  isSuspended?: boolean;
  suspendReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;

}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  permissions?: string[];
  roles?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
}

export interface LoginPhoneRequest {
  number: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  number: string;
  password: string;
  gender?: string;
  birthDate?: string;
  location?: string;
  role?: RoleType;
}

export interface RegisterOrgRequest extends RegisterRequest {
  organizationName: string;
  workspaceName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==================== OTP Types ====================

export type OTPType = "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL";

export interface SendOTPRequest {
  email: string;
}

export interface VerifyEmailOTPRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface VerifyOTPRequest {
  email: string;
  code: string;
  type: OTPType;
}

export interface ResendOTPRequest {
  email: string;
  type: OTPType;
}

export interface OTPResponse {
  message: string;
  expiresIn?: number;
  retryAfter?: number;
}

export interface VerifyOTPResponse {
  valid: boolean;
  message: string;
}

// ==================== Account Types ====================

export interface AccountDetails extends User {
  currentAvatars: string[];
}

export interface UpdateAccountRequest {
  name?: string;
  birthDate?: string;
  location?: string;
  gender?: string;
  pushToken?: string;
}

export interface UpdateStatusRequest {
  status: string;
}

export interface UpdateOnlineStatusRequest {
  isOnline: boolean;
}

export interface SelectAvatarRequest {
  avatarUrl: string;
}

export interface AvatarHistoryResponse {
  currentAvatar: string | null;
  avatarHistory: string[];
}

export interface UploadAvatarResponse {
  message: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    currentAvatars: string[];
  };
}

export interface UserActivityStatus {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    status: string | null;
    isOnline: boolean;
    lastSeen: string | null;
    lastSeenText: string;
  };
}