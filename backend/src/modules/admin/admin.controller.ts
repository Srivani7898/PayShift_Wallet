import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereCondition: any = {};
    if (search) {
      whereCondition.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          uuid: true,
          fullName: true,
          email: true,
          phone: true,
          profileImage: true,
          isVerified: true,
          isBlocked: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUserBlock = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    const targetUserId = parseInt(req.params.id);

    if (isNaN(targetUserId)) {
      throw new BadRequestError('Invalid user ID');
    }

    if (targetUserId === adminId) {
      throw new BadRequestError('You cannot block yourself');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked: !targetUser.isBlocked },
      select: { id: true, fullName: true, isBlocked: true },
    });

    const action = updatedUser.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER';
    await prisma.auditLog.create({
      data: {
        action,
        details: `${updatedUser.isBlocked ? 'Blocked' : 'Unblocked'} user ${targetUser.email} (ID: ${targetUserId}) by admin ID: ${adminId}`,
        userId: adminId,
      },
    });

    logger.info(`Admin ${adminId} ${updatedUser.isBlocked ? 'blocked' : 'unblocked'} user ${targetUserId}`);

    res.status(200).json({
      success: true,
      message: `User has been successfully ${updatedUser.isBlocked ? 'blocked' : 'unblocked'}.`,
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingKYCs = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pendingList = await prisma.kYCRecord.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: pendingList,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyKYC = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.userId;
    const kycId = parseInt(req.params.id);
    const { status, reason } = req.body;

    if (isNaN(kycId)) {
      throw new BadRequestError('Invalid KYC record ID');
    }

    const kyc = await prisma.kYCRecord.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundError('KYC record not found');
    }

    const isApproved = status === 'APPROVED';

    const result = await prisma.$transaction(async (tx) => {
      const updatedKyc = await tx.kYCRecord.update({
        where: { id: kycId },
        data: {
          status,
          verifiedAt: new Date(),
          verifiedBy: String(adminId),
        },
      });

      await tx.user.update({
        where: { id: kyc.userId },
        data: { isVerified: isApproved },
      });

      const messageText = isApproved
        ? 'Congratulations! Your KYC documents have been approved. You now have full transaction privileges.'
        : `Your KYC documents were rejected. Reason: ${reason || 'Invalid documents'}. Please re-submit valid ID documents.`;

      const notification = await tx.notification.create({
        data: {
          userId: kyc.userId,
          title: isApproved ? 'KYC Approved' : 'KYC Rejected',
          message: messageText,
          type: 'KYC',
        },
      });

      await tx.auditLog.create({
        data: {
          action: isApproved ? 'APPROVE_KYC' : 'REJECT_KYC',
          details: `KYC ID: ${kycId} for User ID: ${kyc.userId} ${isApproved ? 'Approved' : 'Rejected'} by admin ID: ${adminId}`,
          userId: adminId,
        },
      });

      return { kyc: updatedKyc, notification };
    });

    logger.info(`Admin ${adminId} verified KYC ${kycId} as ${status}`);

    // Emit notification socket to the user
    const io = req.app.get('io');
    if (io) {
      io.emit(`notification_created_${kyc.userId}`, result.notification);
      io.emit(`user_verified_${kyc.userId}`, { isVerified: isApproved });
    }

    res.status(200).json({
      success: true,
      message: `KYC record successfully ${isApproved ? 'approved' : 'rejected'}.`,
      data: result.kyc,
    });
  } catch (err) {
    next(err);
  }
};
