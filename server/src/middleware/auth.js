import { queryOne } from '../config/db.js';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the JWT sent in the Authorization header, loads the corresponding
// profile row fresh from the database, and attaches it to req.user.
// Every protected route in this app goes through this middleware first.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Missing or invalid Authorization header');
  }

  const payload = verifyToken(token);
  if (!payload?.id) {
    throw new ApiError(401, 'Invalid or expired session');
  }

  // Reloaded from the database on every request (not just decoded from the
  // token) so a deactivated account or role change takes effect immediately,
  // without waiting for the token to expire.
  const profile = await queryOne(
    'select id, email, full_name, role, is_active from profiles where id = $1',
    [payload.id]
  );

  if (!profile) {
    throw new ApiError(401, 'No profile found for this account');
  }

  if (!profile.is_active) {
    throw new ApiError(403, 'This account has been deactivated. Contact an administrator.');
  }

  req.user = profile;
  next();
});
