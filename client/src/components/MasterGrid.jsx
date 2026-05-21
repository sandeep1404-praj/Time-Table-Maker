import React, { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { format, addDays, startOfWeek } from 'date-fns';
import { SlotModal } from './SlotModal';
import { ConflictBanner } from './ConflictBanner';
import { useTimetableStore } from '../store/timetableStore';
import { useSlots, useTimetableData, useConflicts } from '../hooks/useApi';

export const MasterGrid = () => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConflicts, setCurrentConflicts] = useState([]);

  const store = useTimetableStore();
  const { query: slotsQuery, createMutation, updateMutation } = useSlots();
  const { teachers, batches } = useTimetableData();
  const { data: conflictData } = useConflicts();

  const weekStart = useMemo(() => {
    return startOfWeek(store.selectedWeekStart, { weekStartsOn: 1 });
  }, [store.selectedWeekStart]);

  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const columnDefs = useMemo(() => {
    if (!batches.data) return [];

    const dateColumns = dates.map((date) => ({
      headerName: format(date, 'dd MMM yyyy (EEE)'),
      children: batches.data.map((batch) => ({
        headerName: batch.name,
        field: `${format(date, 'yyyy-MM-dd')}_${batch._id}`,
        width: 150,
        cellRenderer: (props) => {
          const slots = slotsQuery.data?.filter(
            (s) =>
              format(new Date(s.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
              s.batch?._id === batch._id
          ) || [];

          return (
            <div
              onClick={() => {
                setSelectedCell({ date, batch, slots });
                setIsModalOpen(true);
              }}
              className={`p-2 cursor-pointer h-full flex flex-col justify-center ${
                slots.length > 0 ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              {slots.map((slot, idx) => (
                <div key={idx} className="text-xs border-b pb-1 mb-1">
                  <p className="font-semibold">{slot.teacher?.code}</p>
                  <p>{slot.topic}</p>
                  <p className="text-gray-600">{slot.startTime}-{slot.endTime}</p>
                </div>
              ))}
              {slots.length === 0 && <span className="text-gray-300">Click to add</span>}
            </div>
          );
        },
      })),
    }));

    return [
      {
        headerName: 'Date',
        field: 'date',
        pinned: 'left',
        width: 120,
      },
      ...dateColumns,
    ];
  }, [dates, batches.data, slotsQuery.data]);

  const rowData = [{ date: 'Timetable' }];

  const handleSaveSlot = async (formData) => {
    try {
      if (selectedCell?.slots.length > 0) {
        await updateMutation.mutateAsync({
          id: selectedCell.slots[0]._id,
          data: formData,
        });
      } else {
        const result = await createMutation.mutateAsync(formData);
        if (result.conflicts?.length > 0) {
          setCurrentConflicts(result.conflicts);
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving slot:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Master Timetable</h1>

      <ConflictBanner conflicts={conflictData} />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => store.setSelectedWeekStart(addDays(store.selectedWeekStart, -7))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ← Previous Week
        </button>
        <span className="px-4 py-2">{format(weekStart, 'dd MMM')} - {format(addDays(weekStart, 6), 'dd MMM yyyy')}</span>
        <button
          onClick={() => store.setSelectedWeekStart(addDays(store.selectedWeekStart, 7))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next Week →
        </button>
      </div>

      <div className="ag-theme-quartz" style={{ height: '600px' }}>
        <AgGridReact columnDefs={columnDefs} rowData={rowData} />
      </div>

      <SlotModal
        isOpen={isModalOpen}
        slot={selectedCell?.slots?.[0]}
        teachers={teachers.data}
        batches={batches.data}
        conflicts={currentConflicts}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentConflicts([]);
          setSelectedCell(null);
        }}
        onSave={handleSaveSlot}
      />
    </div>
  );
};
