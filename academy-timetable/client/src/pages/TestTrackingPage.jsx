import { useMemo, useState } from "react";
import { useTeachers } from "../hooks/useTeachers";
import { useSlots } from "../hooks/useSlots";
import { useBatches } from "../hooks/useBatches";
import { useBranches } from "../hooks/useBranches";
import TeacherSearchSelect from "../components/TeacherSearchSelect";
import TestSlotModal from "../components/TestSlotModal";
import {
  analyzeTestProgress,
  filterByTeacher,
  filterByBranch,
  filterByBatch,
  filterByTestStatus,
  filterBySearch,
  groupByBranch,
  groupByBatch
} from "../utils/testProgress";
import { formatDisplayDate, getWeekdayName } from "../utils/dateFormat";

const mainTabs = [
  { key: "taken", label: "Tests Taken", description: "Test slots from the master timetable" },
  {
    key: "pending",
    label: "Test Pending",
    description: "Chapter marked complete but test not yet taken"
  }
];

const statusFilters = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "scheduled", label: "Scheduled" },
  { key: "ongoing", label: "Ongoing" }
];

const viewModes = [
  { key: "branch", label: "Branch wise" },
  { key: "batch", label: "Batch wise" }
];

const statusBadge = {
  completed: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-sky-100 text-sky-800",
  ongoing: "bg-amber-100 text-amber-800"
};

