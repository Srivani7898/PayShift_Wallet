import request from 'supertest';
import app from '../app';
import prisma from '../database';
import { generateAccessToken } from '../utils';

// Mock database
jest.mock('../database', () => {
  const mockDb: any = {
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  mockDb.$transaction = jest.fn();

  return {
    __esModule: true,
    default: mockDb,
    prisma: mockDb,
  };
});

describe('Wallet Module APIs', () => {
  const token = generateAccessToken({ userId: 1, role: 'USER' });

  beforeEach(() => {
    jest.clearAllMocks();
    // Configure $transaction mock implementation
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      return callback(prisma);
    });
  });

  describe('GET /api/wallet', () => {
    it('should return wallet details for authenticated user', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        balance: 15000.50,
        lockedBalance: 0.00,
        currency: 'INR',
      });

      const response = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(15000.50);
      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should throw UnauthorizedError when no token is provided', async () => {
      const response = await request(app).get('/api/wallet');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/wallet/add-money', () => {
    it('should add money to wallet successfully', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.wallet.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        balance: 100.00,
      });
      mockPrisma.wallet.update.mockResolvedValue({
        id: 1,
        userId: 1,
        balance: 600.00,
      });
      mockPrisma.transaction.create.mockResolvedValue({
        id: 10,
        referenceNumber: 'TXN12345',
        amount: 500.00,
        transactionType: 'ADD_MONEY',
      });
      mockPrisma.notification.create.mockResolvedValue({
        id: 100,
        title: 'Money Added',
      });

      const response = await request(app)
        .post('/api/wallet/add-money')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 500.00 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(600.00);
      expect(mockPrisma.wallet.update).toHaveBeenCalled();
    });

    it('should validate recharge amount and fail if amount is negative', async () => {
      const response = await request(app)
        .post('/api/wallet/add-money')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: -10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
