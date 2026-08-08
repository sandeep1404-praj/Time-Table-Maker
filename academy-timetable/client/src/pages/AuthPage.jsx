import { useState } from "react";
import api from "../api/client";
import { useAuthStore } from "../store/useAuthStore";

const AuthPage = ({ onAuthenticated }) => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        email: email.trim(),
        password
      };

      const { data } = await api.post("/api/auth/login", payload);
      setAuth(data);
      onAuthenticated?.(data.user);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to continue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-6 px-4 py-6 lg:grid-cols-[1.15fr_minmax(360px,0.85fr)] lg:px-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-100">
          Academy access
        </div>
        <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Log in to manage the timetable.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
          Only existing users can sign in here. Admin users can create new accounts from the admin panel.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Role</p>
            <p className="mt-2 text-lg font-bold text-white">User / Admin</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Signup</p>
            <p className="mt-2 text-lg font-bold text-white">Disabled</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Audit</p>
            <p className="mt-2 text-lg font-bold text-white">Activity logs</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Use your email and password to enter the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              className="form-input"
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Please wait..." : "Log in"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AuthPage;