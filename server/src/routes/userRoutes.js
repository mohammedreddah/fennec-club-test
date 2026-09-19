import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);

export default router;
