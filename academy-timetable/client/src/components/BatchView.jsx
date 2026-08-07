import { useTimetableStore } from "../store/useTimetableStore";
import { useBatches } from "../hooks/useBatches";
import { useBranches } from "../hooks/useBranches";
import { useBatchTimetable } from "../hooks/useTimetable";
import api from "../api/client";
import { useState } from "react";
import { formatDisplayDate, getWeekdayName } from "../utils/dateFormat";
import { getTeacherHighlightStyle } from "../utils/teacherColor";
import { formatTimeForDisplay } from "../utils/time";
import { formatBatchDisplayName } from "../utils/displayName";
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
                  getOptionLabel={(batch) => formatBatchDisplayName(batch)}
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
      ) : (() => {
          // Group slots by date key preserving order
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

          const SLOT_TYPE_LABEL = {
            "lecture": "Lecture (Theory)",
            "lecture-theory": "Lecture (Theory)",
            "lecture-mcq": "Lecture (MCQ)",
            "test": "Test",
            "mcq": "MCQ",
            "revision": "Revision",
            "coverup": "Coverup"
          };

          return (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Faculty</th>
                    <th>Chapter</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.flatMap(({ key, slots: groupSlots }) =>
                    groupSlots.map((slot, idx) => {
                      const chapter = slot.teacher?.chapters?.find(
                        (ch) => String(ch.chapterNumber) === String(slot.chapterNumber)
                      );
                      const chapterDisplay = slot.chapterNumber
                        ? chapter?.title
                          ? `Ch. ${slot.chapterNumber} – ${chapter.title}`
                          : `Ch. ${slot.chapterNumber}`
                        : "—";

                      return (
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
                          <td>
                            <span
                              className="inline-block rounded-md border px-2 py-0.5 text-xs font-semibold"
                              style={getTeacherHighlightStyle(slot.teacher?.color)}
                            >
                              {slot.teacher?.name}
                            </span>
                          </td>
                          <td className="text-xs font-medium">{chapterDisplay}</td>
                          <td className="text-xs font-semibold text-slate-800">
                            {formatTimeForDisplay(slot.startTime)} – {formatTimeForDisplay(slot.endTime)}
                          </td>
                          <td className="text-xs font-medium">
                            <span className={`inline-block rounded-md px-2 py-0.5 font-semibold ${
                              slot.slotType === "test" ? "bg-red-50 text-red-700"
                                : slot.slotType === "lecture-mcq" ? "bg-violet-50 text-violet-700"
                                : slot.slotType === "revision" ? "bg-amber-50 text-amber-700"
                                : slot.slotType === "coverup" ? "bg-slate-100 text-slate-600"
                                : "bg-sky-50 text-sky-700"
                            }`}>
                              {SLOT_TYPE_LABEL[slot.slotType] || slot.slotType || "Lecture (Theory)"}
                            </span>
                          </td>
                          <td className="text-xs font-medium">{slot.topic}</td>
                        </tr>
                      );
                    })
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

export default BatchView;
