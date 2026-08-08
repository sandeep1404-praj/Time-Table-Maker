import { useEffect, useMemo, useState } from "react";
import TeacherSearchSelect from "../components/TeacherSearchSelect";
import { useSlots } from "../hooks/useSlots";
import {
  useAddTeacherChapter,
  useCreateTeacher,
  useDeleteTeacher,
  useTeachers,
  useUpdateTeacher
} from "../hooks/useTeachers";
import { getSlotDurationHours } from "../utils/time";

const formatHours = (value) => `${Number(value || 0).toFixed(1)} hrs`;

const ChevronIcon = ({ open = false }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
  >
    <path
      d="M5 8l5 5 5-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StatCard = ({ label, value, description }) => (
  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    {description ? <p className="mt-1 text-xs leading-relaxed text-slate-300">{description}</p> : null}
  </div>
);

const TeacherManagementPage = () => {
  const { data: teachers = [] } = useTeachers();
  const { data: slots = [] } = useSlots();
  const addTeacherChapter = useAddTeacherChapter();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherSubject, setNewTeacherSubject] = useState("");
  const [newAllowScheduleOverlap, setNewAllowScheduleOverlap] = useState(false);
  const [createTeacherWarning, setCreateTeacherWarning] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherSubject, setEditTeacherSubject] = useState("");
  const [editAllowScheduleOverlap, setEditAllowScheduleOverlap] = useState(false);
  const [editTeacherWarning, setEditTeacherWarning] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterHours, setChapterHours] = useState("");
  const [chapterPanelVisible, setChapterPanelVisible] = useState(false);

  const selectedTeacher = teachers.find((teacher) => teacher._id === selectedTeacherId);
  const selectedTeacherChapters = selectedTeacher?.chapters || [];

  const teacherTotals = useMemo(() => {
    const totals = new Map();

    slots.forEach((slot) => {
      const teacherId = slot.teacher?._id || slot.teacher;
      if (!teacherId || slot.status === "canceled") return;

      const duration = getSlotDurationHours(slot);
      if (duration <= 0) return;

      const currentTotal = totals.get(String(teacherId)) || 0;
      totals.set(String(teacherId), currentTotal + duration);
    });

    return totals;
  }, [slots]);

  const selectedTeacherTotal = teacherTotals.get(String(selectedTeacherId)) || 0;

  useEffect(() => {
    if (!selectedTeacher) {
      setEditTeacherName("");
      setEditTeacherSubject("");
      setEditAllowScheduleOverlap(false);
      setChapterPanelVisible(false);
      return;
    }

    setEditTeacherName(selectedTeacher.name || "");
    setEditTeacherSubject(selectedTeacher.subject || "");
    setEditAllowScheduleOverlap(Boolean(selectedTeacher.allowScheduleOverlap));
    setEditTeacherWarning("");
    setChapterPanelVisible(false);

    const frameId = window.requestAnimationFrame(() => {
      setChapterPanelVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedTeacher]);

  const handleCreateTeacher = async () => {
    const name = newTeacherName.trim();
    const subject = newTeacherSubject.trim();

    if (!name && !subject) {
      setCreateTeacherWarning("Teacher name and subject are required.");
      return;
    }
    if (!name) {
      setCreateTeacherWarning("Teacher name is required.");
      return;
    }
    if (!subject) {
      setCreateTeacherWarning("Subject is required. Add a subject before saving the teacher.");
      return;
    }

    setCreateTeacherWarning("");
    try {
      await createTeacher.mutateAsync({
        name,
        subject,
        allowScheduleOverlap: newAllowScheduleOverlap
      });
      setNewTeacherName("");
      setNewTeacherSubject("");
      setNewAllowScheduleOverlap(false);
    } catch (error) {
      setCreateTeacherWarning(error?.response?.data?.error || "Unable to add teacher.");
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacherId) return;

    const name = editTeacherName.trim();
    const subject = editTeacherSubject.trim();

    if (!name) {
      setEditTeacherWarning("Teacher name is required.");
      return;
    }
    if (!subject) {
      setEditTeacherWarning("Subject is required.");
      return;
    }

    setEditTeacherWarning("");
    try {
      await updateTeacher.mutateAsync({
        id: selectedTeacherId,
        name,
        subject,
        allowScheduleOverlap: editAllowScheduleOverlap
      });
    } catch (error) {
      setEditTeacherWarning(error?.response?.data?.error || "Unable to update teacher.");
    }
  };

  const handleAddChapter = async () => {
    if (!selectedTeacherId || !chapterNumber.trim()) return;

    await addTeacherChapter.mutateAsync({
      id: selectedTeacherId,
      chapterNumber: chapterNumber.trim(),
      title: chapterTitle.trim(),
      plannedHours: Number(chapterHours || 0)
    });

    setChapterNumber("");
    setChapterTitle("");
    setChapterHours("");
  };

  const totalActiveHours = useMemo(
    () => Array.from(teacherTotals.values()).reduce((sum, value) => sum + value, 0),
    [teacherTotals]
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="grid gap-6 px-6 py-6 md:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] lg:px-10">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-100">
              Teacher workspace
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Teacher Management</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Create, update, and organize teachers from one focused dashboard. Active allotted time is calculated
                from current timetable slots only, so archived weeks naturally clear the total.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-200">
              <span className="rounded-full bg-white/10 px-3 py-1">{teachers.length} teachers</span>
              {/* <span className="rounded-full bg-white/10 px-3 py-1">{formatHours(totalActiveHours)} active time</span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {selectedTeacher ? `${selectedTeacher.name} selected` : "Select a teacher to edit chapters"}
              </span> */}
            </div>
          </div>

          {/* <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Teachers" value={teachers.length} description="Manage all active teacher records." />
            <StatCard
              label="Selected time"
              value={formatHours(selectedTeacherTotal)}
              description="Counted only from non-archived timetable slots."
            />
            <StatCard
              label="Selected chapters"
              value={selectedTeacher ? selectedTeacherChapters.length : "0"}
              description={selectedTeacher ? selectedTeacher.subject || "No subject set." : "Pick a teacher card."}
            />
          </div> */}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <section className="manage-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add Teacher</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Set the teacher name, subject, and overlap behavior in a single compact form.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick create
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div>
                <label className="form-label">Teacher name</label>
                <input
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Enter teacher name"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Subject</label>
                <input
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="form-input"
                />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={handleCreateTeacher} className="btn-primary h-[42px] w-full lg:w-auto">
                  Add Teacher
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newAllowScheduleOverlap}
                  onChange={(e) => setNewAllowScheduleOverlap(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Allow schedule overlap for this teacher
              </label>
              <p className="text-xs text-slate-500">Helpful when a teacher is intentionally double-booked.</p>
            </div>

            {createTeacherWarning && <p className="mt-3 text-sm text-amber-700">{createTeacherWarning}</p>}
          </section>

          <section className="manage-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Teachers</h3>
                <p className="mt-1 text-sm text-slate-500">Click a teacher to open the detail panel and chapters.</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {teachers.length} total
              </div>
            </div>

            {teachers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">No teachers yet</p>
                <p className="mt-1 text-sm text-slate-500">Create the first teacher above to start managing chapters.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {teachers.map((teacher) => {
                  const totalHours = teacherTotals.get(String(teacher._id)) || 0;

                  return (
                    <button
                      key={teacher._id}
                      type="button"
                      onClick={() => setSelectedTeacherId(teacher._id)}
                      className={`group rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        selectedTeacherId === teacher._id
                          ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                          : "border-slate-200 bg-white hover:border-indigo-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{teacher.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{teacher.subject || "No subject"}</p>
                        </div>
                        <div className="rounded-lg bg-white px-2.5 py-1 text-right shadow-sm ring-1 ring-slate-100">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Time</p>
                          <p className="text-sm font-bold text-indigo-700">{formatHours(totalHours)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {teacher.chapters?.length || 0} chapters
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            teacher.allowScheduleOverlap
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {teacher.allowScheduleOverlap ? "Overlap allowed" : "Conflict checks on"}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                          Click to manage
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteTeacher.mutateAsync(teacher._id);
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="xl:sticky xl:top-28 h-fit">
          <div
            className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-out ${
              selectedTeacher && chapterPanelVisible
                ? "max-h-[2000px] translate-y-0 opacity-100"
                : "max-h-[260px] translate-y-3 opacity-100"
            }`}
          >
            {selectedTeacher ? (
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Selected teacher</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{selectedTeacher.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{selectedTeacher.subject || "No subject"}</p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Active time</p>
                    <p className="text-lg font-bold text-indigo-700">{formatHours(selectedTeacherTotal)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {selectedTeacherChapters.length} chapters
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      selectedTeacher.allowScheduleOverlap
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {selectedTeacher.allowScheduleOverlap ? "Overlap allowed" : "Conflict checks on"}
                  </span>
                </div>

                <details className="group mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 group-open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Edit teacher</h4>
                      <p className="text-xs text-slate-500">Update the name, subject, or overlap setting.</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition group-open:bg-indigo-50 group-open:text-indigo-700 group-open:ring-indigo-200">
                      <ChevronIcon />
                    </span>
                  </summary>

                  <div className="border-t border-slate-200 px-4 py-4">
                    <div className="space-y-3">
                      <div>
                        <label className="form-label">Teacher name</label>
                        <input
                          value={editTeacherName}
                          onChange={(e) => setEditTeacherName(e.target.value)}
                          placeholder="Teacher name"
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">Subject</label>
                        <input
                          value={editTeacherSubject}
                          onChange={(e) => setEditTeacherSubject(e.target.value)}
                          placeholder="Subject"
                          className="form-input"
                        />
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={editAllowScheduleOverlap}
                          onChange={(e) => setEditAllowScheduleOverlap(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Allow schedule overlap
                      </label>
                      <button
                        type="button"
                        onClick={handleUpdateTeacher}
                        disabled={updateTeacher.isPending}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        {updateTeacher.isPending ? "Saving..." : "Save changes"}
                      </button>
                    </div>

                    {editTeacherWarning && <p className="mt-3 text-sm text-amber-700">{editTeacherWarning}</p>}
                  </div>
                </details>

                <details className="group mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 group-open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Add chapter</h4>
                      <p className="text-xs text-slate-500">Attach a chapter to the selected teacher.</p>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition group-open:bg-indigo-50 group-open:text-indigo-700 group-open:ring-indigo-200">
                      <ChevronIcon />
                    </span>
                  </summary>

                  <div className="border-t border-slate-200 px-4 py-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="form-label">Chapter no.</label>
                        <input
                          value={chapterNumber}
                          onChange={(e) => setChapterNumber(e.target.value)}
                          placeholder="Chapter no."
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">Planned hours</label>
                        <input
                          value={chapterHours}
                          onChange={(e) => setChapterHours(e.target.value)}
                          placeholder="0"
                          type="number"
                          min="0"
                          className="form-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label">Chapter title</label>
                        <input
                          value={chapterTitle}
                          onChange={(e) => setChapterTitle(e.target.value)}
                          placeholder="Chapter title"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddChapter}
                        disabled={addTeacherChapter.isPending}
                        className="btn-secondary disabled:opacity-50"
                      >
                        {addTeacherChapter.isPending ? "Adding..." : "Add chapter"}
                      </button>
                    </div>
                  </div>
                </details>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Chapters</h4>
                      <p className="text-xs text-slate-500">A quick overview of the selected teacher’s chapter list.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {selectedTeacherChapters.length} total
                    </span>
                  </div>

                  {selectedTeacherChapters.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                      <p className="text-sm font-medium text-slate-700">No chapters yet</p>
                      <p className="mt-1 text-sm text-slate-500">Use the add form above to create the first chapter.</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {selectedTeacherChapters.map((chapter) => (
                        <div
                          key={chapter._id || `${chapter.chapterNumber}-${chapter.title}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Chapter {chapter.chapterNumber}
                              </p>
                              <p className="mt-0.5 text-sm text-slate-600">{chapter.title || "Untitled chapter"}</p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              <p className="font-semibold text-slate-700">{Number(chapter.plannedHours || 0).toFixed(1)} hrs</p>
                              <p>planned</p>
                            </div>
                          </div>

                          {chapter.branchCompletions?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                                Completion tracked
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col justify-center p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                  ↘
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Select a teacher</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Click any teacher card on the left to open the detail panel, review chapters, and add a new one.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TeacherManagementPage;