import { Router } from 'express';
import {
  sendMoney,
  getTransactions,
  getTransactionById,
} from './transaction.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { sendMoneySchema } from './transaction.validation';

const router = Router();

// Secure all transaction endpoints
router.use(authenticate);

router.post('/send', validate(sendMoneySchema), sendMoney);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);

export default router;
