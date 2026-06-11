import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils';
import { logger } from '../../config/logger';

export const getBankAccounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { isPrimary: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (err) {
    next(err);
  }
};

export const linkBankAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { bankName, accountNumber, ifsc, accountHolder, pin } = req.body;

    const existingAccount = await prisma.bankAccount.findUnique({
      where: {
        userId_bankName: {
          userId: userId!,
          bankName,
        },
      },
    });

    if (existingAccount) {
      throw new ConflictError(`You have already linked a ${bankName} account.`);
    }

    const hasAccounts = await prisma.bankAccount.findFirst({
      where: { userId },
    });

    // If first account, link as primary
    const isPrimary = !hasAccounts;

    const account = await prisma.bankAccount.create({
      data: {
        userId: userId!,
        bankName,
        accountNumber,
        ifsc,
        accountHolder,
        isPrimary,
        pin: pin || '1234', // default PIN if not provided
      },
    });

    logger.info(`Linked bank account ${bankName} for user ${userId}`);

    res.status(201).json({
      success: true,
      message: `${bankName} account linked successfully.`,
      data: account,
    });
  } catch (err) {
    next(err);
  }
};

export const unlinkBankAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const accountId = parseInt(req.params.id);

    if (isNaN(accountId)) {
      throw new BadRequestError('Invalid account ID');
    }

    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Bank account not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.bankAccount.delete({
        where: { id: accountId },
      });

      // If we deleted the primary account, promote another account to primary
      if (account.isPrimary) {
        const nextAccount = await tx.bankAccount.findFirst({
          where: { userId },
        });

        if (nextAccount) {
          await tx.bankAccount.update({
            where: { id: nextAccount.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    logger.info(`Unlinked bank account ${accountId} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Bank account unlinked successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const setPrimaryBankAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const accountId = parseInt(req.params.id);

    if (isNaN(accountId)) {
      throw new BadRequestError('Invalid account ID');
    }

    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundError('Bank account not found');
    }

    await prisma.$transaction([
      prisma.bankAccount.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.bankAccount.update({
        where: { id: accountId },
        data: { isPrimary: true },
      }),
    ]);

    logger.info(`Set primary bank account ${accountId} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: `${account.bankName} set as primary bank account.`,
    });
  } catch (err) {
    next(err);
  }
};
