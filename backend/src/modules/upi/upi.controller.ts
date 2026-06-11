import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils';
import { logger } from '../../config/logger';

export const getUPIIds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const upiIds = await prisma.uPIId.findMany({
      where: { userId },
      orderBy: { isPrimary: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: upiIds,
    });
  } catch (err) {
    next(err);
  }
};

export const createUPIId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { upiId } = req.body;

    const normalizedUpiId = upiId.toLowerCase();

    const existingUpi = await prisma.uPIId.findUnique({
      where: { upiId: normalizedUpiId },
    });

    if (existingUpi) {
      throw new ConflictError('This UPI ID is already registered.');
    }

    const hasUPI = await prisma.uPIId.findFirst({
      where: { userId },
    });

    const isPrimary = !hasUPI;

    const newUpi = await prisma.uPIId.create({
      data: {
        userId: userId!,
        upiId: normalizedUpiId,
        isPrimary,
      },
    });

    logger.info(`Created UPI ID ${normalizedUpiId} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'UPI ID created successfully.',
      data: newUpi,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUPIId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('Invalid UPI ID');
    }

    const upi = await prisma.uPIId.findFirst({
      where: { id, userId },
    });

    if (!upi) {
      throw new NotFoundError('UPI ID not found');
    }

    // Check count: cannot delete if it is the last one
    const count = await prisma.uPIId.count({
      where: { userId },
    });

    if (count <= 1) {
      throw new BadRequestError('You must keep at least one UPI ID active.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.uPIId.delete({
        where: { id },
      });

      if (upi.isPrimary) {
        const nextUpi = await tx.uPIId.findFirst({
          where: { userId },
        });

        if (nextUpi) {
          await tx.uPIId.update({
            where: { id: nextUpi.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    logger.info(`Deleted UPI ID ${id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'UPI ID deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const setPrimaryUPIId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('Invalid UPI ID');
    }

    const upi = await prisma.uPIId.findFirst({
      where: { id, userId },
    });

    if (!upi) {
      throw new NotFoundError('UPI ID not found');
    }

    await prisma.$transaction([
      prisma.uPIId.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.uPIId.update({
        where: { id },
        data: { isPrimary: true },
      }),
    ]);

    logger.info(`Set primary UPI ID ${id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: `UPI ID ${upi.upiId} set as primary.`,
    });
  } catch (err) {
    next(err);
  }
};
