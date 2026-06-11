import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const generateQRPayload = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { upiIds: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const primaryUpi = user.upiIds.find((u) => u.isPrimary) || user.upiIds[0];
    if (!primaryUpi) {
      throw new BadRequestError('No UPI ID found for this user');
    }

    // Format: upi://pay?pa=address@bank&pn=FullName&cu=INR
    const encodedName = encodeURIComponent(user.fullName);
    const qrPayload = `upi://pay?pa=${primaryUpi.upiId}&pn=${encodedName}&cu=INR`;

    res.status(200).json({
      success: true,
      data: {
        upiId: primaryUpi.upiId,
        fullName: user.fullName,
        qrPayload,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const payByQR = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user?.userId;
    const { qrPayload, amount, upiPin, description } = req.body;

    // Parse the QR payload to extract receiver's UPI ID
    let receiverUpi: string | null = null;
    try {
      if (qrPayload.startsWith('upi://pay')) {
        const queryPart = qrPayload.split('?')[1];
        const params = new URLSearchParams(queryPart);
        receiverUpi = params.get('pa');
      } else {
        // Fallback: treat the payload itself as raw UPI ID
        receiverUpi = qrPayload;
      }
    } catch {
      throw new BadRequestError('Failed to parse QR payload');
    }

    if (!receiverUpi) {
      throw new BadRequestError('Invalid QR payload: Recipient UPI address not found');
    }

    const normalizedReceiverUpi = receiverUpi.toLowerCase().trim();

    const upiRecord = await prisma.uPIId.findUnique({
      where: { upiId: normalizedReceiverUpi },
      include: { user: { include: { wallet: true } } },
    });

    if (!upiRecord) {
      throw new NotFoundError('Recipient UPI address not registered on PayShift');
    }

    const receiver = upiRecord.user;
    if (receiver.id === senderId) {
      throw new BadRequestError('Cannot transfer funds to yourself');
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: { wallet: true, bankAccounts: true },
    });

    if (!sender) {
      throw new NotFoundError('Sender account not found');
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
        where: { userId: receiver.id },
        data: { balance: { increment: amount } },
      });

      // 3. Create transaction record
      const refNo = `UPI${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      const transaction = await tx.transaction.create({
        data: {
          referenceNumber: refNo,
          senderId,
          receiverId: receiver.id,
          amount,
          transactionType: 'SEND',
          status: 'SUCCESS',
          description: description || `QR Payment to ${receiver.fullName}`,
        },
      });

      // 4. Create notification for sender
      const senderNotification = await tx.notification.create({
        data: {
          userId: senderId!,
          title: 'Money Sent via QR',
          message: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} successfully paid to ${receiver.fullName} via QR.`,
          type: 'TRANSACTION',
        },
      });

      // 5. Create notification for receiver
      const receiverNotification = await tx.notification.create({
        data: {
          userId: receiver.id,
          title: 'Money Received via QR',
          message: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} received from ${sender.fullName} via QR.`,
          type: 'TRANSACTION',
        },
      });

      // 6. Cashback reward count logic
      const count = await tx.transaction.count({
        where: { senderId, transactionType: 'SEND', status: 'SUCCESS' },
      });

      let reward = null;
      let rewardNotification = null;

      if ((count + 1) % 5 === 0) {
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

    logger.info(`QR transfer success. Sender ID: ${senderId}, Receiver ID: ${receiver.id}, Amount: ${amount}`);

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
      message: `₹${amount} paid successfully to ${receiver.fullName}!`,
      data: {
        transaction: result.transaction,
        balance: result.senderWallet.balance,
      },
    });
  } catch (err) {
    next(err);
  }
};
