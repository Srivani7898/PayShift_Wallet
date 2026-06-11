import { Router } from 'express';
import { generateQRPayload, payByQR } from './qr.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { qrPaySchema } from './qr.validation';

const router = Router();

// Secure all QR routes
router.use(authenticate);

router.get('/generate', generateQRPayload);
router.post('/pay', validate(qrPaySchema), payByQR);

export default router;
