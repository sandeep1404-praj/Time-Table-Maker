import { create } from 'zustand';

export const useTimetableStore = create((set) => ({
  slots: [],
  conflicts: [],
  teachers: [],
  branches: [],
  batches: [],
  selectedWeekStart: new Date('2026-05-18'),
  selectedTeacher: null,
  selectedBatch: null,
  selectedBranch: null,

  setSlots: (slots) => set({ slots }),
  setConflicts: (conflicts) => set({ conflicts }),
  setTeachers: (teachers) => set({ teachers }),
  setBranches: (branches) => set({ branches }),
  setBatches: (batches) => set({ batches }),
  setSelectedWeekStart: (date) => set({ selectedWeekStart: date }),
  setSelectedTeacher: (teacher) => set({ selectedTeacher: teacher }),
  setSelectedBatch: (batch) => set({ selectedBatch: batch }),
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  addSlot: (slot) => set((state) => ({ slots: [...state.slots, slot] })),
  updateSlot: (id, slot) =>
    set((state) => ({
      slots: state.slots.map((s) => (s._id === id ? slot : s)),
    })),
  deleteSlot: (id) =>
    set((state) => ({ slots: state.slots.filter((s) => s._id !== id) })),
}));
