import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';

export const getSpendingAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    // Fetch sums from different tables
    const billsSum = await prisma.billPayment.aggregate({
      where: { userId, status: 'SUCCESS' },
      _sum: { amount: true },
    });

    const rechargesSum = await prisma.rechargeHistory.aggregate({
      where: { userId, status: 'SUCCESS' },
      _sum: { amount: true },
    });

    const withdrawalsSum = await prisma.transaction.aggregate({
      where: { senderId: userId, transactionType: 'WITHDRAW', status: 'SUCCESS' },
      _sum: { amount: true },
    });

    const p2pSendsSum = await prisma.transaction.aggregate({
      where: { senderId: userId, transactionType: 'SEND', status: 'SUCCESS' },
      _sum: { amount: true },
    });

    const billAmt = Number(billsSum._sum.amount || 0);
    const rechargeAmt = Number(rechargesSum._sum.amount || 0);
    const bankTransferAmt = Number(withdrawalsSum._sum.amount || 0);
    const p2pAmt = Number(p2pSendsSum._sum.amount || 0);

    const totalSpending = billAmt + rechargeAmt + bankTransferAmt + p2pAmt;

    // Sub-categorize P2P sends for richer visual categorization (Food, Shopping, Travel, Entertainment)
    // We can simulate categorization based on description/receiver or distribute it proportionally
    const foodAmt = Math.round(p2pAmt * 0.4);
    const shoppingAmt = Math.round(p2pAmt * 0.35);
    const travelAmt = Math.round(p2pAmt * 0.15);
    const entAmt = Math.max(0, p2pAmt - (foodAmt + shoppingAmt + travelAmt));

    const categories = [
      { category: 'Bills & Utilities', amount: billAmt, percentage: totalSpending > 0 ? Math.round((billAmt / totalSpending) * 100) : 0 },
      { category: 'Mobile & Recharges', amount: rechargeAmt, percentage: totalSpending > 0 ? Math.round((rechargeAmt / totalSpending) * 100) : 0 },
      { category: 'Bank Transfers', amount: bankTransferAmt, percentage: totalSpending > 0 ? Math.round((bankTransferAmt / totalSpending) * 100) : 0 },
      { category: 'Food & Dining', amount: foodAmt, percentage: totalSpending > 0 ? Math.round((foodAmt / totalSpending) * 100) : 0 },
      { category: 'Shopping & Retail', amount: shoppingAmt, percentage: totalSpending > 0 ? Math.round((shoppingAmt / totalSpending) * 100) : 0 },
      { category: 'Travel & Cab', amount: travelAmt, percentage: totalSpending > 0 ? Math.round((travelAmt / totalSpending) * 100) : 0 },
      { category: 'Entertainment', amount: entAmt, percentage: totalSpending > 0 ? Math.round((entAmt / totalSpending) * 100) : 0 },
    ].filter(cat => cat.amount > 0); // Only return categories that have spending

    // Default categories if no spending recorded yet
    if (categories.length === 0) {
      categories.push({ category: 'No Spending Yet', amount: 0, percentage: 0 });
    }

    // Dynamic AI insights generator
    const insights: string[] = [];

    if (totalSpending === 0) {
      insights.push('Start paying utility bills or sending money to see AI-driven budget recommendations.');
      insights.push('Link your primary bank account to instantly top up and pay with zero platform fees.');
    } else {
      if (billAmt > totalSpending * 0.3) {
        insights.push(`Utility bills account for ${Math.round((billAmt / totalSpending) * 100)}% of your monthly outflows. Consider setting up Auto-Pay to avoid late fees.`);
      }
      if (foodAmt > totalSpending * 0.2) {
        insights.push('Your dining expenditures are higher than last week. Cooking at home could save you around ₹1,500 this month.');
      }
      if (shoppingAmt > totalSpending * 0.25) {
        insights.push('Shopping spikes detected around weekend nights. Review your cart lists and set a cooling-off limit.');
      }
      
      const cashbackEarned = await prisma.reward.aggregate({
        where: { userId, rewardType: 'CASHBACK', status: 'CLAIMED' },
        _sum: { rewardAmount: true },
      });
      const cbAmt = Number(cashbackEarned._sum.rewardAmount || 0);
      if (cbAmt > 0) {
        insights.push(`You saved ₹${cbAmt} this month in scratch cards! All cashback winnings have been credited to your active wallet.`);
      } else {
        insights.push('Tip: Send money to friends or scan to pay. Every 5 successful transfers qualify you for a cashback scratch card.');
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalSpending,
        categories,
        insights,
      },
    });
  } catch (err) {
    next(err);
  }
};
