import { AppDispatch } from "../redux/store";
import { logOut } from "../redux/feature/authSlice";
import { setWorkspace } from "../redux/feature/workspaceSlice";
import { apiSlice } from "../redux/api/baseApi";

/**
 * Perform a complete logout by clearing all state and redirecting to login.
 * This is the most reliable way to prevent state leakage between user sessions.
 * 
 * @param dispatch Redux dispatch function
 */
export const performFullLogout = (dispatch: AppDispatch) => {
  // 1. Clear Redux slices
  dispatch(logOut());
  dispatch(setWorkspace(null));
  
  // 2. Clear RTK Query cache
  dispatch(apiSlice.util.resetApiState());
  
  // 3. Optional: Clear local storage items that might not be handled by slices
  if (typeof window !== 'undefined') {
    localStorage.removeItem("currentWorkspaceId");
    // Add any other custom LS keys here
    
    // 4. Perform a hard redirect to the login page to clean up all memory state
    // We use window.location.href instead of router.push to ensure a fresh start
    window.location.href = "/login";
  }
};
