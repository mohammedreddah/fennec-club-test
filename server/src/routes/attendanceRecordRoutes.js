import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/attendanceRecordController.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  [
    body('session_id').isUUID().withMessage('A valid session is required'),
    body('athlete_id').isUUID().withMessage('A valid athlete is required'),
    body('status').isIn(['present', 'absent']).withMessage('Status must be present or absent'),
    body('note').optional({ checkFalsy: true }).isString(),
  ],
  validate,
  controller.createRecord
);

router.put(
  '/:id',
  [
    body('status').optional().isIn(['present', 'absent']),
    body('note').optional({ checkFalsy: true }).isString(),
  ],
  validate,
  controller.updateRecord
);

router.delete('/:id', controller.deleteRecord);

export default router;
