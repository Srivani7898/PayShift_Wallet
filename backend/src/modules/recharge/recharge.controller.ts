import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const getRechargeHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const history = await prisma.rechargeHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};

export const performRecharge = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { type, operator, amount, identifier, circle, upiPin } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, bankAccounts: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify UPI PIN of the primary bank account
    const primaryBank = user.bankAccounts.find((b) => b.isPrimary) || user.bankAccounts[0];
    if (!primaryBank) {
      throw new BadRequestError('Please link a bank account and set up a UPI PIN first.');
    }

    if (primaryBank.pin !== upiPin) {
      throw new BadRequestError('Incorrect UPI PIN. Please try again.');
    }

    if (!user.wallet || Number(user.wallet.balance) < amount) {
      throw new BadRequestError('Insufficient wallet balance');
    }

    const refNo = `REC${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      // 2. Create Transaction
      const txn = await tx.transaction.create({
        data: {
          referenceNumber: refNo,
          senderId: userId,
          amount,
          transactionType: 'RECHARGE',
          status: 'SUCCESS',
          description: `${type} Recharge - ${operator} (${identifier})`,
        },
      });

      // 3. Create Recharge History
      const recharge = await tx.rechargeHistory.create({
        data: {
          userId: userId!,
          mobileNumber: identifier,
          operator,
          circle: circle || 'Default',
          amount,
          status: 'SUCCESS',
          referenceNumber: refNo,
        },
      });

      // 4. Create Notification
      const notification = await tx.notification.create({
        data: {
          userId: userId!,
          title: 'Recharge Successful',
          message: `Your ${type} recharge of ₹${amount} for ${identifier} is successful. Ref: ${refNo}`,
          type: 'RECHARGE',
        },
      });

      return { wallet: updatedWallet, txn, recharge, notification };
    });

    logger.info(`Recharge successful. User: ${userId}, Type: ${type}, Amount: ${amount}`);

    // Emit sockets
    const io = req.app.get('io');
    if (io) {
      io.emit(`wallet_updated_${userId}`, { balance: result.wallet.balance });
      io.emit(`notification_created_${userId}`, result.notification);
    }

    res.status(200).json({
      success: true,
      message: `Recharge of ₹${amount} successful!`,
      data: {
        recharge: result.recharge,
        balance: result.wallet.balance,
      },
    });
  } catch (err) {
    next(err);
  }
};
