import { Router } from 'express';
import {
  getUPIIds,
  createUPIId,
  deleteUPIId,
  setPrimaryUPIId,
} from './upi.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { createUPISchema } from './upi.validation';

const router = Router();

// Secure all UPI endpoints
router.use(authenticate);

router.get('/', getUPIIds);
router.post('/', validate(createUPISchema), createUPIId);
router.delete('/:id', deleteUPIId);
router.put('/:id/primary', setPrimaryUPIId);

export default router;
