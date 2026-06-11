import { mockDelay } from '../api.js';
import { storageService } from '../storage/storage';
import { notificationService } from './notificationService';

const initialRewards = {
  pointsBalance: 450,
  cashbackEarned: 70, // Total cashback earned
  history: [
    { id: 'rh-1', title: 'Cashback on Broadband', amount: 50, date: '2026-05-10' },
    { id: 'rh-2', title: 'Cashback on Airtel Recharge', amount: 20, date: '2026-04-30' },
  ],
  scratchCards: [
    { id: 'card-1', scratched: false, rewardType: 'cashback', value: 20, title: '₹20 Cashback', subtitle: 'On your next mobile recharge' },
    { id: 'card-2', scratched: false, rewardType: 'cashback', value: 50, title: '₹50 Cashback', subtitle: 'On electricity bill payment' },
    { id: 'card-3', scratched: false, rewardType: 'points', value: 150, title: '150 Points', subtitle: 'Added to your PayShift club' },
    { id: 'card-4', scratched: false, rewardType: 'coupon', value: '5% Off', title: '5% Recharge Coupon', subtitle: 'Promo Code: RECH5' },
  ]
};

const defaultOffers = [
  { id: 'o-1', title: 'Win up to ₹1000', description: 'Link your primary bank account and send ₹100 or more via UPI.', code: 'UPILINK', bannerUrl: '' },
  { id: 'o-2', title: 'Flat ₹50 Cashback', description: 'Pay electricity bills above ₹1000 using your linked HDFC bank account.', code: 'LIGHT50', bannerUrl: '' },
  { id: 'o-3', title: 'Double Reward Points', description: 'Recharge using your PayShift wallet balance on Saturdays.', code: 'SATRECH', bannerUrl: '' },
  { id: 'o-4', title: '5% Off Broadband', description: 'Renew your gas or broadband bills and get instant 5% off up to ₹150.', code: 'FIBER5', bannerUrl: '' }
];

export const rewardService = {
  async getRewards() {
    await mockDelay(true, 300);
    let rewards = storageService.getRewards();
    if (!rewards) {
      storageService.setRewards(initialRewards);
      rewards = initialRewards;
    }
    return rewards;
  },

  async scratchCard(id) {
    await mockDelay(true, 800);
    const rewards = await this.getRewards();
    let cardFound = null;
    
    const updatedCards = rewards.scratchCards.map(card => {
      if (card.id === id && !card.scratched) {
        cardFound = card;
        return { ...card, scratched: true };
      }
      return card;
    });

    if (!cardFound) {
      throw new Error('Card already scratched or invalid ID');
    }

    let updatedHistory = [...rewards.history];
    let pointsBalance = rewards.pointsBalance;
    let cashbackEarned = rewards.cashbackEarned;

    // Apply reward benefits
    if (cardFound.rewardType === 'cashback') {
      cashbackEarned += cardFound.value;
      updatedHistory.unshift({
        id: `rh-${Date.now()}`,
        title: `Scratch Card: ${cardFound.title}`,
        amount: cardFound.value,
        date: new Date().toISOString().slice(0, 10),
      });

      // Add to Wallet Balance
      const walletBalance = storageService.getWalletBalance();
      const newBalance = Number((walletBalance + cardFound.value).toFixed(2));
      storageService.setWalletBalance(newBalance);
      
      // Save Transaction
      const now = new Date();
      const txn = {
        id: `TXN${now.getTime().toString().slice(-8)}`,
        title: 'Cashback Received',
        amount: cardFound.value,
        type: 'Refund',
        status: 'Success',
        date: now.toISOString().slice(0, 10),
        method: 'Cashback Credit',
        bank: 'PayShift Wallet',
        utr: `CBK${now.getTime().toString().slice(-8)}`,
        balanceAfter: `₹${newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      };
      
      const transactions = storageService.getTransactions([]);
      storageService.setTransactions([txn, ...transactions]);
      
      // Notify
      await notificationService.addNotification(
        'Cashback Earned',
        'Cashback Credited!',
        `₹${cardFound.value} cashback has been credited to your PayShift wallet.`
      );
      
      window.dispatchEvent(new Event('payswift:balance_updated'));
    } else if (cardFound.rewardType === 'points') {
      pointsBalance += cardFound.value;
      await notificationService.addNotification(
        'Cashback Earned',
        'Reward Points Added',
        `${cardFound.value} points added to your PayShift rewards club.`
      );
    } else if (cardFound.rewardType === 'coupon') {
      await notificationService.addNotification(
        'Cashback Earned',
        'Coupon Revealed!',
        `Recharge Promo Code: RECH5. Get 5% cashback on your next recharge.`
      );
    }

    const updatedRewards = {
      pointsBalance,
      cashbackEarned,
      history: updatedHistory,
      scratchCards: updatedCards,
    };

    storageService.setRewards(updatedRewards);
    window.dispatchEvent(new Event('payswift:rewards_updated'));
    
    return { rewards: updatedRewards, rewardReveal: cardFound };
  },

  async getOffers() {
    await mockDelay(true, 200);
    return defaultOffers;
  }
};
export default rewardService;
