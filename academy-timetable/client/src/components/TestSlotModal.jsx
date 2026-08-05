import { useEffect, useMemo, useState } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { useBatches } from "../hooks/useBatches";
import { useCreateSlot, useUpdateSlot, useDeleteSlot } from "../hooks/useSlots";
import { getAllChapterOptions } from "../utils/testProgress";
import { formatTimeForStorage, splitStoredTime } from "../utils/time";
import { formatBatchDisplayName } from "../utils/displayName";
import SearchableComboBox from "./SearchableComboBox";

const emptyForm = {
  date: "",
  startTime: "",
  startPeriod: "AM",
  endTime: "",
  endPeriod: "AM",
  batch: "",
  topic: "",
  subject: "",
  chapterNumber: "",
  notes: ""
};

const TestSlotModal = ({
  slot,
  onClose,
  defaultSubject = "",
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

  const chapterOptions = useMemo(() => getAllChapterOptions(teachers), [teachers]);
  const isEdit = Boolean(slot?._id);
  const startTimeValue = formatTimeForStorage(form.startTime, form.startPeriod);
  const endTimeValue = formatTimeForStorage(form.endTime, form.endPeriod);

  useEffect(() => {
    if (!slot) {
      setForm({
        ...emptyForm,
        subject: defaultSubject || "",
        chapterNumber: defaultChapterNumber || "",
        batch: defaultBatchId || ""
      });
      return;
    }

    setForm({
      date: slot.date?.slice(0, 10) || "",
      startTime: splitStoredTime(slot.startTime).time,
      startPeriod: splitStoredTime(slot.startTime).period,
      endTime: splitStoredTime(slot.endTime).time,
      endPeriod: splitStoredTime(slot.endTime).period,
      batch: slot.batch?._id || slot.batch || "",
      topic: slot.topic || "",
      subject: slot.subject || "",
      chapterNumber: slot.chapterNumber || "",
      notes: slot.notes || ""
    });
  }, [slot, defaultSubject, defaultChapterNumber, defaultBatchId]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleChapterChange = (value) => {
    const option = chapterOptions.find((item) => item.chapterNumber === value);
    setForm((prev) => ({
      ...prev,
      chapterNumber: value,
      subject: option?.subject || prev.subject
    }));
  };

  const isPending = createSlot.isPending || updateSlot.isPending || deleteSlot.isPending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.date || !startTimeValue || !endTimeValue || !form.batch) {
      setError("Date, time, and batch are required.");
      return;
    }
    if (!form.chapterNumber || !form.subject) {
      setError("Subject and chapter are required for test tracking.");
      return;
    }

    setError("");
    const payload = {
      ...form,
      startTime: startTimeValue,
      endTime: endTimeValue,
      teacher: null,
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
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="relative z-[81] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{isEdit ? "Edit Test" : "Add Test"}</h3>
            <p className="text-xs text-slate-500">Tests are tracked by subject, chapter, and batch — no teacher.</p>
          </div>
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
          <label className="text-sm">
            Subject
            <input
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="e.g. Physics"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="text-sm">
            Chapter
            <SearchableComboBox
              mode="value"
              options={chapterOptions}
              value={form.chapterNumber}
              onChange={handleChapterChange}
              placeholder="Search chapter..."
              emptyLabel="Select chapter"
              className="mt-1"
              inputClassName="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              getOptionLabel={(chapter) => `${chapter.subject ? `${chapter.subject} · ` : ""}Ch. ${chapter.chapterNumber} ${chapter.title}`.trim()}
              getOptionValue={(chapter) => chapter.chapterNumber}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Batch
            <SearchableComboBox
              options={batches}
              value={form.batch}
              onChange={(value) => updateField("batch", value)}
              placeholder="Search batch..."
              emptyLabel="Select"
              className="mt-1"
              inputClassName="mt-1 w-full rounded-lg border border-slate-300 p-2"
              getOptionLabel={(batch) => formatBatchDisplayName(batch)}
              getOptionValue={(batch) => batch._id}
            />
          </label>
          <label className="text-sm">
            Start
            <div className="mt-1 flex gap-2">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2"
              />
              <select
                value={form.startPeriod}
                onChange={(e) => updateField("startPeriod", e.target.value)}
                className="w-24 rounded-lg border border-slate-300 p-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </label>
          <label className="text-sm">
            End
            <div className="mt-1 flex gap-2">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2"
              />
              <select
                value={form.endPeriod}
                onChange={(e) => updateField("endPeriod", e.target.value)}
                className="w-24 rounded-lg border border-slate-300 p-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
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
