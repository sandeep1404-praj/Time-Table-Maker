import express from "express";
import TimeSlot from "../models/TimeSlot.js";
import { sortSlotsByDateAndTime } from "../utils/time.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/teacher/:teacherId",
  asyncHandler(async (req, res) => {
    const query = { teacher: String(req.params.teacherId).trim() };
    if (req.query.archiveId) {
      query.archiveId = String(req.query.archiveId).trim();
    } else {
      query.isArchived = { $ne: true };
    }
    const slots = sortSlotsByDateAndTime(
      await TimeSlot.find(query)
        .populate("batch")
        .populate({ path: "batch", populate: "branch" })
    );
    res.json(slots);
  })
);

router.get(
  "/batch/:batchId",
  asyncHandler(async (req, res) => {
    const query = { batch: String(req.params.batchId).trim() };
    if (req.query.archiveId) {
      query.archiveId = String(req.query.archiveId).trim();
    } else {
      query.isArchived = { $ne: true };
    }
    const slots = sortSlotsByDateAndTime(
      await TimeSlot.find(query)
        .populate("teacher")
        .populate({ path: "batch", populate: "branch" })
    );
    res.json(slots);
  })
);

export default router;
