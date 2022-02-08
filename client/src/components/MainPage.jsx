import { Button, Link } from "@mui/material";
import { getCurrentUserSelector, logoutThunk } from "@redux/auth";
import React from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

const MainPage = () => {
  const { email } = useSelector(getCurrentUserSelector) || {};

  const dispatch = useDispatch();

  const onClick = () => dispatch(logoutThunk());

  return (
    <p>
      {email} <Button onClick={onClick}>Выйти</Button>
    </p>
  );
};

export default MainPage;
