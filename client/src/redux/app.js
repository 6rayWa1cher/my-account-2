import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { unwrapResult } from "@reduxjs/toolkit";

import { loadUserThunk } from "./auth";

const appSelector = (state) => state.app;

export const AppStateEnum = Object.freeze({
  OFF: "off",
  INITIALIZING: "initializing",
  RUNNING: "running",
  FAILED: "failed",
});

export const initApplication = createAsyncThunk(
  "app/init",
  async (_, { getState, dispatch, requestId, rejectWithValue }) => {
    const { currentRequestId, loading } = appSelector(getState());
    if (
      loading !== AppStateEnum.INITIALIZING ||
      requestId !== currentRequestId
    ) {
      return;
    }
    try {
      await dispatch(loadUserThunk()).then(unwrapResult);
    } catch (e) {
      return rejectWithValue("load user fail");
    }

    return "OK";
  }
);

export const loadingSelector = createSelector(
  appSelector,
  ({ loading }) => loading
);

export const errorSelector = createSelector(appSelector, ({ error }) => error);

export const app = createSlice({
  name: "app",
  initialState: {
    loading: AppStateEnum.OFF,
    initRequestId: null,
    currentRequestId: null,
    error: null,
  },
  reducers: {},
  extraReducers: {
    [initApplication.pending]: (state, action) => {
      if (state.loading === AppStateEnum.OFF) {
        state.loading = AppStateEnum.INITIALIZING;
        state.currentRequestId = action.meta.requestId;
      }
    },
    [initApplication.fulfilled]: (state, action) => {
      const { requestId } = action.meta;
      if (
        state.loading === AppStateEnum.INITIALIZING &&
        state.currentRequestId === requestId
      ) {
        state.loading = AppStateEnum.RUNNING;
        state.currentRequestId = null;
      }
    },
    [initApplication.rejected]: (state, action) => {
      const { requestId } = action.meta;
      if (
        state.loading === AppStateEnum.INITIALIZING &&
        state.currentRequestId === requestId
      ) {
        state.loading = AppStateEnum.FAILED;
        state.currentRequestId = null;
        state.error = action.payload;
      }
    },
  },
});

const reducer = app.reducer;
export default reducer;
