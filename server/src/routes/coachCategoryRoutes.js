import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/coachCategoryController.js';

const router = Router();

router.use(requireAuth);

// Coach: view my own assigned categories
router.get('/my-categories', requireRole('coach'), controller.getMyCategories);

// Admin: view / assign
router.get('/coach/:coachId', requireRole('admin'), controller.getCategoriesForCoach);

// Admin sees any category's coaches; a coach may only look up categories
// assigned to themselves (enforced in the controller) - needed so a coach
// can pick co-coaches to record as present for a session.
router.get('/category/:categoryId', controller.getCoachesForCategory);
router.put(
  '/coach/:coachId',
  requireRole('admin'),
  [body('categoryIds').isArray().withMessage('categoryIds must be an array of category IDs')],
  validate,
  controller.setCoachCategories
);

export default router;
