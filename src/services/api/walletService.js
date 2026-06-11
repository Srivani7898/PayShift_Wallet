import { mockDelay } from '../api.js';
import { storageService } from '../storage/storage';

export const walletService = {
  async getBalance() {
    await mockDelay(true, 300);
    return storageService.getWalletBalance();
  },

  async addMoney(amount) {
    await mockDelay(true, 800);
    const currentBalance = storageService.getWalletBalance();
    const newBalance = Number((currentBalance + amount).toFixed(2));
    storageService.setWalletBalance(newBalance);
    
    // Add transaction record
    const now = new Date();
    const txn = {
      id: `TXN${now.getTime().toString().slice(-8)}`,
      title: 'Wallet Top-up',
      amount: amount,
      type: 'Wallet',
      status: 'Success',
      date: now.toISOString().slice(0, 10),
      method: 'Bank Transfer',
      bank: 'Linked Account',
      utr: `WLT${now.getTime().toString().slice(-8)}`,
      balanceAfter: `₹${newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    };
    
    const transactions = storageService.getTransactions([]);
    storageService.setTransactions([txn, ...transactions]);
    
    // Trigger local state updates if necessary
    window.dispatchEvent(new Event('payswift:balance_updated'));
    
    return { balance: newBalance, transaction: txn };
  },

  async withdrawMoney(amount, destBank) {
    await mockDelay(true, 900);
    const currentBalance = storageService.getWalletBalance();
    if (amount > currentBalance) {
      throw new Error('Insufficient wallet balance');
    }
    const newBalance = Number((currentBalance - amount).toFixed(2));
    storageService.setWalletBalance(newBalance);
    
    // Add transaction record
    const now = new Date();
    const txn = {
      id: `TXN${now.getTime().toString().slice(-8)}`,
      title: `Withdraw to ${destBank}`,
      amount: -amount,
      type: 'Wallet',
      status: 'Success',
      date: now.toISOString().slice(0, 10),
      method: 'Bank Withdrawal',
      bank: destBank,
      utr: `WDW${now.getTime().toString().slice(-8)}`,
      balanceAfter: `₹${newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    };
    
    const transactions = storageService.getTransactions([]);
    storageService.setTransactions([txn, ...transactions]);
    
    window.dispatchEvent(new Event('payswift:balance_updated'));
    
    return { balance: newBalance, transaction: txn };
  }
};
export default walletService;
