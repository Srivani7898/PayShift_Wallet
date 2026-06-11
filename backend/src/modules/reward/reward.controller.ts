import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const getRewards = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const rewards = await prisma.reward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: rewards,
    });
  } catch (err) {
    next(err);
  }
};

export const claimReward = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('Invalid reward ID');
    }

    const reward = await prisma.reward.findFirst({
      where: { id, userId },
    });

    if (!reward) {
      throw new NotFoundError('Reward card not found');
    }

    if (reward.status === 'CLAIMED') {
      throw new BadRequestError('This scratch card has already been claimed');
    }

    const amount = Number(reward.rewardAmount);
    const refNo = `CBK${Date.now().toString().slice(-8)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark reward claimed
      const updatedReward = await tx.reward.update({
        where: { id },
        data: { status: 'CLAIMED' },
      });

      // 2. Increment wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });

      // 3. Create cashback transaction record
      const txn = await tx.transaction.create({
        data: {
          referenceNumber: refNo,
          receiverId: userId,
          amount,
          transactionType: 'CASHBACK',
          status: 'SUCCESS',
          description: `Cashback scratch card reward claimed`,
        },
      });

      // 4. Create Notification
      const notification = await tx.notification.create({
        data: {
          userId: userId!,
          title: 'Cashback Claimed',
          message: `Congratulations! ₹${amount} cashback scratch card has been successfully credited to your wallet.`,
          type: 'REWARD',
        },
      });

      return { reward: updatedReward, wallet: updatedWallet, txn, notification };
    });

    logger.info(`Cashback claimed successfully. User ID: ${userId}, Amount: ${amount}`);

    // Emit sockets
    const io = req.app.get('io');
    if (io) {
      io.emit(`wallet_updated_${userId}`, { balance: result.wallet.balance });
      io.emit(`notification_created_${userId}`, result.notification);
    }

    res.status(200).json({
      success: true,
      message: `₹${amount} cashback credited to your wallet!`,
      data: {
        reward: result.reward,
        balance: result.wallet.balance,
        transaction: result.txn,
      },
    });
  } catch (err) {
    next(err);
  }
};
