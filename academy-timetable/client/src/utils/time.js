export const parseTimeToMinutes = (timeValue) => {
  if (timeValue == null || timeValue === "") return null;

  let raw = String(timeValue).trim();
  if (raw.includes("T")) {
    raw = raw.split("T")[1].slice(0, 8).trim();
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) {
      hours = 0;
    }
    if (meridiem === "PM") {
      hours += 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

const padTwo = (value) => String(value).padStart(2, "0");

export const minutesToTimeString = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const minutesToTimeParts = (totalMinutes) => {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return {
    time: `${padTwo(hours12)}:${padTwo(minutes)}`,
    period
  };
};

export const formatTimeForStorage = (timeValue, period = "AM") => {
  if (!timeValue) return "";
  const normalizedTime = String(timeValue).trim();
  if (/\s[AP]M$/i.test(normalizedTime)) {
    const parsed = parseTimeToMinutes(normalizedTime);
    if (parsed === null) return normalizedTime.toUpperCase();
    const parts = minutesToTimeParts(parsed);
    return `${parts.time} ${parts.period}`;
  }

  const [hourValue, minuteValue] = normalizedTime.split(":");
  if (hourValue == null || minuteValue == null) return normalizedTime.toUpperCase();

  let hour = Number(hourValue);
  const minute = Number(minuteValue);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return normalizedTime.toUpperCase();

  const normalizedPeriod = String(period).toUpperCase() === "PM" ? "PM" : "AM";
  if (hour === 0) hour = 12;
  if (hour > 12) {
    hour -= 12;
  }

  return `${padTwo(hour)}:${padTwo(minute)} ${normalizedPeriod}`;
};

export const formatTimeForDisplay = (timeValue) => formatTimeForStorage(timeValue);

export const splitStoredTime = (timeValue) => {
  if (!timeValue) {
    return { time: "", period: "AM" };
  }

  const raw = String(timeValue).trim().toUpperCase();
  const match = raw.match(/^(\d{1,2}:\d{2})(?:\s*([AP]M))?$/);
  if (!match) {
    return { time: raw, period: "AM" };
  }

  const time = match[1];
  const period = match[2] || (parseTimeToMinutes(time) >= 720 ? "PM" : "AM");
  return { time, period };
};

export const resolveEndMinutes = (startMinutes, endMinutes) => {
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

export const getSlotDurationMinutes = (startTime, endTime) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return 0;

  const resolvedEnd = resolveEndMinutes(start, end);
  if (resolvedEnd <= start) return 0;

  return resolvedEnd - start;
};

export const getSlotDurationHours = (slot) =>
  getSlotDurationMinutes(slot.startTime, slot.endTime) / 60;

export const parseSlotDateTime = (date, timeStr) => {
  const dateStr =
    typeof date === "string"
      ? date.slice(0, 10)
      : new Date(date).toISOString().slice(0, 10);
  const minutes = parseTimeToMinutes(timeStr);
  if (minutes === null) return new Date(`${dateStr}T00:00:00`);

  const hours24 = Math.floor(minutes / 60) % 24;
  const minutesPart = minutes % 60;
  return new Date(`${dateStr}T${padTwo(hours24)}:${padTwo(minutesPart)}:00`);
};

export const getSlotEndDateTime = (slot) => {
  if (!slot?.date || !slot?.startTime || !slot?.endTime) return null;

  const startMinutes = parseTimeToMinutes(slot.startTime);
  const endMinutes = parseTimeToMinutes(slot.endTime);
  if (startMinutes === null || endMinutes === null) return null;

  const resolvedEndMinutes = resolveEndMinutes(startMinutes, endMinutes);
  const start = parseSlotDateTime(slot.date, slot.startTime);
  return new Date(start.getTime() + (resolvedEndMinutes - startMinutes) * 60 * 1000);
};
