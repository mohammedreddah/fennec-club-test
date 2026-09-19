import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as controller from '../controllers/parentAthleteController.js';

const router = Router();

router.use(requireAuth);

// Parent portal - every route here is scoped to req.user.id inside the
// service layer (assertParentOwnsAthlete), so a parent can never reach
// another family's data by guessing an athlete id.
router.get('/my-athletes', requireRole('parent'), controller.getMyAthletes);
router.get('/my-athletes/:athleteId', requireRole('parent'), controller.getMyAthleteDetail);
router.get('/my-athletes/:athleteId/attendance', requireRole('parent'), controller.getMyAthleteAttendance);
router.get('/my-athletes/:athleteId/documents', requireRole('parent'), controller.getMyAthleteDocuments);
router.get('/my-athletes/:athleteId/coaches', requireRole('parent'), controller.getMyAthleteCoaches);

// Admin: manage which athletes a parent account is linked to
router.get('/parent/:parentId', requireRole('admin'), controller.getAthletesForParent);
router.get('/athlete/:athleteId', requireRole('admin'), controller.getParentsForAthlete);
router.put(
  '/parent/:parentId',
  requireRole('admin'),
  [body('athleteIds').isArray().withMessage('athleteIds must be an array of athlete IDs')],
  validate,
  controller.setParentAthletes
);

export default router;
