import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const sendMoney = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user?.userId;
    const { recipient, amount, upiPin, description } = req.body;

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: { wallet: true, bankAccounts: true },
    });

    if (!sender) {
      throw new NotFoundError('Sender account not found');
    }

    // Identify receiver
    let receiver = null;

    // 1. Try finding by email
    receiver = await prisma.user.findUnique({
      where: { email: recipient },
    });

    // 2. Try finding by phone
    if (!receiver) {
      receiver = await prisma.user.findUnique({
        where: { phone: recipient },
      });
    }

    // 3. Try finding by UPI ID
    if (!receiver) {
      const upiRecord = await prisma.uPIId.findUnique({
        where: { upiId: recipient },
        include: { user: true },
      });
      if (upiRecord) {
        receiver = upiRecord.user;
      }
    }

    if (!receiver) {
      throw new NotFoundError('Recipient user not found');
    }

    if (receiver.id === senderId) {
      throw new BadRequestError('Cannot transfer funds to yourself');
    }

    // Verify UPI PIN of the sender's primary bank account
    const primaryBank = sender.bankAccounts.find((b) => b.isPrimary) || sender.bankAccounts[0];
    if (!primaryBank) {
      throw new BadRequestError('Please link a bank account and set up a UPI PIN first.');
    }

    if (primaryBank.pin !== upiPin) {
      throw new BadRequestError('Incorrect UPI PIN. Please try again.');
    }

    // Check sender wallet balance
    if (!sender.wallet || Number(sender.wallet.balance) < amount) {
      throw new BadRequestError('Insufficient wallet balance');
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct sender wallet
      const updatedSenderWallet = await tx.wallet.update({
        where: { userId: senderId },
        data: { balance: { decrement: amount } },
      });

      // 2. Credit receiver wallet
      const updatedReceiverWallet = await tx.wallet.update({
        where: { userId: receiver!.id },
        data: { balance: { increment: amount } },
      });

      // 3. Create transaction record
      const refNo = `UPI${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      const transaction = await tx.transaction.create({
        data: {
          referenceNumber: refNo,
          senderId,
          receiverId: receiver!.id,
          amount,
          transactionType: 'SEND',
          status: 'SUCCESS',
          description: description || `P2P transfer to ${receiver!.fullName}`,
        },
      });

      // 4. Create notification for sender
      const senderNotification = await tx.notification.create({
        data: {
          userId: senderId!,
          title: 'Money Sent',
          message: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} sent successfully to ${receiver!.fullName}.`,
          type: 'TRANSACTION',
        },
      });

      // 5. Create notification for receiver
      const receiverNotification = await tx.notification.create({
        data: {
          userId: receiver!.id,
          title: 'Money Received',
          message: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} received from ${sender.fullName}.`,
          type: 'TRANSACTION',
        },
      });

      // 6. Cashback/Reward business logic:
      // Count sender's successful P2P send transactions
      const count = await tx.transaction.count({
        where: { senderId, transactionType: 'SEND', status: 'SUCCESS' },
      });

      let reward = null;
      let rewardNotification = null;

      if ((count + 1) % 5 === 0) {
        // Every 5 successful transfers earns a cashback
        const cashbackAmount = Math.floor(10 + Math.random() * 90); // Random ₹10 - ₹100
        
        reward = await tx.reward.create({
          data: {
            userId: senderId!,
            rewardType: 'CASHBACK',
            rewardAmount: cashbackAmount,
            status: 'UNCLAIMED',
          },
        });

        rewardNotification = await tx.notification.create({
          data: {
            userId: senderId!,
            title: 'Reward Earned!',
            message: `Congratulations! You've earned a scratch card worth ₹${cashbackAmount} for completing 5 transfers.`,
            type: 'REWARD',
          },
        });
      }

      return {
        transaction,
        senderWallet: updatedSenderWallet,
        receiverWallet: updatedReceiverWallet,
        senderNotification,
        receiverNotification,
        reward,
        rewardNotification,
      };
    });

    logger.info(`P2P transfer success. Sender ID: ${senderId}, Receiver ID: ${receiver.id}, Amount: ${amount}`);

    // Emit Realtime Sockets
    const io = req.app.get('io');
    if (io) {
      io.emit(`wallet_updated_${senderId}`, { balance: result.senderWallet.balance });
      io.emit(`wallet_updated_${receiver.id}`, { balance: result.receiverWallet.balance });
      
      io.emit(`money_sent_${senderId}`, result.transaction);
      io.emit(`money_received_${receiver.id}`, result.transaction);
      
      io.emit(`notification_created_${senderId}`, result.senderNotification);
      io.emit(`notification_created_${receiver.id}`, result.receiverNotification);

      if (result.reward) {
        io.emit(`reward_earned_${senderId}`, result.reward);
        if (result.rewardNotification) {
          io.emit(`notification_created_${senderId}`, result.rewardNotification);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `₹${amount} sent successfully to ${receiver.fullName}!`,
      data: {
        transaction: result.transaction,
        balance: result.senderWallet.balance,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, search = '', type = '' } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query conditions
    const whereCondition: any = {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    };

    if (search) {
      whereCondition.AND = [
        {
          OR: [
            { referenceNumber: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (type) {
      whereCondition.transactionType = type;
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          sender: { select: { fullName: true, email: true, phone: true } },
          receiver: { select: { fullName: true, email: true, phone: true } },
        },
      }),
      prisma.transaction.count({ where: whereCondition }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
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

export const getTransactionById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: {
        sender: { select: { fullName: true, email: true, phone: true } },
        receiver: { select: { fullName: true, email: true, phone: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
};
