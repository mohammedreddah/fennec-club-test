import { query, queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export const listSessionTypes = async () => {
  return query('select * from session_types order by display_order');
};

export const getSessionTypeById = async (id) => {
  const type = await queryOne('select * from session_types where id = $1', [id]);
  if (!type) throw new ApiError(404, 'Session type not found');
  return type;
};

export const createSessionType = async ({ name, description, display_order }) => {
  try {
    return await queryOne(
      'insert into session_types (name, description, display_order) values ($1, $2, $3) returning *',
      [name, description || null, display_order ?? 0]
    );
  } catch (err) {
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const updateSessionType = async (id, { name, description, display_order }) => {
  const sets = [];
  const params = [id];
  for (const [key, value] of Object.entries({ name, description, display_order })) {
    if (value !== undefined) {
      params.push(value);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (sets.length === 0) return getSessionTypeById(id);

  try {
    const type = await queryOne(`update session_types set ${sets.join(', ')} where id = $1 returning *`, params);
    if (!type) throw new ApiError(404, 'Session type not found');
    return type;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const deleteSessionType = async (id) => {
  // Sessions using this type keep their session_type_id set to null instead
  // of blocking the delete (see the `on delete set null` FK), so old history
  // stays intact even if the type is later removed.
  const result = await queryOne('delete from session_types where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Session type not found');
  return { id };
};
