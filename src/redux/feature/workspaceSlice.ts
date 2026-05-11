import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WorkspaceState {
  currentWorkspaceId: string | null;
}

const getInitialState = (): WorkspaceState => {
  if (typeof window === 'undefined') {
    return { currentWorkspaceId: null };
  }
  
  const savedId = localStorage.getItem("currentWorkspaceId");
  return { currentWorkspaceId: savedId };
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: getInitialState(),
  reducers: {
    setWorkspace: (state, action: PayloadAction<string | null>) => {
      state.currentWorkspaceId = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem("currentWorkspaceId", action.payload);
        } else {
          localStorage.removeItem("currentWorkspaceId");
        }
      }
    },
  },
});

export const { setWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
