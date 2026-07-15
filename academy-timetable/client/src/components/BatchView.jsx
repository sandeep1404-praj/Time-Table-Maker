import { useTimetableStore } from "../store/useTimetableStore";
import { useBatches } from "../hooks/useBatches";
import { useBranches } from "../hooks/useBranches";
import { useBatchTimetable } from "../hooks/useTimetable";
import api from "../api/client";
import { useState } from "react";
import { formatDisplayDate, getWeekdayName } from "../utils/dateFormat";
import { getTeacherHighlightStyle } from "../utils/teacherColor";
import SearchableComboBox from "./SearchableComboBox";

const BatchView = () => {
  const { data: batches = [] } = useBatches();
  const { data: branches = [] } = useBranches();
  const selectedBatchId = useTimetableStore((state) => state.selectedBatchId);
  const setSelectedBatchId = useTimetableStore((state) => state.setSelectedBatchId);
  const { data: slots = [] } = useBatchTimetable(selectedBatchId);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const filteredBatches = selectedBranchId
    ? batches.filter((batch) => batch.branch?._id === selectedBranchId)
    : batches;

  const downloadDocx = async () => {
    if (!selectedBatchId) return;
    const response = await api.get(`/api/export/batch/${selectedBatchId}/docx`, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "batch-timetable.docx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const downloadPdf = async () => {
    if (!selectedBatchId) return;
    const response = await api.get(`/api/export/batch/${selectedBatchId}/pdf`, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "batch-timetable.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="panel-body h-[21rem] overflow-y-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="form-label">Branch</label>
                <SearchableComboBox
                  options={branches}
                  value={selectedBranchId}
                  onChange={(value) => {
                    setSelectedBranchId(value);
                    setSelectedBatchId("");
                  }}
                  placeholder="Search branch..."
                  emptyLabel="All"
                  className="min-w-[180px]"
                  inputClassName="form-input min-w-[180px]"
                  getOptionLabel={(branch) => branch.name}
                  getOptionValue={(branch) => branch._id}
                />
              </div>
              <div>
                <label className="form-label">Batch</label>
                <SearchableComboBox
                  options={filteredBatches}
                  value={selectedBatchId}
                  onChange={setSelectedBatchId}
                  placeholder="Search batch..."
                  emptyLabel="Select"
                  className="min-w-[220px]"
                  inputClassName="form-input min-w-[220px]"
                  getOptionLabel={(batch) => `${batch.branch?.name || ""} ${batch.name}`.trim()}
                  getOptionValue={(batch) => batch._id}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadDocx}
                disabled={!selectedBatchId}
                className="btn-secondary"
              >
                Download (Word)
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={!selectedBatchId}
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
          <p className="mt-1 text-sm text-slate-500">Select a batch to view its timetable.</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Faculty</th>
                <th>Chapter</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot._id}>
                  <td className="font-medium">{formatDisplayDate(slot.date)}</td>
                  <td>
                    <span className="day-badge">{getWeekdayName(slot.date)}</span>
                  </td>
                  <td>
                    <span
                      className="inline-block rounded-md border px-2 py-0.5 text-xs font-semibold"
                      style={getTeacherHighlightStyle(slot.teacher?.color)}
                    >
                      {slot.teacher?.name}
                    </span>
                  </td>
                  <td className="text-xs font-medium">{slot.topic}</td>
                  <td className="text-xs font-semibold text-slate-800">
                    {slot.startTime} – {slot.endTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BatchView;
