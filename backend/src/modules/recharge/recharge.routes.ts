import { Router } from 'express';
import { getRechargeHistory, performRecharge } from './recharge.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { performRechargeSchema } from './recharge.validation';

const router = Router();

// Secure all recharge routes
router.use(authenticate);

router.get('/', getRechargeHistory);
router.post('/', validate(performRechargeSchema), performRecharge);

export default router;
