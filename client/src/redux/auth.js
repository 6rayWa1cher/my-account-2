import { logoutApi } from "@api/auth";
import { getCurrentUserApi } from "@api/users";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import { createAsyncThunkWrapped } from "@utils/thunkWrapper";

export const loadUserThunk = createAsyncThunkWrapped("auth/load", async () => {
  const response = await getCurrentUserApi();
  return response.data;
});

export const logoutThunk = createAsyncThunkWrapped("auth/logout", async () => {
  await logoutApi();
  return "ok";
});

const initialState = {
  user: null,
};

const auth = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout() {
      return initialState;
    },
    setUser(state, { payload }) {
      state.user = payload;
    },
  },
  extraReducers: {
    [loadUserThunk.fulfilled]: (state, { payload }) => {
      state.user = payload;
    },
    [logoutThunk.fulfilled]: () => initialState,
    [logoutThunk.rejected]: () => initialState,
  },
});

const actions = auth.actions;
export const logout = actions.logout;
export const setUser = actions.setUser;

const authSelector = (state) => state.auth;
export const getCurrentUserSelector = createSelector(
  authSelector,
  (auth) => auth.user
);

export default auth.reducer;
