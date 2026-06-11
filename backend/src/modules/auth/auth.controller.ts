import { Request, Response, NextFunction } from 'express';
import prisma from '../../database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { logger } from '../../config/logger';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      throw new ConflictError('User with this email already exists');
    }

    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      throw new ConflictError('User with this phone number already exists');
    }

    const passwordHash = await hashPassword(password);

    // Create User, Wallet, and Audit Log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          isVerified: true, // Auto verify for testing simulation
        },
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 18450.75, // Matches the frontend initial mock balance
        },
      });

      // Create a default linked bank account so they can link others
      await tx.bankAccount.create({
        data: {
          userId: user.id,
          bankName: 'HDFC Bank',
          accountNumber: 'XXXX XXXX 4321',
          ifsc: 'HDFC0000240',
          accountHolder: fullName,
          isPrimary: true,
          pin: '4820',
        },
      });

      // Create a default UPI ID
      const baseHandle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      await tx.uPIId.create({
        data: {
          userId: user.id,
          upiId: `${baseHandle}@hdfcbank`,
          isPrimary: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'REGISTER',
          details: `Registered user ${email}`,
          userId: user.id,
        },
      });

      return { user, wallet };
    });

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      data: {
        userId: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new BadRequestError('Your account has been blocked. Please contact support.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate mock OTP for testing
    const otp = '123456';
    logger.info(`OTP ${otp} sent to user: ${identifier}`);

    res.status(200).json({
      success: true,
      message: 'OTP dispatched successfully to your registered email/phone.',
      data: {
        otpSent: true,
        pendingIdentifier: identifier,
        hint: 'Use 123456 for testing OTP verification.',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { otp, pendingIdentifier } = req.body;

    if (otp !== '123456') {
      throw new BadRequestError('Incorrect OTP code');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: pendingIdentifier },
          { phone: pendingIdentifier },
        ],
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: expiry,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        details: `Logged in via OTP: ${pendingIdentifier}`,
        userId: user.id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged in!',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          uuid: user.uuid,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role,
          appLockPin: user.appLockPin,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully logged out.',
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    verifyRefreshToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      role: storedToken.user.role,
    });

    const newRefreshToken = generateRefreshToken({ userId: storedToken.user.id });

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundError('User with this email does not exist');
    }

    logger.info(`Password reset OTP 123456 sent to email: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP code sent to your registered email address.',
      data: {
        hint: 'Use 123456 for testing OTP verification.',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (otp !== '123456') {
      throw new BadRequestError('Incorrect OTP code');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        action: 'RESET_PASSWORD',
        details: `Password reset successfully for email: ${email}`,
        userId: user.id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        uuid: user.uuid,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        appLockPin: user.appLockPin,
        isVerified: user.isVerified,
        wallet: {
          balance: user.wallet?.balance,
          lockedBalance: user.wallet?.lockedBalance,
          currency: user.wallet?.currency,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
