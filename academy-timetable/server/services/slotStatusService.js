const { parseSlotDateTime, getSlotEndDateTime } = require("../utils/time");

const deriveSlotStatus = (slot, now = new Date()) => {
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

const buildStatusTimestamps = (nextStatus, previousStatus = "") => {
  const now = new Date();
  const payload = { status: nextStatus, statusUpdatedAt: now };

  if (nextStatus === "canceled" && previousStatus !== "canceled") {
    payload.canceledAt = now;
  }
  if (nextStatus === "completed" && previousStatus !== "completed") {
    payload.completedAt = now;
  }
  if (nextStatus === "ongoing" && previousStatus !== "ongoing") {
    payload.ongoingAt = now;
  }

  return payload;
};

const resolveSlotStatusPayload = (slotData, now = new Date()) => {
  if (slotData.status === "canceled") {
    return buildStatusTimestamps("canceled", "");
  }

  const effectiveStatus = deriveSlotStatus(slotData, now);
  return buildStatusTimestamps(effectiveStatus, slotData.status || "");
};

module.exports = {
  deriveSlotStatus,
  buildStatusTimestamps,
  resolveSlotStatusPayload
};
