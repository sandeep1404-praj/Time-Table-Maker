import { useMemo, useState } from "react";
import { useSlots, useCreateSlot, useUpdateSlot } from "../hooks/useSlots";
import { useBatches } from "../hooks/useBatches";
import { useDates, useDeleteDateRow } from "../hooks/useDates";
import SlotModal from "./SlotModal";
import { deriveSlotStatus } from "../utils/slotStatus";

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

const MasterGrid = () => {
  const { data: slots = [] } = useSlots();
  const { data: batches = [] } = useBatches();
  const { data: dateRows = [] } = useDates();
  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteDateRow = useDeleteDateRow();
  const [activeCell, setActiveCell] = useState(null);
  const extraDates = dateRows.map((row) => row.date.slice(0, 10));

  const rowData = useMemo(() => groupSlotsByDate(slots, extraDates), [slots, extraDates]);

  const handleCellClick = (date, batchId, slotsInCell) => {
    setActiveCell({
      date,
      batch: batchId,
      slots: slotsInCell
    });
  };

  const handleSave = async (payload, slotId) => {
    if (slotId) {
      await updateSlot.mutateAsync({ id: slotId, ...payload });
    } else {
      await createSlot.mutateAsync(payload);
    }
    setActiveCell(null);
  };

  const handleDeleteRow = async (date) => {
    const confirmed = window.confirm(`Delete all slots on ${date} and remove the row?`);
    if (!confirmed) return;
    await deleteDateRow.mutateAsync(date);
  };

  return (
    <div className="w-full overflow-auto hide-scrollbar" data-testid="master-grid">
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
                <div className="flex items-center justify-between gap-2">
                  <span>{row.date}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(row.date)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    title="Delete Row"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6l-2 14H7L5 6"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
              {batches.map((batch) => {
                const cellSlots = row[batch._id] || [];
                return (
                  <td
                    key={batch._id}
                    className="min-w-[180px] border px-2 py-2 align-top"
                    onClick={() => handleCellClick(row.date, batch._id, cellSlots)}
                  >
                    {cellSlots.length === 0 ? (
                      <span className="text-xs text-slate-400">Add</span>
                    ) : (
                      <div className="space-y-1">
                        {cellSlots.map((slot) => (
                          <div key={slot._id} className="rounded border border-slate-200 bg-white px-2 py-1">
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
                            {(() => {
                              const status = deriveSlotStatus(slot);
                              return status !== "scheduled" ? (
                                <div className="mt-1 text-[11px] uppercase tracking-wide text-amber-600">
                                  {status}
                                </div>
                              ) : null;
                            })()}
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
      {activeCell && (
        <SlotModal
          initialData={activeCell}
          onClose={() => setActiveCell(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default MasterGrid;
