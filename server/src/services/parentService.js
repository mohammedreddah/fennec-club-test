import { query, queryOne, withTransaction } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { ApiError } from '../utils/apiResponse.js';

const PARENT_SELECT = `
  select
    pa.id, pa.phone, pa.created_at, pa.updated_at,
    json_build_object(
      'id', p.id, 'email', p.email, 'full_name', p.full_name,
      'role', p.role, 'is_active', p.is_active,
      'created_at', p.created_at, 'updated_at', p.updated_at
    ) as profile
  from parents pa
  join profiles p on p.id = pa.id
`;

export const listParents = async () => {
  return query(`${PARENT_SELECT} order by pa.created_at desc`);
};

export const getParentById = async (id) => {
  const parent = await queryOne(`${PARENT_SELECT} where pa.id = $1`, [id]);
  if (!parent) throw new ApiError(404, 'Parent not found');
  return parent;
};

export const createParent = async ({ email, password, fullName, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await queryOne('select id from profiles where email = $1', [normalizedEmail]);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(password);

  const id = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into profiles (email, password_hash, full_name, role, is_active)
       values ($1, $2, $3, 'parent', true) returning id`,
      [normalizedEmail, passwordHash, fullName]
    );
    const newId = rows[0].id;

    await client.query('insert into parents (id, phone) values ($1, $2)', [newId, phone || null]);

    return newId;
  });

  return getParentById(id);
};

export const updateParent = async (id, { fullName, email, phone }) => {
  const normalizedEmail = email !== undefined ? email.trim().toLowerCase() : undefined;

  if (normalizedEmail !== undefined) {
    const existing = await queryOne('select id from profiles where email = $1 and id <> $2', [normalizedEmail, id]);
    if (existing) throw new ApiError(409, 'Another account already uses this email');
  }

  await withTransaction(async (client) => {
    if (fullName !== undefined || normalizedEmail !== undefined) {
      await client.query(
        `update profiles set
           full_name = coalesce($2, full_name),
           email = coalesce($3, email)
         where id = $1`,
        [id, fullName !== undefined ? fullName : null, normalizedEmail !== undefined ? normalizedEmail : null]
      );
    }
    if (phone !== undefined) {
      await client.query('update parents set phone = $2 where id = $1', [id, phone]);
    }
  });
  return getParentById(id);
};

export const setParentActive = async (id, isActive) => {
  const result = await queryOne('update profiles set is_active = $2 where id = $1 returning id', [id, isActive]);
  if (!result) throw new ApiError(404, 'Parent not found');
  return getParentById(id);
};

export const updateParentPassword = async (id, newPassword) => {
  const passwordHash = await hashPassword(newPassword);
  const result = await queryOne('update profiles set password_hash = $2 where id = $1 returning id', [id, passwordHash]);
  if (!result) throw new ApiError(404, 'Parent not found');
  return { id };
};

export const deleteParent = async (id) => {
  const result = await queryOne('delete from profiles where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Parent not found');
  return { id };
};
