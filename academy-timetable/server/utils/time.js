const parseTimeToMinutes = (timeValue) => {
  if (timeValue == null || timeValue === "") return null;

  let raw = String(timeValue).trim();
  if (raw.includes("T")) {
    raw = raw.split("T")[1].slice(0, 5);
  }

  const segments = raw.split(":");
  if (segments.length < 2) return null;

  const hours = Number(segments[0]);
  const minutes = Number(segments[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
};

const resolveEndMinutes = (startMinutes, endMinutes) => {
  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes > startMinutes) return endMinutes;

  const endWith12 = endMinutes + 12 * 60;
  if (endWith12 > startMinutes && endWith12 - startMinutes <= 12 * 60) {
    return endWith12;
  }

  const endWith24 = endMinutes + 24 * 60;
  if (endWith24 > startMinutes) {
    return endWith24;
  }

  return endMinutes;
};

const parseSlotDateTime = (date, timeStr) => {
  const dateStr =
    typeof date === "string"
      ? date.slice(0, 10)
      : date.toISOString().slice(0, 10);
  return new Date(`${dateStr}T${timeStr}`);
};

const getSlotEndDateTime = (slot) => {
  if (!slot?.date || !slot?.startTime || !slot?.endTime) return null;

  const startMinutes = parseTimeToMinutes(slot.startTime);
  const endMinutes = parseTimeToMinutes(slot.endTime);
  if (startMinutes === null || endMinutes === null) return null;

  const resolvedEndMinutes = resolveEndMinutes(startMinutes, endMinutes);
  const start = parseSlotDateTime(slot.date, slot.startTime);
  return new Date(start.getTime() + (resolvedEndMinutes - startMinutes) * 60 * 1000);
};

const getSlotDurationHours = (slot) => {
  const start = parseTimeToMinutes(slot.startTime);
  const end = parseTimeToMinutes(slot.endTime);
  if (start === null || end === null) return 0;

  const resolvedEnd = resolveEndMinutes(start, end);
  if (resolvedEnd <= start) return 0;

  return (resolvedEnd - start) / 60;
};

module.exports = {
  parseTimeToMinutes,
  resolveEndMinutes,
  parseSlotDateTime,
  getSlotEndDateTime,
  getSlotDurationHours
};
