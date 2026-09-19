// Wraps an async controller so thrown errors are forwarded to the centralized
// error handler instead of crashing the process or being silently swallowed.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
