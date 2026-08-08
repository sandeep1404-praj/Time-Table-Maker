import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticate, createAuthToken, recordActivity } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Minimum password length enforced here and in admin user-create route.
const MIN_PASSWORD_LENGTH = 8;

// A dummy hash used for constant-time comparison when a user is not found.
// This prevents timing-based user enumeration attacks.
const DUMMY_HASH = "$2b$10$invalid.hash.that.never.matches.xxxxxxxxxxxxxxxxxxxxxxxxx";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name || "",
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt
});

// ── Self-signup is permanently disabled.
//    User accounts are created exclusively by admins via POST /api/admin/users.
router.post("/signup", (_req, res) => {
  res.status(403).json({ error: "Self-signup is disabled. Contact your administrator." });
});

// ── Login – protected by IP-based rate limiter (10 attempts / 15 min).
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      // Generic message – do not confirm whether the account exists.
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = await User.findOne({ email });

    // Always run bcrypt.compare to prevent timing-based user enumeration.
    // If the user does not exist we compare against a dummy hash (and discard the result).
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      // Same response regardless of whether email was wrong or password was wrong.
      return res.status(401).json({ error: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = createAuthToken(user);

    await recordActivity({
      user: user._id,
      userEmail: user.email,
      role: user.role,
      action: "auth.login",
      method: "POST",
      path: "/api/auth/login",
      statusCode: 200
    });

    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── Session verification – used by the SPA on startup.
router.get("/me", authenticate, async (req, res, next) => {
  try {
    res.json({ user: toPublicUser(req.user) });
  } catch (err) {
    next(err);
  }
});

export default router;