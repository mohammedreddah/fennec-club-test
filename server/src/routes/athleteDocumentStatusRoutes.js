import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/athleteDocumentStatusController.js';

const router = Router();

router.use(requireAuth);

// Both admin and coach can view checklists (coach access is scoped inside the service)
router.get('/missing', controller.getAthletesWithMissingDocuments);
router.get('/athlete/:athleteId', controller.getChecklistForAthlete);

// Admin-only: full folders/documents x athletes matrix, used for the Excel export
router.get('/export-matrix', requireRole('admin'), controller.getExportMatrix);

// Both admin and coach can mark documents received/not received
router.post(
  '/',
  [
    body('athlete_id').isUUID().withMessage('A valid athlete is required'),
    body('document_requirement_id').isUUID().withMessage('A valid document requirement is required'),
    body('is_received').isBoolean().withMessage('is_received must be true or false'),
    body('note').optional({ checkFalsy: true }).isString(),
  ],
  validate,
  controller.markDocumentStatus
);

export default router;
