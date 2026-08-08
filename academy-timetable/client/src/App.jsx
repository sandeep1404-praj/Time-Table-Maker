import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import MasterPage from "./pages/MasterPage";
import TeacherPage from "./pages/TeacherPage";
import TeacherManagementPage from "./pages/TeacherManagementPage";
import BatchPage from "./pages/BatchPage";
import ManagePage from "./pages/ManagePage";
import HistoryPage from "./pages/HistoryPage";
import ChapterTrackingPage from "./pages/ChapterTrackingPage";
import TestTrackingPage from "./pages/TestTrackingPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ToastViewport from "./components/ToastViewport";
import { useAuthStore } from "./store/useAuthStore";

const routes = [
  { path: "/master", label: "Timetable", description: "Master timetable and slot editor", wide: true },
  { path: "/teacher", label: "Teachers", description: "Teacher-wise schedule and exports" },
  { path: "/teacher-setup", label: "Teacher Setup", description: "Add, edit, and remove teachers with active allotment totals" },
  { path: "/batch", label: "Batches", description: "Batch-wise schedule and exports" },
  { path: "/tracking", label: "Chapter Progress", description: "Track completion and progress" },
  { path: "/tests", label: "Tests", description: "Test tracking and scheduling" },
  { path: "/history", label: "History", description: "Archived timetables" },
  { path: "/manage", label: "Manage", description: "Teacher, batch, and branch setup" },
  { path: "/admin/users", label: "Admin Users", description: "View user details and create accounts", adminOnly: true },
  { path: "/admin/activity", label: "Admin Activity", description: "See what users did", adminOnly: true }
];

const normalizePath = (path) => {
  if (!path || path === "/") return "/master";
  if (path === "/admin") return "/admin/users";
  return path.replace(/\/+$/, "") || "/master";
};

const App = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [authReady, setAuthReady] = useState(() => !token);

  useEffect(() => {
    const handleAuthLogout = () => {
      clearAuth();
      setAuthReady(true);
    };

    window.addEventListener("auth:logout", handleAuthLogout);

    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, [clearAuth]);

  useEffect(() => {
    if (!token) {
      setAuthReady(true);
      return;
    }

    let active = true;
    setAuthReady(false);

    api
      .get("/api/auth/me")
      .then(({ data }) => {
        if (!active) return;
        setAuth({ token, user: data.user });
        setAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        clearAuth();
        setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, [token, setAuth, clearAuth]);

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

  const visibleRoutes = useMemo(
    () => routes.filter((route) => !route.adminOnly || user?.role === "admin"),
    [user?.role]
  );

  const activeRoute = useMemo(
    () => visibleRoutes.find((route) => route.path === currentPath) || visibleRoutes[0] || routes[0],
    [currentPath, visibleRoutes]
  );
  const ActivePage = useMemo(() => {
    switch (activeRoute.path) {
      case "/master":
        return MasterPage;
      case "/teacher":
        return TeacherPage;
      case "/teacher-setup":
        return TeacherManagementPage;
      case "/batch":
        return BatchPage;
      case "/tracking":
        return ChapterTrackingPage;
      case "/tests":
        return TestTrackingPage;
      case "/history":
        return HistoryPage;
      case "/manage":
        return ManagePage;
      case "/admin/users":
      case "/admin/activity":
        return AdminPage;
      default:
        return MasterPage;
    }
  }, [activeRoute.path]);

  useEffect(() => {
    if (!authReady || !token) return;
    if (visibleRoutes.length === 0) return;
    if (!visibleRoutes.some((route) => route.path === currentPath)) {
      navigate(visibleRoutes[0].path);
    }
  }, [authReady, token, visibleRoutes, currentPath]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_48%,_#eef2ff_100%)] text-slate-800">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-xl">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-indigo-100" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Checking your session...</p>
            <p className="mt-1 text-sm text-slate-500">Please wait while we restore access.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthPage onAuthenticated={() => navigate("/master")} />;
  }

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
            {visibleRoutes.map((route) => (
              <button
                key={route.path}
                type="button"
                onClick={() => navigate(route.path)}
                className={`nav-tab ${currentPath === route.path ? "nav-tab--active" : "nav-tab--inactive"}`}
              >
                {route.label}
              </button>
            ))}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">{user?.name || user?.email}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  setCurrentPath("/master");
                  window.history.replaceState({}, "", "/master");
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
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

        <ActivePage section={activeRoute.path === "/admin/activity" ? "activity" : "users"} onNavigate={navigate} />
      </main>
    </div>
  );
};

export default App;
