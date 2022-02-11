import express from "express";
import Account from "../models/account.js";
import { getAllAccounts } from "../middlewares/entityExtractor.js";
import { body, validationResult } from "express-validator";
import { getAccountBasicInfoFromNameApi } from "../api/firefly3.js";
import { strategiesMap } from "../services/importStrategies.js";
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
  body("importStrategy").exists().isLength({ min: 5, max: 25 }),
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

export default router;
