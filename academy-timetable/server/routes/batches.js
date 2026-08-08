import express from "express";
import Batch from "../models/Batch.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const BATCH_NAME_MAX = 100;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const batches = await Batch.find().populate("branch");
    res.json(batches);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim().slice(0, BATCH_NAME_MAX);
    const branch = String(req.body.branch || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Batch name is required" });
    }
    if (!branch) {
      return res.status(400).json({ error: "Branch is required" });
    }

    const batch = await Batch.create({ name, branch });
    const populated = await batch.populate("branch");
    res.status(201).json(populated);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json({ status: "deleted" });
  })
);

export default router;
