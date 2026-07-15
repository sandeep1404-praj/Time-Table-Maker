import { useMemo, useState } from "react";
import { useBatches } from "../hooks/useBatches";
import { useArchives, useArchiveData, useDeleteArchive } from "../hooks/useArchives";
import SlotCard from "../components/SlotCard";
import DateCell from "../components/DateCell";
import SearchableComboBox from "../components/SearchableComboBox";
import { getExactTimeOverlapIds } from "../utils/exactTimeOverlap";

const groupSlotsByDate = (slots, extraDates) => {
  const map = new Map();
  const normalizedSlots = Array.isArray(slots) ? slots : [];
  const normalizedExtraDates = Array.isArray(extraDates) ? extraDates : [];

  normalizedSlots.forEach((slot) => {
    const dateKey = slot.date.slice(0, 10);
    if (!map.has(dateKey)) {
      map.set(dateKey, { date: dateKey });
    }
    const row = map.get(dateKey);
    row[slot.batch?._id] = row[slot.batch?._id] || [];
    row[slot.batch?._id].push(slot);
  });

  normalizedExtraDates.forEach((date) => {
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

  const normalizedArchives = Array.isArray(archives) ? archives : [];
  const normalizedBatches = Array.isArray(batches) ? batches : [];
  const selectedArchive = normalizedArchives.find((arc) => arc._id === selectedArchiveId);

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

  const exactOverlapIds = useMemo(
    () => getExactTimeOverlapIds(archiveData?.slots || []),
    [archiveData?.slots]
  );

  return (
    <div className="space-y-5">
      <div className="panel h-[21rem] overflow-y-auto">
        <div className="panel-header">
          <h2 className="text-lg font-bold text-slate-900">Archived Timetables</h2>
          <p className="mt-0.5 text-sm text-slate-500">Browse and manage previously archived weeks.</p>
        </div>
        <div className="panel-body">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="form-label">Select Archive Week</label>
              <SearchableComboBox
                options={normalizedArchives}
                value={selectedArchiveId}
                onChange={setSelectedArchiveId}
                placeholder="Search archive week..."
                emptyLabel="Select an archive..."
                className="min-w-[280px]"
                inputClassName="form-input min-w-[280px]"
                getOptionLabel={(archive) => archive.name}
                getOptionValue={(archive) => archive._id}
              />
            </div>
            {selectedArchiveId && (
              <button
                type="button"
                onClick={handleDeleteArchive}
                disabled={deleteArchive.isPending}
                className="btn-danger-outline mt-5"
              >
                {deleteArchive.isPending ? "Deleting..." : "Delete Archive Week"}
              </button>
            )}
          </div>
        </div>
      </div>

      {!selectedArchiveId ? (
        <div className="empty-state">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-400">
            📅
          </div>
          <p className="font-semibold text-slate-700">No archive selected</p>
          <p className="mt-1 text-sm text-slate-500">
            Please select an archived week to view its timetable.
          </p>
        </div>
      ) : (
        <div className="timetable-wrap">
          <table className="timetable-table">
            <thead>
              <tr>
                <th className="sticky-col timetable-col-date">Date</th>
                {normalizedBatches.map((batch) => (
                  <th key={batch._id} className="timetable-col-batch">
                    <div className="batch-header-branch">{batch.branch?.name}</div>
                    <div className="batch-header-name">{batch.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowData.map((row) => (
                <tr key={row.date}>
                  <td className="sticky-col timetable-col-date px-2 py-3">
                    <DateCell date={row.date} />
                  </td>
                  {normalizedBatches.map((batch) => {
                    const cellSlots = row[batch._id] || [];
                    return (
                      <td key={batch._id} className="timetable-cell timetable-col-batch">
                        {cellSlots.length === 0 ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : (
                          <div className="space-y-2">
                            {cellSlots.map((slot) => (
                              <SlotCard
                                key={slot._id}
                                slot={slot}
                                muted
                                useStoredStatus
                                showOverlapBadge={exactOverlapIds.has(slot._id)}
                              />
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
