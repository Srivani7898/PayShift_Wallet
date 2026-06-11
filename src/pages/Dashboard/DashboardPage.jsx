/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, Smartphone, Send, QrCode, Link2, Trophy, 
  Sparkles, ArrowRight, ShieldCheck, PlusCircle, ArrowUpRight, 
  Bell, Landmark, Lock, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

import { walletService } from '../../services/api/walletService';
import { transactionService } from '../../services/api/transactionService';
import { upiService } from '../../services/api/upiService';
import { rewardService } from '../../services/api/rewardService';
import { notificationService } from '../../services/api/notificationService';
import { storageService } from '../../services/storage/storage';

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton, CardSkeleton, TransactionSkeleton } from '../../components/ui/Skeleton';
import { showToast } from '../../components/ui/Toast';

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [latestNotif, setLatestNotif] = useState(null);
  
  // Modal / Drawer States
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCheckBalanceOpen, setIsCheckBalanceOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  
  // Transaction Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Form States
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [upiPin, setUpiPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [balanceReveal, setBalanceReveal] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const balance = await walletService.getBalance();
      setWalletBalance(balance);
      
      const txData = await transactionService.getTransactions({ limit: 3 });
      setTransactions(txData.transactions);
      
      const banks = await upiService.getBankAccounts();
      setBankAccounts(banks);
      
      const offData = await rewardService.getOffers();
      setOffers(offData);
      
      const notifs = await notificationService.getNotifications();
      const unread = notifs.find(n => !n.read);
      setLatestNotif(unread || notifs[0] || null);
      
      if (banks.filter(b => b.status !== 'Available').length > 0) {
        setWithdrawBank(banks.find(b => b.status !== 'Available')?.bank || '');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      showToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Listen to updates
    const handleBalanceChange = () => {
      setWalletBalance(storageService.getWalletBalance());
    };
    window.addEventListener('payswift:balance_updated', handleBalanceChange);
    return () => window.removeEventListener('payswift:balance_updated', handleBalanceChange);
  }, []);

  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amount = Number(addAmount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await walletService.addMoney(amount);
      setWalletBalance(res.balance);
      setIsAddMoneyOpen(false);
      setAddAmount('');
      showToast(`₹${amount} added to wallet!`, 'success');
      
      // Reload recent transactions
      const txData = await transactionService.getTransactions({ limit: 3 });
      setTransactions(txData.transactions);
    } catch (err) {
      setFormError(err.message || 'Failed to add money');
    } finally {
      setFormLoading(false);
    }
  };

  const handleWithdrawMoney = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    if (amount > walletBalance) {
      setFormError('Insufficient wallet balance');
      return;
    }
    if (!withdrawBank) {
      setFormError('Please select a bank account');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await walletService.withdrawMoney(amount, withdrawBank);
      setWalletBalance(res.balance);
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      showToast(`₹${amount} withdrawn to ${withdrawBank}!`, 'success');
      
      const txData = await transactionService.getTransactions({ limit: 3 });
      setTransactions(txData.transactions);
    } catch (err) {
      setFormError(err.message || 'Failed to withdraw money');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    const pin = storageService.getPaymentPin();
    if (!pin) {
      setFormError('Please configure a UPI PIN in profile settings first');
      return;
    }
    if (upiPin !== pin) {
      setFormError('Incorrect UPI PIN');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // simulation delay
      setBalanceReveal(selectedBank.balance);
    } catch {
      setFormError('Failed to retrieve balance');
    } finally {
      setFormLoading(false);
    }
  };

  // Recharts Spending Data
  const analyticsData = [
    { name: 'Food', amount: 3200, color: '#00BAF2' },
    { name: 'Shopping', amount: 4500, color: '#6366f1' },
    { name: 'Travel', amount: 1500, color: '#8b5cf6' },
    { name: 'Bills', amount: 1264, color: '#00D084' },
    { name: 'Recharges', amount: 299, color: '#f59e0b' },
  ];

  const linkedBanks = bankAccounts.filter(b => b.status !== 'Available');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <CardSkeleton />
          <div className="glass-panel p-5 space-y-4 rounded-[28px]">
            <Skeleton variant="text" width="100px" height="15px" />
            <TransactionSkeleton />
          </div>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Alert Preview Banner */}
      {latestNotif && (
        <div 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 rounded-2xl bg-brand-500/10 dark:bg-brand-500/5 border border-brand-500/20 dark:border-brand-500/10 p-3.5 cursor-pointer hover:bg-brand-500/15 dark:hover:bg-brand-500/10 transition duration-150"
        >
          <Bell className="text-brand-500 shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
              {latestNotif.title}: {latestNotif.message}
            </p>
          </div>
          <ArrowRight className="text-brand-500 shrink-0" size={14} />
        </div>
      )}

      {/* Main Grid: Balance & Recent transactions */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Wallet Balance Card */}
        <section className="glass-panel rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl shadow-brand-500/10 flex flex-col justify-between border border-slate-900 overflow-hidden relative">
          {/* Subtle logo shine overlay */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
          
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Wallet Balance
              </span>
              <h2 className="flex items-center text-4xl font-black tracking-tight">
                <IndianRupee size={32} className="text-brand-500 shrink-0 mr-1" />
                {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-accent shadow-inner">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3.5">
            <Button
              variant="primary"
              className="bg-brand-500 hover:bg-brand-650 text-white rounded-2xl border-none shadow-md shadow-brand-500/20 py-3 text-xs"
              onClick={() => {
                setFormError('');
                setIsAddMoneyOpen(true);
              }}
            >
              <PlusCircle size={16} className="mr-1.5" />
              Add Money
            </Button>
            <Button
              variant="secondary"
              className="bg-white/10 text-white border-white/10 hover:bg-white/15 rounded-2xl py-3 text-xs"
              onClick={() => {
                if (linkedBanks.length === 0) {
                  showToast('Please link a bank account to withdraw', 'info');
                  return;
                }
                setFormError('');
                setIsWithdrawOpen(true);
              }}
            >
              <ArrowUpRight size={16} className="mr-1.5" />
              Withdraw
            </Button>
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="glass-panel rounded-[28px] p-5 flex flex-col justify-between shadow-soft">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">
                Recent Transactions
              </h3>
              <button 
                onClick={() => navigate('/transactions')} 
                className="text-xs font-black text-brand-700 dark:text-brand-500 hover:underline flex items-center gap-0.5"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                No recent transactions.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition duration-150 cursor-pointer"
                    onClick={() => setSelectedReceipt(item)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xs font-black ${
                        item.status === 'Success' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' 
                          : item.status === 'Failed'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-450'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'
                      }`}>
                        {item.type.substring(0, 3).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{item.title}</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{item.date} • {item.id}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black ${item.amount > 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                        {item.amount > 0 ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
                      </p>
                      <Badge variant={item.status === 'Success' ? 'success' : item.status === 'Failed' ? 'failed' : 'pending'} size="sm">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions grid */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <QuickActionBtn label="Send Money" icon={Send} color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" onClick={() => navigate('/send-money')} />
          <QuickActionBtn label="UPI QR Setup" icon={Link2} color="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" onClick={() => navigate('/upi')} />
          <QuickActionBtn label="Recharge" icon={Smartphone} color="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450" onClick={() => navigate('/recharge')} />
          <QuickActionBtn label="Bill Payments" icon={PlusCircle} color="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450" onClick={() => navigate('/bills')} />
          <QuickActionBtn label="Rewards" icon={Trophy} color="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" onClick={() => navigate('/rewards')} />
        </div>
      </section>

      {/* Linked accounts and Check Balance */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">
              Linked Accounts & Scanners
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Check balance and link secondary accounts</p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-xl font-bold py-1.5" onClick={() => navigate('/upi')}>
            Manage
          </Button>
        </div>

        {linkedBanks.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-150 dark:border-slate-800/80 text-center">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">No linked bank accounts</p>
            <p className="mt-1 text-xs text-slate-450">Link an account to enable UPI transfers and balance checkers.</p>
            <Button variant="primary" size="sm" className="mt-3 rounded-xl" onClick={() => navigate('/upi')}>
              Link Account
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {linkedBanks.map((account) => (
              <div 
                key={account.bank} 
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 hover:border-brand-500 dark:hover:border-brand-500 transition duration-150"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-lg ${account.tone}`}>
                      <Landmark size={15} />
                    </span>
                    <p className="font-black text-slate-900 dark:text-slate-50 text-sm truncate">{account.bank}</p>
                  </div>
                  <p className="mt-2 text-xs font-black text-slate-400 dark:text-slate-500">{account.account}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-450 dark:text-slate-500 truncate">{account.upi}</p>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs"
                  onClick={() => {
                    setSelectedBank(account);
                    setUpiPin('');
                    setBalanceReveal(null);
                    setFormError('');
                    setIsCheckBalanceOpen(true);
                  }}
                >
                  Balance
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Spend Analytics & AI Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Recharts Analytics Preview */}
        <section className="glass-panel rounded-[28px] p-5 shadow-soft">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-1">
            Spending Analytics
          </h3>
          <p className="text-xs text-slate-400 mb-5">Monthly expense breakdown by category</p>
          
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  fontWeight="bold"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  fontWeight="bold"
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 186, 242, 0.04)' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                  }} 
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={28}>
                  {analyticsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* AI Financial Insights (UI ONLY) */}
        <section className="glass-panel rounded-[28px] p-5 border border-brand-500/25 bg-gradient-to-br from-white/60 via-brand-500/5 to-indigo-500/5 dark:from-slate-900/60 dark:via-brand-500/5 dark:to-indigo-500/5 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 text-white">
                <Sparkles size={16} />
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">
                AI Financial Insights
              </h3>
            </div>
            
            <div className="space-y-4">
              <InsightRow suggestion="You spent ₹3,200 on food this month." trend="Food expenses are stable." type="neutral" />
              <InsightRow suggestion="Your mobile recharge costs increased by 12%." trend="Consider switching to Airtel best-valuepack." type="warning" />
              <InsightRow suggestion="You can save ₹1,500 by reducing shopping expenses." trend="Target: limit non-essential purchases." type="success" />
            </div>
          </div>
          
          <div className="mt-6 rounded-2xl bg-brand-500/10 dark:bg-brand-500/5 border border-brand-500/20 dark:border-brand-500/10 p-4 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
            <strong className="text-brand-700 dark:text-brand-500 block mb-1">SmartTip:</strong>
            Based on your transactions, linking your SBI credit card and paying bills on time can yield up to ₹250 cashback this month.
          </div>
        </section>
      </div>

      {/* Offers & Coupons Carousel */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-1">
          Cashback Offers & Coupons
        </h3>
        <p className="text-xs text-slate-400 mb-4">Earn points and cashback on recharges and bills</p>
        
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {offers.map((offer) => (
            <div 
              key={offer.id} 
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex flex-col justify-between h-36"
            >
              <div>
                <span className="text-[10px] font-black uppercase text-brand-500 tracking-wider">
                  Code: {offer.code}
                </span>
                <h4 className="font-black text-sm text-slate-900 dark:text-slate-50 mt-1">{offer.title}</h4>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 leading-snug truncate-2-lines">{offer.description}</p>
              </div>
              
              <button 
                onClick={() => navigate('/rewards')}
                className="text-xs font-black text-brand-700 dark:text-brand-500 hover:underline text-left mt-3 flex items-center gap-0.5"
              >
                Claim Offer <ArrowRight size={10} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DRAWER & MODAL SHEETS */}
      {/* ========================================================================= */}

      {/* ADD MONEY DRAWER */}
      <Drawer
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        title="Add Money to Wallet"
      >
        <form onSubmit={handleAddMoney} className="space-y-4 pt-1">
          <Input
            label="Amount (₹)"
            type="number"
            value={addAmount}
            onChange={setAddAmount}
            placeholder="Enter amount to add"
            error={formError}
            required
          />

          {/* Quick Amount presets */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 2000].map(val => (
              <button
                key={val}
                type="button"
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 text-xs font-black"
                onClick={() => setAddAmount(String(val))}
              >
                +₹{val}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            loading={formLoading}
          >
            Add Money Securely
          </Button>
        </form>
      </Drawer>

      {/* WITHDRAW MONEY DRAWER */}
      <Drawer
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Withdraw Money to Bank"
      >
        <form onSubmit={handleWithdrawMoney} className="space-y-4 pt-1">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 p-4 text-xs font-bold text-slate-500">
            Available Wallet Balance: <strong className="text-slate-850 dark:text-white">₹{walletBalance.toLocaleString()}</strong>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            value={withdrawAmount}
            onChange={setWithdrawAmount}
            placeholder="Enter amount to withdraw"
            error={formError}
            required
          />

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
              Select Bank Account
            </span>
            <select
              value={withdrawBank}
              onChange={(e) => setWithdrawBank(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500 dark:focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
            >
              {linkedBanks.map((acc) => (
                <option key={acc.bank} value={acc.bank}>
                  {acc.bank} - {acc.account}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="submit"
            className="w-full mt-4"
            loading={formLoading}
          >
            Withdraw to Bank
          </Button>
        </form>
      </Drawer>

      {/* SECURE CHECK BALANCE DRAWER */}
      <Drawer
        isOpen={isCheckBalanceOpen}
        onClose={() => setIsCheckBalanceOpen(false)}
        title={selectedBank ? `Check Balance: ${selectedBank.bank}` : 'Check Balance'}
      >
        <form onSubmit={handleCheckBalance} className="space-y-4 pt-1">
          {balanceReveal ? (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/20 p-5 text-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-450 uppercase tracking-widest">
                Available Bank Balance
              </span>
              <p className="mt-2 text-3xl font-black text-emerald-800 dark:text-emerald-400">
                {balanceReveal}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">Encrypted connection active</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100/10 p-4">
                <p className="text-xs font-black text-amber-900 dark:text-amber-450">UPI Verification Required</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Enter your UPI payment PIN to verify. Default PIN is <strong className="text-brand-700 font-black">1234</strong> or whatever you saved.
                </p>
              </div>

              <div className="relative">
                <Input
                  label="Enter UPI PIN"
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={upiPin}
                  onChange={(val) => setUpiPin(val.replace(/\D/g, ''))}
                  placeholder="••••"
                  error={formError}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 transition"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                loading={formLoading}
              >
                Verify & Show Balance
              </Button>
            </>
          )}
        </form>
      </Drawer>

      {/* TRANSACTION RECEIPT MODAL */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Transaction Receipt"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 text-center">
              <span className="text-xs font-bold text-slate-450 uppercase">Amount Paid</span>
              <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                ₹{Math.abs(selectedReceipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <Badge variant={selectedReceipt.status === 'Success' ? 'success' : selectedReceipt.status === 'Failed' ? 'failed' : 'pending'} className="mt-2.5">
                {selectedReceipt.status}
              </Badge>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-xs font-bold">
              <ReceiptRow label="Transaction Title" value={selectedReceipt.title} />
              <ReceiptRow label="Transaction ID" value={selectedReceipt.id} />
              <ReceiptRow label="Date" value={selectedReceipt.date} />
              <ReceiptRow label="Payment Mode" value={selectedReceipt.type} />
              <ReceiptRow label="From Source" value={selectedReceipt.bank || 'Wallet balance'} />
              <ReceiptRow label="UTR / Reference ID" value={selectedReceipt.utr || `${selectedReceipt.id}-REF`} />
              <ReceiptRow label="Wallet Balance After" value={selectedReceipt.balanceAfter || 'N/A'} />
            </div>

            <div className="rounded-2xl bg-emerald-50/65 dark:bg-emerald-950/10 p-3.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-450 border border-emerald-100/10">
              This digital receipt confirms the funds status on the PayShift network.
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => setSelectedReceipt(null)}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>

    </div>
  );
}

// Sub-components
function QuickActionBtn({ label, icon: Icon, color = '', onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:-translate-y-0.5 hover:shadow-soft transition-all duration-150"
    >
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${color} shadow-sm mb-2`}>
        <Icon size={22} />
      </span>
      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
        {label}
      </span>
    </button>
  );
}

function InsightRow({ suggestion, trend, type }) {
  const badgeColors = {
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450',
    neutral: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 p-3.5">
      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full shrink-0 mt-0.5 ${badgeColors[type]}`}>
        {type}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">
          {suggestion}
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-none">
          {trend}
        </p>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-slate-700 dark:text-slate-350">
      <span className="text-slate-400 dark:text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-850 dark:text-slate-100 text-right truncate max-w-xs">{value}</span>
    </div>
  );
}

export default DashboardPage;
