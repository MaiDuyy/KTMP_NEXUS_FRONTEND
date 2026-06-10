// authSlice.ts
import { User } from "@/src/type/auth.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  permissions: string[]; // RBAC permissions
  roles: string[]; // User roles

}

// --- HÀM HELPER ĐỂ LẤY DỮ LIỆU TỪ LS (chỉ user info, KHÔNG lưu token) ---
const getInitialStateFromStorage = (): AuthState => {
  if (typeof window === 'undefined') {
    return { 
      user: null, 
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      permissions: [],
      roles: [],
  
    };
  }

  try {
    const userJson = localStorage.getItem("user"); 
    const user = userJson ? JSON.parse(userJson) : null;
    const token = localStorage.getItem("accessToken") || null;
    const refresh = localStorage.getItem("refreshToken") || null;
    const permissionsJson = localStorage.getItem("permissions");
    const permissions = permissionsJson ? JSON.parse(permissionsJson) : [];
    const rolesJson = localStorage.getItem("roles");
    const roles = rolesJson ? JSON.parse(rolesJson) : [];

    if (user && token) {
      return {
        user,
        token,
        refreshToken: refresh,
        isAuthenticated: true,
        permissions,
        roles,

      };
    }
  } catch (error) {
    console.error("Lỗi parse JSON từ localStorage", error);
  }

  return { 
    user: null, 
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    permissions: [],
    roles: [],

  };
};

// SỬ DỤNG HÀM TRÊN ĐỂ KHỞI TẠO
const initialState: AuthState = getInitialStateFromStorage();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string ,permissions?: string[]; roles?: string[]; }>
    ) => {
      const { user, accessToken, refreshToken, permissions = [], roles = [] } = action.payload;
      state.user = user;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      if (permissions.length > 0) state.permissions = permissions;
      if (roles.length > 0) state.roles = roles;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        if (permissions.length > 0) {
          localStorage.setItem("permissions", JSON.stringify(permissions));
        }
        if (roles.length > 0) {
          localStorage.setItem("roles", JSON.stringify(roles));
        }
      }
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.roles = [];

      
      if (typeof window !== 'undefined') {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("permissions");
        localStorage.removeItem("roles");
        localStorage.removeItem("currentWorkspaceId");
      }
    },
    tokenReceived: (state, action: PayloadAction<{ accessToken: string, refreshToken: string }>) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    // RBAC: Set permissions after fetching from API
    setPermissions: (state, action: PayloadAction<{ permissions: string[]; roles: string[] }>) => {
      state.permissions = action.payload.permissions;
      state.roles = action.payload.roles;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("permissions", JSON.stringify(action.payload.permissions));
        localStorage.setItem("roles", JSON.stringify(action.payload.roles));
      }
    },
  },
});

export const { setCredentials, logOut, tokenReceived, setPermissions } = authSlice.actions;
export default authSlice.reducer;