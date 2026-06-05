import { parseSlotDateTime, getSlotEndDateTime } from "./time";

export const deriveSlotStatus = (slot, now = new Date()) => {
  if (slot.status === "canceled") {
    return "canceled";
  }

  if (!slot.date || !slot.startTime || !slot.endTime) {
    return slot.status || "scheduled";
  }

  const start = parseSlotDateTime(slot.date, slot.startTime);
  const end = getSlotEndDateTime(slot);

  if (!end) {
    return slot.status || "scheduled";
  }

  if (now < start) {
    return "scheduled";
  }
  if (now >= end) {
    return "completed";
  }
  return "ongoing";
};

export const formatSlotStatus = (status) => {
  if (!status || status === "scheduled") {
    return "";
  }
  return status;
};
