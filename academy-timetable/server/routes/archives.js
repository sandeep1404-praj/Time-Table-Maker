import express from "express";
import Archive from "../models/Archive.js";
import DateRow from "../models/DateRow.js";
import TimeSlot from "../models/TimeSlot.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const archives = await Archive.find().sort({ createdAt: -1 });
  res.json(archives);
});

router.post("/", async (req, res) => {
  const activeDates = await DateRow.find({ isArchived: { $ne: true } }).sort({ date: 1 });
  if (activeDates.length === 0) {
    return res.status(400).json({ error: "No active dates to archive." });
  }

  const startDate = activeDates[0].date;
  const endDate = activeDates[activeDates.length - 1].date;
  
  const options = { month: "short", day: "numeric" };
  const name = `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;

  const archive = await Archive.create({ name, startDate, endDate });

  await DateRow.updateMany({ isArchived: { $ne: true } }, { isArchived: true, archiveId: archive._id });
  await TimeSlot.updateMany({ isArchived: { $ne: true } }, { isArchived: true, archiveId: archive._id });

  res.status(201).json(archive);
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Archive.findByIdAndDelete(id);
    await DateRow.deleteMany({ archiveId: id });
    await TimeSlot.deleteMany({ archiveId: id });
    res.json({ message: "Archive deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete archive" });
  }
});

export default router;
