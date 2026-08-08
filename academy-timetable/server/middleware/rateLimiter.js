import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Rate limiter for authentication endpoints (login).
 * 10 attempts per 15 minutes per IP address.
 * After exhaustion the IP is blocked for 15 minutes with a clear error.
 *
 * Uses ipKeyGenerator to correctly handle both IPv4 and IPv6 addresses.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,    // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,     // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false,
  message: {
    error: "Too many login attempts. Please try again in 15 minutes."
  },
  // ipKeyGenerator handles IPv4-mapped IPv6 addresses correctly and is
  // required when using a custom keyGenerator with express-rate-limit v7+.
  keyGenerator: (req) => ipKeyGenerator(req)
});

/**
 * Rate limiter for general authenticated API traffic.
 * 300 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down."
  },
  keyGenerator: (req) => ipKeyGenerator(req)
});

/**
 * Rate limiter for admin routes.
 * 100 requests per minute per IP (admin panel is low-volume).
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many admin requests. Please slow down."
  },
  keyGenerator: (req) => ipKeyGenerator(req)
});
