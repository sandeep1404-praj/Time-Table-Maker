const parseSlotDateTime = (date, timeStr) => {
  const dateStr =
    typeof date === "string"
      ? date.slice(0, 10)
      : new Date(date).toISOString().slice(0, 10);
  return new Date(`${dateStr}T${timeStr}`);
};

export const deriveSlotStatus = (slot, now = new Date()) => {
  if (slot.status === "canceled") {
    return "canceled";
  }

  if (!slot.date || !slot.startTime || !slot.endTime) {
    return slot.status || "scheduled";
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

export const formatSlotStatus = (status) => {
  if (!status || status === "scheduled") {
    return "";
  }
  return status;
};
