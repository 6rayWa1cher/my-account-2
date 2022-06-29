import express, { json, urlencoded } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import passport from "passport";
import expressSession from "express-session";
import connectMongo from "connect-mongo";
import db from "./db.js";
import { ensureLoggedIn } from "connect-ensure-login";
import fileUpload from "express-fileupload";
import methodOverride from "method-override";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import accountRouter from "./routes/account.js";
import projectRouter from "./routes/project.js";

const app = express();

const __dirname = path.resolve();

db.init();
app.set("view engine", "ejs");
// app.set("view options", { closeDelimiter: '/>' });
app.use(methodOverride("_method"));
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: true }));
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
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

const ensureLogIn = () => ensureLoggedIn({ redirectTo: "/auth/login" });

app.use("/", indexRouter);
app.use("/users", ensureLogIn(), usersRouter);
app.use("/auth", authRouter);
app.use("/accounts", ensureLogIn(), accountRouter);
app.use("/projects", ensureLogIn(), projectRouter);

app.use((req, res) => {
  try {
    res.render("pages/errorPage", {
      code: 404,
      message: "Страница не найдена",
    });
  } catch (err2) {
    res.status(500).json({ firstError: 404, secondError: err2.stack });
  }
});

app.use(function (err, req, res, next) {
  const isNotFound = ~err.message.indexOf("not found");
  const isCastError = ~err.message.indexOf("Cast to ObjectId failed");
  if (err.message && (isNotFound || isCastError)) {
    return next();
  }

  console.error(err.stack);

  try {
    res.render("pages/errorPage", { code: 500, message: err.stack });
  } catch (err2) {
    res.status(500).json({ firstError: err.stack, secondError: err2.stack });
  }
});

export default app;
