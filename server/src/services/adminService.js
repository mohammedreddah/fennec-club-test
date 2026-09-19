import { query, queryOne, withTransaction } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { ApiError } from '../utils/apiResponse.js';

const ADMIN_SELECT = `
  select
    a.id, a.phone, a.created_at, a.updated_at,
    json_build_object(
      'id', p.id, 'email', p.email, 'full_name', p.full_name,
      'role', p.role, 'is_active', p.is_active,
      'created_at', p.created_at, 'updated_at', p.updated_at
    ) as profile
  from admins a
  join profiles p on p.id = a.id
`;

export const listAdmins = async () => {
  return query(`${ADMIN_SELECT} order by a.created_at desc`);
};

export const getAdminById = async (id) => {
  const admin = await queryOne(`${ADMIN_SELECT} where a.id = $1`, [id]);
  if (!admin) throw new ApiError(404, 'Admin not found');
  return admin;
};

export const createAdmin = async ({ email, password, fullName, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await queryOne('select id from profiles where email = $1', [normalizedEmail]);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(password);

  const id = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into profiles (email, password_hash, full_name, role, is_active)
       values ($1, $2, $3, 'admin', true) returning id`,
      [normalizedEmail, passwordHash, fullName]
    );
    const newId = rows[0].id;

    await client.query('insert into admins (id, phone) values ($1, $2)', [newId, phone || null]);

    return newId;
  });

  return getAdminById(id);
};

export const updateAdmin = async (id, { fullName, phone }) => {
  await withTransaction(async (client) => {
    if (fullName !== undefined) {
      await client.query('update profiles set full_name = $2 where id = $1', [id, fullName]);
    }
    if (phone !== undefined) {
      await client.query('update admins set phone = $2 where id = $1', [id, phone]);
    }
  });
  return getAdminById(id);
};

export const setAdminActive = async (id, isActive) => {
  const result = await queryOne('update profiles set is_active = $2 where id = $1 returning id', [id, isActive]);
  if (!result) throw new ApiError(404, 'Admin not found');
  return getAdminById(id);
};

export const updateAdminPassword = async (id, newPassword) => {
  const passwordHash = await hashPassword(newPassword);
  const result = await queryOne(
    'update profiles set password_hash = $2 where id = $1 returning id',
    [id, passwordHash]
  );
  if (!result) throw new ApiError(404, 'Admin not found');
  return { id };
};

export const deleteAdmin = async (id, requestingAdminId) => {
  if (id === requestingAdminId) {
    throw new ApiError(400, 'You cannot delete your own admin account while logged in as it');
  }
  const result = await queryOne('delete from profiles where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Admin not found');
  return { id };
};
