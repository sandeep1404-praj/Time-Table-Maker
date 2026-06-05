import { useMemo, useState } from "react";
import { useSlots, useCreateSlot, useUpdateSlot } from "../hooks/useSlots";
import { useBatches } from "../hooks/useBatches";
import { useDates, useDeleteDateRow } from "../hooks/useDates";
import SlotModal from "./SlotModal";
import SlotCard from "./SlotCard";
import DateCell from "./DateCell";

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
    <div className="timetable-wrap" data-testid="master-grid">
      <table className="timetable-table">
        <thead>
          <tr>
            <th className="sticky-col timetable-col-date">Date</th>
            {batches.map((batch) => (
              <th key={batch._id} className="timetable-col-batch">
                <div className="batch-header-branch">{batch.branch?.name}</div>
                <div className="batch-header-name">{batch.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowData.map((row) => (
            <tr key={row.date} className="group">
              <td className="sticky-col timetable-col-date px-2 py-3">
                <DateCell
                  date={row.date}
                  showDelete
                  onDelete={() => handleDeleteRow(row.date)}
                />
              </td>
              {batches.map((batch) => {
                const cellSlots = row[batch._id] || [];
                return (
                  <td
                    key={batch._id}
                    className="timetable-cell timetable-col-batch"
                    onClick={() => handleCellClick(row.date, batch._id, cellSlots)}
                  >
                    {cellSlots.length === 0 ? (
                      <div className="timetable-cell--empty">+ Add slot</div>
                    ) : (
                      <div className="space-y-2">
                        {cellSlots.map((slot) => (
                          <SlotCard key={slot._id} slot={slot} />
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
