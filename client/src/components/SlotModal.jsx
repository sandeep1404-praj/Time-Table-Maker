import React, { useState, useEffect } from 'react';

export const SlotModal = ({ isOpen, slot, teachers, batches, onClose, onSave, conflicts = [] }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    teacher: '',
    batch: '',
    topic: '',
    slotType: 'lecture',
    notes: '',
  });

  useEffect(() => {
    if (slot) {
      setFormData({
        date: slot.date ? new Date(slot.date).toISOString().split('T')[0] : '',
        startTime: slot.startTime || '',
        endTime: slot.endTime || '',
        teacher: slot.teacher?._id || '',
        batch: slot.batch?._id || '',
        topic: slot.topic || '',
        slotType: slot.slotType || 'lecture',
        notes: slot.notes || '',
      });
    } else {
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        teacher: '',
        batch: '',
        topic: '',
        slotType: 'lecture',
        notes: '',
      });
    }
  }, [slot, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{slot ? 'Edit Slot' : 'New Slot'}</h2>

        {conflicts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
            <p className="text-red-700 font-semibold text-sm">⚠️ Conflict Warning</p>
            <p className="text-red-600 text-sm">
              This teacher has another slot on this date!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <select
              name="teacher"
              value={formData.teacher}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Select Teacher</option>
              {teachers?.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Select Batch</option>
              {batches?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="topic"
              placeholder="Topic"
              value={formData.topic}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
            <select
              name="slotType"
              value={formData.slotType}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="lecture">Lecture</option>
              <option value="test">Test</option>
              <option value="coverup">Coverup</option>
            </select>
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              rows="2"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 p-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
