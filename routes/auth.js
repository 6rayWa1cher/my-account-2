var express = require("express");
var passport = require("passport");
var OAuth2Strategy = require("passport-oauth2");
var crypto = require("crypto");
var router = express.Router();
var logger = require("morgan");

class FireflyIIIOAuth2Strategy extends OAuth2Strategy {
  constructor({ url, clientID, clientSecret, callbackURL }, verify) {
    super(
      {
        authorizationURL: `${url}/oauth/authorize`,
        tokenURL: `${url}/oauth/token`,
        clientID,
        clientSecret,
        callbackURL,
      },
      verify
    );
    this.userInfoURL = `${url}/api/v1/about/user`;
  }

  userProfile(accessToken, done) {}
}

passport.use(
  new FireflyIIIOAuth2Strategy(
    {
      url: process.env.FIREFLY_III_URL,
      clientID: process.env.FIREFLY_III_CLIENT_ID,
      clientSecret: process.env.FIREFLY_III_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/fireflyiii/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ exampleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

router.get("/fireflyiii", passport.authenticate("oauth2"));

router.get(
  "/fireflyiii/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

module.exports = router;
