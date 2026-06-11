import { mockDelay } from '../api.js';
import { storageService } from '../storage/storage';

const initialBankAccounts = [
  {
    bank: 'HDFC Bank',
    type: 'Savings Account',
    account: 'XXXX XXXX 4321',
    holder: 'Srivani N',
    ifsc: 'HDFC0000240',
    branch: 'Bengaluru - Indiranagar',
    upi: 'srivani@hdfcbank',
    balance: '₹82,450.60',
    status: 'Primary',
    tone: 'bg-blue-50 text-blue-700',
    pin: '4820',
  },
  {
    bank: 'State Bank of India',
    type: 'Savings Account',
    account: 'XXXX XXXX 1290',
    holder: 'Srivani N',
    ifsc: 'SBIN0003357',
    branch: 'Mysuru Main Branch',
    upi: 'srivani@sbi',
    balance: '₹34,120.25',
    status: 'Active',
    tone: 'bg-violet-50 text-violet-700',
    pin: '1190',
  },
  {
    bank: 'Axis Bank',
    type: 'Salary Account',
    account: 'XXXX XXXX 2554',
    holder: 'Srivani N',
    ifsc: 'UTIB0000114',
    branch: 'Hyderabad - Gachibowli',
    upi: 'srivani@axis',
    balance: '₹1,18,900.00',
    status: 'Active',
    tone: 'bg-rose-50 text-rose-700',
    pin: '2554',
  },
  {
    bank: 'ICICI Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    bank: 'Kotak Mahindra Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    bank: 'Punjab National Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    bank: 'Bank of Baroda',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    bank: 'Canara Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    bank: 'Union Bank of India',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-red-50 text-red-700',
  },
  {
    bank: 'IDFC FIRST Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    bank: 'Yes Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-blue-50 text-blue-700',
  },
  {
    bank: 'Federal Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-indigo-50 text-indigo-700',
  },
  {
    bank: 'Indian Bank',
    type: 'Savings Account',
    account: 'Ready to link',
    holder: 'Srivani N',
    ifsc: 'Select branch',
    branch: 'Popular bank',
    upi: 'Add UPI ID',
    balance: 'Not linked',
    status: 'Available',
    tone: 'bg-cyan-50 text-cyan-700',
  },
];

const bankBalanceByName = {
  'ICICI Bank': '₹46,780.35',
  'Kotak Mahindra Bank': '₹22,940.00',
  'Punjab National Bank': '₹18,620.75',
  'Bank of Baroda': '₹39,500.20',
  'Canara Bank': '₹27,340.90',
  'Union Bank of India': '₹31,875.40',
  'IDFC FIRST Bank': '₹64,210.10',
  'Yes Bank': '₹15,990.50',
  'Federal Bank': '₹52,430.65',
  'Indian Bank': '₹24,705.30',
  'HDFC Bank': '₹82,450.60',
  'State Bank of India': '₹34,120.25',
  'Axis Bank': '₹1,18,900.00',
};

const accountNumbers = {
  'ICICI Bank': 'XXXX XXXX 8062',
  'Kotak Mahindra Bank': 'XXXX XXXX 7448',
  'Punjab National Bank': 'XXXX XXXX 5930',
  'Bank of Baroda': 'XXXX XXXX 3186',
  'Canara Bank': 'XXXX XXXX 9074',
  'Union Bank of India': 'XXXX XXXX 6412',
  'IDFC FIRST Bank': 'XXXX XXXX 2805',
  'Yes Bank': 'XXXX XXXX 7721',
  'Federal Bank': 'XXXX XXXX 4598',
  'Indian Bank': 'XXXX XXXX 1369',
};

const ifscCodes = {
  'ICICI Bank': 'ICIC0001204',
  'Kotak Mahindra Bank': 'KKBK0000422',
  'Punjab National Bank': 'PUNB0123400',
  'Bank of Baroda': 'BARB0INDIRA',
  'Canara Bank': 'CNRB0002781',
  'Union Bank of India': 'UBIN0564201',
  'IDFC FIRST Bank': 'IDFB0080152',
  'Yes Bank': 'YESB0000341',
  'Federal Bank': 'FDRL0001892',
  'Indian Bank': 'IDIB000B146',
};

