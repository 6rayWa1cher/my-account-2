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
import { exportToFilefly3 } from "../services/projectManager/index.js";
import {
  processAutomatizationRules,
  strategiesMap,
} from "../services/projectManager/index.js";
const router = express.Router();

const renderPageProjects = [
  getAllProjects,
  getAllAccounts,
  (req, res) =>
    res.render("pages/projects", {
      projects: req.projects.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt),
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
      await processAutomatizationRules(constructed, req.account);
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
      console.error(err.stack);
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

router.get("/:id/export", getProjectById(), (req, res) => {
  if (!req.project) {
    throw new Error("not found");
  }

  const transfers = req.project.transactionGroups.filter(
    (g) => g.transactionType === "Transfer"
  );
  const incomingTransferAccounts = [
    ...new Set(
      transfers.flatMap((g) => g.transactions).flatMap((t) => t.sourceName)
    ),
  ];
  const outgoingTransferAccounts = [
    ...new Set(
      transfers.flatMap((g) => g.transactions).flatMap((t) => t.destinationName)
    ),
  ];

  res.render("pages/projectExport", {
    project: req.project,
    incomingTransferAccounts,
    outgoingTransferAccounts,
    postLink: `/projects/${req.project._id}/export`,
  });
});

router.post("/:id/export", getProjectById(), async (req, res, next) => {
  try {
    if (!req.project) {
      throw new Error("not found");
    }
    const incomingTransferAccounts = Object.entries(req.body.incoming ?? {})
      .filter(([, v]) => v === "on")
      .map(([k]) => k);
    const outgoingTransferAccounts = Object.entries(req.body.outgoing ?? {})
      .filter(([, v]) => v === "on")
      .map(([k]) => k);

    const errors = await exportToFilefly3({
      project: req.project,
      incomingTransferAccounts: incomingTransferAccounts,
      outgoingTransferAccounts: outgoingTransferAccounts,
      accessToken: req.session.firefly.accessToken,
    });

    res.redirect(`/projects/${req.project._id}`);
  } catch (err) {
    next(err);
  }
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
      group.transactionType = newGroup.transactionType;
      project.lastUpdatedAt = new Date();

      await project.save();

      res.redirect(`/projects/${project._id}`);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

router.delete(
  "/:id/:group",
  getProjectById(),
  getGroupFromProject,
  async (req, res, next) => {
    try {
      if (!req.group) {
        throw new Error("not found");
      }
      req.project.transactionGroups = req.project.transactionGroups.filter(
        (g) => !g._id.equals(req.group._id)
      );
      await req.project.save();
      res.redirect(`/projects/${req.project._id}`);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
