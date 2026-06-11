import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAccount,
  getDashboardData,
} from './user.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { updateProfileSchema, updateAvatarSchema } from './user.validation';

const router = Router();

// Secure all user profile endpoints
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/avatar', validate(updateAvatarSchema), updateAvatar);
router.delete('/account', deleteAccount);
router.get('/dashboard', getDashboardData);

export default router;
