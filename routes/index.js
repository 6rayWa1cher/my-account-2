import express from "express";
import Project from "../models/project.js";
const router = express.Router();

/* GET home page. */
router.get("/", async (req, res) => {
  if (req.user) {
    const projects = await Project.find({ owner: req.user.id });
    res.render("pages/home", { projects });
  } else {
    res.render("pages/index");
  }
});

export default router;
