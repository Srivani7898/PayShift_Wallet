import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, RefreshCcw, Loader2, CheckCircle2, ArrowLeft, Landmark } from 'lucide-react';
import { mockDelay } from '../../services/api.js';
import { walletService } from '../../services/api/walletService';
import { transactionService } from '../../services/api/transactionService';
import { storageService } from '../../services/storage/storage';
import { operators, rechargePacks } from '../../constants/mockData';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';

export function RechargePage() {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(() => storageService.getWalletBalance());
  
  // Form States
  const [operator, setOperator] = useState(operators[0]);
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [bill, setBill] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  const handleFetchBill = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (number.length < 8) {
      setPaymentError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    setPaid(false);
    setPaymentError('');
    try {
      // simulate network fetch
      const billData = await mockDelay({
        dueDate: 'Instant Recharge',
        amount: amount || '299',
      }, 700);
      
      setBill(billData);
      setAmount(billData.amount);
      showToast('Bill/pack fetched successfully');
    } catch {
      setPaymentError('Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPack = (pack) => {
    setAmount(String(pack.price));
    setBill({
      dueDate: 'Instant Recharge',
      amount: String(pack.price),
      pack,
    });
    setPaid(false);
    setPaymentError('');
  };

  const handlePayBill = async () => {
    if (!bill || paying) return;
    const payable = Number(bill.amount);
    
    if (payable > walletBalance) {
      setPaymentError('Insufficient wallet balance. Please add money to wallet first.');
      showToast('Insufficient wallet balance');
      return;
    }
    
    setPaying(true);
    setPaymentError('');
    try {
      // Simulate debit
      const res = await walletService.withdrawMoney(payable, 'PayShift Wallet');
      setWalletBalance(res.balance);
      
      // Update transaction list
      const now = new Date();
      const transactionId = `TXN${now.getTime().toString().slice(-8)}`;
      const utr = `REC${now.getTime().toString().slice(-8)}`;
      
      const rechargeTx = {
        id: transactionId,
        title: `Mobile Recharge: ${operator}`,
        amount: -payable,
        type: 'Recharge',
        status: 'Success',
        date: now.toISOString().slice(0, 10),
        method: 'Wallet Pay',
        bank: 'PayShift Wallet',
        utr,
        balanceAfter: `₹${res.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      };
      
      await transactionService.addTransaction(rechargeTx);
      
      // Alert notify
      const notifService = (await import('../../services/api/notificationService')).notificationService;
      await notifService.addNotification(
        'Recharge Success',
        'Recharge Successful',
        `Recharge of ₹${payable} for mobile ${number} was successful.`
      );

      setPaid(true);
      showToast('Recharge successful!', 'success');
    } catch (err) {
      setPaymentError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Mobile Recharge</h2>
          <p className="text-xs text-slate-400">Recharge prepaid and postpaid connections</p>
        </div>
      </div>

      <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-6">
        
        {/* Wallet Balance Display */}
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Smartphone size={16} className="text-brand-500" />
            <span>PayShift Wallet Balance:</span>
          </div>
          <span className="text-sm font-black text-brand-700 dark:text-brand-500">
            ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleFetchBill} className="grid gap-4 sm:grid-cols-2">
          
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
              Select Operator
            </span>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              {operators.filter(op => op.includes('Prepaid') || op.includes('BSNL')).map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </label>

          <Input
            label="Mobile Number"
            type="tel"
            maxLength={10}
            value={number}
            onChange={(val) => setNumber(val.replace(/\D/g, ''))}
            placeholder="10-digit number"
            required
          />

          <Input
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(val) => setAmount(val)}
            placeholder="Enter recharge value"
            required
          />

          <Button
            type="submit"
            variant="secondary"
            loading={loading}
            className="sm:col-span-2 rounded-2xl h-12 mt-2"
          >
            <RefreshCcw size={16} className="mr-1.5" />
            Fetch Suggested Packs & Bill
          </Button>

        </form>

        {/* Suggested packs Grid */}
        <div className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50">
              Suggested Packs
            </h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">Tap to select</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rechargePacks.map((pack) => {
              const isActive = Number(amount) === pack.price;
              return (
                <div
                  key={pack.id}
                  onClick={() => handleSelectPack(pack)}
                  className={`rounded-2xl border p-4 text-left transition duration-150 cursor-pointer ${
                    isActive
                      ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-350 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-black text-slate-600 dark:text-slate-300">
                      {pack.title}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-55">₹{pack.price}</span>
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">{pack.data}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Validity: {pack.validity} • {pack.calls}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected pack / checkout card */}
        {bill && (
          <div className="mt-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-brand-500/10 pb-2.5">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-500">Selected Operator</span>
                <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">{operator}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-brand-500">Payable Amount</span>
                <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">₹{bill.amount}</p>
              </div>
            </div>

            {paymentError && (
              <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400">
                {paymentError}
              </p>
            )}

            {paid ? (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 p-4 font-black text-sm text-emerald-800 dark:text-emerald-400 border border-emerald-100/10">
                <CheckCircle2 size={18} /> Recharge Completed Successfully!
              </div>
            ) : (
              <Button
                onClick={handlePayBill}
                loading={paying}
                className="w-full h-12"
              >
                Pay Securely from Wallet
              </Button>
            )}
          </div>
        )}

      </section>
    </div>
  );
}

export default RechargePage;
