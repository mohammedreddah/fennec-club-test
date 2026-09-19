import { ApiError } from '../utils/apiResponse.js';

// Usage: requireRole('admin') or requireRole('admin', 'coach')
// Must be used after requireAuth, which populates req.user.
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};
