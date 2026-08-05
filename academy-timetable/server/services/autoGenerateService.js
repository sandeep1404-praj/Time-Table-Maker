import TimeSlot from "../models/TimeSlot.js";
import { sortSlotsByDateAndTime } from "../utils/time.js";

const getTeacherTimetable = async (teacherId) => {
  return sortSlotsByDateAndTime(
    await TimeSlot.find({ teacher: teacherId })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
};

const getBatchTimetable = async (batchId) => {
  return sortSlotsByDateAndTime(
    await TimeSlot.find({ batch: batchId })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
};

export { getBatchTimetable, getTeacherTimetable };
