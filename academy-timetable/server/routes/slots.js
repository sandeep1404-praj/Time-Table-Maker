const express = require("express");
const { body, validationResult } = require("express-validator");
const TimeSlot = require("../models/TimeSlot");
const { checkAndLogConflicts, findConflicts } = require("../services/conflictService");
const {
  deriveSlotStatus,
  buildStatusTimestamps,
  resolveSlotStatusPayload
} = require("../services/slotStatusService");

const router = express.Router();

const syncSlotStatuses = async (slots) => {
  const now = new Date();
  const updates = [];

  for (const slot of slots) {
    if (slot.status === "canceled") {
      continue;
    }
    const effectiveStatus = deriveSlotStatus(slot, now);
    if (effectiveStatus !== slot.status) {
      updates.push({
        updateOne: {
          filter: { _id: slot._id },
          update: buildStatusTimestamps(effectiveStatus, slot.status)
        }
      });
      slot.status = effectiveStatus;
    }
  }

  if (updates.length) {
    await TimeSlot.bulkWrite(updates);
  }
};

router.get("/", async (req, res) => {
  const query = {};
  if (req.query.archiveId) {
    query.archiveId = req.query.archiveId;
  } else {
    query.isArchived = { $ne: true };
  }
  const slots = await TimeSlot.find(query)
    .populate("teacher batch")
    .sort({ date: 1, startTime: 1 });

  if (!req.query.archiveId) {
    await syncSlotStatuses(slots);
  }

  res.json(slots);
});

router.post(
  "/",
  [
    body("date").isISO8601(),
    body("startTime").isString().notEmpty(),
    body("endTime").isString().notEmpty(),
    body("teacher").isString(),
    body("batch").isString(),
    body("slotType").optional().isIn(["lecture", "test", "mcq", "revision", "coverup"]),
    body("status")
      .optional()
      .isIn(["scheduled", "ongoing", "completed", "canceled"])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.status === "canceled" && !req.body.cancelNote) {
      return res.status(400).json({ error: "Cancel note is required" });
    }

    const conflicts = await findConflicts(req.body);
    if (conflicts.length) {
      return res.status(409).json({
        message: "Conflict detected: overlapping teacher or batch slot.",
        conflicts
      });
    }

    const createPayload = { ...req.body };
    if (createPayload.status !== "canceled") {
      Object.assign(createPayload, resolveSlotStatusPayload(createPayload));
    } else {
      Object.assign(
        createPayload,
        buildStatusTimestamps("canceled", createPayload.status || "")
      );
    }

    const slot = await TimeSlot.create(createPayload);
    const loggedConflicts = await checkAndLogConflicts(slot);
    res.status(201).json({ slot, conflicts: loggedConflicts });
  }
);

router.put(
  "/:id",
  [
    body("date").optional().isISO8601(),
    body("startTime").optional().isString().notEmpty(),
    body("endTime").optional().isString().notEmpty(),
    body("slotType").optional().isIn(["lecture", "test", "mcq", "revision", "coverup"]),
    body("status")
      .optional()
      .isIn(["scheduled", "ongoing", "completed", "canceled"])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await TimeSlot.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const candidate = {
      _id: existing._id,
      date: req.body.date || existing.date,
      startTime: req.body.startTime || existing.startTime,
      endTime: req.body.endTime || existing.endTime,
      teacher: req.body.teacher || existing.teacher,
      batch: req.body.batch || existing.batch,
      status: req.body.status || existing.status
    };

    const conflicts = await findConflicts(candidate);
    if (conflicts.length) {
      return res.status(409).json({
        message: "Conflict detected: overlapping teacher or batch slot.",
        conflicts
      });
    }

    if (req.body.status === "canceled" && !req.body.cancelNote) {
      return res.status(400).json({ error: "Cancel note is required" });
    }

    const updatePayload = { ...req.body };
    const mergedSlot = {
      date: updatePayload.date || existing.date,
      startTime: updatePayload.startTime || existing.startTime,
      endTime: updatePayload.endTime || existing.endTime,
      status: updatePayload.status || existing.status
    };

    if (mergedSlot.status === "canceled") {
      Object.assign(
        updatePayload,
        buildStatusTimestamps("canceled", existing.status)
      );
    } else {
      Object.assign(updatePayload, resolveSlotStatusPayload(mergedSlot));
    }

    const slot = await TimeSlot.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true
    });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const loggedConflicts = await checkAndLogConflicts(slot);
    res.json({ slot, conflicts: loggedConflicts });
  }
);

router.delete("/:id", async (req, res) => {
  const slot = await TimeSlot.findByIdAndDelete(req.params.id);
  if (!slot) {
    return res.status(404).json({ error: "Slot not found" });
  }
  res.json({ status: "deleted" });
});

router.post("/check-conflict", async (req, res) => {
  const slot = req.body;
  const conflicts = await findConflicts(slot);
  res.json({ conflicts });
});

module.exports = router;
