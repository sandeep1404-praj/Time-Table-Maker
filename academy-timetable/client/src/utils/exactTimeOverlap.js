export const getExactTimeOverlapIds = (slots = []) => {
  const normalizedSlots = Array.isArray(slots) ? slots : [];
  const groups = new Map();

  normalizedSlots.forEach((slot) => {
    const dateKey = slot.date?.slice?.(0, 10) || "";
    const teacherKey = slot.teacher?._id || slot.teacher || "";
    const groupKey = `${dateKey}|${teacherKey}|${slot.startTime || ""}|${slot.endTime || ""}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(slot);
  });

  const overlapIds = new Set();
  groups.forEach((group) => {
    if (group.length > 1) {
      group.forEach((slot) => overlapIds.add(slot._id));
    }
  });

  return overlapIds;
};