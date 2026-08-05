import express from "express";
import TimeSlot from "../models/TimeSlot.js";
import { sortSlotsByDateAndTime } from "../utils/time.js";

const router = express.Router();

router.get("/teacher/:teacherId", async (req, res) => {
  const query = { teacher: req.params.teacherId };
  if (req.query.archiveId) {
    query.archiveId = req.query.archiveId;
  } else {
    query.isArchived = { $ne: true };
  }
  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find(query)
      .populate("batch")
      .populate({ path: "batch", populate: "branch" })
  );
  res.json(slots);
});

router.get("/batch/:batchId", async (req, res) => {
  const query = { batch: req.params.batchId };
  if (req.query.archiveId) {
    query.archiveId = req.query.archiveId;
  } else {
    query.isArchived = { $ne: true };
  }
  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find(query)
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
  res.json(slots);
});

export default router;
