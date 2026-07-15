import { useTimetableStore } from "../store/useTimetableStore";
import { useTeachers } from "../hooks/useTeachers";
import { useTeacherTimetable } from "../hooks/useTimetable";
import TeacherSearchSelect from "./TeacherSearchSelect";
import api from "../api/client";
import { formatDisplayDate, getWeekdayName } from "../utils/dateFormat";

const TeacherView = () => {
  const { data: teachers = [] } = useTeachers();
  const selectedTeacherId = useTimetableStore((state) => state.selectedTeacherId);
  const setSelectedTeacherId = useTimetableStore((state) => state.setSelectedTeacherId);
  const { data: slots = [] } = useTeacherTimetable(selectedTeacherId);

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
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Branch</th>
                <th>Time</th>
                <th>Topic</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot._id}>
                  <td className="font-medium">{formatDisplayDate(slot.date)}</td>
                  <td>
                    <span className="day-badge">{getWeekdayName(slot.date)}</span>
                  </td>
                  <td>{slot.batch?.branch?.name}</td>
                  <td className="text-xs font-semibold text-slate-800">
                    {slot.startTime} – {slot.endTime}
                  </td>
                  <td className="text-xs font-medium">{slot.topic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherView;
