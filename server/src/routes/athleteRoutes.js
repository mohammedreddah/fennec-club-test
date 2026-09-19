import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as athleteController from '../controllers/athleteController.js';

const router = Router();

router.use(requireAuth);

// Admin and coach can both read (coach results are scoped server-side to their categories)
router.get('/', athleteController.listAthletes);
router.get('/:id', athleteController.getAthlete);

// Builds a fresh, independent set of validator chains each time it's called.
// Express-validator chains are mutable builder objects - reusing the *same*
// chain instances between routes (e.g. via `.map(v => v.optional())`) mutates
// them in place, so a setting applied for one route (like category_id's
// checkFalsy option here) can silently leak into or get overwritten by
// another route that reuses the same array. A factory function avoids that
// entirely by giving each route its own chains to configure.
function buildAthleteValidators({ partial } = {}) {
  const opt = (chain) => (partial ? chain.optional() : chain);

  return [
    opt(body('first_name')).trim().notEmpty().withMessage('First name is required'),
    opt(body('last_name')).trim().notEmpty().withMessage('Last name is required'),
    opt(body('date_of_birth')).isISO8601().withMessage('A valid date of birth is required'),
    opt(body('gender')).isIn(['male', 'female']).withMessage('Gender must be male or female'),
    opt(body('guardian_name')).trim().notEmpty().withMessage('Guardian name is required'),
    opt(body('guardian_phone'))
      .matches(/^[0-9]{10}$/)
      .withMessage('Parent phone number must be exactly 10 digits'),
    body('category_id').optional({ checkFalsy: true }).isUUID().withMessage('Category must be a valid category'),
    body('phone_number')
      .optional({ checkFalsy: true })
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone number must be exactly 10 digits'),
    body('address').optional({ checkFalsy: true }).isString(),
  ];
}

router.post('/', requireRole('admin'), buildAthleteValidators(), validate, athleteController.createAthlete);
router.put(
  '/:id',
  requireRole('admin'),
  buildAthleteValidators({ partial: true }),
  validate,
  athleteController.updateAthlete
);
router.delete('/:id', requireRole('admin'), athleteController.deleteAthlete);

export default router;
