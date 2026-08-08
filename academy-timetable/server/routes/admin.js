import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { requireRole } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const MIN_PASSWORD_LENGTH = 8;
const LOG_PAGE_DEFAULT = 50;
const LOG_PAGE_MAX = 100;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt
});

// All admin routes require: authentication (already applied on /api/*) + admin role + rate limit.
router.use(adminLimiter, requireRole("admin"));

// ── List all users (no passwords).
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-passwordHash");
    res.json({ users: users.map(toPublicUser) });
  } catch (err) {
    next(err);
  }
});

// ── Create a user (admin only).
router.post("/users", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();
    const name = String(req.body.name || "").trim().slice(0, 100);
    const role = req.body.role === "admin" ? "admin" : "user";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12); // cost 12 for production
    const user = await User.create({ name, email, passwordHash, role });

    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── Delete a user (admin only, cannot delete self).
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ status: "deleted" });
  } catch (err) {
    next(err);
  }
});

// ── Activity logs – paginated, body truncated to prevent leaking large payloads.
router.get("/logs", async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || LOG_PAGE_DEFAULT,
      LOG_PAGE_MAX
    );
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .populate({ path: "user", select: "name email role" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments()
    ]);

    // Truncate body/query payloads to prevent leaking large sensitive records.
    const safeLogs = logs.map((log) => ({
      ...log,
      body: truncateObject(log.body),
      query: truncateObject(log.query)
    }));

    res.json({ logs: safeLogs, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// Truncate objects to prevent large payloads appearing in log responses.
const truncateObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const str = JSON.stringify(obj);
  if (str.length <= 500) return obj;
  return { _truncated: true, preview: str.slice(0, 200) + "…" };
};

export default router;