import { queryOne } from '../config/db.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiResponse.js';

export const login = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const account = await queryOne(
    'select id, email, full_name, role, is_active, password_hash from profiles where email = $1',
    [normalizedEmail]
  );

  if (!account) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await comparePassword(password, account.password_hash);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!account.is_active) {
    throw new ApiError(403, 'This account has been deactivated. Contact an administrator.');
  }

  const token = signToken({ id: account.id, role: account.role });

  const { password_hash, ...profile } = account;

  return { token, profile };
};

// Login is stateless (JWT-based) so there's nothing to invalidate server-side
// for a normal logout — the client simply discards its token. This function
// exists so the /api/auth/logout route has a symmetrical, documented place
// to add token revocation (e.g. a denylist table) later if ever needed.
export const logout = async () => {
  return true;
};
