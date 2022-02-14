import express from "express";
import { body, validationResult } from "express-validator";
import { eraseEmptyStrings } from "../middlewares/body.js";
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
    if (!req.files?.upload || req.files?.upload?.size === 0) {
      req.processError = new Error("File is missing of not uploaded");
      return next();
    }
    try {
      const { func } = strategiesMap[req.account.importStrategy];
      const constructed = await func(req.account, req.files.upload.data);
      constructed.transactionGroups.sort((a, b) => b.date - a.date);
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

const getGroupFromProject = (req, res, next) => {
  if (!req.project) {
    next(new Error("not found"));
  }
  const group = req.project.transactionGroups.find(
    (g) => g._id == req.params.group
  );
  if (!group) {
    next(new Error("not found"));
  }
  req.group = group;
  next();
};

const renderTransactionGroupEdit = [
  getProjectById(),
  getGroupFromProject,
  (req, res) => {
    const group = req.group;
    res.render("pages/transactionGroupEdit", {
      group,
      putLink: `/projects/${req.project._id}/${group._id}?_method=PUT`,
      deleteLink: `/projects/${req.project._id}/${group._id}?_method=DELETE`,
    });
  },
];

router.get("/:id/:group", renderTransactionGroupEdit);

router.put(
  "/:id/:group",
  eraseEmptyStrings(),
  getProjectById(),
  getGroupFromProject,
  async (req, res, next) => {
    try {
      const project = req.project;
      const group = req.group;
      const newGroup = req.body;

      group.groupTitle = newGroup.groupTitle;
      group.transactions = newGroup.transactions;
      group.transactions.forEach((transaction, i) => {
        transaction.amount = `-${transaction.amount}`;
        transaction.tags = newGroup.transactions[i].tags?.split?.(",");
      });
      project.lastUpdatedAt = new Date();

      await project.save();

      res.redirect(`/projects/${project._id}`);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

export default router;
