import { queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export const createRequirement = async ({ folder_id, name, description, display_order }) => {
  try {
    return await queryOne(
      `insert into document_requirements (folder_id, name, description, display_order)
       values ($1, $2, $3, $4) returning *`,
      [folder_id, name, description || null, display_order ?? 0]
    );
  } catch (err) {
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const updateRequirement = async (id, { name, description, display_order }) => {
  const sets = [];
  const params = [id];
  for (const [key, value] of Object.entries({ name, description, display_order })) {
    if (value !== undefined) {
      params.push(value);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (sets.length === 0) {
    const existing = await queryOne('select * from document_requirements where id = $1', [id]);
    if (!existing) throw new ApiError(404, 'Document requirement not found');
    return existing;
  }

  try {
    const requirement = await queryOne(
      `update document_requirements set ${sets.join(', ')} where id = $1 returning *`,
      params
    );
    if (!requirement) throw new ApiError(404, 'Document requirement not found');
    return requirement;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const deleteRequirement = async (id) => {
  const result = await queryOne('delete from document_requirements where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Document requirement not found');
  return { id };
};
