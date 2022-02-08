import { basicAxios } from "./utils";

export const logoutApi = () => basicAxios.get("/auth/logout");
