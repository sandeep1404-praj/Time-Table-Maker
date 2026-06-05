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
    <div className="space-y-5">
      <div className="toolbar">
        <button type="button" onClick={handleArchive} className="btn-danger mr-auto">
          Archive Week
        </button>
        <button
          type="button"
          onClick={() => downloadFile("/api/export/all-pdfs", "timetables.zip", "application/zip")}
          className="btn-secondary"
        >
          Download All PDFs
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
          className="btn-secondary"
        >
          Master (Word)
        </button>
        <button
          type="button"
          onClick={() => downloadFile("/api/export/master/pdf", "master-timetable.pdf", "application/pdf")}
          className="btn-secondary"
        >
          Master (PDF)
        </button>
      </div>

      <div className="setup-grid">
        <div className="space-y-3">
          <p className="setup-section-title">Add Branch</p>
          <div className="flex gap-2">
            <input
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="Branch name"
              className="form-input"
            />
            <button onClick={handleAddBranch} className="btn-primary shrink-0">
              Add
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="setup-section-title">Add Batch (Column)</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="form-select min-w-[120px]"
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
              className="form-input min-w-[120px] flex-1"
            />
            <button onClick={handleAddBatch} className="btn-primary shrink-0">
              Add
            </button>
          </div>
          {batches.length === 0 && <p className="text-xs text-slate-500">No batches yet.</p>}
        </div>
        <div className="space-y-3">
          <p className="setup-section-title">Add Date Row</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="form-input"
            />
            <button onClick={handleAddDate} className="btn-primary shrink-0">
              Add
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="form-input"
            />
            <button onClick={handleAddWeek} className="btn-primary shrink-0">
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
