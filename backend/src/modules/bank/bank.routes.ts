import { Router } from 'express';
import {
  getBankAccounts,
  linkBankAccount,
  unlinkBankAccount,
  setPrimaryBankAccount,
} from './bank.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { linkBankAccountSchema } from './bank.validation';

const router = Router();

// Secure all bank endpoints
router.use(authenticate);

router.get('/', getBankAccounts);
router.post('/', validate(linkBankAccountSchema), linkBankAccount);
router.delete('/:id', unlinkBankAccount);
router.put('/:id/primary', setPrimaryBankAccount);

export default router;
