// Load environment variables FIRST via a dedicated side-effect import.
// In ESM, import statements are hoisted, so we use a loader module that
// calls dotenv.config() synchronously before any other module reads process.env.
import "./config/env.js";


import express from "express";
import helmet from "helmet";
import cors from "cors";
import { connectDb } from "./config/db.js";

import "./models/User.js";
import "./models/ActivityLog.js";
import "./models/Teacher.js";
import "./models/Branch.js";
import "./models/Batch.js";
import "./models/TimeSlot.js";
import "./models/ConflictLog.js";
import "./models/DateRow.js";
import "./models/Archive.js";

import slotsRouter from "./routes/slots.js";
import teachersRouter from "./routes/teachers.js";
import branchesRouter from "./routes/branches.js";
import batchesRouter from "./routes/batches.js";
import datesRouter from "./routes/dates.js";
import timetableRouter from "./routes/timetable.js";
import conflictsRouter from "./routes/conflicts.js";
import exportRouter from "./routes/export.js";
import archivesRouter from "./routes/archives.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import { activityLogger, authenticate, globalErrorHandler, validateStartupConfig } from "./middleware/auth.js";
import { sanitizeInputs } from "./middleware/sanitize.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// ── Trust the first reverse-proxy hop (Render, Nginx, etc.) so that
//    req.ip returns the real client IP, not the proxy IP.
//    This is required for rate-limiting to work correctly.
app.set("trust proxy", 1);

// ── Security headers via Helmet.
//    Disables X-Powered-By, sets X-Frame-Options, X-Content-Type-Options,
//    Referrer-Policy, HSTS, and a restrictive Content-Security-Policy.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Needed for inline styles common in SPAs
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,       // 1 year
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

// ── CORS – only allow known origins.
//    Requests with no Origin header (server-to-server) are blocked
//    except for the health check route below.
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://time-table-guru.netlify.app",
  // Allow localhost only in non-production environments
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:3000"] : [])
].filter(Boolean).map((u) => u.replace(/\/+$/, "")); // strip trailing slashes

app.use(
  cors({
    origin: function (origin, callback) {
      // Block requests with no origin in production (server-to-server / curl attacks).
      if (!origin) {
        if (process.env.NODE_ENV === "production") {
          return callback(new Error("Cross-origin request blocked"));
        }
        // Allow in dev for tools like Postman/curl.
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ── Body parsing with size limits to prevent payload-based DoS attacks.
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

// ── NoSQL injection sanitization – strips MongoDB operators from all input.
app.use(sanitizeInputs);

// ── Health check (no auth required, before rate limit middleware).
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// ── Auth routes (login / signup tombstone / me).
//    Rate limiting on login is applied inside the router.
app.use("/api/auth", authRouter);

// ── All /api/* routes require authentication + activity logging.
//    General rate limiter applied to all authenticated API routes.
app.use("/api", authenticate, apiLimiter, activityLogger);

app.use("/api/slots", slotsRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/branches", branchesRouter);
app.use("/api/batches", batchesRouter);
app.use("/api/dates", datesRouter);
app.use("/api/timetable", timetableRouter);
app.use("/api/conflicts", conflictsRouter);
app.use("/api/export", exportRouter);
app.use("/api/archives", archivesRouter);
app.use("/api/admin", adminRouter);

// ── Global error handler – must be registered LAST.
//    Catches any error passed to next(err) or thrown in async handlers.
app.use(globalErrorHandler);

const port = process.env.PORT || 4000;

// Validate critical configuration before connecting to the database.
// This ensures JWT_SECRET is present and long enough.
validateStartupConfig();

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port} [${process.env.NODE_ENV || "development"}]`);
    });
  })
  .catch((error) => {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  });