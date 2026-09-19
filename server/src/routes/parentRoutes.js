import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as parentController from '../controllers/parentController.js';

const router = Router();

// Admin-only account management, same shape as coaches/admins.
router.use(requireAuth, requireRole('admin'));

const createValidators = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').optional({ checkFalsy: true }).isString(),
];

const updateValidators = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('A valid email is required'),
  body('phone').optional({ checkFalsy: true }).isString(),
];

router.get('/', parentController.listParents);
router.get('/:id', parentController.getParent);
router.post('/', createValidators, validate, parentController.createParent);
router.put('/:id', updateValidators, validate, parentController.updateParent);
router.patch('/:id/activate', parentController.activateParent);
router.patch('/:id/deactivate', parentController.deactivateParent);
router.patch(
  '/:id/password',
  [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')],
  validate,
  parentController.updateParentPassword
);
router.delete('/:id', parentController.deleteParent);

export default router;
