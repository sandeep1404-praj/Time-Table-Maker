import { useMemo, useState } from "react";
import { useBatches } from "../hooks/useBatches";
import { useArchives, useArchiveData, useDeleteArchive } from "../hooks/useArchives";

const groupSlotsByDate = (slots, extraDates) => {
  const map = new Map();
  slots.forEach((slot) => {
    const dateKey = slot.date.slice(0, 10);
    if (!map.has(dateKey)) {
      map.set(dateKey, { date: dateKey });
    }
    const row = map.get(dateKey);
    row[slot.batch?._id] = row[slot.batch?._id] || [];
    row[slot.batch?._id].push(slot);
  });

  extraDates.forEach((date) => {
    if (!map.has(date)) {
      map.set(date, { date });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const HistoryPage = () => {
  const { data: batches = [] } = useBatches();
  const { data: archives = [] } = useArchives();
  const deleteArchive = useDeleteArchive();
  const [selectedArchiveId, setSelectedArchiveId] = useState("");
  const { data: archiveData } = useArchiveData(selectedArchiveId);

  const selectedArchive = archives.find((arc) => arc._id === selectedArchiveId);

  const handleDeleteArchive = async () => {
    if (!selectedArchiveId || !selectedArchive) return;
    const confirmed = window.confirm(
      `Delete archived week "${selectedArchive.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await deleteArchive.mutateAsync(selectedArchiveId);
    setSelectedArchiveId("");
  };

  const rowData = useMemo(() => {
    if (!archiveData) return [];
    const extraDates = (archiveData.dates || []).map((row) => row.date.slice(0, 10));
    return groupSlotsByDate(archiveData.slots || [], extraDates);
  }, [archiveData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Select Archive Week
          <select
            value={selectedArchiveId}
            onChange={(e) => setSelectedArchiveId(e.target.value)}
            className="ml-2 rounded border border-slate-300 p-2"
          >
            <option value="">Select an archive...</option>
            {archives.map((arc) => (
              <option key={arc._id} value={arc._id}>
                {arc.name}
              </option>
            ))}
          </select>
        </label>
        {selectedArchiveId && (
          <button
            type="button"
            onClick={handleDeleteArchive}
            disabled={deleteArchive.isPending}
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
          >
            {deleteArchive.isPending ? "Deleting..." : "Delete Archive Week"}
          </button>
        )}
      </div>

      {!selectedArchiveId ? (
        <div className="mt-8 text-center text-slate-500">
          Please select an archived week to view its timetable.
        </div>
      ) : (
        <div className="w-full overflow-auto hide-scrollbar">
          <table className="min-w-max border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="sticky left-0 z-10 border bg-slate-100 px-2 py-2 text-left">
                  Date
                </th>
                {batches.map((batch) => (
                  <th key={batch._id} className="min-w-[180px] border px-2 py-2 text-center">
                    <div className="text-xs text-slate-500">{batch.branch?.name}</div>
                    <div className="font-semibold">{batch.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowData.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 border bg-white px-2 py-2 font-medium">
                    {row.date}
                  </td>
                  {batches.map((batch) => {
                    const cellSlots = row[batch._id] || [];
                    return (
                      <td
                        key={batch._id}
                        className="min-w-[180px] border px-2 py-2 align-top"
                      >
                        {cellSlots.length === 0 ? (
                          <span className="text-xs text-slate-300">-</span>
                        ) : (
                          <div className="space-y-1">
                            {cellSlots.map((slot) => (
                              <div key={slot._id} className="rounded border border-slate-200 bg-white px-2 py-1 opacity-80">
                                <div className="text-sm font-semibold">
                                  {slot.startTime}-{slot.endTime}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <span
                                    className="inline-flex h-2 w-2 rounded-full"
                                    style={{ backgroundColor: slot.teacher?.color || "#94a3b8" }}
                                  />
                                  <span>{slot.teacher?.name || ""}</span>
                                </div>
                                <div className="text-xs text-slate-500">{slot.topic}</div>
                                {slot.status && slot.status !== "scheduled" && (
                                  <div className="mt-1 text-[11px] uppercase tracking-wide text-amber-600">
                                    {slot.status}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
