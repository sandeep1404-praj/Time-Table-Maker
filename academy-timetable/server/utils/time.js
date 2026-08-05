const TIME_INPUT_PATTERN = /^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i;

const padTwo = (value) => String(value).padStart(2, "0");

const getRawTimeString = (timeValue) => {
  if (timeValue == null || timeValue === "") return "";

  let raw = String(timeValue).trim();
  if (raw.includes("T")) {
    raw = raw.split("T")[1].slice(0, 8).trim();
  }

  return raw.replace(/\s+/g, " ").toUpperCase();
};

const parseTimeToMinutes = (timeValue) => {
  const raw = getRawTimeString(timeValue);
  if (!raw) return null;

  const match = raw.match(TIME_INPUT_PATTERN);
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

const minutesToTimeParts = (totalMinutes) => {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return {
    hour: hours12,
    minute: padTwo(minutes),
    period
  };
};

const formatTimeForStorage = (timeValue) => {
  const minutes = parseTimeToMinutes(timeValue);
  if (minutes === null) {
    return getRawTimeString(timeValue);
  }

  const { hour, minute, period } = minutesToTimeParts(minutes);
  return `${padTwo(hour)}:${minute} ${period}`;
};

const formatTimeForDisplay = (timeValue) => formatTimeForStorage(timeValue);

const convertTimeTo24HourString = (timeValue) => {
  const minutes = parseTimeToMinutes(timeValue);
  if (minutes === null) {
    return getRawTimeString(timeValue);
  }

  const hours24 = Math.floor(minutes / 60) % 24;
  const minutesPart = minutes % 60;
  return `${padTwo(hours24)}:${padTwo(minutesPart)}`;
};

const parseSlotDateTime = (date, timeStr) => {
  const dateStr =
    typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return new Date(`${dateStr}T${convertTimeTo24HourString(timeStr)}`);
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

const sortSlotsByDateAndTime = (slots = []) =>
  [...slots].sort((left, right) => {
    const leftDate = new Date(left.date).getTime();
    const rightDate = new Date(right.date).getTime();
    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    const leftStart = parseTimeToMinutes(left.startTime);
    const rightStart = parseTimeToMinutes(right.startTime);
    if (leftStart !== rightStart) {
      return (leftStart ?? Number.MAX_SAFE_INTEGER) - (rightStart ?? Number.MAX_SAFE_INTEGER);
    }

    const leftEnd = parseTimeToMinutes(left.endTime);
    const rightEnd = parseTimeToMinutes(right.endTime);
    return (leftEnd ?? Number.MAX_SAFE_INTEGER) - (rightEnd ?? Number.MAX_SAFE_INTEGER);
  });

export {
  convertTimeTo24HourString,
  formatTimeForDisplay,
  formatTimeForStorage,
  getSlotDurationHours,
  getSlotEndDateTime,
  parseSlotDateTime,
  parseTimeToMinutes,
  resolveEndMinutes,
  sortSlotsByDateAndTime
};
