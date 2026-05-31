import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Observer {
  id: string;
  name: string;
}

interface ObserverState {
  // Mapping channelId -> Array of observing Admins
  channelObservers: Record<string, Observer[]>;
}

const initialState: ObserverState = {
  channelObservers: {},
};

const observerSlice = createSlice({
  name: "observer",
  initialState,
  reducers: {
    addObserver: (
      state,
      action: PayloadAction<{ channelId: string; admin: Observer }>
    ) => {
      const { channelId, admin } = action.payload;
      if (!state.channelObservers[channelId]) {
        state.channelObservers[channelId] = [];
      }
      // Avoid duplicate observers
      const exists = state.channelObservers[channelId].some(
        (obs) => obs.id === admin.id
      );
      if (!exists) {
        state.channelObservers[channelId].push(admin);
      }
    },
    removeObserver: (
      state,
      action: PayloadAction<{ channelId: string; adminId: string }>
    ) => {
      const { channelId, adminId } = action.payload;
      if (state.channelObservers[channelId]) {
        state.channelObservers[channelId] = state.channelObservers[
          channelId
        ].filter((obs) => obs.id !== adminId);
      }
    },
    clearObservers: (state, action: PayloadAction<string>) => {
      const channelId = action.payload;
      delete state.channelObservers[channelId];
    },
  },
});

export const { addObserver, removeObserver, clearObservers } =
  observerSlice.actions;
export default observerSlice.reducer;
