import { query, queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

const ATHLETE_SELECT = `
  select a.*,
    case when cat.id is null then null else json_build_object('id', cat.id, 'name', cat.name) end as category
  from athletes a
  left join categories cat on cat.id = a.category_id
`;

export const getCoachCategoryIds = async (coachId) => {
  const rows = await query('select category_id from coach_categories where coach_id = $1', [coachId]);
  return rows.map((row) => row.category_id);
};

// requestingUser is req.user - used to scope results for coaches.
export const listAthletes = async (requestingUser, { categoryId, isActive, search } = {}) => {
  const conditions = [];
  const params = [];

  if (requestingUser.role === 'coach') {
    const categoryIds = await getCoachCategoryIds(requestingUser.id);
    if (categoryIds.length === 0) return [];
    params.push(categoryIds);
    conditions.push(`a.category_id = any($${params.length}::uuid[])`);
  }

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`a.category_id = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive === 'true');
    conditions.push(`a.is_active = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(a.first_name ilike $${params.length} or a.last_name ilike $${params.length})`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  return query(`${ATHLETE_SELECT} ${where} order by a.last_name`, params);
};

export const getAthleteById = async (requestingUser, id) => {
  const athlete = await queryOne(`${ATHLETE_SELECT} where a.id = $1`, [id]);
  if (!athlete) throw new ApiError(404, 'Athlete not found');

  if (requestingUser.role === 'coach') {
    const categoryIds = await getCoachCategoryIds(requestingUser.id);
    if (!categoryIds.includes(athlete.category_id)) {
      throw new ApiError(403, 'You do not have access to this athlete');
    }
  }

  return athlete;
};

export const createAthlete = async (payload) => {
  const categoryId = payload.category_id || null;
  try {
    const row = await queryOne(
      `insert into athletes
         (first_name, last_name, date_of_birth, gender, phone_number, guardian_name,
          guardian_phone, address, category_id, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, coalesce($10, true))
       returning id`,
      [
        payload.first_name,
        payload.last_name,
        payload.date_of_birth,
        payload.gender,
        payload.phone_number || null,
        payload.guardian_name,
        payload.guardian_phone,
        payload.address || null,
        categoryId,
        payload.is_active,
      ]
    );
    return queryOne(`${ATHLETE_SELECT} where a.id = $1`, [row.id]);
  } catch (err) {
    throw new ApiError(err.code === '23503' ? 400 : 400, err.detail || err.message);
  }
};

export const updateAthlete = async (id, rawPayload) => {
  const payload = { ...rawPayload };
  if (payload.category_id === '') payload.category_id = null;

  const fields = [
    'first_name',
    'last_name',
    'date_of_birth',
    'gender',
    'phone_number',
    'guardian_name',
    'guardian_phone',
    'address',
    'category_id',
    'is_active',
  ];
  const sets = [];
  const params = [id];
  for (const field of fields) {
    if (payload[field] !== undefined) {
      params.push(payload[field]);
      sets.push(`${field} = $${params.length}`);
    }
  }
  if (sets.length === 0) return queryOne(`${ATHLETE_SELECT} where a.id = $1`, [id]);

  try {
    const result = await queryOne(
      `update athletes set ${sets.join(', ')} where id = $1 returning id`,
      params
    );
    if (!result) throw new ApiError(404, 'Athlete not found');
    return queryOne(`${ATHLETE_SELECT} where a.id = $1`, [id]);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, err.detail || err.message);
  }
};

export const deleteAthlete = async (id) => {
  const result = await queryOne('delete from athletes where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Athlete not found');
  return { id };
};
