import { useMemo, useState } from "react";
import { useTeachers, useUpdateChapterBranchCompletion } from "../hooks/useTeachers";
import { useSlots } from "../hooks/useSlots";
import { useBatches } from "../hooks/useBatches";
import { useBranches } from "../hooks/useBranches";
import TeacherSearchSelect from "../components/TeacherSearchSelect";
import SearchableComboBox from "../components/SearchableComboBox";
import {
  analyzeChapterProgress,
  filterByTeacher,
  filterByBranch,
  filterByBatch,
  filterCompletedByTiming,
  filterBySearch,
  groupByBranch,
  groupByBatch
} from "../utils/chapterProgress";

const mainTabs = [
  { key: "ongoing", label: "Ongoing", description: "Started but not yet marked complete" },
  {
    key: "extended",
    label: "Time Extended",
    description: "Exceeded allotted hours, not yet marked complete"
  },
  { key: "completed", label: "Completed", description: "Manually marked as complete" }
];

const timingFilters = [
  { key: "all", label: "All" },
  { key: "before", label: "Before time" },
  { key: "ontime", label: "On time" },
  { key: "after", label: "Over time" }
];

const formatHours = (value) => `${Number(value || 0).toFixed(1)} hrs`;

const timingBadge = {
  before: { label: "Before time", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  ontime: { label: "On time", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  after: { label: "Over time", className: "bg-amber-50 text-amber-700 ring-amber-200" }
};

const ProgressBar = ({ percent, variant = "default" }) => {
  const barColor =
    variant === "extended"
      ? "bg-amber-500"
      : variant === "completed"
        ? "bg-emerald-500"
        : "bg-indigo-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
};

const viewModes = [
  { key: "branch", label: "Branch wise" },
  { key: "batch", label: "Batch wise" }
];

const ChapterCard = ({ item, variant = "default", showBatch = false, onToggleComplete, isToggling }) => {
  const timing = item.completionTiming ? timingBadge[item.completionTiming] : null;
  const isOverPlan = item.completedHours > item.plannedHours;

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              Ch. {item.chapterNumber}
            </span>
            {timing && variant === "completed" && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${timing.className}`}
              >
                {timing.label}
              </span>
            )}
            {variant === "extended" && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                +{formatHours(item.completedHours - item.plannedHours)} over
              </span>
            )}
          </div>
          <p className="mt-1 font-semibold text-slate-900">{item.chapterTitle || "Untitled chapter"}</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {item.teacherName}
            <span className="mx-1.5 text-slate-300">·</span>
            {item.subject}
          </p>
          {showBatch && item.batchName && (
            <p className="mt-0.5 text-xs text-slate-500">
              {item.branchName} · {item.batchName}
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-800">
            {formatHours(item.completedHours)}
            <span className="font-normal text-slate-400"> / </span>
            {formatHours(item.plannedHours)}
          </p>
          {item.scheduledHours > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">
              +{formatHours(item.scheduledHours)} scheduled
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{item.lectureCount} lecture{item.lectureCount !== 1 ? "s" : ""} taken</span>
          <span className={isOverPlan && variant !== "completed" ? "font-medium text-amber-600" : ""}>
            {item.progressPercent}%
          </span>
        </div>
        <ProgressBar
          percent={variant === "extended" ? (item.completedHours / item.plannedHours) * 100 : item.progressPercent}
          variant={variant}
        />
      </div>
      {onToggleComplete && item.chapterId && item.branchId && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">
            Manual: {item.isMarkedComplete ? "Marked complete" : "Not marked complete"}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={isToggling}
              onClick={() => onToggleComplete(item, false)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                !item.isMarkedComplete
                  ? "bg-amber-100 text-amber-800"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Ongoing
            </button>
            <button
              type="button"
              disabled={isToggling}
              onClick={() => onToggleComplete(item, true)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                item.isMarkedComplete
                  ? "bg-emerald-100 text-emerald-800"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GroupSection = ({ groupName, items, variant, showBatch, onToggleComplete, isToggling }) => (
  <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
        {groupName.charAt(0).toUpperCase()}
      </div>
      <div>
        <h3 className="font-semibold text-slate-800">{groupName}</h3>
        <p className="text-xs text-slate-500">
          {items.length} chapter{items.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
    <div className="space-y-3">
      {items.map((item) => (
        <ChapterCard
          key={item.key}
          item={item}
          variant={variant}
          showBatch={showBatch}
          onToggleComplete={onToggleComplete}
          isToggling={isToggling}
        />
      ))}
    </div>
  </section>
);

const EmptyState = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
      —
    </div>
    <p className="font-medium text-slate-700">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
  </div>
);

const ChapterTrackingPage = () => {
  const { data: teachers = [] } = useTeachers();
  const { data: slots = [] } = useSlots();
  const { data: batches = [] } = useBatches();
  const { data: branches = [] } = useBranches();
  const [activeTab, setActiveTab] = useState("ongoing");
  const [teacherFilterId, setTeacherFilterId] = useState("");
  const [branchFilterId, setBranchFilterId] = useState("");
  const [batchFilterId, setBatchFilterId] = useState("");
  const [viewMode, setViewMode] = useState("branch");
  const [timingFilter, setTimingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const updateCompletion = useUpdateChapterBranchCompletion();

  const filteredBatches = useMemo(() => {
    if (!branchFilterId) return batches;
    return batches.filter(
      (batch) => String(batch.branch?._id || batch.branch) === String(branchFilterId)
    );
  }, [batches, branchFilterId]);

  const analysis = useMemo(
    () => analyzeChapterProgress({ slots, teachers, batches, branches, viewMode }),
    [slots, teachers, batches, branches, viewMode]
  );

  const searchSuggestions = useMemo(() => {
    const values = new Set();
    const add = (value) => {
      const text = String(value || "").trim();
      if (text) values.add(text);
    };

    teachers.forEach((teacher) => {
      add(teacher.name);
      add(teacher.subject);
      teacher.chapters?.forEach((chapter) => {
        add(`Ch. ${chapter.chapterNumber}`);
        add(chapter.title);
      });
    });
    branches.forEach((branch) => add(branch.name));
    batches.forEach((batch) => {
      add(batch.name);
      add(batch.branch?.name);
      add(`${batch.branch?.name || ""} ${batch.name}`);
    });
    [...analysis.ongoing, ...analysis.extended, ...analysis.completed].forEach((item) => {
      add(item.teacherName);
      add(item.chapterTitle);
      add(item.subject);
      add(item.branchName);
      add(item.batchName);
      add(item.chapterNumber);
    });

    return Array.from(values).sort();
  }, [teachers, branches, batches, analysis]);

  const handleToggleComplete = async (item, isCompleted) => {
    if (!item.chapterId || !item.branchId || !item.teacherId) return;
    await updateCompletion.mutateAsync({
      teacherId: item.teacherId,
      chapterId: item.chapterId,
      branchId: item.branchId,
      isCompleted
    });
  };

  const filterItems = (items) => {
    let result = filterByTeacher(items, teacherFilterId, (item) => item.teacherId);
    result = filterByBranch(result, branchFilterId);
    if (viewMode === "batch") {
      result = filterByBatch(result, batchFilterId);
    }
    result = filterBySearch(result, searchQuery);
    return result;
  };

  const filteredOngoing = useMemo(
    () => filterItems(analysis.ongoing),
    [analysis.ongoing, teacherFilterId, branchFilterId, batchFilterId, viewMode, searchQuery]
  );

  const filteredExtended = useMemo(
    () => filterItems(analysis.extended),
    [analysis.extended, teacherFilterId, branchFilterId, batchFilterId, viewMode, searchQuery]
  );

  const filteredCompleted = useMemo(() => {
    const byFilters = filterItems(analysis.completed);
    return filterCompletedByTiming(byFilters, timingFilter);
  }, [analysis.completed, teacherFilterId, branchFilterId, batchFilterId, viewMode, searchQuery, timingFilter]);

  const tabCounts = {
    ongoing: filteredOngoing.length,
    extended: filteredExtended.length,
    completed: filteredCompleted.length
  };

  const activeItems =
    activeTab === "ongoing"
      ? filteredOngoing
      : activeTab === "extended"
        ? filteredExtended
        : filteredCompleted;

  const groupedItems = useMemo(
    () => (viewMode === "batch" ? groupByBatch(activeItems) : groupByBranch(activeItems)),
    [activeItems, viewMode]
  );

  const activeTabMeta = mainTabs.find((tab) => tab.key === activeTab);

  return (
    <div className="space-y-6">
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">Chapter Progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track chapters branch-wise or batch-wise. Mark complete manually on each card or in Manage.
          </p>
        </div>
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">View mode</p>
          <div className="flex flex-wrap gap-2">
            {viewModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => {
                  setViewMode(mode.key);
                  if (mode.key === "branch") setBatchFilterId("");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === mode.key
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <SearchableComboBox
              mode="text"
              value={searchQuery}
              onChange={setSearchQuery}
              options={searchSuggestions}
              placeholder="Teacher, chapter, branch, batch..."
              allowEmpty={false}
              className="w-full"
              inputClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              panelClassName="mt-2"
              noResultsText="Type to search by teacher, chapter, branch, or batch."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Branch
            </label>
            <SearchableComboBox
              options={branches}
              value={branchFilterId}
              onChange={(value) => {
                setBranchFilterId(value);
                setBatchFilterId("");
              }}
              placeholder="Search branches..."
              emptyLabel="All branches"
              className="w-full"
              inputClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              getOptionLabel={(branch) => branch.name}
              getOptionValue={(branch) => branch._id}
            />
          </div>
          {viewMode === "batch" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch
              </label>
              <SearchableComboBox
                options={filteredBatches}
                value={batchFilterId}
                onChange={setBatchFilterId}
                placeholder="Search batches..."
                emptyLabel="All batches"
                className="w-full"
                inputClassName="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                getOptionLabel={(batch) => `${batch.branch?.name || ""} ${batch.name}`.trim()}
                getOptionValue={(batch) => batch._id}
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Teacher
            </label>
            <TeacherSearchSelect
              teachers={teachers}
              value={teacherFilterId}
              onChange={setTeacherFilterId}
              placeholder="Search teacher..."
              emptyLabel="All teachers"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">{activeTabMeta?.label}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{activeTabMeta?.description}</p>

          {activeTab === "completed" && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Completion timing
              </p>
              <div className="flex flex-wrap gap-2">
                {timingFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setTimingFilter(filter.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      timingFilter === filter.key
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {activeItems.length === 0 ? (
            <EmptyState
              title={`No ${activeTabMeta?.label.toLowerCase()} chapters`}
              description={
                activeTab === "ongoing"
                  ? "Chapters appear here when at least one lecture is taken but not yet marked complete."
                  : activeTab === "extended"
                    ? "Chapters appear here when time taken exceeds allotted hours and they are not marked complete."
                    : "Mark chapters as complete in Manage to see them here."
              }
            />
          ) : (
            <div className="space-y-6">
              {Array.from(groupedItems.entries()).map(([groupName, items]) => (
                <GroupSection
                  key={groupName}
                  groupName={groupName}
                  items={items}
                  showBatch={viewMode === "batch"}
                  onToggleComplete={handleToggleComplete}
                  isToggling={updateCompletion.isPending}
                  variant={activeTab === "extended" ? "extended" : activeTab === "completed" ? "completed" : "default"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterTrackingPage;
