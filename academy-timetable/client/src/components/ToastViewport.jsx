import { useToastStore } from "../store/useToastStore";

const toneStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-white text-slate-700"
};

const ToastViewport = () => {
  const items = useToastStore((state) => state.items);
  const removeToast = useToastStore((state) => state.removeToast);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[120] flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
      {items.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => removeToast(toast.id)}
          className={`rounded-2xl border p-3 text-left shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 ${toneStyles[toast.tone] || toneStyles.info}`}
        >
          {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
          {toast.message && <p className="mt-0.5 text-xs leading-5 opacity-90">{toast.message}</p>}
        </button>
      ))}
    </div>
  );
};

export default ToastViewport;