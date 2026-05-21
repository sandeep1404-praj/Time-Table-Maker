import React, { useState } from 'react';
import { format } from 'date-fns';
import { useBatchTimetable, useTimetableData } from '../hooks/useApi';

export const BatchView = () => {
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const { batches } = useTimetableData();
  const { data: timetableData, isLoading } = useBatchTimetable(selectedBatchId);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Batch Timetable</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Batch:</label>
        <select
          value={selectedBatchId || ''}
          onChange={(e) => setSelectedBatchId(e.target.value || null)}
          className="border p-2 rounded w-full max-w-xs"
        >
          <option value="">-- Select a batch --</option>
          {batches.data?.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.name} - {batch.branch?.name || 'N/A'}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading...</p>}

      {timetableData && timetableData.length === 0 && (
        <p className="text-gray-600">No slots for this batch.</p>
      )}

      {timetableData && timetableData.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-green-500 text-white">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Day</th>
              <th className="border p-2">Faculty</th>
              <th className="border p-2">Chapter</th>
              <th className="border p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {timetableData.map((slot, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="border p-2">
                  {format(new Date(slot.date), 'dd MMM yyyy')}
                </td>
                <td className="border p-2">
                  {format(new Date(slot.date), 'EEE')}
                </td>
                <td className="border p-2">{slot.teacher?.name || '-'}</td>
                <td className="border p-2">{slot.topic}</td>
                <td className="border p-2">
                  {slot.startTime} - {slot.endTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
