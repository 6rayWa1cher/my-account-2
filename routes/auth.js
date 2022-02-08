import express from "express";
import passport from "passport";
import OAuth2Strategy from "passport-oauth2";
import crypto from "crypto";
import logger from "morgan";
import fetch from "node-fetch";
import User from "../models/user.js";
const router = express.Router();

class FireflyOAuth2Strategy extends OAuth2Strategy {
  constructor({ url, clientID, clientSecret, callbackURL, ...rest }, verify) {
    super(
      {
        authorizationURL: `${url}/oauth/authorize`,
        tokenURL: `${url}/oauth/token`,
        clientID,
        clientSecret,
        callbackURL,
        ...rest,
      },
      verify
    );
    this.userInfoURL = `${url}/api/v1/about/user`;
  }

  userProfile(accessToken, done) {
    return fetch(this.userInfoURL, {
      headers: { Authorization: "Bearer " + accessToken },
    })
      .then((res) => res.json())
      .then((result) => done(null, result.data))
      .catch((e) => done(e, null));
  }
}

passport.use(
  new FireflyOAuth2Strategy(
    {
      url: process.env.FIREFLY_III_URL,
      clientID: process.env.FIREFLY_III_CLIENT_ID,
      clientSecret: process.env.FIREFLY_III_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/fireflyiii/callback`,
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, profile, done) => {
      const {
        id,
        attributes: { blocked, email },
      } = profile;

      if (blocked) {
        done(new Error("Firefly user id blocked"), null);
      }

      req.session.firefly = {
        accessToken,
        refreshToken,
      };

      User.findOne({ fireflyId: id }, (err, user) =>
        user || err
          ? done(err, user)
          : new User({ fireflyId: id, email }).save((err, user) =>
              done(err, user)
            )
      );
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

router.get("/fireflyiii", passport.authenticate("oauth2"));

router.get(
  "/fireflyiii/callback",
  passport.authenticate("oauth2", { failureRedirect: "/auth/login" }),
  (req, res, next) => {
    res.redirect(req.session.returnTo ?? "/");
  }
);

router.get("/login", (req, res) => res.redirect("/auth/fireflyiii"));

router.get("/logout", (req, res) => {
  req.logout();
});

export default router;
