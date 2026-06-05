const ConflictLog = require("../models/ConflictLog");
const Teacher = require("../models/Teacher");
const TimeSlot = require("../models/TimeSlot");

const hasOverlap = (a, b) => a.startTime < b.endTime && a.endTime > b.startTime;

const findTeacherConflicts = async (newSlot) => {
  if (!newSlot.teacher) return [];

  const teacher = await Teacher.findById(newSlot.teacher).select("allowScheduleOverlap");
  if (teacher?.allowScheduleOverlap) {
    return [];
  }

  const existingSlots = await TimeSlot.find({
    teacher: newSlot.teacher,
    date: newSlot.date,
    status: { $ne: "canceled" },
    ...(newSlot._id ? { _id: { $ne: newSlot._id } } : {})
  })
    .populate("teacher")
    .populate({ path: "batch", populate: "branch" });

  return existingSlots
    .filter((slot) => hasOverlap(newSlot, slot))
    .map((slot) => ({ type: "teacher", slot }));
};

const findBatchConflicts = async (newSlot) => {
  if (!newSlot.batch) return [];
  const existingSlots = await TimeSlot.find({
    batch: newSlot.batch,
    date: newSlot.date,
    status: { $ne: "canceled" },
    ...(newSlot._id ? { _id: { $ne: newSlot._id } } : {})
  })
    .populate("teacher")
    .populate({ path: "batch", populate: "branch" });

  return existingSlots
    .filter((slot) => hasOverlap(newSlot, slot))
    .map((slot) => ({ type: "batch", slot }));
};

const findConflicts = async (newSlot) => {
  if (newSlot.status === "canceled") {
    return [];
  }
  const [teacherConflicts, batchConflicts] = await Promise.all([
    findTeacherConflicts(newSlot),
    findBatchConflicts(newSlot)
  ]);

  return [...teacherConflicts, ...batchConflicts];
};

const checkAndLogConflicts = async (newSlot) => {
  if (!newSlot._id) {
    return [];
  }

  const conflicts = [];
  const overlappingSlots = await findTeacherConflicts(newSlot);
  for (const { slot } of overlappingSlots) {
    const log = await ConflictLog.create({
      slot1: newSlot._id,
      slot2: slot._id
    });
    conflicts.push({
      slot1: newSlot._id,
      slot2: slot._id,
      detectedAt: log.detectedAt
    });
  }

  return conflicts;
};

module.exports = { checkAndLogConflicts, findConflicts, hasOverlap };
