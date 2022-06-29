import express from "express";
import Account from "../models/account.js";
import {
  getAllAccounts,
  getAccountById,
  getRuleFromAccountById,
} from "../middlewares/entityExtractor.js";
import { body, validationResult } from "express-validator";
import { getAccountBasicInfoFromNameApi } from "../api/firefly3.js";
import { strategiesMap, scopesMap } from "../services/projectManager/index.js";
const router = express.Router();

const renderPageAccounts = [
  getAllAccounts,
  (req, res) =>
    res.render("pages/accounts", {
      accounts: req.accounts,
      validationErrors: validationResult(req),
      processError: req.processError,
      importStrategies: Object.entries(strategiesMap).map(
        ([internalReference, { name }]) => ({ internalReference, name })
      ),
      ...req.renderData,
    }),
];

router.get("/", renderPageAccounts);

router.post(
  "/",
  body("importStrategy").exists().isIn(Object.keys(strategiesMap)),
  body("fireflyName").exists(),
  async (req, res, next) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return next();
    }
    try {
      const fireflyAccounts = await getAccountBasicInfoFromNameApi({
        name: req.body.fireflyName,
        accessToken: req.session.firefly.accessToken,
      });
      if (!fireflyAccounts || fireflyAccounts.length === 0) {
        throw new Error("account wasn't found on ff3");
      }
      const fireflyAccount = fireflyAccounts[0];
      const saved = await new Account({
        importStrategy: req.body.importStrategy,
        fireflyAccount: {
          id: fireflyAccount.id,
          name: fireflyAccount.name,
        },
        owner: req.user.id,
      }).save();
      console.log(saved.toString());
    } catch (error) {
      console.error(error);
      req.processError = error;
    }
    next();
  },
  renderPageAccounts
);

const renderPageAccount = [
  getAccountById(),
  (req, res) =>
    res.render("pages/account", {
      account: req.account,
      validationErrors: validationResult(req),
      processError: req.processError,
      scopesMap,
      addRuleLink: `/accounts/${req.account._id}/rule`,
      deleteLink: `/accounts/${req.account._id}?_method=DELETE`,
      ...req.renderData,
    }),
];

router.get("/:id", renderPageAccount);

router.delete("/:id", getAccountById(), (req, res, next) => {
  if (!req.account) {
    throw new Error("not found");
  }
  Account.findByIdAndDelete(req.params.id, (err) => {
    if (err) next(err);
    res.redirect("/accounts");
  });
});

router.get(
  "/:id/:rule",
  getAccountById(),
  getRuleFromAccountById(),
  (req, res) => {
    if (!req.rule) {
      throw new Error("not found");
    }
    res.render("pages/ruleEdit", {
      rule: req.rule,
      scopesMap,
      deleteLink: `/accounts/${req.account._id}/${req.rule._id}?_method=DELETE`,
      putLink: `/accounts/${req.account._id}/${req.rule._id}?_method=PUT`,
    });
  }
);

const ruleValidation = [
  body("trigger").exists().isString(),
  body("action").exists().isString(),
  body("note").exists().isString().isLength({ min: 3, max: 30 }),
  body("scope").exists().isString().isIn(Object.keys(scopesMap)),
];

router.post(
  "/:id/rule",
  ruleValidation,
  getAccountById(),
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return next();
      }
      if (!req.account) {
        throw new Error("not found");
      }
      const account = req.account;
      account.automatizationRules.push(req.body);
      await account.save();
      res.redirect(`/accounts/${account._id}`);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

router.put(
  "/:id/:rule",
  ruleValidation,
  getAccountById(),
  getRuleFromAccountById(),
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return next();
      }
      if (!req.rule) {
        throw new Error("not found");
      }

      const rule = req.rule;
      rule.trigger = req.body.trigger;
      rule.action = req.body.action;
      rule.note = req.body.note;
      rule.scope = req.body.scope;

      await req.account.save();
      res.redirect(`/accounts/${req.account._id}`);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

router.delete(
  "/:id/:rule",
  getAccountById(),
  getRuleFromAccountById(),
  async (req, res, next) => {
    try {
      if (!req.rule) {
        throw new Error("not found");
      }
      req.account.automatizationRules = req.account.automatizationRules.filter(
        (r) => !r._id.equals(req.rule._id)
      );
      await req.account.save();
      res.redirect(`/accounts/${req.account._id}`);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