const TestCard = ({ item, onEdit, onSchedule, showBatch }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            Ch. {item.chapterNumber}
          </span>
          {item.status && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[item.status] || "bg-slate-100 text-slate-600"}`}
            >
              {item.status}
            </span>
          )}
          {item.isMarkedComplete && !item.status && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Test not taken
            </span>
          )}
        </div>
        <p className="mt-1 font-semibold text-slate-900">{item.chapterTitle || "Untitled"}</p>
        <p className="text-sm text-slate-600">{item.subject || "—"}</p>
        {!showBatch && item.branchName && (
          <p className="text-xs text-slate-500">{item.branchName}</p>
        )}
        {showBatch && item.batchName && (
          <p className="text-xs text-slate-500">
            {item.branchName} · {item.batchName}
          </p>
        )}
        {item.date && (
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-indigo-600">{getWeekdayName(item.date)}</span>
            {" · "}
            {formatDisplayDate(item.date)}
            {" · "}
            <span className="font-medium text-slate-700">
              {item.startTime} – {item.endTime}
            </span>
            {item.topic ? ` · ${item.topic}` : ""}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {item.slotId && (
          <button
            type="button"
            onClick={() => onEdit(item.slot)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
        )}
        {!item.slotId && onSchedule && (
          <button
            type="button"
            onClick={() => onSchedule(item)}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
          >
            Schedule Test
          </button>
        )}
      </div>
    </div>
  </div>
);

const GroupSection = ({ groupName, items, onEdit, onSchedule, showBatch }) => (
  <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <h3 className="mb-3 font-semibold text-slate-800">{groupName}</h3>
    <div className="space-y-3">
      {items.map((item) => (
        <TestCard
          key={item.key}
          item={item}
          onEdit={onEdit}
          onSchedule={onSchedule}
          showBatch={showBatch}
        />
      ))}
    </div>
  </section>
);

const TestTrackingPage = () => {
  const { data: teachers = [] } = useTeachers();
  const { data: slots = [] } = useSlots();
  const { data: batches = [] } = useBatches();
  const { data: branches = [] } = useBranches();
  const [activeTab, setActiveTab] = useState("taken");
  const [viewMode, setViewMode] = useState("branch");
  const [teacherFilterId, setTeacherFilterId] = useState("");
  const [branchFilterId, setBranchFilterId] = useState("");
  const [batchFilterId, setBatchFilterId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSlot, setModalSlot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduleDefaults, setScheduleDefaults] = useState({
    subject: "",
    chapterNumber: "",
    batchId: ""
  });

  const filteredBatches = useMemo(() => {
    if (!branchFilterId) return batches;
    return batches.filter(
      (batch) => String(batch.branch?._id || batch.branch) === String(branchFilterId)
    );
  }, [batches, branchFilterId]);

  const analysis = useMemo(
    () => analyzeTestProgress({ slots, teachers, batches, branches, viewMode }),
    [slots, teachers, batches, branches, viewMode]
  );

  const filterItems = (items) => {
    let result = filterByTeacher(items, teacherFilterId);
    result = filterByBranch(result, branchFilterId);
    if (viewMode === "batch") {
      result = filterByBatch(result, batchFilterId);
    }
    result = filterBySearch(result, searchQuery);
    return result;
  };

  const filteredTaken = useMemo(() => {
    let items = filterItems(analysis.testsTaken);
    return filterByTestStatus(items, statusFilter);
  }, [analysis.testsTaken, teacherFilterId, branchFilterId, batchFilterId, viewMode, searchQuery, statusFilter]);

  const filteredPending = useMemo(
    () => filterItems(analysis.testPending),
    [analysis.testPending, teacherFilterId, branchFilterId, batchFilterId, viewMode, searchQuery]
  );

  const activeItems = activeTab === "taken" ? filteredTaken : filteredPending;
  const groupedItems = useMemo(
    () => (viewMode === "batch" ? groupByBatch(activeItems) : groupByBranch(activeItems)),
    [activeItems, viewMode]
  );

  const tabCounts = {
    taken: filteredTaken.length,
    pending: filteredPending.length
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-violet-50/30 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Test Tracking</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tests from master timetable appear here (no teacher required). Pending shows completed
              chapters without a taken test.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalSlot(null);
              setScheduleDefaults({ subject: "", chapterNumber: "", batchId: "" });
              setShowAddModal(true);
            }}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Add Test
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            View mode
          </p>
          <div className="flex flex-wrap gap-2">
            {viewModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => {
                  setViewMode(mode.key);
                  if (mode.key === "branch") setBatchFilterId("");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  viewMode === mode.key
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
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
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Teacher, chapter, branch, batch, topic..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Branch
            </label>
            <select
              value={branchFilterId}
              onChange={(e) => {
                setBranchFilterId(e.target.value);
                setBatchFilterId("");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          {viewMode === "batch" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch
              </label>
              <select
                value={batchFilterId}
                onChange={(e) => setBatchFilterId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">All batches</option>
                {filteredBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.branch?.name} {batch.name}
                  </option>
                ))}
              </select>
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
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              activeTab === tab.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold">{mainTabs.find((t) => t.key === activeTab)?.label}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {mainTabs.find((t) => t.key === activeTab)?.description}
          </p>
          {activeTab === "taken" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    statusFilter === filter.key
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          {activeItems.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              {activeTab === "taken"
                ? "No tests found. Add a test slot in Master timetable or use Add Test."
                : "No pending tests. Mark chapters complete to track missing tests."}
            </p>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedItems.entries()).map(([groupName, items]) => (
                <GroupSection
                  key={groupName}
                  groupName={groupName}
                  items={items}
                  showBatch={viewMode === "batch"}
                  onEdit={(slot) => {
                    setShowAddModal(false);
                    setModalSlot(slot);
                  }}
                  onSchedule={(item) => {
                    setModalSlot(null);
                    setScheduleDefaults({
                      subject: item.subject,
                      chapterNumber: item.chapterNumber,
                      batchId: item.batchId || ""
                    });
                    setShowAddModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {(showAddModal || modalSlot) && (
        <TestSlotModal
          slot={modalSlot}
          defaultSubject={scheduleDefaults.subject}
          defaultChapterNumber={scheduleDefaults.chapterNumber}
          defaultBatchId={scheduleDefaults.batchId}
          onClose={() => {
            setShowAddModal(false);
            setModalSlot(null);
            setScheduleDefaults({ subject: "", chapterNumber: "", batchId: "" });
          }}
        />
      )}
    </div>
  );
};

export default TestTrackingPage;
