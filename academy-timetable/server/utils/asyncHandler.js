/**
 * Wraps an async Express route handler so that any thrown error or
 * rejected promise is forwarded to Express's next(err) instead of
 * crashing the server or producing an unhandled rejection warning.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
