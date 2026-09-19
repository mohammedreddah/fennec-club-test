import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import * as folderController from '../controllers/folderController.js';

const router = Router();

router.use(requireAuth);

router.get('/', folderController.listFolders);
router.get('/:id', folderController.getFolder);

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Folder name is required'),
    body('display_order').optional().isInt(),
  ],
  validate,
  folderController.createFolder
);

router.put(
  '/:id',
  requireRole('admin'),
  [body('name').optional().trim().notEmpty(), body('display_order').optional().isInt()],
  validate,
  folderController.updateFolder
);

router.delete('/:id', requireRole('admin'), folderController.deleteFolder);

export default router;
