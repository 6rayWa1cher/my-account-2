import express from "express";
import Account from "../models/account.js";
import { getAllAccounts } from "../middlewares/entityExtractor.js";
import { body, validationResult } from "express-validator";
import { getAccountBasicInfoFromNameApi } from "../api/firefly3.js";
const router = express.Router();

// router.get("/", (req, res, next) => {
//   Account.find({ owner: req.user.id }, (err, account) =>
//     err ? next(err) : res.send(account)
//   );
// });

// router.get("/:account", (req, res, next) => {
//   Account.findOne(
//     { owner: req.user.id, _id: req.params.account },
//     (err, account) => (err || !account ? next(err) : res.send(account))
//   );
// });

const renderPageAccounts = (req, res, options) =>
  getAllAccounts(req, res, () =>
    res.render("pages/accounts", {
      accounts: req.accounts,
      ...options,
    })
  );

router.get("/", getAllAccounts, (req, res) => {
  res.render("pages/accounts", { accounts: req.accounts });
});

router.post(
  "/",
  body("importStrategy").exists().isLength({ min: 5, max: 25 }),
  body("fireflyName").exists(),
  (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      renderPageAccounts(req, res, { validationErrors });
    } else {
      getAccountBasicInfoFromNameApi({
        name: req.body.fireflyName,
        accessToken: req.session.firefly.accessToken,
      })
        .then(async (acc) => {
          if (!acc || acc.length === 0) {
            throw new Error("account wasn't found on ff3");
          }
          return acc;
        })
        .then((acc) =>
          new Account({
            importStrategy: req.body.importStrategy,
            fireflyAccount: {
              id: acc[0].id,
              name: acc[0].name,
            },
            owner: req.user.id,
          }).save()
        )
        .then((v) => renderPageAccounts(req, res, { newAccount: v }))
        .catch((error) => {
          console.error(error);
          renderPageAccounts(req, res, { error });
        });
    }
  }
);

// router.put("/:account", (req, res, next) => {
//   Account.findOneAndReplace(
//     { owner: req.user.id, _id: req.params.account },
//     req.body,
//     (err, account) => (err || !account ? next(err) : res.send(account))
//   );
// });

// router.delete("/:account", (req, res, next) => {
//   Account.findOneAndDelete(
//     { owner: req.user.id, _id: req.params.account },
//     (err, account) => (err || !account ? next(err) : res.send(account))
//   );
// });

export default router;
