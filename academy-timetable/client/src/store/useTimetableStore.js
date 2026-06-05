import { create } from "zustand";

export const useTimetableStore = create((set) => ({
  selectedTeacherId: "",
  selectedBatchId: "",
  conflicts: [],
  conflictMessage: "",
  setSelectedTeacherId: (selectedTeacherId) => set({ selectedTeacherId }),
  setSelectedBatchId: (selectedBatchId) => set({ selectedBatchId }),
  setConflicts: (conflicts) => set({ conflicts }),
  setConflictMessage: (conflictMessage) => set({ conflictMessage }),
  clearConflicts: () => set({ conflicts: [], conflictMessage: "" })
}));