export const upiService = {
  async getBankAccounts() {
    await mockDelay(true, 350);
    let accounts = storageService.getBankAccounts([]);
    if (accounts.length === 0) {
      storageService.setBankAccounts(initialBankAccounts);
      accounts = initialBankAccounts;
    }
    
    const user = storageService.getUser();
    if (user) {
      const userName = user.name || 'PayShift User';
      const userHandle = user.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user';
      let hasChanges = false;
      
      const fixedAccounts = accounts.map(acc => {
        if (acc.holder !== userName) {
          hasChanges = true;
          const updated = {
            ...acc,
            holder: userName
          };
          if (updated.upi && updated.upi.includes('srivani@')) {
            updated.upi = updated.upi.replace('srivani@', `${userHandle}@`);
          } else if (updated.upi === 'srivani@hdfcbank') {
            updated.upi = `${userHandle}@hdfcbank`;
          } else if (updated.upi === 'srivani@sbi') {
            updated.upi = `${userHandle}@sbi`;
          } else if (updated.upi === 'srivani@axis') {
            updated.upi = `${userHandle}@axis`;
          }
          return updated;
        }
        return acc;
      });
      
      if (hasChanges) {
        storageService.setBankAccounts(fixedAccounts);
        accounts = fixedAccounts;
      }
    }
    
    return accounts;
  },

  async linkBank(bankName, pin) {
    await mockDelay(true, 750);
    const accounts = await this.getBankAccounts();
    const hasPrimary = accounts.some(acc => acc.status === 'Primary');
    const user = storageService.getUser();
    const userName = user?.name || 'PayShift User';
    const userHandle = user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user';
    const updated = accounts.map((acc) => {
      if (acc.bank === bankName) {
        return {
          ...acc,
          holder: userName,
          account: accountNumbers[bankName] || 'XXXX XXXX 6789',
          ifsc: ifscCodes[bankName] || 'BANK0001234',
          branch: 'Verified Branch',
          upi: `${userHandle}@${bankName.toLowerCase().replace(/\s+bank/g, '').replace(/\s+/g, '')}`,
          balance: bankBalanceByName[bankName] || '₹12,500.00',
          status: hasPrimary ? 'Active' : 'Primary',
          pin: pin || '1234',
        };
      }
      return acc;
    });
    storageService.setBankAccounts(updated);
    return updated;
  },

  async updateBankPin(bankName, pin) {
    await mockDelay(true, 500);
    const accounts = await this.getBankAccounts();
    const updated = accounts.map((acc) => {
      if (acc.bank === bankName) {
        return { ...acc, pin };
      }
      return acc;
    });
    storageService.setBankAccounts(updated);
    return updated;
  },

  async unlinkBank(bankName) {
    await mockDelay(true, 700);
    const accounts = await this.getBankAccounts();
    
    // Check if we are removing a primary account. If so, select another linked account as primary.
    let target = accounts.find((acc) => acc.bank === bankName);
    const wasPrimary = target?.status === 'Primary';
    
    const updated = accounts.map((acc) => {
      if (acc.bank === bankName) {
        return {
          ...acc,
          account: 'Ready to link',
          ifsc: 'Select branch',
          branch: 'Popular bank',
          upi: 'Add UPI ID',
          balance: 'Not linked',
          status: 'Available',
        };
      }
      return acc;
    });
    
    if (wasPrimary) {
      const firstActiveIdx = updated.findIndex((acc) => acc.status === 'Active');
      if (firstActiveIdx !== -1) {
        updated[firstActiveIdx].status = 'Primary';
      }
    }
    
    storageService.setBankAccounts(updated);
    return updated;
  },

  async addUpiId(bankName, upiId) {
    if (!this.verifyUpiId(upiId)) {
      throw new Error('Invalid UPI ID format. Should be in name@bank format (e.g. user@paytm)');
    }
    await mockDelay(true, 500);
    const accounts = await this.getBankAccounts();
    const updated = accounts.map((acc) => {
      if (acc.bank === bankName) {
        return { ...acc, upi: upiId };
      }
      return acc;
    });
    storageService.setBankAccounts(updated);
    return updated;
  },

  async setPrimaryAccount(bankName) {
    await mockDelay(true, 600);
    const accounts = await this.getBankAccounts();
    const updated = accounts.map((acc) => {
      if (acc.bank === bankName) {
        return { ...acc, status: 'Primary' };
      }
      if (acc.status === 'Primary') {
        return { ...acc, status: 'Active' };
      }
      return acc;
    });
    storageService.setBankAccounts(updated);
    return updated;
  },

  verifyUpiId(upiId) {
    // Basic validation: user@bankname
    const regex = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$/;
    return regex.test(upiId);
  },

  initializeNewUserBankAccounts() {
    const user = storageService.getUser();
    const userName = user?.name || 'PayShift User';
    const unlinked = initialBankAccounts.map(acc => ({
      ...acc,
      holder: userName,
      account: 'Ready to link',
      ifsc: 'Select branch',
      branch: 'Popular bank',
      upi: 'Add UPI ID',
      balance: 'Not linked',
      status: 'Available',
      pin: undefined
    }));
    storageService.setBankAccounts(unlinked);
  }
};
export default upiService;
