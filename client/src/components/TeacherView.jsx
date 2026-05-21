import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTeacherTimetable, useTimetableData } from '../hooks/useApi';

export const TeacherView = () => {
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const { teachers } = useTimetableData();
  const { data: timetableData, isLoading } = useTeacherTimetable(selectedTeacherId);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Teacher Timetable</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Teacher:</label>
        <select
          value={selectedTeacherId || ''}
          onChange={(e) => setSelectedTeacherId(e.target.value || null)}
          className="border p-2 rounded w-full max-w-xs"
        >
          <option value="">-- Select a teacher --</option>
          {teachers.data?.map((teacher) => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading...</p>}

      {timetableData && timetableData.length === 0 && (
        <p className="text-gray-600">No slots for this teacher.</p>
      )}

      {timetableData && timetableData.length > 0 && (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Day</th>
              <th className="border p-2">Branch</th>
              <th className="border p-2">Time</th>
              <th className="border p-2">Topic</th>
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
                <td className="border p-2">{slot.batch?.branch?.name || '-'}</td>
                <td className="border p-2">
                  {slot.startTime} - {slot.endTime}
                </td>
                <td className="border p-2">{slot.topic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
