import { query, queryOne, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';
import { getCoachCategoryIds } from './athleteService.js';

const SESSION_SELECT = `
  select
    s.*,
    json_build_object('id', cat.id, 'name', cat.name) as category,
    case when st.id is null then null else json_build_object('id', st.id, 'name', st.name) end as session_type,
    json_build_object(
      'id', c.id,
      'profile', json_build_object('full_name', p.full_name)
    ) as coach,
    coalesce(
      (select json_agg(
          json_build_object('id', co.id, 'full_name', cp.full_name) order by cp.full_name
        )
       from attendance_session_coaches sc
       join coaches co on co.id = sc.coach_id
       join profiles cp on cp.id = co.id
       where sc.session_id = s.id
      ), '[]'::json
    ) as additional_coaches,
    coalesce(
      (select json_agg(
          json_build_object(
            'id', r.id, 'athlete_id', r.athlete_id, 'status', r.status, 'note', r.note,
            'athlete', json_build_object('id', ath.id, 'first_name', ath.first_name, 'last_name', ath.last_name)
          ) order by ath.last_name
        )
       from attendance_records r
       join athletes ath on ath.id = r.athlete_id
       where r.session_id = s.id
      ), '[]'::json
    ) as records
  from attendance_sessions s
  join categories cat on cat.id = s.category_id
  join coaches c on c.id = s.coach_id
  join profiles p on p.id = c.id
  left join session_types st on st.id = s.session_type_id
`;

// Replaces the full set of additional (co-)coaches for a session. Doesn't
// touch attendance_sessions.coach_id (the owning/creating coach) - this is
// purely a record of who else was present, not an ownership change.
async function setAdditionalCoaches(client, sessionId, coachIds, ownerCoachId) {
  await client.query('delete from attendance_session_coaches where session_id = $1', [sessionId]);
  const uniqueIds = [...new Set((coachIds || []).filter((id) => id && id !== ownerCoachId))];
  for (const coachId of uniqueIds) {
    await client.query(
      'insert into attendance_session_coaches (session_id, coach_id) values ($1, $2)',
      [sessionId, coachId]
    );
  }
}

export const listSessions = async (requestingUser, { categoryId, coachId, dateFrom, dateTo } = {}) => {
  const conditions = [];
  const params = [];

  if (requestingUser.role === 'coach') {
    params.push(requestingUser.id);
    conditions.push(`s.coach_id = $${params.length}`);
  } else if (coachId) {
    params.push(coachId);
    conditions.push(`s.coach_id = $${params.length}`);
  }

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`s.category_id = $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`s.session_date >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo);
    conditions.push(`s.session_date <= $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  return query(`${SESSION_SELECT} ${where} order by s.session_date desc`, params);
};

export const getSessionById = async (requestingUser, id) => {
  const session = await queryOne(`${SESSION_SELECT} where s.id = $1`, [id]);
  if (!session) throw new ApiError(404, 'Attendance session not found');

  if (requestingUser.role === 'coach' && session.coach_id !== requestingUser.id) {
    throw new ApiError(403, 'You do not have access to this attendance session');
  }
  return session;
};

// Creates a session and its attendance records in one transaction.
// records: [{ athlete_id, status, note }]
// additional_coach_ids: string[] - other coaches present, recorded alongside
// the creating coach; they do not gain edit rights over the session.
export const createSessionWithRecords = async (
  requestingUser,
  { category_id, session_date, session_type_id, note, records, additional_coach_ids }
) => {
  if (requestingUser.role === 'coach') {
    const categoryIds = await getCoachCategoryIds(requestingUser.id);
    if (!categoryIds.includes(category_id)) {
      throw new ApiError(403, 'You are not assigned to this category');
    }
  }

  const sessionId = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into attendance_sessions (category_id, session_date, coach_id, session_type_id, note)
       values ($1, coalesce($2, current_date), $3, $4, $5)
       returning id`,
      [category_id, session_date || null, requestingUser.id, session_type_id || null, note || null]
    );
    const newId = rows[0].id;

    if (Array.isArray(records) && records.length > 0) {
      for (const r of records) {
        await client.query(
          'insert into attendance_records (session_id, athlete_id, status, note) values ($1, $2, $3, $4)',
          [newId, r.athlete_id, r.status, r.note || null]
        );
      }
    }

    if (Array.isArray(additional_coach_ids)) {
      await setAdditionalCoaches(client, newId, additional_coach_ids, requestingUser.id);
    }

    return newId;
  });

  return getSessionById(requestingUser, sessionId);
};

export const updateSession = async (
  requestingUser,
  id,
  { session_date, session_type_id, note, records, additional_coach_ids }
) => {
  const existing = await getSessionById(requestingUser, id);

  await withTransaction(async (client) => {
    const sets = [];
    const params = [id];
    if (session_date !== undefined) {
      params.push(session_date);
      sets.push(`session_date = $${params.length}`);
    }
    if (session_type_id !== undefined) {
      params.push(session_type_id || null);
      sets.push(`session_type_id = $${params.length}`);
    }
    if (note !== undefined) {
      params.push(note);
      sets.push(`note = $${params.length}`);
    }
    if (sets.length > 0) {
      await client.query(`update attendance_sessions set ${sets.join(', ')} where id = $1`, params);
    }

    if (Array.isArray(records)) {
      // Upsert each record individually to respect the unique(session_id, athlete_id)
      // constraint and update existing statuses rather than duplicating rows.
      for (const r of records) {
        await client.query(
          `insert into attendance_records (session_id, athlete_id, status, note)
           values ($1, $2, $3, $4)
           on conflict (session_id, athlete_id)
           do update set status = excluded.status, note = excluded.note`,
          [id, r.athlete_id, r.status, r.note || null]
        );
      }
    }

    if (Array.isArray(additional_coach_ids)) {
      await setAdditionalCoaches(client, id, additional_coach_ids, existing.coach_id);
    }
  });

  return getSessionById(requestingUser, existing.id);
};

export const deleteSession = async (requestingUser, id) => {
  await getSessionById(requestingUser, id);
  await queryOne('delete from attendance_sessions where id = $1 returning id', [id]);
  return { id };
};
