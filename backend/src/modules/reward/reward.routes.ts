import { Router } from 'express';
import { getRewards, claimReward } from './reward.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Secure all reward routes
router.use(authenticate);

router.get('/', getRewards);
router.post('/:id/claim', claimReward);

export default router;
