import { query, queryOne } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export const listFolders = async () => {
  const folders = await query('select * from document_folders order by display_order');
  const requirements = await query('select * from document_requirements order by display_order');
  return folders.map((folder) => ({
    ...folder,
    documents: requirements.filter((r) => r.folder_id === folder.id),
  }));
};

export const getFolderById = async (id) => {
  const folder = await queryOne('select * from document_folders where id = $1', [id]);
  if (!folder) throw new ApiError(404, 'Folder not found');
  folder.documents = await query(
    'select * from document_requirements where folder_id = $1 order by display_order',
    [id]
  );
  return folder;
};

export const createFolder = async ({ name, description, display_order }) => {
  try {
    return await queryOne(
      'insert into document_folders (name, description, display_order) values ($1, $2, $3) returning *',
      [name, description || null, display_order ?? 0]
    );
  } catch (err) {
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const updateFolder = async (id, { name, description, display_order }) => {
  const sets = [];
  const params = [id];
  for (const [key, value] of Object.entries({ name, description, display_order })) {
    if (value !== undefined) {
      params.push(value);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (sets.length === 0) return getFolderById(id);

  try {
    const folder = await queryOne(
      `update document_folders set ${sets.join(', ')} where id = $1 returning *`,
      params
    );
    if (!folder) throw new ApiError(404, 'Folder not found');
    return folder;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.code === '23505' ? 409 : 400, err.detail || err.message);
  }
};

export const deleteFolder = async (id) => {
  const result = await queryOne('delete from document_folders where id = $1 returning id', [id]);
  if (!result) throw new ApiError(404, 'Folder not found');
  return { id };
};
