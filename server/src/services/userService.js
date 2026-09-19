import { query, queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

// password_hash is deliberately never selected here — this file only ever
// returns data that's safe to hand back to the frontend.
const SAFE_COLUMNS = 'id, email, full_name, role, is_active, created_at, updated_at';

export const listProfiles = async (role) => {
  if (role) {
    return query(`select ${SAFE_COLUMNS} from profiles where role = $1 order by full_name`, [role]);
  }
  return query(`select ${SAFE_COLUMNS} from profiles order by full_name`);
};

export const getProfileById = async (id) => {
  const profile = await queryOne(`select ${SAFE_COLUMNS} from profiles where id = $1`, [id]);
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};

export const setProfileActive = async (id, isActive) => {
  const profile = await queryOne(
    `update profiles set is_active = $2 where id = $1 returning ${SAFE_COLUMNS}`,
    [id, isActive]
  );
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};
