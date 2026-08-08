import express from "express";
import Branch from "../models/Branch.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const BRANCH_NAME_MAX = 100;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const branches = await Branch.find().sort({ name: 1 });
    res.json(branches);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim().slice(0, BRANCH_NAME_MAX);
    if (!name) {
      return res.status(400).json({ error: "Branch name is required" });
    }

    // Case-insensitive duplicate check
    const existing = await Branch.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } });
    if (existing) {
      return res.status(409).json({ error: "Branch already exists" });
    }

    const branch = await Branch.create({ name });
    res.status(201).json(branch);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json({ status: "deleted" });
  })
);

export default router;
