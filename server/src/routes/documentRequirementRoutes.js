import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/documentRequirementController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.post(
  '/',
  [
    body('folder_id').isUUID().withMessage('A valid folder is required'),
    body('name').trim().notEmpty().withMessage('Document name is required'),
    body('display_order').optional().isInt(),
  ],
  validate,
  controller.createRequirement
);

router.put(
  '/:id',
  [body('name').optional().trim().notEmpty(), body('display_order').optional().isInt()],
  validate,
  controller.updateRequirement
);

router.delete('/:id', controller.deleteRequirement);

export default router;
