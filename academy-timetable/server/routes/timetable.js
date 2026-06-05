const express = require("express");
const TimeSlot = require("../models/TimeSlot");

const router = express.Router();

router.get("/teacher/:teacherId", async (req, res) => {
  const query = { teacher: req.params.teacherId };
  if (req.query.archiveId) {
    query.archiveId = req.query.archiveId;
  } else {
    query.isArchived = { $ne: true };
  }
  const slots = await TimeSlot.find(query)
    .populate("batch")
    .populate({ path: "batch", populate: "branch" })
    .sort({ date: 1, startTime: 1 });
  res.json(slots);
});

router.get("/batch/:batchId", async (req, res) => {
  const query = { batch: req.params.batchId };
  if (req.query.archiveId) {
    query.archiveId = req.query.archiveId;
  } else {
    query.isArchived = { $ne: true };
  }
  const slots = await TimeSlot.find(query)
    .populate("teacher")
    .populate({ path: "batch", populate: "branch" })
    .sort({ date: 1, startTime: 1 });
  res.json(slots);
});

module.exports = router;
