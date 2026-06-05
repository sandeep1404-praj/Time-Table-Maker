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
  const isWideLayout = activeTab === "master" || activeTab === "history";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="app-header">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-lg font-bold text-white shadow-md shadow-indigo-200">
              GA
            </div>
            <div>
              <h1 className="app-brand">Guru Aanklan Academy</h1>
              <p className="app-brand-sub">Timetable Management</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`nav-tab ${
                  activeTab === tab.key ? "nav-tab--active" : "nav-tab--inactive"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className={`mx-auto px-6 py-6 ${isWideLayout ? "max-w-[1600px]" : "max-w-6xl"}`}>
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
