const TimeSlot = require("../models/TimeSlot");

const getTeacherTimetable = async (teacherId) => {
  return TimeSlot.find({ teacher: teacherId })
    .populate("teacher")
    .populate({ path: "batch", populate: "branch" })
    .sort({ date: 1, startTime: 1 });
};

const getBatchTimetable = async (batchId) => {
  return TimeSlot.find({ batch: batchId })
    .populate("teacher")
    .populate({ path: "batch", populate: "branch" })
    .sort({ date: 1, startTime: 1 });
};

module.exports = { getTeacherTimetable, getBatchTimetable };
