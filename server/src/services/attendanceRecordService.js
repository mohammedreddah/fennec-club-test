import { queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

const RECORD_SELECT = `
  select
    r.*,
    json_build_object('id', ath.id, 'first_name', ath.first_name, 'last_name', ath.last_name) as athlete,
    json_build_object('id', s.id, 'coach_id', s.coach_id, 'category_id', s.category_id, 'session_date', s.session_date) as session
  from attendance_records r
  join athletes ath on ath.id = r.athlete_id
  join attendance_sessions s on s.id = r.session_id
`;

const assertRecordAccess = (requestingUser, record) => {
  if (requestingUser.role === 'admin') return;
  if (record.session.coach_id !== requestingUser.id) {
    throw new ApiError(403, 'You do not have access to this attendance record');
  }
};

export const createRecord = async (requestingUser, { session_id, athlete_id, status, note }) => {
  const session = await queryOne('select id, coach_id from attendance_sessions where id = $1', [session_id]);
  if (!session) throw new ApiError(404, 'Attendance session not found');
  if (requestingUser.role === 'coach' && session.coach_id !== requestingUser.id) {
    throw new ApiError(403, 'You do not have access to this attendance session');
  }

  try {
    const row = await queryOne(
      'insert into attendance_records (session_id, athlete_id, status, note) values ($1, $2, $3, $4) returning id',
      [session_id, athlete_id, status, note || null]
    );
    return queryOne(`${RECORD_SELECT} where r.id = $1`, [row.id]);
  } catch (err) {
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const updateRecord = async (requestingUser, id, { status, note }) => {
  const existing = await queryOne(`${RECORD_SELECT} where r.id = $1`, [id]);
  if (!existing) throw new ApiError(404, 'Attendance record not found');
  assertRecordAccess(requestingUser, existing);

  const sets = [];
  const params = [id];
  if (status !== undefined) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (note !== undefined) {
    params.push(note);
    sets.push(`note = $${params.length}`);
  }
  if (sets.length === 0) return existing;

  await queryOne(`update attendance_records set ${sets.join(', ')} where id = $1 returning id`, params);
  return queryOne(`${RECORD_SELECT} where r.id = $1`, [id]);
};

export const deleteRecord = async (requestingUser, id) => {
  const existing = await queryOne(`${RECORD_SELECT} where r.id = $1`, [id]);
  if (!existing) throw new ApiError(404, 'Attendance record not found');
  assertRecordAccess(requestingUser, existing);

  await queryOne('delete from attendance_records where id = $1 returning id', [id]);
  return { id };
};
