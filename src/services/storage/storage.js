const STORAGE_PREFIX = 'payswift:';

const keys = {
  TOKEN: 'token',
  USER: 'user',
  BANK_ACCOUNTS: 'bank-accounts',
  KYC_STATUS: 'kyc-status',
  PAYMENT_PIN: 'payment-pin',
  APP_LOCK_PIN: 'app-lock-pin',
  TRANSACTIONS: 'transactions',
  WALLET_BALANCE: 'wallet-balance',
  NOTIFICATIONS: 'notifications',
  REWARDS: 'rewards',
  SETTINGS: 'settings',
};

const getFullKey = (key) => `${STORAGE_PREFIX}${key}`;

export const storageService = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(getFullKey(key));
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error reading key ${key} from storage:`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(getFullKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing key ${key} to storage:`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(getFullKey(key));
      return true;
    } catch (error) {
      console.error(`Error removing key ${key} from storage:`, error);
      return false;
    }
  },

  clear() {
    try {
      Object.values(keys).forEach((k) => {
        localStorage.removeItem(getFullKey(k));
      });
      // Also clean up older keys
      localStorage.removeItem('payswift_token');
      localStorage.removeItem('payswift_user');
      localStorage.removeItem('payswift-bank-accounts');
      localStorage.removeItem('payswift-kyc-status');
      localStorage.removeItem('payswift-payment-pin');
      localStorage.removeItem('payswift-app-lock-pin');
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  // Helpers
  getToken() {
    // Backwards compatibility
    const oldToken = localStorage.getItem('payswift_token');
    if (oldToken) {
      this.set(keys.TOKEN, oldToken);
      localStorage.removeItem('payswift_token');
      return oldToken;
    }
    return this.get(keys.TOKEN);
  },
  setToken(token) {
    return this.set(keys.TOKEN, token);
  },
  removeToken() {
    return this.remove(keys.TOKEN);
  },

  getUser() {
    const oldUser = localStorage.getItem('payswift_user');
    if (oldUser) {
      try {
        const parsed = JSON.parse(oldUser);
        this.setUser(parsed);
        localStorage.removeItem('payswift_user');
        return parsed;
      } catch (err) {
        console.warn('Failed to parse legacy user:', err);
      }
    }
    return this.get(keys.USER);
  },
  setUser(user) {
    return this.set(keys.USER, user);
  },

  getWalletBalance(defaultVal = 18450.75) {
    return this.get(keys.WALLET_BALANCE, defaultVal);
  },
  setWalletBalance(balance) {
    return this.set(keys.WALLET_BALANCE, balance);
  },

  getTransactions(defaultTransactions = []) {
    return this.get(keys.TRANSACTIONS, defaultTransactions);
  },
  setTransactions(transactions) {
    return this.set(keys.TRANSACTIONS, transactions);
  },

  getBankAccounts(defaultAccounts = []) {
    const oldAccounts = localStorage.getItem('payswift-bank-accounts');
    if (oldAccounts) {
      try {
        const parsed = JSON.parse(oldAccounts);
        this.setBankAccounts(parsed);
        localStorage.removeItem('payswift-bank-accounts');
        return parsed;
      } catch (err) {
        console.warn('Failed to parse legacy bank accounts:', err);
      }
    }
    return this.get(keys.BANK_ACCOUNTS, defaultAccounts);
  },
  setBankAccounts(accounts) {
    return this.set(keys.BANK_ACCOUNTS, accounts);
  },

  getKycStatus(defaultVal = 'Pending') {
    const oldKyc = localStorage.getItem('payswift-kyc-status');
    if (oldKyc) {
      this.setKycStatus(oldKyc);
      localStorage.removeItem('payswift-kyc-status');
      return oldKyc;
    }
    return this.get(keys.KYC_STATUS, defaultVal);
  },
  setKycStatus(status) {
    return this.set(keys.KYC_STATUS, status);
  },

  getPaymentPin() {
    const oldPin = localStorage.getItem('payswift-payment-pin');
    if (oldPin) {
      this.setPaymentPin(oldPin);
      localStorage.removeItem('payswift-payment-pin');
      return oldPin;
    }
    return this.get(keys.PAYMENT_PIN, '');
  },
  setPaymentPin(pin) {
    return this.set(keys.PAYMENT_PIN, pin);
  },

  getAppLockPin() {
    const user = this.getUser();
    return user?.appLockPin || '';
  },
  setAppLockPin(pin) {
    const user = this.getUser();
    if (user) {
      user.appLockPin = pin;
      this.setUser(user);
      
      const registered = this.get('registered-users', []) || [];
      const updated = registered.map((u) => {
        if (
          u.email?.toLowerCase() === user.email?.toLowerCase() ||
          u.mobile === user.mobile ||
          u.name?.toLowerCase() === user.name?.toLowerCase()
        ) {
          return { ...u, appLockPin: pin };
        }
        return u;
      });
      this.set('registered-users', updated);
    }
    return this.set(keys.APP_LOCK_PIN, pin);
  },

  getNotifications(defaultVal = []) {
    return this.get(keys.NOTIFICATIONS, defaultVal);
  },
  setNotifications(notifications) {
    return this.set(keys.NOTIFICATIONS, notifications);
  },

  getRewards(defaultVal = null) {
    return this.get(keys.REWARDS, defaultVal);
  },
  setRewards(rewards) {
    return this.set(keys.REWARDS, rewards);
  },

  getSettings(defaultVal = { notificationsEnabled: true, emailAlerts: true, biometrics: false }) {
    return this.get(keys.SETTINGS, defaultVal);
  },
  setSettings(settings) {
    return this.set(keys.SETTINGS, settings);
  },
};
