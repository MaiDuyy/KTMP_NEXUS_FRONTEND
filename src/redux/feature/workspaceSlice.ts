import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WorkspaceState {
  currentWorkspaceId: string | null;
  currentDepartmentId: string | null;
}

const getInitialState = (): WorkspaceState => {
  if (typeof window === 'undefined') {
    return { currentWorkspaceId: null, currentDepartmentId: null };
  }
  
  const savedWsId = localStorage.getItem("currentWorkspaceId");
  const savedDeptId = localStorage.getItem("currentDepartmentId");
  return { 
    currentWorkspaceId: savedWsId,
    currentDepartmentId: savedDeptId,
  };
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
    setDepartment: (state, action: PayloadAction<string | null>) => {
      state.currentDepartmentId = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem("currentDepartmentId", action.payload);
        } else {
          localStorage.removeItem("currentDepartmentId");
        }
      }
    },
  },
});

export const { setWorkspace, setDepartment } = workspaceSlice.actions;
export default workspaceSlice.reducer;
