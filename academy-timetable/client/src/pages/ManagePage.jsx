import { useBranches, useDeleteBranch } from "../hooks/useBranches";
import { useBatches, useDeleteBatch } from "../hooks/useBatches";
import {
  useTeachers,
  useDeleteTeacher,
  useCreateTeacher,
  useAddTeacherChapter,
  useUpdateTeacher,
  useUpdateTeacherChapter,
  useDeleteTeacherChapter,
  useUpdateChapterBranchCompletion
} from "../hooks/useTeachers";
import { useEffect, useState } from "react";
import TeacherSearchSelect from "../components/TeacherSearchSelect";
import ChapterCompletionModal from "../components/ChapterCompletionModal";

const ManagePage = () => {
  const { data: branches = [] } = useBranches();
  const { data: batches = [] } = useBatches();
  const { data: teachers = [] } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const addTeacherChapter = useAddTeacherChapter();
  const updateTeacherChapter = useUpdateTeacherChapter();
  const deleteTeacherChapter = useDeleteTeacherChapter();
  const updateBranchCompletion = useUpdateChapterBranchCompletion();
  const deleteBranch = useDeleteBranch();
  const deleteBatch = useDeleteBatch();
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
  const [editingChapterId, setEditingChapterId] = useState("");
  const [editChapterNumber, setEditChapterNumber] = useState("");
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [completionChapter, setCompletionChapter] = useState(null);

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

  const selectedTeacher = teachers.find((teacher) => teacher._id === selectedTeacherId);

  useEffect(() => {
    if (!selectedTeacher) {
      setEditTeacherName("");
      setEditTeacherSubject("");
      setEditingChapterId("");
      return;
    }
    setEditTeacherName(selectedTeacher.name || "");
    setEditTeacherSubject(selectedTeacher.subject || "");
    setEditAllowScheduleOverlap(Boolean(selectedTeacher.allowScheduleOverlap));
    setEditTeacherWarning("");
    setEditingChapterId("");
  }, [
    selectedTeacherId,
    selectedTeacher?.name,
    selectedTeacher?.subject,
    selectedTeacher?.allowScheduleOverlap
  ]);

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

  const startEditChapter = (chapter) => {
    setEditingChapterId(chapter._id);
    setEditChapterNumber(chapter.chapterNumber || "");
    setEditChapterTitle(chapter.title || "");
  };

  const handleUpdateChapter = async () => {
    if (!selectedTeacherId || !editingChapterId) return;
    if (!editChapterNumber.trim()) return;
    await updateTeacherChapter.mutateAsync({
      teacherId: selectedTeacherId,
      chapterId: editingChapterId,
      chapterNumber: editChapterNumber.trim(),
      title: editChapterTitle.trim()
    });
    setEditingChapterId("");
  };

  const handleDeleteChapter = async () => {
    if (!selectedTeacherId || !editingChapterId) return;
    const confirmed = window.confirm("Delete this chapter? This cannot be undone.");
    if (!confirmed) return;
    await deleteTeacherChapter.mutateAsync({
      teacherId: selectedTeacherId,
      chapterId: editingChapterId
    });
    setEditingChapterId("");
  };

  const handleToggleCompletion = async ({ branchId, batchId, isCompleted }) => {
    if (!selectedTeacherId || !completionChapter?._id) return;
    await updateBranchCompletion.mutateAsync({
      teacherId: selectedTeacherId,
      chapterId: completionChapter._id,
      branchId,
      batchId,
      isCompleted
    });
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

  return (
    <div className="space-y-5">
      <div className="manage-card">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add Teacher</h2>
          <p className="text-xs text-slate-500">Subject auto-fills in slot form.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value)}
              placeholder="Teacher name"
              className="form-input"
            />
            <input
              value={newTeacherSubject}
              onChange={(e) => setNewTeacherSubject(e.target.value)}
              placeholder="Subject"
              className="form-input"
            />
            <button type="button" onClick={handleCreateTeacher} className="btn-primary">
              Add Teacher
            </button>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newAllowScheduleOverlap}
              onChange={(e) => setNewAllowScheduleOverlap(e.target.checked)}
              className="rounded border-slate-300"
            />
            Allow this teacher&apos;s schedule to overlap (skip teacher conflict checks)
          </label>
          {createTeacherWarning && (
            <p className="mt-2 text-sm text-amber-700">{createTeacherWarning}</p>
          )}
        </div>
        <div className="manage-subcard mb-5">
          <h3 className="font-semibold text-slate-800">Edit Teacher &amp; Chapters</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <TeacherSearchSelect
              teachers={teachers}
              value={selectedTeacherId}
              onChange={setSelectedTeacherId}
              placeholder="Search teacher..."
              emptyLabel="Select teacher"
              compact
            />
            <input
              value={selectedTeacher?.subject || ""}
              placeholder="Subject"
              disabled
              className="form-input bg-slate-100"
            />
          </div>
          {selectedTeacherId && (
            <>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  placeholder="Teacher name"
                  className="form-input"
                />
                <input
                  value={editTeacherSubject}
                  onChange={(e) => setEditTeacherSubject(e.target.value)}
                  placeholder="Subject"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={handleUpdateTeacher}
                  disabled={updateTeacher.isPending}
                  className="btn-secondary disabled:opacity-50"
                >
                  {updateTeacher.isPending ? "Saving..." : "Save Teacher"}
                </button>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editAllowScheduleOverlap}
                  onChange={(e) => setEditAllowScheduleOverlap(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Allow this teacher&apos;s schedule to overlap (skip teacher conflict checks)
              </label>
            </>
          )}
          {editTeacherWarning && (
            <p className="mt-2 text-sm text-amber-700">{editTeacherWarning}</p>
          )}
          <h4 className="mt-4 text-sm font-semibold">Add Chapter</h4>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
              placeholder="Chapter no."
              className="form-input"
            />
            <input
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="Chapter title"
              className="form-input"
            />
            <input
              value={chapterHours}
              onChange={(e) => setChapterHours(e.target.value)}
              placeholder="Planned hours"
              type="number"
              min="0"
              className="form-input"
            />
            <button type="button" onClick={handleAddChapter} className="btn-secondary">
              Add Chapter
            </button>
          </div>
          {selectedTeacher?.chapters?.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Chapters
              </p>
              {selectedTeacher.chapters.map((chapter) => (
                <div
                  key={chapter._id || `${chapter.chapterNumber}-${chapter.title}`}
                  className="rounded border border-slate-200 bg-white p-2"
                >
                  {editingChapterId === chapter._id ? (
                    <div className="grid gap-2 md:grid-cols-4">
                      <input
                        value={editChapterNumber}
                        onChange={(e) => setEditChapterNumber(e.target.value)}
                        placeholder="Chapter no."
                        className="rounded border border-slate-300 p-2 text-sm"
                      />
                      <input
                        value={editChapterTitle}
                        onChange={(e) => setEditChapterTitle(e.target.value)}
                        placeholder="Chapter title"
                        className="rounded border border-slate-300 p-2 text-sm md:col-span-2"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateChapter}
                          disabled={updateTeacherChapter.isPending}
                          className="rounded bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChapterId("")}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteChapter}
                          disabled={deleteTeacherChapter.isPending}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-slate-800">
                          Ch. {chapter.chapterNumber} — {chapter.title || "Untitled"}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          {chapter.plannedHours} hrs planned
                        </span>
                      </div>
                      {chapter._id && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => startEditChapter(chapter)}
                            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setCompletionChapter(chapter)}
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark Complete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Delete Records</h2>
          <p className="text-xs text-slate-500">Use carefully. This cannot be undone.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teachers</p>
            {teachers.length === 0 && <p className="mt-2 text-xs text-slate-500">No teachers.</p>}
            {teachers.length > 0 && (
              <div className="mt-2 space-y-2">
                {teachers.map((teacher) => (
                  <div key={teacher._id} className="flex items-center justify-between rounded bg-white px-2 py-2">
                    <span className="text-sm font-medium text-slate-700">{teacher.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteTeacher.mutateAsync(teacher._id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branches</p>
            {branches.length === 0 && <p className="mt-2 text-xs text-slate-500">No branches.</p>}
            {branches.length > 0 && (
              <div className="mt-2 space-y-2">
                {branches.map((branch) => (
                  <div key={branch._id} className="flex items-center justify-between rounded bg-white px-2 py-2">
                    <span className="text-sm font-medium text-slate-700">{branch.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteBranch.mutateAsync(branch._id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Batches</p>
            {batches.length === 0 && <p className="mt-2 text-xs text-slate-500">No batches.</p>}
            {batches.length > 0 && (
              <div className="mt-2 space-y-2">
                {batches.map((batch) => (
                  <div key={batch._id} className="flex items-center justify-between rounded bg-white px-2 py-2">
                    <span className="text-sm font-medium text-slate-700">
                      {batch.branch?.name} {batch.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteBatch.mutateAsync(batch._id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {completionChapter && (
        <ChapterCompletionModal
          chapter={
            selectedTeacher?.chapters?.find((item) => item._id === completionChapter._id) ||
            completionChapter
          }
          branches={branches}
          onClose={() => setCompletionChapter(null)}
          onToggle={handleToggleCompletion}
          isPending={updateBranchCompletion.isPending}
        />
      )}
    </div>
  );
};

export default ManagePage;
