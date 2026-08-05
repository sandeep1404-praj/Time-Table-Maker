import express from "express";
import Branch from "../models/Branch.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const branches = await Branch.find().sort({ name: 1 });
  res.json(branches);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Branch name is required" });
  }

  const branch = await Branch.create({ name });
  res.status(201).json(branch);
});

router.delete("/:id", async (req, res) => {
  const branch = await Branch.findByIdAndDelete(req.params.id);
  if (!branch) {
    return res.status(404).json({ error: "Branch not found" });
  }
  res.json({ status: "deleted" });
});

export default router;
