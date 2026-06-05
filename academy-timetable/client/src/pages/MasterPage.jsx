import { useState } from "react";
import MasterGrid from "../components/MasterGrid";
import { useBranches, useCreateBranch } from "../hooks/useBranches";
import { useBatches, useCreateBatch } from "../hooks/useBatches";
import { useCreateDate, useCreateWeekDates } from "../hooks/useDates";
import api from "../api/client";

const MasterPage = () => {
  const { data: branches = [] } = useBranches();
  const { data: batches = [] } = useBatches();
  const createBranch = useCreateBranch();
  const createBatch = useCreateBatch();
  const createDate = useCreateDate();
  const createWeekDates = useCreateWeekDates();
  const [newBranch, setNewBranch] = useState("");
  const [newBatch, setNewBatch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [newDate, setNewDate] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");

  const downloadFile = async (url, filename, mimeType) => {
    const response = await api.get(url, { responseType: "blob" });
    const blob = new Blob([response.data], {
      type: mimeType || response.headers["content-type"] || "application/octet-stream"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handleAddBranch = async () => {
    if (!newBranch.trim()) return;
    await createBranch.mutateAsync({ name: newBranch.trim() });
    setNewBranch("");
  };

  const handleAddBatch = async () => {
    if (!newBatch.trim() || !selectedBranch) return;
    await createBatch.mutateAsync({ name: newBatch.trim(), branch: selectedBranch });
    setNewBatch("");
  };

  const handleAddDate = () => {
    if (!newDate) return;
    createDate.mutateAsync({ date: newDate });
    setNewDate("");
  };

  const handleAddWeek = () => {
    if (!weekStartDate) return;
    createWeekDates.mutateAsync({ startDate: weekStartDate });
    setWeekStartDate("");
  };

  const handleArchive = async () => {
    const confirmed = window.confirm("Archive all current dates and slots?");
    if (!confirmed) return;
    await api.post("/api/archives");
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleArchive}
          className="mr-auto rounded bg-red-600 px-3 py-2 text-sm text-white"
        >
          Archive Week
        </button>
        <button
          type="button"
          onClick={() => downloadFile("/api/export/all-pdfs", "timetables.zip", "application/zip")}
          className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          Download All PDFs (Zip)
        </button>
        <button
          type="button"
          onClick={() =>
            downloadFile(
              "/api/export/master/docx",
              "master-timetable.docx",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
          }
          className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          Download Master (Word)
        </button>
        <button
          type="button"
          onClick={() => downloadFile("/api/export/master/pdf", "master-timetable.pdf", "application/pdf")}
          className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          Download Master (PDF)
        </button>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Add Branch</p>
          <div className="flex gap-2">
            <input
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="Branch name"
              className="w-full rounded border border-slate-300 p-2 text-sm"
            />
            <button onClick={handleAddBranch} className="rounded bg-slate-900 px-3 text-sm text-white">
              Add
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Add Batch (Column)</p>
          <div className="flex gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded border border-slate-300 p-2 text-sm"
            >
              <option value="">Branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <input
              value={newBatch}
              onChange={(e) => setNewBatch(e.target.value)}
              placeholder="Batch name"
              className="w-full rounded border border-slate-300 p-2 text-sm"
            />
            <button onClick={handleAddBatch} className="rounded bg-slate-900 px-3 text-sm text-white">
              Add
            </button>
          </div>
          {batches.length === 0 && <p className="text-xs text-slate-500">No batches yet.</p>}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Add Date Row</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded border border-slate-300 p-2 text-sm"
            />
            <button onClick={handleAddDate} className="rounded bg-slate-900 px-3 text-sm text-white">
              Add
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full rounded border border-slate-300 p-2 text-sm"
            />
            <button onClick={handleAddWeek} className="rounded bg-slate-900 px-3 text-sm text-white">
              Add Week
            </button>
          </div>
        </div>
      </div>
      <MasterGrid />
    </div>
  );
};

export default MasterPage;
