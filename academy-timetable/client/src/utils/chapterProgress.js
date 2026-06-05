import { deriveSlotStatus } from "./slotStatus";
import {
  getSlotDurationHours,
  getSlotDurationMinutes,
  parseTimeToMinutes
} from "./time";

export const HOURS_TOLERANCE = 0.25;

export { getSlotDurationHours, parseTimeToMinutes };

export const getDurationHoursFromTimes = (startTime, endTime) =>
  getSlotDurationMinutes(startTime, endTime) / 60;

const isLectureSlot = (slot) => !slot.slotType || slot.slotType === "lecture";

export const getBatchBranchId = (batch) => {
  if (!batch?.branch) return null;
  return batch.branch._id || batch.branch;
};

export const resolveSlotBatchContext = (slot, batches = [], branches = []) => {
  const batchMap = new Map(batches.map((batch) => [String(batch._id), batch]));
  const branchMap = new Map(branches.map((branch) => [String(branch._id), branch]));

  const batchId = slot.batch?._id || slot.batch;
  if (!batchId) return null;

  const batch = batchMap.get(String(batchId)) || (slot.batch?._id ? slot.batch : null);
  const branchId = getBatchBranchId(batch);
  if (!branchId) return null;

  const branchName =
    batch?.branch?.name || branchMap.get(String(branchId))?.name || "Unknown branch";

  return {
    batchId: String(batchId),
    batch,
    branchId: String(branchId),
    branchName,
    batchName: batch?.name || ""
  };
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
    chapterId: chapter?._id || "",
    chapterTitle: chapter?.title || "",
    plannedHours: Number(chapter?.plannedHours || 0),
    branchCompletions: chapter?.branchCompletions || [],
    batchCompletions: chapter?.batchCompletions || []
  };
};

export const isChapterMarkedComplete = (teacher, chapterNumber, branchId) => {
  const { branchCompletions } = getChapterMeta(teacher, chapterNumber);
  const branchIdStr = String(branchId);

  const entry = branchCompletions.find((item) => {
    const entryBranchId = item.branch?._id || item.branch;
    return String(entryBranchId) === branchIdStr;
  });
  return Boolean(entry?.isCompleted);
};

const buildChapterKey = (teacherId, chapterNumber, branchId, batchId = null, viewMode = "branch") =>
  viewMode === "batch" && batchId
    ? `${teacherId}|${chapterNumber}|${branchId}|${batchId}`
    : `${teacherId}|${chapterNumber}|${branchId}`;

const slotMatchesChapter = (slot, teacherId, chapterNumber) => {
  const slotTeacherId = slot.teacher?._id || slot.teacher;
  if (String(slotTeacherId) !== String(teacherId)) return false;
  if (String(slot.chapterNumber || "") !== String(chapterNumber || "")) return false;
  return true;
};

export const sumCompletedChapterHours = ({
  slots = [],
  batches = [],
  branches = [],
  teacherId,
  chapterNumber,
  batchId = null,
  branchId = null,
  excludeSlotId = null,
  now = new Date()
}) => {
  return slots.reduce((sum, slot) => {
    if (excludeSlotId && slot._id === excludeSlotId) return sum;
    if (deriveSlotStatus(slot, now) !== "completed") return sum;
    if (!slotMatchesChapter(slot, teacherId, chapterNumber)) return sum;

    const context = resolveSlotBatchContext(slot, batches, branches);
    if (!context) return sum;

    if (batchId && context.batchId !== String(batchId)) return sum;
    if (!batchId && branchId && context.branchId !== String(branchId)) return sum;

    return sum + getSlotDurationHours(slot);
  }, 0);
};

