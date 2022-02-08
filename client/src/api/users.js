import { basicAxios } from "./utils";

export const getCurrentUserApi = () => basicAxios("/users/current");
