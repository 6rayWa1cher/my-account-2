import { createAsyncThunk } from "@reduxjs/toolkit";

export const thunkWrapper = (func) => (arg, thunkApi) =>
  func(arg, thunkApi).catch((e) => {
    console.error("Thunk error", e);
    return thunkApi.rejectWithValue(
      e?.response
        ? (({ data, status, headers }) => ({ data, status, headers }))(
            e.response
          )
        : e?.message
        ? e.message
        : e
    );
  });

export const createAsyncThunkWrapped = (type, payloadCreator, options) =>
  createAsyncThunk(type, thunkWrapper(payloadCreator), options);
