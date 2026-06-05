import { useState } from "react";
import MasterPage from "./pages/MasterPage";
import TeacherPage from "./pages/TeacherPage";
import BatchPage from "./pages/BatchPage";
import ManagePage from "./pages/ManagePage";
import HistoryPage from "./pages/HistoryPage";
import ChapterTrackingPage from "./pages/ChapterTrackingPage";
import TestTrackingPage from "./pages/TestTrackingPage";

const tabs = [
  { key: "master", label: "Master Timetable" },
  { key: "teacher", label: "Teacher View" },
  { key: "batch", label: "Batch View" },
  { key: "tracking", label: "Chapter Progress" },
  { key: "tests", label: "Test Tracking" },
  { key: "history", label: "History" },
  { key: "manage", label: "Manage" }
];

const App = () => {
  const [activeTab, setActiveTab] = useState("master");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Guru Aanklan Academy</h1>
            <p className="text-sm text-slate-500">Timetable Management</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        {activeTab === "master" && <MasterPage />}
        {activeTab === "teacher" && <TeacherPage />}
        {activeTab === "batch" && <BatchPage />}
        {activeTab === "tracking" && <ChapterTrackingPage />}
        {activeTab === "tests" && <TestTrackingPage />}
        {activeTab === "history" && <HistoryPage />}
        {activeTab === "manage" && <ManagePage />}
      </main>
    </div>
  );
};

export default App;
