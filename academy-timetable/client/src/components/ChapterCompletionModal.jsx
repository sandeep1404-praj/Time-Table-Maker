const ChapterCompletionModal = ({
  chapter,
  branches,
  onClose,
  onToggle,
  isPending
}) => {
  const getBranchStatus = (branchId) => {
    const entry = chapter.branchCompletions?.find(
      (item) => String(item.branch?._id || item.branch) === String(branchId)
    );
    return Boolean(entry?.isCompleted);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Mark Chapter Complete</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                Ch. {chapter.chapterNumber} — {chapter.title || "Untitled"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Set completion status branch-wise for this chapter.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {branches.length === 0 ? (
            <p className="text-sm text-slate-500">Add branches on the Master page first.</p>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => {
                const branchComplete = getBranchStatus(branch._id);

                return (
                  <div
                    key={branch._id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{branch.name}</p>
                      <p className="text-xs text-slate-500">
                        {branchComplete ? "Marked complete" : "In progress"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onToggle({ branchId: branch._id, isCompleted: false })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          !branchComplete
                            ? "bg-amber-100 text-amber-800"
                            : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Ongoing
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onToggle({ branchId: branch._id, isCompleted: true })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          branchComplete
                            ? "bg-emerald-100 text-emerald-800"
                            : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterCompletionModal;
