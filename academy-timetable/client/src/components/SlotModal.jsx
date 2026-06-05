import { useMemo, useState } from "react";
import { useTeachers, useCreateTeacher } from "../hooks/useTeachers";
import { useBatches } from "../hooks/useBatches";
import { useBranches } from "../hooks/useBranches";
import { useDeleteSlot, useSlots } from "../hooks/useSlots";
import { useTimetableStore } from "../store/useTimetableStore";
import { deriveSlotStatus } from "../utils/slotStatus";
import {
  sumCompletedChapterHours,
  getDurationHoursFromTimes
} from "../utils/chapterProgress";
import TeacherSearchSelect from "./TeacherSearchSelect";

const SlotModal = ({ initialData, onClose, onSave }) => {
  const { data: teachers = [] } = useTeachers();
  const { data: allSlots = [] } = useSlots();
  const createTeacher = useCreateTeacher();
  const deleteSlot = useDeleteSlot();
  const conflicts = useTimetableStore((state) => state.conflicts);
  const conflictMessage = useTimetableStore((state) => state.conflictMessage);
  const clearConflicts = useTimetableStore((state) => state.clearConflicts);
  const { data: batches = [] } = useBatches();
  const { data: branches = [] } = useBranches();
  const baseForm = useMemo(
    () => ({
      date: initialData?.date || "",
      startTime: "",
      endTime: "",
      teacher: "",
      batch: initialData?.batch || "",
      topic: "",
      subject: "",
      chapterNumber: "",
      slotType: "lecture",
      isCanceled: false,
      cancelNote: "",
      notes: ""
    }),
    [initialData]
  );
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [form, setForm] = useState(baseForm);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [teacherError, setTeacherError] = useState("");
  const [slotError, setSlotError] = useState("");

  const existingSlots = initialData?.slots || [];

  const hydrateFromSlot = (slot) => {
    setForm({
      date: slot.date?.slice(0, 10) || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
      teacher: slot.teacher?._id || slot.teacher || "",
      batch: slot.batch?._id || slot.batch || initialData?.batch || "",
      topic: slot.topic || "",
      subject: slot.subject || "",
      chapterNumber: slot.chapterNumber || "",
      slotType: slot.slotType || "lecture",
      isCanceled: slot.status === "canceled",
      cancelNote: slot.cancelNote || "",
      notes: slot.notes || ""
    });
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedTeacher = teachers.find((teacher) => teacher._id === form.teacher);
  const teacherChapters = selectedTeacher?.chapters || [];

  const selectedBatch = batches.find((item) => item._id === form.batch);
  const selectedBranchName = selectedBatch?.branch?.name;
  const selectedBatchName = selectedBatch?.name;

  const autoStatus = useMemo(
    () =>
      deriveSlotStatus({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        status: form.isCanceled ? "canceled" : "scheduled"
      }),
    [form.date, form.startTime, form.endTime, form.isCanceled]
  );

  const chapterProgressHours = useMemo(() => {
    if (!form.teacher || !form.chapterNumber || !form.batch) return 0;

    let total = sumCompletedChapterHours({
      slots: allSlots,
      batches,
      branches,
      teacherId: form.teacher,
      chapterNumber: form.chapterNumber,
      batchId: form.batch,
      excludeSlotId: selectedSlotId || null
    });

    if (form.startTime && form.endTime && !form.isCanceled && autoStatus === "completed") {
      total += getDurationHoursFromTimes(form.startTime, form.endTime);
    }

    return total;
  }, [
    allSlots,
    batches,
    branches,
    form.teacher,
    form.chapterNumber,
    form.batch,
    form.startTime,
    form.endTime,
    form.isCanceled,
    autoStatus,
    selectedSlotId
  ]);

  const plannedHours = teacherChapters.find(
    (chapter) => String(chapter.chapterNumber || "") === String(form.chapterNumber || "")
  )?.plannedHours;

  const handleTeacherChange = (value) => {
    const teacher = teachers.find((item) => item._id === value);
    setForm((prev) => ({
      ...prev,
      teacher: value,
      subject: teacher?.subject || prev.subject,
      chapterNumber: teacher?.chapters?.[0]?.chapterNumber || prev.chapterNumber
    }));
  };

  const handleSlotSelect = (value) => {
    setSelectedSlotId(value);
    if (!value) {
      setForm(baseForm);
      return;
    }
    const slot = existingSlots.find((item) => item._id === value);
    if (slot) {
      hydrateFromSlot(slot);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.date || !form.startTime || !form.endTime || !form.teacher || !form.batch) {
      setSlotError("Please fill date, time, teacher, and batch before saving.");
      return;
    }
    if (form.isCanceled && !form.cancelNote.trim()) {
      setSlotError("Please add a cancel note before marking canceled.");
      return;
    }
    setSlotError("");
    const { isCanceled, ...rest } = form;
    onSave(
      {
        ...rest,
        status: isCanceled ? "canceled" : autoStatus
      },
      selectedSlotId || null
    );
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim()) {
      setTeacherError("Teacher name is required.");
      return;
    }
    if (!form.subject.trim()) {
      setTeacherError("Subject is required. Enter a subject before adding the teacher.");
      return;
    }
    try {
      const teacher = await createTeacher.mutateAsync({
        name: newTeacherName.trim(),
        subject: form.subject.trim()
      });
      setNewTeacherName("");
      setTeacherError("");
      if (teacher?._id) {
        updateField("teacher", teacher._id);
      }
    } catch (error) {
      const message = error?.response?.data?.error || "Unable to add teacher.";
      setTeacherError(message);
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlotId) return;
    await deleteSlot.mutateAsync(selectedSlotId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <form
        className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Slot</h3>
          <button
            type="button"
            onClick={() => {
              clearConflicts();
              onClose();
            }}
            className="text-sm text-slate-500"
          >
            Close
          </button>
        </div>
        {slotError && (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {slotError}
          </div>
        )}
        {(conflictMessage || conflicts.length > 0) && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">
              {conflictMessage || "Conflict detected: overlapping slot."}
            </p>
            {conflicts.length > 0 && (
              <ul className="mt-2 space-y-1">
                {conflicts.map((conflict) => (
                  <li key={`${conflict.type}-${conflict.slot?._id}`}>
                    {conflict.type === "teacher" ? "Teacher" : "Batch"} overlap: {" "}
                    {conflict.slot?.date?.slice(0, 10)} {conflict.slot?.startTime}-
                    {conflict.slot?.endTime} | {conflict.slot?.teacher?.name || ""} | {" "}
                    {conflict.slot?.batch?.branch?.name || ""} {conflict.slot?.batch?.name || ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {existingSlots.length > 0 && (
            <label className="text-sm md:col-span-2">
              Edit Existing Slot
              <select
                value={selectedSlotId}
                onChange={(e) => handleSlotSelect(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              >
                <option value="">Create new slot</option>
                {existingSlots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.startTime}-{slot.endTime} {slot.topic || "(no topic)"}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm">
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          <div className="text-sm">
            Teacher
            <TeacherSearchSelect
              teachers={teachers}
              value={form.teacher}
              onChange={handleTeacherChange}
              placeholder="Search teacher..."
              emptyLabel="Select"
              compact
              allowEmpty
              className="mt-1"
            />
            {selectedTeacher?.allowScheduleOverlap && (
              <p className="mt-1 text-xs text-slate-500">
                This teacher can have overlapping time slots; batch conflicts still apply.
              </p>
            )}
          </div>
          <label className="text-sm">
            Subject
            <input
              type="text"
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            Chapter
            <select
              value={form.chapterNumber}
              onChange={(e) => updateField("chapterNumber", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            >
              <option value="">Select</option>
              {teacherChapters.map((chapter) => (
                <option key={chapter.chapterNumber} value={chapter.chapterNumber}>
                  {chapter.chapterNumber} {chapter.title}
                </option>
              ))}
            </select>
          </label>
          {/* <div className="text-sm">
            <p className="mb-1">Add Teacher (uses Subject above)</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                className="w-full rounded border border-slate-300 p-2"
              />
              <button
                type="button"
                onClick={handleAddTeacher}
                className="rounded bg-slate-900 px-3 text-white"
              >
                Add
              </button>
            </div>
            {teacherError && <p className="mt-1 text-xs text-red-600">{teacherError}</p>}
          </div> */}
          <label className="text-sm">
            Batch
            <select
              value={form.batch}
              onChange={(e) => updateField("batch", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            >
              <option value="">Select</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.branch?.name} {batch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Start Time
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            End Time
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => updateField("endTime", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            Topic
            <input
              type="text"
              value={form.topic}
              onChange={(e) => updateField("topic", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            Type
            <select
              value={form.slotType}
              onChange={(e) => updateField("slotType", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
            >
              <option value="lecture">Lecture</option>
              <option value="test">Test</option>
              <option value="mcq">MCQ</option>
              <option value="revision">Revision</option>
              <option value="coverup">Coverup (Legacy)</option>
            </select>
          </label>
          <div className="text-sm">
            <p className="mb-1 font-medium">Status</p>
            <p className="rounded border border-slate-200 bg-slate-50 px-2 py-2 capitalize text-slate-700">
              {autoStatus}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Updates automatically from date and time. Only canceled slots can be set manually.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isCanceled}
              onChange={(e) => updateField("isCanceled", e.target.checked)}
              className="rounded border-slate-300"
            />
            Mark as canceled
          </label>
          {form.isCanceled && (
            <label className="text-sm md:col-span-2">
              Cancel Note
              <textarea
                value={form.cancelNote}
                onChange={(e) => updateField("cancelNote", e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                rows={2}
              />
            </label>
          )}
          <div className="text-xs text-slate-500 md:col-span-2">
            {form.batch ? (
              <>
                Chapter progress
                {selectedBranchName && selectedBatchName
                  ? ` (${selectedBranchName} · ${selectedBatchName})`
                  : ""}
                : {chapterProgressHours.toFixed(1)} hrs
                {Number.isFinite(plannedHours) && plannedHours > 0
                  ? ` / ${plannedHours} hrs planned`
                  : ""}
                <span className="block text-[11px] text-slate-400">
                  Sums all completed lectures for this teacher, chapter, and batch — including
                  multiple slots on the same day.
                </span>
              </>
            ) : (
              "Select a batch to see chapter progress for that batch."
            )}
          </div>
          <label className="text-sm md:col-span-2">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              rows={3}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-2">
            Cancel
          </button>
          {selectedSlotId && (
            <button
              type="button"
              onClick={handleDeleteSlot}
              className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-600"
            >
              Delete Slot
            </button>
          )}
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">
            Save Slot
          </button>
        </div>
      </form>
    </div>
  );
};

export default SlotModal;
