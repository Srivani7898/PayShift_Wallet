import { Router } from 'express';
import { getSpendingAnalytics } from './analytics.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Secure all analytics routes
router.use(authenticate);

router.get('/spending', getSpendingAnalytics);

export default router;
