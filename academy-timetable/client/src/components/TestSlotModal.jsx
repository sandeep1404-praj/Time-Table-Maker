import { useEffect, useState } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { useBatches } from "../hooks/useBatches";
import { useCreateSlot, useUpdateSlot, useDeleteSlot } from "../hooks/useSlots";
import TeacherSearchSelect from "./TeacherSearchSelect";

const emptyForm = {
  date: "",
  startTime: "",
  endTime: "",
  teacher: "",
  batch: "",
  topic: "",
  subject: "",
  chapterNumber: "",
  notes: ""
};

const TestSlotModal = ({
  slot,
  onClose,
  defaultTeacherId = "",
  defaultChapterNumber = "",
  defaultBatchId = ""
}) => {
  const { data: teachers = [] } = useTeachers();
  const { data: batches = [] } = useBatches();
  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const isEdit = Boolean(slot?._id);

  useEffect(() => {
    if (!slot) {
      const teacher = teachers.find((item) => item._id === defaultTeacherId);
      setForm({
        ...emptyForm,
        teacher: defaultTeacherId || "",
        subject: teacher?.subject || "",
        chapterNumber: defaultChapterNumber || teacher?.chapters?.[0]?.chapterNumber || "",
        batch: defaultBatchId || ""
      });
      return;
    }

    setForm({
      date: slot.date?.slice(0, 10) || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
      teacher: slot.teacher?._id || slot.teacher || "",
      batch: slot.batch?._id || slot.batch || "",
      topic: slot.topic || "",
      subject: slot.subject || "",
      chapterNumber: slot.chapterNumber || "",
      notes: slot.notes || ""
    });
  }, [slot, defaultTeacherId, defaultChapterNumber, defaultBatchId, teachers]);

  const selectedTeacher = teachers.find((teacher) => teacher._id === form.teacher);
  const teacherChapters = selectedTeacher?.chapters || [];

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleTeacherChange = (value) => {
    const teacher = teachers.find((item) => item._id === value);
    setForm((prev) => ({
      ...prev,
      teacher: value,
      subject: teacher?.subject || prev.subject,
      chapterNumber: teacher?.chapters?.[0]?.chapterNumber || prev.chapterNumber
    }));
  };

  const isPending = createSlot.isPending || updateSlot.isPending || deleteSlot.isPending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.date || !form.startTime || !form.endTime || !form.teacher || !form.batch) {
      setError("Date, time, teacher, and batch are required.");
      return;
    }
    if (!form.chapterNumber) {
      setError("Chapter is required for test tracking.");
      return;
    }

    setError("");
    const payload = {
      ...form,
      slotType: "test"
    };

    try {
      if (isEdit) {
        await updateSlot.mutateAsync({ id: slot._id, ...payload });
      } else {
        await createSlot.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Unable to save test.");
    }
  };

  const handleDelete = async () => {
    if (!slot?._id) return;
    const confirmed = window.confirm("Delete this test slot?");
    if (!confirmed) return;
    await deleteSlot.mutateAsync(slot._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isEdit ? "Edit Test" : "Add Test"}</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <div className="text-sm md:col-span-2">
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
          </div>
          <label className="text-sm">
            Subject
            <input
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            Chapter
            <select
              value={form.chapterNumber}
              onChange={(e) => updateField("chapterNumber", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            >
              <option value="">Select</option>
              {teacherChapters.map((chapter) => (
                <option key={chapter.chapterNumber} value={chapter.chapterNumber}>
                  {chapter.chapterNumber} {chapter.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            Batch
            <select
              value={form.batch}
              onChange={(e) => updateField("batch", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
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
            Start
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            End
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => updateField("endTime", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            Topic
            <input
              value={form.topic}
              onChange={(e) => updateField("topic", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "Saving..." : isEdit ? "Update Test" : "Add Test"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestSlotModal;
