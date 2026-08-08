import { useEffect, useMemo, useState } from "react";
import MasterPage from "./pages/MasterPage";
import TeacherPage from "./pages/TeacherPage";
import TeacherManagementPage from "./pages/TeacherManagementPage";
import BatchPage from "./pages/BatchPage";
import ManagePage from "./pages/ManagePage";
import HistoryPage from "./pages/HistoryPage";
import ChapterTrackingPage from "./pages/ChapterTrackingPage";
import TestTrackingPage from "./pages/TestTrackingPage";
import ToastViewport from "./components/ToastViewport";

const routes = [
  { path: "/master", label: "Timetable", description: "Master timetable and slot editor", wide: true },
  { path: "/teacher", label: "Teachers", description: "Teacher-wise schedule and exports" },
  { path: "/teacher-setup", label: "Teacher Setup", description: "Add, edit, and remove teachers with active allotment totals" },
  { path: "/batch", label: "Batches", description: "Batch-wise schedule and exports" },
  { path: "/tracking", label: "Chapter Progress", description: "Track completion and progress" },
  { path: "/tests", label: "Tests", description: "Test tracking and scheduling" },
  { path: "/history", label: "History", description: "Archived timetables" },
  { path: "/manage", label: "Manage", description: "Teacher, batch, and branch setup" }
];

const routeViews = {
  "/master": MasterPage,
  "/teacher": TeacherPage,
  "/teacher-setup": TeacherManagementPage,
  "/batch": BatchPage,
  "/tracking": ChapterTrackingPage,
  "/tests": TestTrackingPage,
  "/history": HistoryPage,
  "/manage": ManagePage
};

const normalizePath = (path) => {
  if (!path || path === "/") return "/master";
  return path.replace(/\/+$/, "") || "/master";
};

const App = () => {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const nextPath = routes.some((route) => route.path === normalizePath(window.location.pathname))
      ? normalizePath(window.location.pathname)
      : "/master";
    if (nextPath !== window.location.pathname) {
      window.history.replaceState({}, "", nextPath);
    }
    setCurrentPath(nextPath);

    const handlePopState = () => setCurrentPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path) => {
    const nextPath = normalizePath(path);
    if (nextPath === normalizePath(window.location.pathname)) return;
    window.history.pushState({}, "", nextPath);
    setCurrentPath(nextPath);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  };

  const activeRoute = useMemo(
    () => routes.find((route) => route.path === currentPath) || routes[0],
    [currentPath]
  );
  const ActivePage = routeViews[activeRoute.path] || MasterPage;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_48%,_#eef2ff_100%)] text-slate-800">
      <ToastViewport />
      <header className="app-header">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-lg font-bold text-white shadow-md shadow-indigo-200">
              GA
            </div>
            <div>
              <h1 className="app-brand">Guru Aanklan Academy</h1>
              <p className="app-brand-sub">Timetable operations across separate routed pages</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 lg:justify-end">
            {routes.map((route) => (
              <button
                key={route.path}
                type="button"
                onClick={() => navigate(route.path)}
                className={`nav-tab ${currentPath === route.path ? "nav-tab--active" : "nav-tab--inactive"}`}
              >
                {route.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`mx-auto px-4 py-6 lg:px-6 ${activeRoute.wide ? "max-w-[1600px]" : "max-w-7xl"}`}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">
              {activeRoute.label}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {activeRoute.description}
            </h2>
          </div>
          {/* <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            Use the navigation to switch pages
          </div> */}
        </div>

        <ActivePage />
      </main>
    </div>
  );
};

export default App;
