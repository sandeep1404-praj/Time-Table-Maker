import { create } from "zustand";

export const useToastStore = create((set, get) => ({
  items: [],
  pushToast: ({ title, message, tone = "info" }) => {
    const id = crypto.randomUUID();
    const item = { id, title, message, tone };
    set({ items: [...get().items, item] });
    window.setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },
  removeToast: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
  clearToasts: () => set({ items: [] })
}));