import { Router } from 'express';
import {
  getAllUsers,
  toggleUserBlock,
  getPendingKYCs,
  verifyKYC,
} from './admin.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/admin';
import { validate } from '../../middlewares/validation';
import { verifyKYCSchema } from './admin.validation';

const router = Router();

// Secure all admin routes to authenticated administrators
router.use(authenticate);
router.use(requireAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleUserBlock);
router.get('/kyc/pending', getPendingKYCs);
router.put('/kyc/:id/verify', validate(verifyKYCSchema), verifyKYC);

export default router;
