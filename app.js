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
import accountRouter from "./routes/account.js";
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

const ensureLogIn = () => ensureLoggedIn({ redirectTo: "/auth/login" });
app.use("/", indexRouter);
app.use("/users", ensureLogIn(), usersRouter);
app.use("/auth", authRouter);
app.use("/accounts", ensureLogIn(), accountRouter);

app.use((err, req, res, next) => {
  const isNotFound = ~err.message.indexOf("not found");
  const isCastError = ~err.message.indexOf("Cast to ObjectId failed");
  if (err.message && (isNotFound || isCastError)) {
    return next();
  }

  console.log(err.stack);

  res.status(500).json({ error: err.stack });
});

app.use((req, res) => {
  res.sendStatus(404);
});

export default app;
