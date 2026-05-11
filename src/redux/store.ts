import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/baseApi";
import authReducer from "./feature/authSlice";
import workspaceReducer from "./feature/workspaceSlice";
import "./feature/aiApi";
import "./feature/channelApi";
import "./feature/threadApi";
import "./feature/rbacApi";
import "./feature/auditApi";
import "./feature/knowledgeApi";
import "./feature/adminApi";
import "./feature/messageApi";
import "./feature/chatApi";
import "./feature/friendApi";
import "./feature/notificationApi";
import "./feature/accountApi";
import "./feature/userApi";
import "./feature/uploadApi";
import "./feature/otpApi";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    workspace: workspaceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;