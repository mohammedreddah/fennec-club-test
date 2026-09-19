import { query, queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';
import { getAthleteById } from './athleteService.js';

// Builds the full checklist for an athlete: every document requirement across
// every folder, with its status row if one exists (missing = not received).
export const getChecklistForAthlete = async (requestingUser, athleteId) => {
  await getAthleteById(requestingUser, athleteId); // enforces access + existence

  const folders = await query('select * from document_folders order by display_order');
  const requirements = await query('select * from document_requirements order by display_order');
  const statuses = await query('select * from athlete_document_status where athlete_id = $1', [athleteId]);

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
            id: null,
            is_received: false,
            marked_by: null,
            marked_at: null,
            note: null,
          },
        })),
    }))
    .sort((a, b) => a.display_order - b.display_order);
};

// Athletes with at least one missing document, used on the dashboards.
export const getAthletesWithMissingDocuments = async (requestingUser) => {
  const requirements = await query('select id from document_requirements');
  const totalRequired = requirements.length;
  if (totalRequired === 0) return [];

  let athletes;
  if (requestingUser.role === 'coach') {
    const cats = await query('select category_id from coach_categories where coach_id = $1', [requestingUser.id]);
    const categoryIds = cats.map((c) => c.category_id);
    if (categoryIds.length === 0) return [];
    athletes = await query(
      'select id, first_name, last_name, category_id from athletes where is_active = true and category_id = any($1::uuid[])',
      [categoryIds]
    );
  } else {
    athletes = await query('select id, first_name, last_name, category_id from athletes where is_active = true');
  }

  if (athletes.length === 0) return [];

  const statuses = await query(
    'select athlete_id, is_received from athlete_document_status where athlete_id = any($1::uuid[])',
    [athletes.map((a) => a.id)]
  );

  const receivedCountByAthlete = new Map();
  for (const s of statuses) {
    if (s.is_received) {
      receivedCountByAthlete.set(s.athlete_id, (receivedCountByAthlete.get(s.athlete_id) || 0) + 1);
    }
  }

  return athletes.filter((a) => (receivedCountByAthlete.get(a.id) || 0) < totalRequired);
};

// Builds the full folders -> documents -> per-athlete status matrix in two
// queries (instead of one call per athlete), for the admin "export to Excel"
// feature. Scales to any number of folders and any number of documents per
// folder — the caller (frontend) turns "folders" into columns and "athletes"
// into rows dynamically, so adding a new folder or document later needs no
// code change here or on the frontend.
export const getExportMatrix = async () => {
  const folders = await query('select * from document_folders order by display_order');
  const requirements = await query('select * from document_requirements order by display_order');
  const athletes = await query(`
    select a.id, a.first_name, a.last_name, cat.name as category_name
    from athletes a
    join categories cat on cat.id = a.category_id
    where a.is_active = true
    order by a.last_name, a.first_name
  `);
  const statuses = await query('select athlete_id, document_requirement_id, is_received from athlete_document_status');

  const statusMap = new Map(); // `${athleteId}:${requirementId}` -> is_received
  for (const s of statuses) {
    statusMap.set(`${s.athlete_id}:${s.document_requirement_id}`, s.is_received);
  }

  const foldersWithDocs = folders
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      display_order: folder.display_order,
      documents: requirements
        .filter((r) => r.folder_id === folder.id)
        .sort((a, b) => a.display_order - b.display_order),
    }))
    .sort((a, b) => a.display_order - b.display_order);

  const athletesWithStatuses = athletes.map((a) => ({
    id: a.id,
    first_name: a.first_name,
    last_name: a.last_name,
    category_name: a.category_name,
    statuses: requirements.reduce((acc, req) => {
      acc[req.id] = statusMap.get(`${a.id}:${req.id}`) || false;
      return acc;
    }, {}),
  }));

  return { folders: foldersWithDocs, athletes: athletesWithStatuses };
};

// Upserts the received/not-received status for one athlete/document pair.
export const markDocumentStatus = async (requestingUser, { athlete_id, document_requirement_id, is_received, note }) => {
  await getAthleteById(requestingUser, athlete_id); // enforces access + existence

  const markedBy = requestingUser.role === 'coach' ? requestingUser.id : null;

  try {
    return await queryOne(
      `insert into athlete_document_status
         (athlete_id, document_requirement_id, is_received, marked_by, marked_at, note)
       values ($1, $2, $3, $4, now(), $5)
       on conflict (athlete_id, document_requirement_id)
       do update set
         is_received = excluded.is_received,
         marked_by = excluded.marked_by,
         marked_at = excluded.marked_at,
         note = excluded.note
       returning *`,
      [athlete_id, document_requirement_id, is_received, markedBy, note ?? null]
    );
  } catch (err) {
    throw new ApiError(400, err.detail || err.message);
  }
};
