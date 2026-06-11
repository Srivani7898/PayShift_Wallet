import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const getWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet not found for this user');
    }

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        lockedBalance: wallet.lockedBalance,
        currency: wallet.currency,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const addMoney = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { amount } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      const refNo = `TXN${Date.now().toString().slice(-8)}`;

      const txn = await tx.transaction.create({
        data: {
          referenceNumber: refNo,
          receiverId: userId,
          amount,
          transactionType: 'ADD_MONEY',
          status: 'SUCCESS',
          description: 'Top-up added to wallet',
        },
      });

      const notification = await tx.notification.create({
        data: {
          userId: userId!,
          title: 'Money Added',
          message: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been added successfully to your PayShift wallet.`,
          type: 'WALLET',
        },
      });

      return { wallet: updatedWallet, txn, notification };
    });

    logger.info(`Funds added to wallet. User ID: ${userId}, Amount: ${amount}`);

    // Socket emission helper
    const io = req.app.get('io');
    if (io) {
      io.emit(`wallet_updated_${userId}`, { balance: result.wallet.balance });
      io.emit(`notification_created_${userId}`, result.notification);
    }

    res.status(200).json({
      success: true,
      message: `₹${amount} added successfully!`,
      data: {
        balance: result.wallet.balance,
        transaction: result.txn,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawMoney = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { amount, bankAccountId, pin } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const bank = await tx.bankAccount.findUnique({
        where: { id: bankAccountId },
      });

      if (!bank || bank.userId !== userId) {
        throw new NotFoundError('Bank account not found or not linked to your profile');
      }

      if (bank.pin !== pin) {
        throw new BadRequestError('Incorrect UPI PIN. Please try again.');
      }

      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      if (Number(wallet.balance) < amount) {
        throw new BadRequestError('Insufficient wallet balance');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      const refNo = `TXN${Date.now().toString().slice(-8)}`;

      const txn = await tx.transaction.create({
        data: {
          referenceNumber: refNo,
          senderId: userId,
          amount,
          transactionType: 'WITHDRAW',
          status: 'SUCCESS',
          description: `Withdrawal to ${bank.bankName} (${bank.accountNumber})`,
        },
      });

      const notification = await tx.notification.create({
        data: {
          userId: userId!,
          title: 'Withdrawal Successful',
          message: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been transferred from your wallet to ${bank.bankName} account.`,
          type: 'WALLET',
        },
      });

      return { wallet: updatedWallet, txn, notification };
    });

    logger.info(`Funds withdrawn from wallet. User ID: ${userId}, Amount: ${amount}`);

    const io = req.app.get('io');
    if (io) {
      io.emit(`wallet_updated_${userId}`, { balance: result.wallet.balance });
      io.emit(`notification_created_${userId}`, result.notification);
    }

    res.status(200).json({
      success: true,
      message: `₹${amount} withdrawn successfully!`,
      data: {
        balance: result.wallet.balance,
        transaction: result.txn,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const txns = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: userId, transactionType: { in: ['WITHDRAW', 'SEND', 'RECHARGE', 'BILL_PAYMENT'] } },
          { receiverId: userId, transactionType: { in: ['ADD_MONEY', 'RECEIVE', 'CASHBACK', 'REFUND'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: txns,
    });
  } catch (err) {
    next(err);
  }
};
