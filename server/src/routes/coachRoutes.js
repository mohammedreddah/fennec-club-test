import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as coachController from '../controllers/coachController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

const createValidators = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('specialty').optional({ checkFalsy: true }).isString(),
];

const updateValidators = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('A valid email is required'),
  body('phone').optional({ checkFalsy: true }).isString(),
  body('specialty').optional({ checkFalsy: true }).isString(),
];

router.get('/', coachController.listCoaches);
router.get('/:id', coachController.getCoach);
router.post('/', createValidators, validate, coachController.createCoach);
router.put('/:id', updateValidators, validate, coachController.updateCoach);
router.patch('/:id/activate', coachController.activateCoach);
router.patch('/:id/deactivate', coachController.deactivateCoach);
router.patch(
  '/:id/password',
  [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')],
  validate,
  coachController.updateCoachPassword
);
router.delete('/:id', coachController.deleteCoach);

export default router;
