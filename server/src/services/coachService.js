import { query, queryOne, withTransaction } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { ApiError } from '../utils/apiResponse.js';

const COACH_SELECT = `
  select
    c.id, c.phone, c.specialty, c.created_at, c.updated_at,
    json_build_object(
      'id', p.id, 'email', p.email, 'full_name', p.full_name,
      'role', p.role, 'is_active', p.is_active,
      'created_at', p.created_at, 'updated_at', p.updated_at
    ) as profile
  from coaches c
  join profiles p on p.id = c.id
`;

export const listCoaches = async () => {
  return query(`${COACH_SELECT} order by c.created_at desc`);
};

export const getCoachById = async (id) => {
  const coach = await queryOne(`${COACH_SELECT} where c.id = $1`, [id]);
  if (!coach) throw new ApiError(404, 'Coach not found');
  return coach;
};

export const createCoach = async ({ email, password, fullName, phone, specialty }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await queryOne('select id from profiles where email = $1', [normalizedEmail]);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(password);

  const id = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into profiles (email, password_hash, full_name, role, is_active)
       values ($1, $2, $3, 'coach', true) returning id`,
      [normalizedEmail, passwordHash, fullName]
    );
    const newId = rows[0].id;

    await client.query(
      'insert into coaches (id, phone, specialty) values ($1, $2, $3)',
      [newId, phone || null, specialty || null]
    );

    return newId;
  });

  return getCoachById(id);
};

export const updateCoach = async (id, { fullName, email, phone, specialty }) => {
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
    if (phone !== undefined || specialty !== undefined) {
      await client.query(
        `update coaches set
           phone = coalesce($2, phone),
           specialty = coalesce($3, specialty)
         where id = $1`,
        [id, phone !== undefined ? phone : null, specialty !== undefined ? specialty : null]
      );
    }
  });
  return getCoachById(id);
};

export const setCoachActive = async (id, isActive) => {
  const result = await queryOne('update profiles set is_active = $2 where id = $1 returning id', [id, isActive]);
  if (!result) throw new ApiError(404, 'Coach not found');
  return getCoachById(id);
};

export const updateCoachPassword = async (id, newPassword) => {
  const passwordHash = await hashPassword(newPassword);
  const result = await queryOne(
    'update profiles set password_hash = $2 where id = $1 returning id',
    [id, passwordHash]
  );
  if (!result) throw new ApiError(404, 'Coach not found');
  return { id };
};

export const deleteCoach = async (id) => {
  // Deleting the profile cascades to the coaches row (and everything tied to it) via FK.
  const result = await queryOne('delete from profiles where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Coach not found');
  return { id };
};
