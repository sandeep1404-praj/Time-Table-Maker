import React from 'react';

export const ConflictBanner = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
      <p className="font-bold">⚠️ Conflicts Detected</p>
      <ul className="text-sm mt-2">
        {conflicts.map((conflict, idx) => (
          <li key={idx}>
            {conflict.slot1?.teacher?.name || 'Teacher'} has overlapping slots
            on {new Date(conflict.slot1?.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};
