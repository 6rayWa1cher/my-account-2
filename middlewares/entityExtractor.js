import Account from "../models/account.js";
import Project from "../models/project.js";
import mongoose from "mongoose";

export const getAllProjects = (req, res, next) =>
  Project.find({ owner: req.user.id })
    .then((projects) => {
      req.projects = projects;
      next();
    })
    .catch((err) => next(err));

export const getAllAccounts = (req, res, next) =>
  Account.find({ owner: req.user.id })
    .then((accounts) => {
      req.accounts = accounts;
      next();
    })
    .catch((err) => next(err));

export const getAccountById =
  ({ field, path = "id" } = {}) =>
  (req, res, next) =>
    Account.findOne({
      owner: req.user.id,
      _id: field ? req.body[field] : req.params[path],
    })
      .then((account) => {
        req.account = account;
        next();
      })
      .catch((err) => next(err));

export const getProjectById =
  ({ field, path = "id" } = {}) =>
  (req, res, next) =>
    Project.findOne({
      owner: req.user.id,
      _id: field ? req.body[field] : req.params[path],
    })
      .populate("account", "fireflyAccount.name")
      .then((project) => {
        req.project = project;
        next();
      })
      .catch((err) => next(err));

export const getRuleFromAccountById =
  ({ field, path = "rule" } = {}) =>
  (req, res, next) => {
    req.rule =
      req.account &&
      req.account.automatizationRules.find((r) =>
        r._id.equals(field ? req.body[field] : req.params[path])
      );
    next();
  };
