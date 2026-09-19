import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as categoryController from '../controllers/categoryController.js';

const router = Router();

router.use(requireAuth);

router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategory);

router.post(
  '/',
  requireRole('admin'),
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  categoryController.createCategory
);

router.put(
  '/:id',
  requireRole('admin'),
  [body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty')],
  validate,
  categoryController.updateCategory
);

router.delete('/:id', requireRole('admin'), categoryController.deleteCategory);

export default router;
