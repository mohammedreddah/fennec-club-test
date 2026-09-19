import { query, queryOne, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export const getAthletesForParent = async (parentId) => {
  return query(
    `select a.*, json_build_object('id', cat.id, 'name', cat.name) as category
     from parent_athletes pa
     join athletes a on a.id = pa.athlete_id
     left join categories cat on cat.id = a.category_id
     where pa.parent_id = $1
     order by a.first_name`,
    [parentId]
  );
};

export const getParentsForAthlete = async (athleteId) => {
  return query(
    `select
       pr.id, pr.phone,
       json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) as profile
     from parent_athletes pa
     join parents pr on pr.id = pa.parent_id
     join profiles p on p.id = pr.id
     where pa.athlete_id = $1
     order by p.full_name`,
    [athleteId]
  );
};

// Replaces the full set of athletes linked to a parent.
export const setParentAthletes = async (parentId, athleteIds) => {
  try {
    await withTransaction(async (client) => {
      await client.query('delete from parent_athletes where parent_id = $1', [parentId]);
      for (const athleteId of athleteIds) {
        await client.query(
          'insert into parent_athletes (parent_id, athlete_id) values ($1, $2)',
          [parentId, athleteId]
        );
      }
    });
  } catch (err) {
    throw new ApiError(400, err.detail || err.message);
  }
  return getAthletesForParent(parentId);
};

// Throws 403 unless the given parent is linked to the given athlete. Every
// parent-portal read (attendance, documents, coach info) must call this
// first - it's the entire security boundary keeping a parent from viewing
// any child but their own.
export const assertParentOwnsAthlete = async (parentId, athleteId) => {
  const link = await queryOne(
    'select id from parent_athletes where parent_id = $1 and athlete_id = $2',
    [parentId, athleteId]
  );
  if (!link) throw new ApiError(403, 'You do not have access to this athlete');
};

export const getAthleteForParent = async (parentId, athleteId) => {
  await assertParentOwnsAthlete(parentId, athleteId);
  const athlete = await queryOne(
    `select a.*, json_build_object('id', cat.id, 'name', cat.name) as category
     from athletes a
     left join categories cat on cat.id = a.category_id
     where a.id = $1`,
    [athleteId]
  );
  if (!athlete) throw new ApiError(404, 'Athlete not found');
  return athlete;
};

export const getAttendanceForParent = async (parentId, athleteId) => {
  await assertParentOwnsAthlete(parentId, athleteId);
  return query(
    `select
       r.id, r.status, r.note as record_note,
       s.session_date, s.note as session_note,
       json_build_object('id', cat.id, 'name', cat.name) as category,
       case when st.id is null then null else json_build_object('id', st.id, 'name', st.name) end as session_type,
       cp.full_name as coach_name,
       coalesce(
         (select json_agg(acp.full_name order by acp.full_name)
          from attendance_session_coaches sc
          join coaches ac on ac.id = sc.coach_id
          join profiles acp on acp.id = ac.id
          where sc.session_id = s.id
         ), '[]'::json
       ) as additional_coach_names
     from attendance_records r
     join attendance_sessions s on s.id = r.session_id
     join categories cat on cat.id = s.category_id
     left join session_types st on st.id = s.session_type_id
     join coaches c on c.id = s.coach_id
     join profiles cp on cp.id = c.id
     where r.athlete_id = $1
     order by s.session_date desc`,
    [athleteId]
  );
};

export const getDocumentsForParent = async (parentId, athleteId) => {
  await assertParentOwnsAthlete(parentId, athleteId);

  const folders = await query('select * from document_folders order by display_order');
  const requirements = await query('select * from document_requirements order by display_order');
  const statuses = await query(
    `select ads.*, json_build_object('id', p.id, 'full_name', p.full_name) as marked_by_coach
     from athlete_document_status ads
     left join coaches c on c.id = ads.marked_by
     left join profiles p on p.id = c.id
     where ads.athlete_id = $1`,
    [athleteId]
  );

  const statusByRequirement = new Map(statuses.map((s) => [s.document_requirement_id, s]));

  return folders
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      display_order: folder.display_order,
      documents: requirements
        .filter((r) => r.folder_id === folder.id)
        .map((doc) => ({
          requirement: doc,
          status: statusByRequirement.get(doc.id) || {
            is_received: false,
            marked_at: null,
            marked_by_coach: null,
            note: null,
          },
        })),
    }))
    .sort((a, b) => a.display_order - b.display_order);
};

export const getCoachesForParent = async (parentId, athleteId) => {
  await assertParentOwnsAthlete(parentId, athleteId);
  const athlete = await queryOne('select category_id from athletes where id = $1', [athleteId]);
  if (!athlete?.category_id) return [];

  return query(
    `select
       c.id, c.phone, c.specialty,
       json_build_object('id', p.id, 'full_name', p.full_name) as profile
     from coach_categories cc
     join coaches c on c.id = cc.coach_id
     join profiles p on p.id = c.id
     where cc.category_id = $1
     order by p.full_name`,
    [athlete.category_id]
  );
};
