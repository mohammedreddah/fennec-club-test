import { query, queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export const listCategories = async () => {
  return query('select * from categories order by name');
};

export const getCategoryById = async (id) => {
  const category = await queryOne('select * from categories where id = $1', [id]);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

export const createCategory = async ({ name, description }) => {
  try {
    return await queryOne(
      'insert into categories (name, description) values ($1, $2) returning *',
      [name, description || null]
    );
  } catch (err) {
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const updateCategory = async (id, { name, description }) => {
  const sets = [];
  const params = [id];
  if (name !== undefined) {
    params.push(name);
    sets.push(`name = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    sets.push(`description = $${params.length}`);
  }
  if (sets.length === 0) return getCategoryById(id);

  try {
    const category = await queryOne(
      `update categories set ${sets.join(', ')} where id = $1 returning *`,
      params
    );
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const deleteCategory = async (id) => {
  const { count } = (await queryOne('select count(*)::int as count from athletes where category_id = $1', [id])) || {
    count: 0,
  };
  if (count > 0) {
    throw new ApiError(409, 'This category still has athletes assigned to it and cannot be deleted');
  }
  const result = await queryOne('delete from categories where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Category not found');
  return { id };
};
