import express from "express";
import Account from "../models/account.js";
const router = express.Router();

router.get("/", (req, res, next) => {
  Account.find({ owner: req.user.id }, (err, account) =>
    err ? next(err) : res.send(account)
  );
});

router.get("/:account", (req, res, next) => {
  Account.findOne(
    { owner: req.user.id, _id: req.params.account },
    (err, account) => (err || !account ? next(err) : res.send(account))
  );
});

router.post("/", (req, res, next) => {
  new Account(req.body)
    .save()
    .then((v) => res.send(v))
    .catch((err) => next(err));
});

router.put("/:account", (req, res, next) => {
  Account.findOneAndReplace(
    { owner: req.user.id, _id: req.params.account },
    req.body,
    (err, account) => (err || !account ? next(err) : res.send(account))
  );
});

router.delete("/:account", (req, res, next) => {
  Account.findOneAndDelete(
    { owner: req.user.id, _id: req.params.account },
    (err, account) => (err || !account ? next(err) : res.send(account))
  );
});

export default router;
