import { Router } from 'express';
import {
  register,
  login,
  verifyOtp,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
} from './auth.controller';
import { validate } from '../../middlewares/validation';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.validation';
import { authenticate } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimit';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/refresh-token', validate(refreshTokenSchema), refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
