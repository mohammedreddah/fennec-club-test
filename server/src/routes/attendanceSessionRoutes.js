import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/attendanceSessionController.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.listSessions);
router.get('/:id', controller.getSession);

router.post(
  '/',
  [
    body('category_id').isUUID().withMessage('A valid category is required'),
    body('session_date').optional().isISO8601(),
    body('session_type_id').optional({ checkFalsy: true }).isUUID().withMessage('Session type must be valid'),
    body('note').optional({ checkFalsy: true }).isString(),
    body('records').isArray({ min: 1 }).withMessage('At least one attendance record is required'),
    body('records.*.athlete_id').isUUID().withMessage('Each record needs a valid athlete_id'),
    body('records.*.status').isIn(['present', 'absent']).withMessage('Status must be present or absent'),
    body('additional_coach_ids').optional().isArray().withMessage('additional_coach_ids must be an array'),
    body('additional_coach_ids.*').optional().isUUID().withMessage('Each additional coach must be a valid coach'),
  ],
  validate,
  controller.createSession
);

router.put(
  '/:id',
  [
    body('session_date').optional().isISO8601(),
    body('session_type_id').optional({ checkFalsy: true }).isUUID().withMessage('Session type must be valid'),
    body('note').optional({ checkFalsy: true }).isString(),
    body('records').optional().isArray(),
    body('additional_coach_ids').optional().isArray().withMessage('additional_coach_ids must be an array'),
    body('additional_coach_ids.*').optional().isUUID().withMessage('Each additional coach must be a valid coach'),
  ],
  validate,
  controller.updateSession
);

router.delete('/:id', controller.deleteSession);

export default router;
