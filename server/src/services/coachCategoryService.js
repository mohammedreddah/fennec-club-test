import { query, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export const getCategoriesForCoach = async (coachId) => {
  return query(
    `select cat.* from coach_categories cc
     join categories cat on cat.id = cc.category_id
     where cc.coach_id = $1
     order by cat.name`,
    [coachId]
  );
};

export const getCoachesForCategory = async (categoryId) => {
  return query(
    `select
       c.id, c.phone, c.specialty,
       json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) as profile
     from coach_categories cc
     join coaches c on c.id = cc.coach_id
     join profiles p on p.id = c.id
     where cc.category_id = $1
     order by p.full_name`,
    [categoryId]
  );
};

// Replaces the full set of category assignments for a coach with categoryIds.
export const setCoachCategories = async (coachId, categoryIds) => {
  try {
    await withTransaction(async (client) => {
      await client.query('delete from coach_categories where coach_id = $1', [coachId]);
      for (const categoryId of categoryIds) {
        await client.query(
          'insert into coach_categories (coach_id, category_id) values ($1, $2)',
          [coachId, categoryId]
        );
      }
    });
  } catch (err) {
    throw new ApiError(400, err.detail || err.message);
  }
  return getCategoriesForCoach(coachId);
};
