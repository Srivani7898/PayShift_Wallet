import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { limiter } from './middlewares/rateLimit';
import errorHandler from './middlewares/error';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import transactionRoutes from './modules/transaction/transaction.routes';
import bankRoutes from './modules/bank/bank.routes';
import upiRoutes from './modules/upi/upi.routes';
import qrRoutes from './modules/qr/qr.routes';
import rechargeRoutes from './modules/recharge/recharge.routes';
import billRoutes from './modules/bill/bill.routes';
import notificationRoutes from './modules/notification/notification.routes';
import rewardRoutes from './modules/reward/reward.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import adminRoutes from './modules/admin/admin.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: '*' })); // Allow all client connections for the testing sandbox
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rate limiter
app.use('/api', limiter);

// Base route registers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bank-accounts', bankRoutes);
app.use('/api/upi', upiRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    service: 'PayShift Backend Services',
  });
});

// Global error handler middleware
app.use(errorHandler);

export default app;
