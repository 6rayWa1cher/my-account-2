import { ensureLoggedIn } from "connect-ensure-login";

export const ensureLogIn = () => ensureLoggedIn({ redirectTo: "/auth/fail" });
