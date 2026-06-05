const parseDateOnly = (dateStr) => {
  const normalized = dateStr?.slice(0, 10);
  if (!normalized) return null;
  return new Date(`${normalized}T12:00:00`);
};

export const getWeekdayName = (dateStr, style = "long") => {
  const date = parseDateOnly(dateStr);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { weekday: style });
};

export const formatDisplayDate = (dateStr) => {
  const date = parseDateOnly(dateStr);
  if (!date || Number.isNaN(date.getTime())) return dateStr?.slice(0, 10) || "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};
