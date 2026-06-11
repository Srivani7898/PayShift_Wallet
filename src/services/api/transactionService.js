import { mockDelay } from '../api.js';
import { storageService } from '../storage/storage';
import { transactions as defaultTransactions } from '../../constants/mockData';

export const transactionService = {
  async getTransactions({ search = '', type = 'All', status = 'All', sort = 'Latest', page = 1, limit = 5 } = {}) {
    await mockDelay(true, 400);
    
    let list = storageService.getTransactions([]);
    if (list.length === 0) {
      storageService.setTransactions(defaultTransactions);
      list = defaultTransactions;
    }

    // Apply Type Filter
    if (type !== 'All') {
      if (type === 'Sent') {
        list = list.filter(t => t.amount < 0);
      } else if (type === 'Received') {
        list = list.filter(t => t.amount > 0);
      } else {
        list = list.filter(t => t.type?.toLowerCase() === type.toLowerCase());
      }
    }

    // Apply Status Filter
    if (status !== 'All') {
      list = list.filter(t => t.status?.toLowerCase() === status.toLowerCase());
    }

    // Apply Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        t =>
          t.id?.toLowerCase().includes(q) ||
          t.title?.toLowerCase().includes(q) ||
          t.payee?.toLowerCase().includes(q) ||
          String(Math.abs(t.amount)).includes(q)
      );
    }

    // Apply Sorting
    if (sort === 'Latest') {
      list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'Oldest') {
      list = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'Highest Amount') {
      list = [...list].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    }

    // Pagination
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    return {
      transactions: paginatedItems,
      totalPages,
      totalItems,
      page,
    };
  },

  async addTransaction(txn) {
    await mockDelay(true, 500);
    const list = storageService.getTransactions([]);
    const updated = [txn, ...list];
    storageService.setTransactions(updated);
    
    // Auto trigger balance update if it affects wallet
    if (txn.type === 'Wallet') {
      const currentBalance = storageService.getWalletBalance();
      const nextBalance = Number((currentBalance + txn.amount).toFixed(2));
      storageService.setWalletBalance(nextBalance);
      window.dispatchEvent(new Event('payswift:balance_updated'));
    }
    
    return txn;
  }
};
export default transactionService;
