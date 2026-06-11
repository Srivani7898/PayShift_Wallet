import { Router } from 'express';
import { getKYCStatus, submitKYC } from './kyc.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { submitKYCSchema } from './kyc.validation';

const router = Router();

// Secure all KYC endpoints
router.use(authenticate);

router.get('/status', getKYCStatus);
router.post('/submit', validate(submitKYCSchema), submitKYC);

export default router;
