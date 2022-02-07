import express, { json, urlencoded } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import passport from "passport";
import expressSession from "express-session";
import connectMongo from "connect-mongo";
import db from "./db.js";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import { ensureLoggedIn } from "connect-ensure-login";

const app = express();

const __dirname = path.resolve();

db.init();

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: connectMongo.create({ mongoUrl: process.env.MONGODB_URL }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/users", ensureLoggedIn(), usersRouter);
app.use("/auth", authRouter);

export default app;
