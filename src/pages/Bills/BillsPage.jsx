import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ReceiptText, RefreshCcw, Loader2, CheckCircle2, 
  ArrowLeft, Landmark, CreditCard, ShieldCheck, 
  Tv, Droplet, Flame, Wifi, Activity 
} from 'lucide-react';
import { mockDelay } from '../../services/api.js';
import { walletService } from '../../services/api/walletService';
import { transactionService } from '../../services/api/transactionService';
import { storageService } from '../../services/storage/storage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';

export function BillsPage() {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(() => storageService.getWalletBalance());
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Form States
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  const billCategories = [
    { id: 'elec', title: 'Electricity', amount: 1264, defaultProvider: 'Tata Power DDL', icon: Activity, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' },
    { id: 'water', title: 'Water Bill', amount: 420, defaultProvider: 'Delhi Jal Board', icon: Droplet, tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400' },
    { id: 'gas', title: 'Gas Cylinder', amount: 918, defaultProvider: 'Indane Gas Cylinder', icon: Flame, tone: 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400' },
    { id: 'broadband', title: 'Broadband', amount: 799, defaultProvider: 'JioFiber Broadband', icon: Wifi, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' },
    { id: 'dth', title: 'DTH Recharge', amount: 350, defaultProvider: 'Tata Play DTH', icon: Tv, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400' },
    { id: 'cc', title: 'Credit Card', amount: 4250, defaultProvider: 'HDFC Bank Credit Card', icon: CreditCard, tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450' },
    { id: 'fastag', title: 'FASTag', amount: 500, defaultProvider: 'PayShift FASTag Operator', icon: RefreshCcw, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450' },
    { id: 'insur', title: 'Insurance', amount: 2199, defaultProvider: 'LIC Premium Policy', icon: ShieldCheck, tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350' },
  ];

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setProvider(cat.defaultProvider);
    setAccountNumber('');
    setAmount(String(cat.amount));
    setBillDetails(null);
    setPaid(false);
    setPaymentError('');
  };

  const handleFetchBill = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setPaymentError('Please enter a valid billing/consumer number');
      return;
    }

    setLoading(true);
    setPaymentError('');
    setPaid(false);
    try {
      // Simulate network fetch
      const details = await mockDelay({
        customerName: 'Srivani N',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 5 days from now
        amount: amount || '1200',
        billId: `BIL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      }, 850);

      setBillDetails(details);
      setAmount(details.amount);
      showToast('Bill invoice fetched successfully');
    } catch {
      setPaymentError('Failed to retrieve bill details. Please check your account number.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    if (!billDetails || paying) return;
    const payable = Number(billDetails.amount);

    if (payable > walletBalance) {
      setPaymentError('Insufficient wallet balance. Please add money to wallet.');
      showToast('Insufficient wallet balance');
      return;
    }

    setPaying(true);
    setPaymentError('');
    try {
      // simulate debit
      const res = await walletService.withdrawMoney(payable, 'PayShift Wallet');
      setWalletBalance(res.balance);

      const now = new Date();
      const transactionId = `TXN${now.getTime().toString().slice(-8)}`;
      const utr = `BIL${now.getTime().toString().slice(-8)}`;

      // Save Transaction
      const billTx = {
        id: transactionId,
        title: `${selectedCategory.title} Paid: ${provider}`,
        amount: -payable,
        type: 'Bill',
        status: 'Success',
        date: now.toISOString().slice(0, 10),
        method: 'Wallet Pay',
        bank: 'PayShift Wallet',
        utr,
        balanceAfter: `₹${res.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      };

      await transactionService.addTransaction(billTx);

      // Alert notify
      const notifService = (await import('../../services/api/notificationService')).notificationService;
      await notifService.addNotification(
        'Bill Paid',
        'Utility Bill Paid',
        `Utility bill of ₹${payable} for ${provider} paid successfully.`
      );

      setPaid(true);
      showToast('Bill paid successfully!', 'success');
    } catch (err) {
      setPaymentError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            if (selectedCategory) setSelectedCategory(null);
            else navigate('/dashboard');
          }}
          className="p-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {selectedCategory ? `${selectedCategory.title} Payment` : 'Recharges & Bill Payments'}
          </h2>
          <p className="text-xs text-slate-400">Pay utility invoices instantly</p>
        </div>
      </div>

      {/* Main Content Box */}
      {!selectedCategory ? (
        <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {billCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/45 dark:bg-slate-900/45 p-4 text-left hover:border-brand-500 dark:hover:border-brand-500 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <span className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${category.tone}`}>
                    <Icon size={21} />
                  </span>
                  <p className="font-black text-slate-900 dark:text-slate-50 text-sm">{category.title}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-450 dark:text-slate-500">Instant settlements</p>
                  <p className="mt-2 text-xs font-black text-brand-700 dark:text-brand-500">₹{category.amount}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-6">
          
          {/* Wallet Balance Display */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <ReceiptText size={16} className="text-brand-500" />
              <span>Wallet Balance:</span>
            </div>
            <span className="text-sm font-black text-brand-700 dark:text-brand-500">
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleFetchBill} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                  Select Utility Provider
                </span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                >
                  <option value={selectedCategory.defaultProvider}>{selectedCategory.defaultProvider}</option>
                  <option value="Alternative Provider A">Alternative Provider A</option>
                  <option value="Alternative Provider B">Alternative Provider B</option>
                </select>
              </label>

              <Input
                label="Consumer / Billing Account Number"
                value={accountNumber}
                onChange={(val) => setAccountNumber(val.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="Enter consumer number"
                required
              />

              <Input
                label="Amount (₹)"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Enter bill value"
                className="sm:col-span-2"
                required
              />

            </div>

            <Button
              type="submit"
              variant="secondary"
              loading={loading}
              className="w-full h-12 mt-2"
            >
              <RefreshCcw size={16} className="mr-1.5" />
              Fetch Bill Details
            </Button>
          </form>

          {/* Fetched invoice checklist and checkout */}
          {billDetails && (
            <div className="rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-950 dark:text-white border-b border-brand-500/10 pb-2">
                Invoice Details
              </h3>
              
              <div className="divide-y divide-slate-150/40 dark:divide-slate-800/40 font-bold text-xs">
                <SummaryRow label="Consumer Name" value={billDetails.customerName} />
                <SummaryRow label="Due Date" value={billDetails.dueDate} />
                <SummaryRow label="Invoice ID" value={billDetails.billId} />
                <SummaryRow label="Total Payable" value={`₹${Number(billDetails.amount).toLocaleString('en-IN')}`} />
              </div>

              {paymentError && (
                <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400">
                  {paymentError}
                </p>
              )}

              {paid ? (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 p-4 font-black text-sm text-emerald-800 dark:text-emerald-450 border border-emerald-100/10">
                  <CheckCircle2 size={18} /> Invoice Settled Successfully!
                </div>
              ) : (
                <Button
                  onClick={handlePayBill}
                  loading={paying}
                  className="w-full h-12"
                >
                  Pay Invoice from Wallet
                </Button>
              )}
            </div>
          )}

        </section>
      )}

    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-slate-700 dark:text-slate-350">
      <span className="text-slate-400 dark:text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-900 dark:text-white text-right truncate max-w-xs">{value}</span>
    </div>
  );
}

export default BillsPage;
