import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/sessionTypeController.js';

const router = Router();

router.use(requireAuth);

// Readable by any authenticated user (coaches need the list to start a session), writable by admin only
router.get('/', controller.listSessionTypes);
router.get('/:id', controller.getSessionType);

router.post(
  '/',
  requireRole('admin'),
  [body('name').trim().notEmpty().withMessage('Session type name is required'), body('display_order').optional().isInt()],
  validate,
  controller.createSessionType
);

router.put(
  '/:id',
  requireRole('admin'),
  [body('name').optional().trim().notEmpty(), body('display_order').optional().isInt()],
  validate,
  controller.updateSessionType
);

router.delete('/:id', requireRole('admin'), controller.deleteSessionType);

export default router;
