import { deriveSlotStatus } from "./slotStatus";

export const HOURS_TOLERANCE = 0.25;

export const parseTimeToMinutes = (timeValue) => {
  if (!timeValue) return 0;
  const [hours, minutes] = timeValue.split(":").map((value) => Number(value));
  return hours * 60 + minutes;
};

export const getSlotDurationHours = (slot) => {
  const start = parseTimeToMinutes(slot.startTime);
  const end = parseTimeToMinutes(slot.endTime);
  if (!start || !end || end <= start) return 0;
  return (end - start) / 60;
};

export const getBatchBranchId = (batch) => {
  if (!batch?.branch) return null;
  return batch.branch._id || batch.branch;
};

export const isLongOngoingSlot = (slot, now = new Date()) => {
  if (deriveSlotStatus(slot, now) !== "ongoing") return false;
  return getSlotDurationHours(slot) > 1;
};

export const getCompletionTiming = (completedHours, plannedHours) => {
  if (plannedHours <= 0) {
    return "ontime";
  }
  if (completedHours < plannedHours - HOURS_TOLERANCE) {
    return "before";
  }
  if (completedHours > plannedHours + HOURS_TOLERANCE) {
    return "after";
  }
  return "ontime";
};

const getChapterMeta = (teacher, chapterNumber) => {
  const chapter = teacher?.chapters?.find(
    (item) => String(item.chapterNumber) === String(chapterNumber)
  );
  return {
    chapterTitle: chapter?.title || "",
    plannedHours: Number(chapter?.plannedHours || 0)
  };
};

const buildChapterKey = (teacherId, chapterNumber, branchId, batchId = "") =>
  `${teacherId}|${chapterNumber}|${branchId}|${batchId}`;

export const analyzeChapterProgress = ({
  slots = [],
  teachers = [],
  batches = [],
  now = new Date()
}) => {
  const teacherMap = new Map(teachers.map((teacher) => [teacher._id, teacher]));
  const batchMap = new Map(batches.map((batch) => [batch._id, batch]));
  const ongoingSlots = [];
  const ongoingSlotIds = new Set();
  const chapterMap = new Map();

  slots.forEach((slot) => {
    if (deriveSlotStatus(slot, now) === "canceled") {
      return;
    }

    if (isLongOngoingSlot(slot, now)) {
      ongoingSlots.push(slot);
      ongoingSlotIds.add(slot._id);
      return;
    }

    const teacherId = slot.teacher?._id || slot.teacher;
    const batchId = slot.batch?._id || slot.batch;
    const batch = slot.batch?._id ? slot.batch : batchMap.get(batchId);
    const branchId = getBatchBranchId(batch);
    const chapterNumber = slot.chapterNumber || "";

    if (!teacherId || !branchId || !chapterNumber) {
      return;
    }

    const key = buildChapterKey(teacherId, chapterNumber, branchId, batchId);
    if (!chapterMap.has(key)) {
      const teacher = teacherMap.get(teacherId);
      const { chapterTitle, plannedHours } = getChapterMeta(teacher, chapterNumber);
      chapterMap.set(key, {
        key,
        teacherId,
        teacherName: teacher?.name || slot.teacher?.name || "",
        subject: slot.subject || teacher?.subject || "",
        chapterNumber,
        chapterTitle,
        plannedHours,
        branchId,
        branchName: batch?.branch?.name || "",
        batchId,
        batchName: batch?.name || "",
        completedHours: 0,
        scheduledHours: 0,
        totalHours: 0,
        slots: []
      });
    }

    const record = chapterMap.get(key);
    const duration = getSlotDurationHours(slot);
    const status = deriveSlotStatus(slot, now);

    record.totalHours += duration;
    record.slots.push(slot);

    if (status === "completed") {
      record.completedHours += duration;
    } else if (status === "scheduled" || status === "ongoing") {
      record.scheduledHours += duration;
    }
  });

  const completed = [];
  const extended = [];

  chapterMap.forEach((record) => {
    if (record.plannedHours <= 0) {
      return;
    }

    const hasPendingSlots = record.scheduledHours > 0;
    const isDoneByHours = record.completedHours >= record.plannedHours;
    const isDoneBySchedule =
      !hasPendingSlots &&
      record.completedHours > 0 &&
      record.slots.every((slot) => deriveSlotStatus(slot, now) === "completed");
    const isDone = isDoneByHours || isDoneBySchedule;
    const completionTiming = getCompletionTiming(record.completedHours, record.plannedHours);

    if (isDone) {
      completed.push({
        ...record,
        isDone: true,
        completionTiming
      });
      return;
    }

    if (record.totalHours > record.plannedHours) {
      extended.push({
        ...record,
        isDone: false,
        completionTiming
      });
    }
  });

  const sortByTeacher = (a, b) =>
    a.teacherName.localeCompare(b.teacherName) ||
    String(a.chapterNumber).localeCompare(String(b.chapterNumber), undefined, {
      numeric: true
    });

  ongoingSlots.sort(
    (a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      a.startTime.localeCompare(b.startTime)
  );
  completed.sort(sortByTeacher);
  extended.sort(sortByTeacher);

  return {
    ongoingSlots,
    ongoingSlotIds,
    completed,
    extended
  };
};

export const filterByTeacher = (items, teacherId, getTeacherId) => {
  if (!teacherId) return items;
  return items.filter((item) => getTeacherId(item) === teacherId);
};

export const filterCompletedByTiming = (items, timing) => {
  if (!timing || timing === "all") return items;
  return items.filter((item) => item.completionTiming === timing);
};

export const groupByBranch = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const label = item.branchName || "Unknown branch";
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label).push(item);
  });
  return map;
};

export const groupByBatch = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const label = `${item.branchName || "Unknown"} · ${item.batchName || "Unknown batch"}`;
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label).push(item);
  });
  return map;
};
