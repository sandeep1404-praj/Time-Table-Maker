import { useMemo, useState } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { useSlots } from "../hooks/useSlots";
import { useBatches } from "../hooks/useBatches";
import TeacherSearchSelect from "../components/TeacherSearchSelect";
import {
  analyzeChapterProgress,
  filterByTeacher,
  filterCompletedByTiming,
  groupByBranch,
  groupByBatch,
  getSlotDurationHours
} from "../utils/chapterProgress";

const mainTabs = [
  { key: "ongoing", label: "Ongoing (>1 hr)" },
  { key: "extended", label: "Extended" },
  { key: "completed", label: "Completed" }
];

const timingFilters = [
  { key: "all", label: "All timings" },
  { key: "before", label: "Before time" },
  { key: "ontime", label: "On time" },
  { key: "after", label: "After time" }
];

const viewModes = [
  { key: "all", label: "All" },
  { key: "branch", label: "Branch wise" },
  { key: "batch", label: "Batch wise" }
];

const formatHours = (value) => `${Number(value || 0).toFixed(1)} hrs`;

const ChapterCard = ({ item }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-semibold text-slate-800">
          Ch. {item.chapterNumber} {item.chapterTitle}
        </p>
        <p className="text-sm text-slate-600">
          {item.teacherName} · {item.subject}
        </p>
        <p className="text-xs text-slate-500">
          {item.branchName}
          {item.batchName ? ` · ${item.batchName}` : ""}
        </p>
      </div>
      <div className="text-right text-xs text-slate-600">
        <p>Planned: {formatHours(item.plannedHours)}</p>
        <p>Completed: {formatHours(item.completedHours)}</p>
        {item.scheduledHours > 0 && <p>Scheduled: {formatHours(item.scheduledHours)}</p>}
        <p className="font-medium text-slate-800">Total: {formatHours(item.totalHours)}</p>
      </div>
    </div>
    {item.completionTiming && (
      <p className="mt-2 text-xs uppercase tracking-wide text-amber-700">
        {item.completionTiming === "before" && "Completed before allotted time"}
        {item.completionTiming === "ontime" && "Completed on time"}
        {item.completionTiming === "after" && "Completed after allotted time"}
      </p>
    )}
  </div>
);

const GroupedList = ({ groups }) => (
  <div className="space-y-4">
    {Array.from(groups.entries()).map(([label, items]) => (
      <div key={label}>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">{label}</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <ChapterCard key={item.key} item={item} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ChapterTrackingPage = () => {
  const { data: teachers = [] } = useTeachers();
  const { data: slots = [] } = useSlots();
  const { data: batches = [] } = useBatches();
  const [activeTab, setActiveTab] = useState("ongoing");
  const [teacherFilterId, setTeacherFilterId] = useState("");
  const [timingFilter, setTimingFilter] = useState("all");
  const [viewMode, setViewMode] = useState("all");

  const analysis = useMemo(
    () => analyzeChapterProgress({ slots, teachers, batches }),
    [slots, teachers, batches]
  );

  const filteredOngoing = useMemo(
    () =>
      filterByTeacher(
        analysis.ongoingSlots,
        teacherFilterId,
        (slot) => slot.teacher?._id || slot.teacher
      ),
    [analysis.ongoingSlots, teacherFilterId]
  );

  const filteredExtended = useMemo(
    () =>
      filterByTeacher(analysis.extended, teacherFilterId, (item) => item.teacherId),
    [analysis.extended, teacherFilterId]
  );

  const filteredCompleted = useMemo(() => {
    const byTeacher = filterByTeacher(
      analysis.completed,
      teacherFilterId,
      (item) => item.teacherId
    );
    return filterCompletedByTiming(byTeacher, timingFilter);
  }, [analysis.completed, teacherFilterId, timingFilter]);

  const renderCompleted = () => {
    if (filteredCompleted.length === 0) {
      return <p className="text-sm text-slate-500">No completed chapters match your filters.</p>;
    }

    if (viewMode === "branch") {
      return <GroupedList groups={groupByBranch(filteredCompleted)} />;
    }
    if (viewMode === "batch") {
      return <GroupedList groups={groupByBatch(filteredCompleted)} />;
    }

    return (
      <div className="space-y-2">
        {filteredCompleted.map((item) => (
          <ChapterCard key={item.key} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Chapter Progress</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ongoing, extended, and completed chapters are kept separate. A slot longer than 1 hour
          appears only in Ongoing; other slots feed the chapter totals.
        </p>
        <div className="mt-4 max-w-md">
          <p className="mb-1 text-sm font-medium">Search teacher</p>
          <TeacherSearchSelect
            teachers={teachers}
            value={teacherFilterId}
            onChange={setTeacherFilterId}
            placeholder="Type to search teacher..."
            emptyLabel="All teachers"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded px-3 py-2 text-sm ${
              activeTab === tab.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ongoing" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Ongoing lectures over 1 hour</h3>
          {filteredOngoing.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No long ongoing lectures right now.</p>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border px-2 py-2 text-left">Date</th>
                    <th className="border px-2 py-2 text-left">Time</th>
                    <th className="border px-2 py-2 text-left">Duration</th>
                    <th className="border px-2 py-2 text-left">Teacher</th>
                    <th className="border px-2 py-2 text-left">Chapter</th>
                    <th className="border px-2 py-2 text-left">Branch · Batch</th>
                    <th className="border px-2 py-2 text-left">Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOngoing.map((slot) => (
                    <tr key={slot._id} className="hover:bg-slate-50">
                      <td className="border px-2 py-2">{slot.date?.slice(0, 10)}</td>
                      <td className="border px-2 py-2">
                        {slot.startTime}-{slot.endTime}
                      </td>
                      <td className="border px-2 py-2">
                        {formatHours(getSlotDurationHours(slot))}
                      </td>
                      <td className="border px-2 py-2">{slot.teacher?.name || ""}</td>
                      <td className="border px-2 py-2">
                        {slot.chapterNumber || "—"} {slot.subject || ""}
                      </td>
                      <td className="border px-2 py-2">
                        {slot.batch?.branch?.name || ""} · {slot.batch?.name || ""}
                      </td>
                      <td className="border px-2 py-2">{slot.topic || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "extended" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Extended chapters</h3>
          <p className="mt-1 text-xs text-slate-500">
            Scheduled and completed time exceeds the planned hours, but the chapter is not finished
            yet.
          </p>
          {filteredExtended.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No extended chapters.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredExtended.map((item) => (
                <ChapterCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Completed chapters</h3>
          <p className="mt-1 text-xs text-slate-500">
            Chapters where completed hours meet the plan, or all slots for the chapter are finished.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timing
              </p>
              <div className="flex flex-wrap gap-2">
                {timingFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setTimingFilter(filter.key)}
                    className={`rounded px-2 py-1 text-xs ${
                      timingFilter === filter.key
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                View
              </p>
              <div className="flex flex-wrap gap-2">
                {viewModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setViewMode(mode.key)}
                    className={`rounded px-2 py-1 text-xs ${
                      viewMode === mode.key
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">{renderCompleted()}</div>
        </div>
      )}
    </div>
  );
};

export default ChapterTrackingPage;
