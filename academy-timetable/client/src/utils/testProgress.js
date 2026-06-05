import { deriveSlotStatus } from "./slotStatus";
import { resolveSlotBatchContext } from "./chapterProgress";

const buildTestKey = (teacherId, chapterNumber, branchId, batchId, viewMode) =>
  viewMode === "batch" && batchId
    ? `${teacherId}|${chapterNumber}|${branchId}|${batchId}`
    : `${teacherId}|${chapterNumber}|${branchId}`;

const getChapterFromTeacher = (teacher, chapterNumber) =>
  teacher?.chapters?.find((item) => String(item.chapterNumber) === String(chapterNumber));

const isTestSlot = (slot) => slot.slotType === "test";

export const isTestTaken = (testSlots, { teacherId, chapterNumber, branchId, batchId, viewMode, batches }) => {
  return testSlots.some((slot) => {
    if (!isTestSlot(slot) || deriveSlotStatus(slot) !== "completed") return false;
    const slotTeacherId = slot.teacher?._id || slot.teacher;
    if (String(slotTeacherId) !== String(teacherId)) return false;
    if (String(slot.chapterNumber || "") !== String(chapterNumber || "")) return false;

    const slotBatchId = slot.batch?._id || slot.batch;
    if (viewMode === "batch" && batchId) {
      return String(slotBatchId) === String(batchId);
    }

    const batch = batches.find((item) => String(item._id) === String(slotBatchId));
    const slotBranchId = batch?.branch?._id || batch?.branch;
    return String(slotBranchId) === String(branchId);
  });
};

export const analyzeTestProgress = ({
  slots = [],
  teachers = [],
  batches = [],
  branches = [],
  viewMode = "branch",
  now = new Date()
}) => {
  const branchMap = new Map(branches.map((branch) => [String(branch._id), branch]));
  const testSlots = slots.filter(
    (slot) => isTestSlot(slot) && deriveSlotStatus(slot, now) !== "canceled"
  );

  const testsTaken = testSlots.map((slot) => {
    const teacherId = slot.teacher?._id || slot.teacher;
    const context = resolveSlotBatchContext(slot, batches, branches);
    const teacher = teachers.find((item) => String(item._id) === String(teacherId));
    const chapter = getChapterFromTeacher(teacher, slot.chapterNumber);
    const status = deriveSlotStatus(slot, now);

    return {
      key: `test-${slot._id}`,
      slotId: slot._id,
      teacherId,
      teacherName: teacher?.name || slot.teacher?.name || "",
      subject: slot.subject || teacher?.subject || "",
      chapterNumber: slot.chapterNumber || "",
      chapterTitle: chapter?.title || "",
      chapterId: chapter?._id || "",
      branchId: context?.branchId || "",
      branchName: context?.branchName || "",
      batchId: context?.batchId || "",
      batchName: context?.batchName || "",
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      topic: slot.topic || "",
      status,
      isCompleted: status === "completed",
      slot
    };
  });

  const testPending = [];
  const pendingKeys = new Set();

  teachers.forEach((teacher) => {
    (teacher.chapters || []).forEach((chapter) => {
      (chapter.branchCompletions || [])
        .filter((entry) => entry.isCompleted)
        .forEach((entry) => {
          const branchId = String(entry.branch?._id || entry.branch);
          const branchName = branchMap.get(branchId)?.name || "Unknown branch";

          if (viewMode === "batch") {
            batches
              .filter(
                (batch) => String(batch.branch?._id || batch.branch) === branchId
              )
              .forEach((batch) => {
                const taken = isTestTaken(testSlots, {
                  teacherId: teacher._id,
                  chapterNumber: chapter.chapterNumber,
                  branchId,
                  batchId: batch._id,
                  viewMode,
                  batches
                });
                if (taken) return;

                const key = buildTestKey(
                  teacher._id,
                  chapter.chapterNumber,
                  branchId,
                  batch._id,
                  viewMode
                );
                if (pendingKeys.has(key)) return;
                pendingKeys.add(key);

                testPending.push({
                  key,
                  teacherId: teacher._id,
                  teacherName: teacher.name,
                  subject: teacher.subject,
                  chapterNumber: chapter.chapterNumber,
                  chapterTitle: chapter.title || "",
                  chapterId: chapter._id,
                  branchId,
                  branchName,
                  batchId: batch._id,
                  batchName: batch.name,
                  isMarkedComplete: true
                });
              });
          } else {
            const taken = isTestTaken(testSlots, {
              teacherId: teacher._id,
              chapterNumber: chapter.chapterNumber,
              branchId,
              viewMode,
              batches
            });
            if (taken) return;

            const key = buildTestKey(teacher._id, chapter.chapterNumber, branchId, null, viewMode);
            if (pendingKeys.has(key)) return;
            pendingKeys.add(key);

            testPending.push({
              key,
              teacherId: teacher._id,
              teacherName: teacher.name,
              subject: teacher.subject,
              chapterNumber: chapter.chapterNumber,
              chapterTitle: chapter.title || "",
              chapterId: chapter._id,
              branchId,
              branchName,
              batchId: "",
              batchName: "",
              isMarkedComplete: true
            });
          }
        });
    });
  });

  const sortItems = (a, b) =>
    a.branchName.localeCompare(b.branchName) ||
    (a.batchName || "").localeCompare(b.batchName || "") ||
    a.teacherName.localeCompare(b.teacherName) ||
    String(a.chapterNumber).localeCompare(String(b.chapterNumber), undefined, {
      numeric: true
    });

  testsTaken.sort(sortItems);
  testPending.sort(sortItems);

  return { testsTaken, testPending };
};

export const filterByTeacher = (items, teacherId) => {
  if (!teacherId) return items;
  return items.filter((item) => String(item.teacherId) === String(teacherId));
};

export const filterByBranch = (items, branchId) => {
  if (!branchId) return items;
  return items.filter((item) => String(item.branchId) === String(branchId));
};

export const filterByBatch = (items, batchId) => {
  if (!batchId) return items;
  return items.filter((item) => String(item.batchId) === String(batchId));
};

export const filterByTestStatus = (items, status) => {
  if (!status || status === "all") return items;
  return items.filter((item) => item.status === status);
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
      item.batchName,
      item.topic,
      item.date?.slice?.(0, 10)
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
    const label = item.branchName || `Branch ${item.branchId}`;
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(item);
  });
  return map;
};

export const groupByBatch = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const label = `${item.branchName || "Branch"} · ${item.batchName || "All batches"}`;
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(item);
  });
  return map;
};
