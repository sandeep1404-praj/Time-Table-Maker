import { useTimetableStore } from "../store/useTimetableStore";

const ConflictBanner = () => {
  const conflicts = useTimetableStore((state) => state.conflicts);
  const conflictMessage = useTimetableStore((state) => state.conflictMessage);
  if (!conflicts.length && !conflictMessage) return null;

  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      {conflictMessage || "Conflict detected: overlapping slots. Please review."}
    </div>
  );
};

export default ConflictBanner;
