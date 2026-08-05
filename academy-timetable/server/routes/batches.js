import express from "express";
import Batch from "../models/Batch.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const batches = await Batch.find().populate("branch");
  res.json(batches);
});

router.post("/", async (req, res) => {
  const { name, branch } = req.body;
  if (!name || !branch) {
    return res.status(400).json({ error: "Batch name and branch are required" });
  }

  const batch = await Batch.create({ name, branch });
  const populated = await batch.populate("branch");
  res.status(201).json(populated);
});

router.delete("/:id", async (req, res) => {
  const batch = await Batch.findByIdAndDelete(req.params.id);
  if (!batch) {
    return res.status(404).json({ error: "Batch not found" });
  }
  res.json({ status: "deleted" });
});

export default router;