export const analyzeChapterProgress = ({
  slots = [],
  teachers = [],
  batches = [],
  branches = [],
  viewMode = "branch",
  now = new Date()
}) => {
  const teacherMap = new Map(teachers.map((teacher) => [teacher._id, teacher]));
  const chapterMap = new Map();

  slots.forEach((slot) => {
    if (deriveSlotStatus(slot, now) === "canceled") {
      return;
    }

    const teacherId = slot.teacher?._id || slot.teacher;
    const context = resolveSlotBatchContext(slot, batches, branches);
    const chapterNumber = slot.chapterNumber || "";

    if (!teacherId || !context || !chapterNumber) {
      return;
    }

    const { branchId, branchName, batchId, batchName } = context;

    const key = buildChapterKey(
      teacherId,
      chapterNumber,
      branchId,
      viewMode === "batch" ? batchId : null,
      viewMode
    );

    if (!chapterMap.has(key)) {
      const teacher = teacherMap.get(teacherId);
      const { chapterId, chapterTitle, plannedHours } = getChapterMeta(teacher, chapterNumber);
      chapterMap.set(key, {
        key,
        teacherId,
        chapterId,
        teacherName: teacher?.name || slot.teacher?.name || "",
        subject: slot.subject || teacher?.subject || "",
        chapterNumber,
        chapterTitle,
        plannedHours,
        branchId,
        branchName,
        batchId: viewMode === "batch" ? batchId : "",
        batchName: viewMode === "batch" ? batchName : "",
        completedHours: 0,
        scheduledHours: 0,
        totalHours: 0,
        lectureCount: 0,
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
      if (duration > 0 && isLectureSlot(slot)) {
        record.lectureCount += 1;
      }
    } else if (status === "scheduled" || status === "ongoing") {
      record.scheduledHours += duration;
    }
  });

  const ongoing = [];
  const extended = [];
  const completed = [];

  chapterMap.forEach((record) => {
    if (record.plannedHours <= 0) {
      return;
    }

    const teacher = teacherMap.get(record.teacherId);
    const isMarkedComplete = isChapterMarkedComplete(
      teacher,
      record.chapterNumber,
      record.branchId
    );
    const completionTiming = getCompletionTiming(record.completedHours, record.plannedHours);
    const hasLectureTaken = record.lectureCount > 0;
    const isTimeExtended = record.completedHours > record.plannedHours;

    const enriched = {
      ...record,
      isMarkedComplete,
      completionTiming,
      progressPercent: Math.min(
        100,
        record.plannedHours > 0
          ? Math.round((record.completedHours / record.plannedHours) * 100)
          : 0
      )
    };

    if (isMarkedComplete) {
      completed.push(enriched);
      return;
    }

    if (isTimeExtended) {
      extended.push(enriched);
    }

    if (hasLectureTaken) {
      ongoing.push(enriched);
    }
  });

  const sortChapters = (a, b) =>
    a.branchName.localeCompare(b.branchName) ||
    (a.batchName || "").localeCompare(b.batchName || "") ||
    a.teacherName.localeCompare(b.teacherName) ||
    String(a.chapterNumber).localeCompare(String(b.chapterNumber), undefined, {
      numeric: true
    });

  ongoing.sort(sortChapters);
  extended.sort(sortChapters);
  completed.sort(sortChapters);

  return { ongoing, extended, completed };
};

export const filterByTeacher = (items, teacherId, getTeacherId) => {
  if (!teacherId) return items;
  return items.filter((item) => getTeacherId(item) === teacherId);
};

export const filterByBranch = (items, branchId) => {
  if (!branchId) return items;
  return items.filter((item) => String(item.branchId) === String(branchId));
};

export const filterByBatch = (items, batchId) => {
  if (!batchId) return items;
  return items.filter((item) => String(item.batchId) === String(batchId));
};

export const filterCompletedByTiming = (items, timing) => {
  if (!timing || timing === "all") return items;
  return items.filter((item) => item.completionTiming === timing);
};

export const filterBySearch = (items, query) => {
  const term = query.trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) => {
    const haystack = [
      item.teacherName,
      item.subject,
      item.chapterNumber,
      item.chapterTitle,
      item.branchName,
      item.batchName
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
};

export const groupByBranch = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const label = item.branchName || `Branch ${item.branchId || "?"}`;
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
    const branchLabel = item.branchName || `Branch ${item.branchId || "?"}`;
    const batchLabel = item.batchName || `Batch ${item.batchId || "?"}`;
    const label = `${branchLabel} · ${batchLabel}`;
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label).push(item);
  });
  return map;
};
