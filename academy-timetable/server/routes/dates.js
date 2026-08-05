import express from "express";
import DateRow from "../models/DateRow.js";
import TimeSlot from "../models/TimeSlot.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const query = {};
  if (req.query.archiveId) {
    query.archiveId = req.query.archiveId;
  } else {
    query.isArchived = { $ne: true };
  }
  const dates = await DateRow.find(query).sort({ date: 1 });
  res.json(dates);
});

router.post("/", async (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  const existing = await DateRow.findOne({ date: new Date(date) });
  if (existing) {
    return res.status(409).json({ error: "Date already exists" });
  }

  const row = await DateRow.create({ date });
  res.status(201).json(row);
});

router.post("/week", async (req, res) => {
  const { startDate } = req.body;
  if (!startDate) {
    return res.status(400).json({ error: "Start date is required" });
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ error: "Invalid start date" });
  }

  const created = [];
  const skipped = [];

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const existing = await DateRow.findOne({ date: day });
    if (existing) {
      skipped.push(existing);
      continue;
    }
    const row = await DateRow.create({ date: day });
    created.push(row);
  }

  res.status(201).json({ created, skipped });
});

router.delete("/by-date/:date", async (req, res) => {
  const day = new Date(req.params.date);
  if (Number.isNaN(day.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const nextDay = new Date(day);
  nextDay.setDate(day.getDate() + 1);

  await TimeSlot.deleteMany({ date: { $gte: day, $lt: nextDay } });
  const row = await DateRow.findOneAndDelete({ date: { $gte: day, $lt: nextDay } });
  if (!row) {
    return res.status(404).json({ error: "Date row not found" });
  }
  res.json({ status: "deleted" });
});

router.delete("/:id", async (req, res) => {
  const row = await DateRow.findByIdAndDelete(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Date row not found" });
  }
  res.json({ status: "deleted" });
});

export default router;
