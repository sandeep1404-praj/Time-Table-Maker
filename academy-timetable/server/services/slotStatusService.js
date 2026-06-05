const parseSlotDateTime = (date, timeStr) => {
  const dateStr =
    typeof date === "string"
      ? date.slice(0, 10)
      : date.toISOString().slice(0, 10);
  return new Date(`${dateStr}T${timeStr}`);
};

const deriveSlotStatus = (slot, now = new Date()) => {
  if (slot.status === "canceled") {
    return "canceled";
  }

  const start = parseSlotDateTime(slot.date, slot.startTime);
  const end = parseSlotDateTime(slot.date, slot.endTime);

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
