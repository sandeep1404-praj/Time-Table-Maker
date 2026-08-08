import { useBranches, useDeleteBranch } from "../hooks/useBranches";
import { useBatches, useDeleteBatch } from "../hooks/useBatches";
import { useTeachers, useDeleteTeacher } from "../hooks/useTeachers";
import { formatBatchDisplayName } from "../utils/displayName";

const ManagePage = () => {
  const { data: branches = [] } = useBranches();
  const { data: batches = [] } = useBatches();
  const { data: teachers = [] } = useTeachers();
  const deleteBranch = useDeleteBranch();
  const deleteBatch = useDeleteBatch();
  const deleteTeacher = useDeleteTeacher();

  return (
    <div className="space-y-5">
      <div className="manage-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Delete Records</h2>
          <p className="text-xs text-slate-500">Use carefully. This cannot be undone.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teachers</p>
            {teachers.length === 0 && <p className="mt-2 text-xs text-slate-500">No teachers.</p>}
            {teachers.length > 0 && (
              <div className="mt-2 space-y-2">
                {teachers.map((teacher) => (
                  <div key={teacher._id} className="flex items-center justify-between rounded bg-white px-2 py-2">
                    <span className="text-sm font-medium text-slate-700">{teacher.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteTeacher.mutateAsync(teacher._id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branches</p>
            {branches.length === 0 && <p className="mt-2 text-xs text-slate-500">No branches.</p>}
            {branches.length > 0 && (
              <div className="mt-2 space-y-2">
                {branches.map((branch) => (
                  <div key={branch._id} className="flex items-center justify-between rounded bg-white px-2 py-2">
                    <span className="text-sm font-medium text-slate-700">{branch.name}</span>
                    <button
                      type="button"
                      onClick={() => deleteBranch.mutateAsync(branch._id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Batches</p>
            {batches.length === 0 && <p className="mt-2 text-xs text-slate-500">No batches.</p>}
            {batches.length > 0 && (
              <div className="mt-2 space-y-2">
                {batches.map((batch) => (
                  <div key={batch._id} className="flex items-center justify-between rounded bg-white px-2 py-2">
                    <span className="text-sm font-medium text-slate-700">
                      {formatBatchDisplayName(batch)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteBatch.mutateAsync(batch._id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePage;
