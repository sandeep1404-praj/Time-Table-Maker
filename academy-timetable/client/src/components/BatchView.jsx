import { useTimetableStore } from "../store/useTimetableStore";
import { useBatches } from "../hooks/useBatches";
import { useBranches } from "../hooks/useBranches";
import { useBatchTimetable } from "../hooks/useTimetable";
import api from "../api/client";
import { useState } from "react";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm">
            Branch
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setSelectedBatchId("");
              }}
              className="ml-2 rounded border border-slate-300 p-2"
            >
              <option value="">All</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Batch
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="ml-2 rounded border border-slate-300 p-2"
            >
              <option value="">Select</option>
              {filteredBatches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.branch?.name} {batch.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadDocx}
            disabled={!selectedBatchId}
            className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            Download (Word)
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!selectedBatchId}
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
            <th className="border px-2 py-2">Faculty</th>
            <th className="border px-2 py-2">Chapter</th>
            <th className="border px-2 py-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot._id}>
              <td className="border px-2 py-2">{slot.date.slice(0, 10)}</td>
              <td className="border px-2 py-2">
                {new Date(slot.date).toLocaleDateString("en-IN", { weekday: "short" })}
              </td>
              <td className="border px-2 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: slot.teacher?.color || "#94a3b8" }}
                  />
                  <span>{slot.teacher?.name}</span>
                </div>
              </td>
              <td className="border px-2 py-2">{slot.topic}</td>
              <td className="border px-2 py-2">
                {slot.startTime}-{slot.endTime}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatchView;
