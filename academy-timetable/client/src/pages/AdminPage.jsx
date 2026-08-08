import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

const getUserDisplayName = (log) => log.user?.name || log.userEmail || "System";

const getActivitySentence = (log) => {
  const actor = getUserDisplayName(log);
  const endpoint = log.path || "";

  if (log.action === "auth.signup") {
    return `${actor} signed up and created an account`;
  }

  if (log.action === "auth.login") {
    return `${actor} signed in`;
  }

  if (endpoint.includes("/api/admin/users") && log.method === "POST") {
    return `${actor} created a new user`;
  }

  if (endpoint.includes("/api/admin/users") && log.method === "GET") {
    return `${actor} opened the user list`;
  }

  if (endpoint.includes("/api/admin/logs")) {
    return `${actor} opened the activity logs`;
  }

  const actionByMethod = {
    GET: "viewed",
    POST: "submitted",
    PUT: "updated",
    PATCH: "updated",
    DELETE: "removed"
  };

  const cleanedPath = endpoint.replace(/^\/api\//, "");
  return `${actor} ${actionByMethod[log.method] || "used"} ${cleanedPath || "the app"}`;
};

const getActivityTarget = (log) => {
  const endpoint = log.path || "";

  if (log.action === "auth.signup") return "Signup";
  if (log.action === "auth.login") return "Login";
  if (endpoint.includes("/api/admin/users")) return "User management";
  if (endpoint.includes("/api/admin/logs")) return "Activity log";
  if (!endpoint) return "System";

  return endpoint.replace(/^\/api\//, "").replace(/\//g, " ");
};

const getActivityUserId = (log) => String(log.user?._id || log.user?.id || log.user || "");

const getActivityUserLabel = (user) => {
  if (!user) return "All users";

  const parts = [user.name || "Unnamed user", user.email].filter(Boolean);
  return parts.join(" • ");
};

const getUserInitials = (user) => {
  const source = String(user?.name || user?.email || "U").trim();
  const pieces = source.split(/\s+/).filter(Boolean);
  if (pieces.length >= 2) {
    return `${pieces[0][0] || "U"}${pieces[1][0] || ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const isViewActivity = (log) => {
  if (log.action === "auth.signup" || log.action === "auth.login") {
    return false;
  }

  return log.method === "GET";
};

const AdminPage = ({ section = "users", onNavigate }) => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(section);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/users");
      return data?.users || [];
    }
  });

  const logsQuery = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/logs");
      return data?.logs || [];
    },
    refetchInterval: 60_000
  });

  const createUser = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/api/admin/users", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setError("");
    },
    onError: (requestError) => {
      setError(requestError?.response?.data?.error || "Unable to create user.");
    }
  });

  const userStats = useMemo(() => {
    const users = usersQuery.data || [];
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      basic: users.filter((user) => user.role === "user").length
    };
  }, [usersQuery.data]);

  const activityStats = useMemo(() => {
    const logs = logsQuery.data || [];
    const meaningfulLogs = logs.filter((log) => !isViewActivity(log));
    return {
      total: meaningfulLogs.length,
      signups: meaningfulLogs.filter((log) => log.action === "auth.signup").length,
      logins: meaningfulLogs.filter((log) => log.action === "auth.login").length
    };
  }, [logsQuery.data]);

  const activityUsers = useMemo(() => {
    const users = usersQuery.data || [];
    const logs = (logsQuery.data || []).filter((log) => !isViewActivity(log));
    const map = new Map();

    users.forEach((user) => {
      map.set(String(user.id), user);
    });

    logs.forEach((log) => {
      const id = getActivityUserId(log);
      if (!id || map.has(id)) return;

      map.set(id, {
        id,
        name: log.user?.name || log.userEmail || "Unknown user",
        email: log.user?.email || log.userEmail || "",
        role: log.role || "user"
      });
    });

    return Array.from(map.values()).sort((left, right) => String(left.name || left.email).localeCompare(String(right.name || right.email)));
  }, [usersQuery.data, logsQuery.data]);

  const activityLogs = useMemo(() => {
    const logs = (logsQuery.data || []).filter((log) => !isViewActivity(log));

    if (selectedUserId === "all") {
      return logs;
    }

    return logs.filter((log) => getActivityUserId(log) === selectedUserId);
  }, [logsQuery.data, selectedUserId]);

  const selectedUser = useMemo(
    () => activityUsers.find((user) => String(user.id) === selectedUserId) || null,
    [activityUsers, selectedUserId]
  );

  const selectedUserStats = useMemo(() => {
    if (selectedUserId === "all") {
      return activityStats;
    }

    const matchingLogs = activityLogs;

    return {
      total: matchingLogs.length,
      signups: matchingLogs.filter((log) => log.action === "auth.signup").length,
      logins: matchingLogs.filter((log) => log.action === "auth.login").length
    };
  }, [activityLogs, activityStats, selectedUserId]);

  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  const handleSectionChange = (nextSection) => {
    setActiveSection(nextSection);

    if (!onNavigate) {
      return;
    }

    onNavigate(nextSection === "activity" ? "/admin/activity" : "/admin/users");
  };

  const isActivitySection = activeSection === "activity";

  const handleSubmit = async (event) => {
    event.preventDefault();
    createUser.mutate({
      name,
      email,
      password,
      role
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="manage-card h-fit overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white lg:sticky lg:top-24 lg:shadow-2xl lg:shadow-slate-950/10">
        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">Admin console</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Control center</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A clean place to manage users and read activity without leaving the page.
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                key: "users",
                title: "Users",
                description: "View people and add new users"
              },
              {
                key: "activity",
                title: "Activity",
                description: "See only user actions"
              }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSectionChange(item.key)}
                className={`group w-full rounded-2xl border px-4 py-3 text-left transition duration-200 ${
                  activeSection === item.key
                    ? "border-white/25 bg-white/15 shadow-lg shadow-black/10 ring-1 ring-white/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{item.description}</p>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      activeSection === item.key ? "bg-cyan-300 shadow-[0_0_0_6px_rgba(103,232,249,0.16)]" : "bg-white/40 group-hover:bg-white/70"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Users</p>
              <p className="mt-2 text-3xl font-bold">{userStats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Admins</p>
              <p className="mt-2 text-3xl font-bold">{userStats.admins}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Activity</p>
              <p className="mt-2 text-3xl font-bold">{activityStats.total}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Current page</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {isActivitySection ? "User activity and audit trail" : "Users and account setup"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              The selected view stays highlighted so it is always clear where you are.
            </p>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        {!isActivitySection ? (
          <>
            <section className="manage-card overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/10">
              <div className="grid gap-4 p-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">User management</p>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight">See user details and add new accounts</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Manage basic and admin users directly from this page without leaving the admin area.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Basic users</p>
                    <p className="mt-2 text-3xl font-bold">{userStats.basic}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Last logs</p>
                    <p className="mt-2 text-3xl font-bold">{activityStats.total}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="manage-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">User details</h3>
                  <p className="mt-1 text-sm text-slate-500">View all users in a table and add a new user from the first row.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{usersQuery.data?.length || 0} total</span>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Name</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Email</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Password</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Role</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top">
                      <td className="border-b border-slate-100 px-4 py-4">
                        <label className="sr-only" htmlFor="admin-user-name">Name</label>
                        <input
                          id="admin-user-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name"
                          className="form-input min-w-[180px]"
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <label className="sr-only" htmlFor="admin-user-email">Email</label>
                        <input
                          id="admin-user-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="form-input min-w-[220px]"
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <label className="sr-only" htmlFor="admin-user-password">Password</label>
                        <input
                          id="admin-user-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="form-input min-w-[180px]"
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <label className="sr-only" htmlFor="admin-user-role">Role</label>
                        <select id="admin-user-role" value={role} onChange={(e) => setRole(e.target.value)} className="form-select min-w-[140px]">
                          <option value="user">Basic user</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <button type="submit" disabled={createUser.isPending} className="btn-primary whitespace-nowrap">
                          {createUser.isPending ? "Creating..." : "Add user"}
                        </button>
                      </td>
                    </tr>

                    {error ? (
                      <tr>
                        <td colSpan="5" className="px-4 pt-4">
                          <div className="alert-error">{error}</div>
                        </td>
                      </tr>
                    ) : null}

                    {usersQuery.isLoading ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                          Loading users...
                        </td>
                      </tr>
                    ) : (usersQuery.data || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                          No users yet.
                        </td>
                      </tr>
                    ) : (
                      usersQuery.data.map((user) => (
                        <tr key={user.id} className="group align-top transition hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-4 py-4">
                            <p className="text-sm font-semibold text-slate-900">{user.name || "Unnamed user"}</p>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4">
                            <p className="break-words text-sm text-slate-600">{user.email}</p>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-400">Hidden</td>
                          <td className="border-b border-slate-100 px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                user.role === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-500">{formatDateTime(user.lastLoginAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </form>
            </section>
          </>
        ) : (
          <>
            <section className="manage-card overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl shadow-slate-950/10">
              <div className="grid gap-4 p-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">Activity history</p>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight">Simple words for what each user did</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    This view shows only meaningful user actions. Page views and log-open events are hidden.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Signups</p>
                    <p className="mt-2 text-3xl font-bold">{selectedUserStats.signups}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Logins</p>
                    <p className="mt-2 text-3xl font-bold">{selectedUserStats.logins}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="manage-card">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Activity log</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a user to see their activity, or keep all users selected.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:min-w-[420px] md:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <label className="form-label">User</label>
                    <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="form-select">
                      <option value="all">All users</option>
                      {activityUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {getActivityUserLabel(user)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-900">Filtered view</p>
                    <p className="mt-1">Only user actions are shown here.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Showing</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUser ? getActivityUserLabel(selectedUser) : "All users"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUserStats.total}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last refresh</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Auto every minute</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {logsQuery.isLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                    Loading logs...
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                    No user activity yet.
                  </div>
                ) : (
                  activityLogs.map((log) => (
                    <article key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white hover:shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {getActivitySentence(log)} <span className="text-xs font-medium text-slate-500">({log.statusCode})</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getUserDisplayName(log)} · {log.role} · {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                          {getActivityTarget(log)}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;