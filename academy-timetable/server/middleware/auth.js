import jwt from "jsonwebtoken";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";

// JWT_SECRET is validated at first use (and at startup via validateStartupConfig()).
// We cannot use process.exit() at module load time in ESM because all imports are
// hoisted before dotenv.config() runs in server.js.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[FATAL] JWT_SECRET is not set or is too short (minimum 32 characters). " +
      "Set JWT_SECRET in your .env file and restart the server."
    );
  }
  return secret;
};

/**
 * Call this once at server startup (after dotenv.config()) to validate
 * critical configuration before accepting any requests.
 */
export const validateStartupConfig = () => {
  try {
    getJwtSecret();
    console.log("[AUTH] JWT_SECRET validated successfully.");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

// Keys that must never appear in logged request bodies / metadata.
const SENSITIVE_KEYS = new Set([
  "password", "passwordhash", "passwordHash",
  "token", "authorization", "secret",
  "pass", "passwd", "pwd", "hash", "key",
  "credential", "credentials", "apikey", "api_key"
]);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEYS.has(key.toLowerCase()))
        .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }

  return value;
};

/**
 * Creates a short-lived access token (2 hours).
 * Only sub (userId) and role are embedded — no email, no PII.
 */
export const createAuthToken = (user) => {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role
    },
    secret,
    { expiresIn: "2h" }
  );
};

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = user;
    req.auth = payload;
    next();
  } catch {
    // Deliberately generic – do not reveal whether token was expired or malformed.
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

export const recordActivity = async ({
  user = null,
  userEmail = "",
  role = "user",
  action,
  method = "",
  path = "",
  statusCode = 200,
  body = {},
  query = {},
  params = {},
  metadata = {}
}) => {
  try {
    await ActivityLog.create({
      user,
      userEmail,
      role,
      action,
      method,
      path,
      statusCode,
      body: sanitizeValue(body),
      query: sanitizeValue(query),
      params: sanitizeValue(params),
      metadata: sanitizeValue(metadata)
    });
  } catch (error) {
    // Non-fatal – log to stderr but do not crash the request.
    console.error("Failed to write activity log:", error.message);
  }
};

export const activityLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const user = req.user;
    if (!user) {
      return;
    }

    void recordActivity({
      user: user._id,
      userEmail: user.email,
      role: user.role,
      action: `${req.method} ${req.route?.path || req.path}`,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      body: req.body,
      query: req.query,
      params: req.params,
      metadata: {
        durationMs: Date.now() - startedAt,
        // Never log full user-agent strings (can contain fingerprinting info)
        ip: req.ip || ""
      }
    });
  });

  next();
};

/**
 * Central async error handler. Pass to app.use() AFTER all routes.
 * Converts unhandled async rejections into clean 500 responses.
 * Never exposes stack traces to the client.
 */
// eslint-disable-next-line no-unused-vars
export const globalErrorHandler = (err, req, res, next) => {
  // Log the full error internally for debugging.
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);

  // Never send stack traces or internal details to the client.
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "An unexpected error occurred" : err.message
  });
};