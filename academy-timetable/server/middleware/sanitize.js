import mongoSanitize from "express-mongo-sanitize";

/**
 * Strips MongoDB operator characters (`$` and `.`) from user-supplied
 * input in req.body, req.query, and req.params.
 *
 * This prevents NoSQL injection attacks where an attacker sends
 * payloads like { "email": { "$gt": "" } } to bypass authentication
 * or enumerate data.
 *
 * Applied globally BEFORE all route handlers.
 */
export const sanitizeInputs = mongoSanitize({
  // Replace prohibited characters instead of removing the whole key.
  // Allows debugging of what was sanitized.
  replaceWith: "_",
  // Also sanitize query strings (e.g. ?filter[$gt]=foo)
  allowDots: false
});
