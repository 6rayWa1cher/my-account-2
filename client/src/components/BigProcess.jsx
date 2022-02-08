import { CircularProgress } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";

const BigProcess = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
    }}
  >
    <CircularProgress />
  </Box>
);

export default BigProcess;
