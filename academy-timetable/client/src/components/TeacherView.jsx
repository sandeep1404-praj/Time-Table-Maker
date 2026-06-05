import { useTimetableStore } from "../store/useTimetableStore";
import { useTeachers } from "../hooks/useTeachers";
import { useTeacherTimetable } from "../hooks/useTimetable";
import TeacherSearchSelect from "./TeacherSearchSelect";
import api from "../api/client";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[240px] max-w-sm flex-1">
          <p className="mb-1 text-sm font-medium">Teacher</p>
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
            className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            Download (Word)
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!selectedTeacherId}
            className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            Download (PDF)
          </button>
        </div>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="border px-2 py-2">Date</th>
            <th className="border px-2 py-2">Day</th>
            <th className="border px-2 py-2">Branch</th>
            <th className="border px-2 py-2">Time</th>
            <th className="border px-2 py-2">Topic</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot._id}>
              <td className="border px-2 py-2">{slot.date.slice(0, 10)}</td>
              <td className="border px-2 py-2">
                {new Date(slot.date).toLocaleDateString("en-IN", { weekday: "short" })}
              </td>
              <td className="border px-2 py-2">{slot.batch?.branch?.name}</td>
              <td className="border px-2 py-2">
                {slot.startTime}-{slot.endTime}
              </td>
              <td className="border px-2 py-2">{slot.topic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherView;
