import { useTimetableStore } from "../store/useTimetableStore";
import { useTeachers } from "../hooks/useTeachers";
import { useTeacherTimetable } from "../hooks/useTimetable";
import TeacherSearchSelect from "./TeacherSearchSelect";
import api from "../api/client";
import { formatDisplayDate, getWeekdayName } from "../utils/dateFormat";
import { formatTimeForDisplay } from "../utils/time";

const TeacherView = () => {
  const { data: teachers = [] } = useTeachers();
  const selectedTeacherId = useTimetableStore((state) => state.selectedTeacherId);
  const setSelectedTeacherId = useTimetableStore((state) => state.setSelectedTeacherId);
  const { data: slots = [] } = useTeacherTimetable(selectedTeacherId);

  const selectedTeacher = teachers.find((t) => t._id === selectedTeacherId);
  const getChapterDisplay = (slot) => {
    if (!slot.chapterNumber) return "—";
    const chapter = selectedTeacher?.chapters?.find(
      (ch) => String(ch.chapterNumber) === String(slot.chapterNumber)
    );
    return chapter?.title
      ? `Ch. ${slot.chapterNumber} – ${chapter.title}`
      : `Ch. ${slot.chapterNumber}`;
  };

  const downloadDocx = async () => {
    if (!selectedTeacherId) return;
    const response = await api.get(`/api/export/teacher/${selectedTeacherId}/docx`, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "teacher-timetable.docx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const downloadPdf = async () => {
    if (!selectedTeacherId) return;
    const response = await api.get(`/api/export/teacher/${selectedTeacherId}/pdf`, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "teacher-timetable.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <div className="panel-body h-[21rem] overflow-y-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[240px] max-w-sm flex-1">
              <label className="form-label">Teacher</label>
              <TeacherSearchSelect
                teachers={teachers}
                value={selectedTeacherId}
                onChange={setSelectedTeacherId}
                placeholder="Search teacher..."
                emptyLabel="Select teacher"
                compact
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadDocx}
                disabled={!selectedTeacherId}
                className="btn-secondary"
              >
                Download (Word)
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={!selectedTeacherId}
                className="btn-secondary"
              >
                Download (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="empty-state">
          <p className="font-semibold text-slate-700">No schedule to display</p>
          <p className="mt-1 text-sm text-slate-500">Select a teacher to view their timetable.</p>
        </div>
      ) : (() => {
          const groups = [];
          const seen = new Map();
          slots.forEach((slot) => {
            const key = slot.date?.slice(0, 10) ?? slot.date;
            if (!seen.has(key)) {
              seen.set(key, []);
              groups.push({ key, slots: seen.get(key) });
            }
            seen.get(key).push(slot);
          });

          return (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Branch</th>
                    <th>Chapter</th>
                    <th>Time</th>
                    <th>Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.flatMap(({ slots: groupSlots }) =>
                    groupSlots.map((slot, idx) => (
                      <tr key={slot._id}>
                        {idx === 0 && (
                          <>
                            <td className="font-medium align-top" rowSpan={groupSlots.length}>
                              {formatDisplayDate(slot.date)}
                            </td>
                            <td className="align-top" rowSpan={groupSlots.length}>
                              <span className="day-badge">{getWeekdayName(slot.date)}</span>
                            </td>
                          </>
                        )}
                        <td>{slot.batch?.branch?.name}</td>
                        <td className="text-xs font-medium">{getChapterDisplay(slot)}</td>
                        <td className="text-xs font-semibold text-slate-800">
                          {formatTimeForDisplay(slot.startTime)} – {formatTimeForDisplay(slot.endTime)}
                        </td>
                        <td className="text-xs font-medium">{slot.topic}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })()
      }
    </div>
  );
};

export default TeacherView;
