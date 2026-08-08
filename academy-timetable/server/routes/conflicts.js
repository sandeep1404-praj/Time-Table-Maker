import express from "express";
import ConflictLog from "../models/ConflictLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const conflicts = await ConflictLog.find()
      .populate({ path: "slot1", populate: ["teacher", "batch"] })
      .populate({ path: "slot2", populate: ["teacher", "batch"] })
      .sort({ detectedAt: -1 })
      .limit(200); // cap results to prevent unbounded data leakage

    res.json(conflicts);
  })
);

export default router;
