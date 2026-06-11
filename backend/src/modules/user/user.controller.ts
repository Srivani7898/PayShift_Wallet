import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        appLockPin: user.appLockPin,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { fullName, email, phone, appLockPin } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phone,
        appLockPin,
      },
    });

    logger.info(`User profile updated for user ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        appLockPin: user.appLockPin,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { profileImage } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileImage },
    });

    logger.info(`User avatar updated for user ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully!',
      data: {
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`User account deleted for user ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboardData = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        bankAccounts: true,
        upiIds: true,
        kycRecord: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Fetch last 5 P2P transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: { select: { fullName: true, email: true, phone: true } },
        receiver: { select: { fullName: true, email: true, phone: true } },
      },
    });

    // Fetch last 5 notifications
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate profile completeness index:
    // 1. Full name set (20%)
    // 2. Email set (20%)
    // 3. Bank linked (20%)
    // 4. UPI ID set (20%)
    // 5. KYC Status verified (20%)
    let score = 40; // Name & Email are default 40%
    if (user.bankAccounts.length > 0) score += 20;
    if (user.upiIds.length > 0) score += 20;
    if (user.kycRecord?.status === 'APPROVED') score += 20;

    res.status(200).json({
      success: true,
      data: {
        user: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          isVerified: user.isVerified,
          kycStatus: user.kycRecord?.status || 'Pending',
        },
        wallet: {
          balance: user.wallet?.balance || '0.00',
          lockedBalance: user.wallet?.lockedBalance || '0.00',
          currency: user.wallet?.currency || 'INR',
        },
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          referenceNumber: tx.referenceNumber,
          amount: tx.amount,
          type: tx.transactionType,
          status: tx.status,
          date: tx.createdAt,
          title: tx.senderId === userId
            ? `Paid to ${tx.receiver?.fullName || 'External'}`
            : `Received from ${tx.sender?.fullName || 'External'}`,
          description: tx.description,
        })),
        recentNotifications,
        profileCompleteness: score,
      },
    });
  } catch (err) {
    next(err);
  }
};
