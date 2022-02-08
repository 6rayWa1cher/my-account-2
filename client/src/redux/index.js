import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import app from "./app";
// import users from "./users";
import auth from "./auth";

const store = (() => {
  const reducer = combineReducers({
    app,
    auth,
    // users,
  });

  const store = configureStore({ reducer });

  // createWrappedApiInterceptor(store);

  return store;
})();

export default store;
