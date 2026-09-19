import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().withMessage('A valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  authController.login
);

router.post('/logout', authController.logout);

router.get('/me', requireAuth, authController.me);

export default router;
