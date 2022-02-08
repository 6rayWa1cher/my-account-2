import express from "express";
import Project from "../models/project.js";
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

router.post("/", (req, res) => {
  // new Project(req.body)
  // .save()
  // .then((v) => res.redirect("/projects"))
  // .catch((err) => next(err));
  res.send();
});

export default router;
