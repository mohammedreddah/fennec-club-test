import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

const createValidators = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone').optional({ checkFalsy: true }).isString(),
];

const updateValidators = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional({ checkFalsy: true }).isString(),
];

router.get('/', adminController.listAdmins);
router.get('/:id', adminController.getAdmin);
router.post('/', createValidators, validate, adminController.createAdmin);
router.put('/:id', updateValidators, validate, adminController.updateAdmin);
router.patch('/:id/activate', adminController.activateAdmin);
router.patch('/:id/deactivate', adminController.deactivateAdmin);
router.patch(
  '/:id/password',
  [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')],
  validate,
  adminController.updateAdminPassword
);
router.delete('/:id', adminController.deleteAdmin);

export default router;
