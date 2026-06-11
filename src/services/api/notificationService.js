import { mockDelay } from '../api.js';
import { storageService } from '../storage/storage';

const initialNotifications = [
  {
    id: 'notif-1',
    type: 'Cashback Earned',
    title: 'Cashback Earned!',
    message: 'Congratulations! You earned ₹20 cashback for mobile recharge.',
    date: '2026-06-10',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'Money Received',
    title: 'Money Received',
    message: '₹2,500 has been credited to your wallet from Neha Rao.',
    date: '2026-06-08',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'KYC Approved',
    title: 'KYC Verification Approved',
    message: 'Great news! Your KYC has been verified. All account limits are now active.',
    date: '2026-06-05',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'Bill Paid',
    title: 'Electricity Bill Paid',
    message: 'Payment of ₹1,264 to Tata Power was successful.',
    date: '2026-06-02',
    read: true,
  }
];

export const notificationService = {
  async getNotifications() {
    await mockDelay(true, 250);
    let list = storageService.getNotifications([]);
    if (list.length === 0) {
      storageService.setNotifications(initialNotifications);
      list = initialNotifications;
    }
    return list;
  },

  async markAsRead(id) {
    await mockDelay(true, 150);
    const list = await this.getNotifications();
    const updated = list.map(item => item.id === id ? { ...item, read: true } : item);
    storageService.setNotifications(updated);
    window.dispatchEvent(new Event('payswift:notifications_updated'));
    return updated;
  },

  async markAllAsRead() {
    await mockDelay(true, 200);
    const list = await this.getNotifications();
    const updated = list.map(item => ({ ...item, read: true }));
    storageService.setNotifications(updated);
    window.dispatchEvent(new Event('payswift:notifications_updated'));
    return updated;
  },

  async deleteNotification(id) {
    await mockDelay(true, 200);
    const list = await this.getNotifications();
    const updated = list.filter(item => item.id !== id);
    storageService.setNotifications(updated);
    window.dispatchEvent(new Event('payswift:notifications_updated'));
    return updated;
  },

  async addNotification(type, title, message) {
    const list = await this.getNotifications();
    const now = new Date();
    const newNotif = {
      id: `notif-${now.getTime()}`,
      type,
      title,
      message,
      date: now.toISOString().slice(0, 10),
      read: false,
    };
    const updated = [newNotif, ...list];
    storageService.setNotifications(updated);
    window.dispatchEvent(new Event('payswift:notifications_updated'));
    return updated;
  }
};
export default notificationService;
