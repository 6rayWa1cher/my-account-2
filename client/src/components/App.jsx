import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import PreloaderWrapper from "@components/PreloaderWrapper";
import MainElement from "./MainElement";
import MainPage from "./MainPage";

const App = () => (
  <SnackbarProvider maxSnack={3} autoHideDuration={5000}>
    <PreloaderWrapper>
      <Router>
        <Routes>
          <Route path="/" element={<MainElement />}>
            <Route index element={<MainPage />} />
          </Route>
        </Routes>
      </Router>
    </PreloaderWrapper>
  </SnackbarProvider>
);

export default App;
