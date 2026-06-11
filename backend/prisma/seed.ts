import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.kYCRecord.deleteMany({});
  await prisma.billPayment.deleteMany({});
  await prisma.rechargeHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.reward.deleteMany({});
  await prisma.uPIId.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Admin User
  const admin = await prisma.user.create({
    data: {
      fullName: 'PayShift Administrator',
      email: 'admin@payshift.com',
      phone: '+91 99999 99999',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // 2. Create Demo User (Srivani)
  const user = await prisma.user.create({
    data: {
      fullName: 'Srivani N',
      email: 'srivani@payshift.com',
      phone: '+91 98765 43210',
      passwordHash: passwordHash,
      role: 'USER',
      isVerified: true,
      appLockPin: '1234',
    },
  });

  // 3. Create Wallets
  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 1000000.00,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: 18450.75,
    },
  });

  // 4. Create UPI ID
  await prisma.uPIId.create({
    data: {
      userId: user.id,
      upiId: 'srivani@hdfcbank',
      isPrimary: true,
    },
  });

  // 5. Create Bank Accounts
  await prisma.bankAccount.createMany({
    data: [
      {
        userId: user.id,
        bankName: 'HDFC Bank',
        accountNumber: 'XXXX XXXX 4321',
        ifsc: 'HDFC0000240',
        accountHolder: 'Srivani N',
        isPrimary: true,
        pin: '4820',
      },
      {
        userId: user.id,
        bankName: 'State Bank of India',
        accountNumber: 'XXXX XXXX 1290',
        ifsc: 'SBIN0003357',
        accountHolder: 'Srivani N',
        isPrimary: false,
        pin: '1190',
      },
    ],
  });

  // 6. Create Transactions
  await prisma.transaction.createMany({
    data: [
      {
        referenceNumber: 'TXN10000001',
        receiverId: user.id,
        amount: 5000.00,
        transactionType: 'ADD_MONEY',
        status: 'SUCCESS',
        description: 'Deposited funds to wallet',
      },
      {
        referenceNumber: 'TXN10000002',
        senderId: user.id,
        amount: 250.00,
        transactionType: 'SEND',
        status: 'SUCCESS',
        description: 'Paid for lunch',
      },
    ],
  });

  // 7. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: 'Welcome to PayShift',
        message: 'Your account is active! Setup bank links and enjoy fast P2P payments.',
        type: 'SYSTEM',
      },
      {
        userId: user.id,
        title: 'Money Added',
        message: '₹5,000.00 successfully added to your PayShift wallet.',
        type: 'WALLET',
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
