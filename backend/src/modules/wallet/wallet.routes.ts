import { Router } from 'express';
import {
  getWallet,
  addMoney,
  withdrawMoney,
  getHistory,
} from './wallet.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { addMoneySchema, withdrawSchema } from './wallet.validation';

const router = Router();

// Secure all wallet endpoints
router.use(authenticate);

router.get('/', getWallet);
router.post('/add-money', validate(addMoneySchema), addMoney);
router.post('/withdraw', validate(withdrawSchema), withdrawMoney);
router.get('/history', getHistory);

export default router;
