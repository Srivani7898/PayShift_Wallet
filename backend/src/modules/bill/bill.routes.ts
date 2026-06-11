import { Router } from 'express';
import { getBillPayments, payBill } from './bill.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { payBillSchema } from './bill.validation';

const router = Router();

// Secure all bill routes
router.use(authenticate);

router.get('/', getBillPayments);
router.post('/', validate(payBillSchema), payBill);

export default router;
