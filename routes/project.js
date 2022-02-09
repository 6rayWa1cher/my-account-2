import express from "express";
import { body, validationResult } from "express-validator";
import {
  getAccountById,
  getAllAccounts,
  getAllProjects,
} from "../middlewares/entityExtractor.js";
import Project from "../models/project.js";
import { importTinkoff } from "../services/importStrategies.js";
const router = express.Router();

// router.get("/", (req, res, next) => {
//   Project.find({ owner: req.user.id }, (err, value) =>
//     err ? next(err) : res.send(value)
//   );
// });

// router.get("/:id", (req, res, next) => {
//   Project.findOne({ owner: req.user.id, _id: req.params.id }, (err, value) =>
//     err || !value ? next(err) : res.send(value)
//   );
// });

// router.post("/", (req, res, next) => {
//   new Project(req.body)
//     .save()
//     .then((v) => res.send(v))
//     .catch((err) => next(err));
// });

// router.put("/:id", (req, res, next) => {
//   Project.findOneAndReplace(
//     { owner: req.user.id, _id: req.params.id },
//     req.body,
//     (err, value) => (err || !value ? next(err) : res.send(value))
//   );
// });

// router.delete("/:id", (req, res, next) => {
//   Project.findOneAndDelete(
//     { owner: req.user.id, _id: req.params.id },
//     (err, value) => (err || !value ? next(err) : res.send(value))
//   );
// });
// router.get("/", (req, res) => {
//   Project.find({ owner: req.user.id }, (err, value) =>
//     err ? next(err) : res.render("pages/projects", { projects: value })
//   );
// });

const renderPageProjects = (req, res) =>
  getAllProjects(req, res, () =>
    getAllAccounts(req, res, () =>
      res.render("pages/projects", {
        projects: req.projects,
        accounts: req.accounts,
        validationErrors: validationResult(req),
        // error: err || req.processError,
        ...req.renderData,
      })
    )
  );

router.get("/", renderPageProjects);

router.post(
  "/",
  body("accountId").exists().isMongoId(),
  getAccountById({ field: "accountId" }),
  async (req, res, next) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return next();
    }
    if (!req.files.upload || req.files.upload.size === 0) {
      req.processError = new Error("File is missing of not uploaded");
      return next();
    }
    try {
      await importTinkoff({}, req.account, req.files.upload.data);
      next();
    } catch (err) {
      next(err);
    }
  },
  renderPageProjects
);

export default router;
