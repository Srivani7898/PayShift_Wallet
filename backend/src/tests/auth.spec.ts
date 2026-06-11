import request from 'supertest';
import app from '../app';
import bcrypt from 'bcryptjs';
import prisma from '../database';

jest.mock('../database', () => {
  const mockDb: any = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    wallet: {
      create: jest.fn(),
    },
    bankAccount: {
      create: jest.fn(),
    },
    uPIId: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  mockDb.$transaction = jest.fn(async (callback) => {
    const res = await callback(mockDb);
    console.log('--- Mock transaction callback returned:', res);
    return res;
  });

  return {
    __esModule: true,
    default: mockDb,
    prisma: mockDb,
  };
});

describe('Auth Module APIs', () => {
  const testPassword = 'password123';
  const hashedTestPassword = bcrypt.hashSync(testPassword, 10);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      const res = await callback(prisma);
      console.log('--- Mock transaction callback returned:', res);
      return res;
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
      });
      mockPrisma.wallet.create.mockResolvedValue({
        id: 1,
        userId: 1,
        balance: 18450.75,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          password: testPassword,
        });

      console.log('--- Register API response:', response.body);
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should validate inputs using Zod schema', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'T',
          email: 'invalid-email',
          phone: '123',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should dispatch OTP for valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        passwordHash: hashedTestPassword,
        isBlocked: false,
      };

      const mockPrisma = prisma as any;
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.otpSent).toBe(true);
    });
  });
});
