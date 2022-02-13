import express from "express";
import { body, validationResult } from "express-validator";
import {
  getAccountById,
  getProjectById,
  getAllAccounts,
  getAllProjects,
} from "../middlewares/entityExtractor.js";
import Project from "../models/project.js";
import { strategiesMap } from "../services/projectManager.js";
const router = express.Router();

const renderPageProjects = [
  getAllProjects,
  getAllAccounts,
  (req, res) =>
    res.render("pages/projects", {
      projects: req.projects,
      accounts: req.accounts,
      validationErrors: validationResult(req),
      processError: req.processError,
      ...req.renderData,
    }),
];

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
      const { func } = strategiesMap[req.account.importStrategy];
      const constructed = await func(req.account, req.files.upload.data);
      const projectName = `Проект счета '${
        req.account.fireflyAccount.name
      }' от ${new Date().toLocaleString("ru-RU")}`;
      const saved = await new Project({
        ...constructed,
        name: projectName,
      }).save();
      console.log(saved.toString());
      res.redirect(`/projects/${saved._id}`);
    } catch (err) {
      req.processError = err;
      console.error(err);
      next();
    }
  },
  renderPageProjects
);

router.get("/:id", getProjectById(), (req, res) => {
  if (!req.project) {
    throw new Error("not found");
  }
  res.render("pages/project", {
    project: req.project,
    deleteLink: `/projects/${req.project._id}?_method=DELETE`,
  });
});

router.delete("/:id", getProjectById(), (req, res, next) => {
  if (!req.project) {
    throw new Error("not found");
  }
  Project.findByIdAndDelete(req.params.id, (err) => {
    if (err) next(err);
    res.redirect("/projects");
  });
});

export default router;
