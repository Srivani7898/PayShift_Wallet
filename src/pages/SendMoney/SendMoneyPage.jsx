/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Smartphone, Send, CreditCard, RefreshCcw, Landmark, 
  Loader2, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

import { upiService } from '../../services/api/upiService';
import { transactionService } from '../../services/api/transactionService';
import { storageService } from '../../services/storage/storage';
import { showToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function SendMoneyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Stages: 'details', 'confirm', 'pin', 'result'
  const [stage, setStage] = useState('details');
  const [mode, setMode] = useState('mobile'); // 'mobile', 'upi', 'fastag', 'self'
  const [bankAccounts, setBankAccounts] = useState([]);
  
  // Form States
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [selfDestBankName, setSelfDestBankName] = useState('');
  const [paymentPin, setPaymentPin] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [resultStatus, setResultStatus] = useState('Success'); // 'Success' | 'Failed'
  const [resultMessage, setResultMessage] = useState('');
  const [pinSetupMode, setPinSetupMode] = useState(false);
  const [newPinForm, setNewPinForm] = useState({ pin: '', confirm: '' });

  const loadBankAccounts = async () => {
    try {
      const accounts = await upiService.getBankAccounts();
      setBankAccounts(accounts);
      
      const activeAccounts = accounts.filter(a => a.status !== 'Available');
      if (activeAccounts.length > 0) {
        setSelectedBankName(activeAccounts.find(a => a.status === 'Primary')?.bank || activeAccounts[0].bank);
        const otherAccounts = activeAccounts.filter(a => a.bank !== selectedBankName);
        if (otherAccounts.length > 0) {
          setSelfDestBankName(otherAccounts[0].bank);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBankAccounts();
    
    // Check if initial mode passed via navigate state
    if (location.state?.mode) {
      setMode(location.state.mode);
    }
  }, [location.state]);

  const activeAccounts = bankAccounts.filter(a => a.status !== 'Available');
  const sourceAccount = activeAccounts.find(a => a.bank === selectedBankName);
  const destinationAccount = activeAccounts.find(a => a.bank === selfDestBankName);

  const getSourceBalanceNum = () => {
    if (!sourceAccount) return 0;
    return Number(sourceAccount.balance.replace(/[₹,]/g, ''));
  };

  // Validations
  const isPayeeValid = () => {
    if (mode === 'mobile') return payee.length === 10;
    if (mode === 'upi') return upiService.verifyUpiId(payee);
    if (mode === 'fastag') return payee.trim().length >= 6;
    if (mode === 'self') return !!destinationAccount && selectedBankName !== selfDestBankName;
    return false;
  };

  const isFormValid = () => {
    const amtNum = Number(amount);
    return isPayeeValid() && amtNum > 0 && !!sourceAccount;
  };

  const handleCreatePin = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newPinForm.pin)) {
      setPaymentError('PIN must be 4 to 6 digits');
      return;
    }
    if (newPinForm.pin !== newPinForm.confirm) {
      setPaymentError('PINs do not match');
      return;
    }
    setLoading(true);
    try {
      const updatedAccounts = await upiService.updateBankPin(sourceAccount.bank, newPinForm.pin);
      setBankAccounts(updatedAccounts);
      setPinSetupMode(false);
      setPaymentError('');
      showToast(`UPI PIN created for ${sourceAccount.bank}!`, 'success');
    } catch (err) {
      console.error(err);
      setPaymentError('Failed to configure UPI PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDetails = () => {
    if (!isFormValid()) return;
    const amtNum = Number(amount);
    if (amtNum > getSourceBalanceNum()) {
      setPaymentError('Insufficient account balance');
      showToast('Insufficient account balance');
      return;
    }
    setPaymentError('');
    setStage('confirm');
  };

  const handleConfirmToPin = () => {
    if (sourceAccount && !sourceAccount.pin) {
      setPinSetupMode(true);
    } else {
      setPinSetupMode(false);
    }
    setStage('pin');
  };

  const executePayment = async (e) => {
    e.preventDefault();
    const bankPin = sourceAccount?.pin;
    
    if (paymentPin !== bankPin) {
      setPaymentError('Incorrect UPI PIN. Please try again.');
      setPaymentPin('');
      return;
    }

    setLoading(true);
    setPaymentError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulate delay
      
      const amtNum = Number(amount);
      const balanceBefore = getSourceBalanceNum();
      const balanceAfter = balanceBefore - amtNum;
      
      // Update local storage bank accounts
      const updatedAccounts = bankAccounts.map((acc) => {
        if (acc.bank === selectedBankName) {
          return {
            ...acc,
            balance: `₹${balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          };
        }
        if (mode === 'self' && acc.bank === selfDestBankName) {
          const destBalBefore = Number(acc.balance.replace(/[₹,]/g, ''));
          const destBalAfter = destBalBefore + amtNum;
          return {
            ...acc,
            balance: `₹${destBalAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          };
        }
        return acc;
      });

      storageService.setBankAccounts(updatedAccounts);

      // Save Transaction History
      const now = new Date();
      const transactionId = `TXN${now.getTime().toString().slice(-8)}`;
      const utr = `UPI${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${now.getTime().toString().slice(-6)}`;
      
      const txnRecord = {
        id: transactionId,
        title: mode === 'self' ? `Self Transfer to ${selfDestBankName}` : `Paid to ${payee}`,
        date: now.toISOString().slice(0, 10),
        type: mode === 'self' ? 'UPI' : mode === 'fastag' ? 'Bill' : 'UPI',
        status: 'Success',
        amount: -amtNum,
        payee: mode === 'self' ? selfDestBankName : payee,
        method: mode === 'self' ? 'Self Transfer' : mode.toUpperCase(),
        bank: selectedBankName,
        account: sourceAccount.account,
        upi: sourceAccount.upi,
        toBank: mode === 'self' ? selfDestBankName : null,
        toAccount: mode === 'self' ? destinationAccount.account : null,
        utr,
        balanceAfter: `₹${balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      };

      await transactionService.addTransaction(txnRecord);
      
      // Add alert notification
      const notifService = (await import('../../services/api/notificationService')).notificationService;
      await notifService.addNotification(
        'Money Sent',
        'Payment Successful',
        `₹${amtNum} sent successfully from ${selectedBankName} to ${mode === 'self' ? selfDestBankName : payee}.`
      );

      setResultStatus('Success');
      setResultMessage(`₹${amtNum.toLocaleString('en-IN')} successfully debited from ${selectedBankName}.`);
      setStage('result');
      
    } catch (err) {
      setResultStatus('Failed');
      setResultMessage(err.message || 'Payment processing failed. Please check network connection.');
      setStage('result');
    } finally {
      setLoading(false);
    }
  };

  const paymentModes = [
    { id: 'mobile', label: 'Mobile', icon: Smartphone, placeholder: 'Enter 10-digit mobile number' },
    { id: 'upi', label: 'UPI ID', icon: Send, placeholder: 'e.g. username@upi' },
    { id: 'fastag', label: 'FASTag', icon: CreditCard, placeholder: 'e.g. KA01AB1234' },
    { id: 'self', label: 'Self', icon: RefreshCcw, placeholder: 'Transfer between linked banks' },
  ];

  const currentMode = paymentModes.find(m => m.id === mode);

  return (
    <div className="mx-auto max-w-xl">
      <section className="glass-panel rounded-[28px] p-6 shadow-soft">
        
        {/* Back button header */}
        {stage !== 'result' && (
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => {
                if (stage === 'pin') setStage('confirm');
                else if (stage === 'confirm') setStage('details');
                else navigate(-1);
              }}
              className="p-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Send Money</h2>
              <p className="text-xs text-slate-400">Secure instant bank transfers</p>
            </div>
          </div>
        )}

        {/* DETAILS STAGE */}
        {stage === 'details' && (
          <div className="space-y-4">
            
            {/* Mode Tabs */}
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-1 shadow-inner">
              {paymentModes.map((item) => {
                const Icon = item.icon;
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex flex-col sm:flex-row h-12 items-center justify-center gap-1 sm:gap-2 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-500 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    onClick={() => {
                      setMode(item.id);
                      setPayee('');
                      setPaymentError('');
                    }}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {activeAccounts.length === 0 ? (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100/20 p-5 text-center">
                <p className="text-sm font-black text-amber-900 dark:text-amber-450">No Linked Bank Accounts</p>
                <p className="text-xs text-slate-400 mt-1">Please link a bank account from profile before sending money.</p>
                <Button variant="primary" size="sm" className="mt-3 rounded-xl" onClick={() => navigate('/upi')}>
                  Link Bank
                </Button>
              </div>
            ) : (
              <>
                {/* Payee Selection field */}
                {mode === 'self' ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                      Transfer To (Own Bank)
                    </span>
                    <select
                      value={selfDestBankName}
                      onChange={(e) => setSelfDestBankName(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    >
                      {activeAccounts
                        .filter(a => a.bank !== selectedBankName)
                        .map((acc) => (
                          <option key={acc.bank} value={acc.bank}>
                            {acc.bank} ({acc.account}) - {acc.balance}
                          </option>
                        ))}
                      {activeAccounts.filter(a => a.bank !== selectedBankName).length === 0 && (
                        <option value="">Link another bank account first</option>
                      )}
                    </select>
                  </label>
                ) : (
                  <Input
                    label={mode === 'mobile' ? 'Mobile Number' : mode === 'upi' ? 'UPI ID' : 'FASTag Vehicle Number'}
                    type={mode === 'mobile' ? 'tel' : 'text'}
                    maxLength={mode === 'mobile' ? 10 : undefined}
                    value={payee}
                    onChange={(val) => {
                      setPayee(mode === 'mobile' ? val.replace(/\D/g, '') : mode === 'fastag' ? val.toUpperCase() : val);
                      setPaymentError('');
                    }}
                    placeholder={currentMode.placeholder}
                    error={payee && !isPayeeValid() ? `Invalid ${currentMode.label} format` : ''}
                    required
                  />
                )}

                {/* Debited Bank Selection field */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-350">
                    Pay From Account
                  </span>
                  <select
                    value={selectedBankName}
                    onChange={(e) => {
                      setSelectedBankName(e.target.value);
                      // Make sure source and destination are different for self transfers
                      if (mode === 'self' && e.target.value === selfDestBankName) {
                        const other = activeAccounts.find(a => a.bank !== e.target.value);
                        setSelfDestBankName(other ? other.bank : '');
                      }
                      setPaymentError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    {activeAccounts.map((acc) => (
                      <option key={acc.bank} value={acc.bank}>
                        {acc.bank} - {acc.account} (Bal: {acc.balance})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Amount input */}
                <Input
                  label="Amount (₹)"
                  type="number"
                  value={amount}
                  onChange={(val) => {
                    setAmount(val);
                    setPaymentError('');
                  }}
                  placeholder="Enter amount to pay"
                  error={paymentError}
                  required
                />

                <Button
                  className="w-full mt-4"
                  onClick={handleVerifyDetails}
                  disabled={!isFormValid()}
                >
                  Continue
                </Button>
              </>
            )}

          </div>
        )}

        {/* CONFIRMATION SUMMARY STAGE */}
        {stage === 'confirm' && (
          <div className="space-y-4 pt-1">
            <h3 className="text-base font-black text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2">
              Payment Summary
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-850 rounded-2xl border border-slate-100 dark:border-slate-850/60 font-bold text-xs">
              <SummaryRow label="Debited Account" value={selectedBankName} />
              <SummaryRow label="Transfer Method" value={currentMode.label} />
              <SummaryRow 
                label={mode === 'self' ? 'Beneficiary Bank' : 'Recipient'} 
                value={mode === 'self' ? selfDestBankName : payee} 
              />
              <SummaryRow label="Transfer Amount" value={`₹${Number(amount).toLocaleString('en-IN')}`} />
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/65 p-4 text-xs font-bold text-slate-500">
              Please double check recipient details. Transferred funds are credited instantly on the NPCI network.
            </div>

            <Button
              className="w-full mt-2"
              onClick={handleConfirmToPin}
            >
              Confirm & Pay ₹{amount}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setStage('details')}
            >
              Edit Details
            </Button>
          </div>
        )}

        {/* PIN CODE VERIFICATION STAGE */}
        {stage === 'pin' && (
          <div className="space-y-4 pt-1">
            {pinSetupMode ? (
              <form onSubmit={handleCreatePin} className="space-y-4">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100/10 p-4">
                  <p className="text-xs font-black text-amber-950 dark:text-amber-450">Create UPI PIN</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    You haven't configured a payment PIN yet. Please create a 4 to 6 digit security PIN now.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="New UPI PIN"
                    type="password"
                    maxLength={6}
                    value={newPinForm.pin}
                    onChange={(val) => setNewPinForm({ ...newPinForm, pin: val.replace(/\D/g, '') })}
                    placeholder="••••"
                  />
                  <Input
                    label="Confirm PIN"
                    type="password"
                    maxLength={6}
                    value={newPinForm.confirm}
                    onChange={(val) => setNewPinForm({ ...newPinForm, confirm: val.replace(/\D/g, '') })}
                    placeholder="••••"
                    error={paymentError}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create PIN & Proceed
                </Button>
              </form>
            ) : (
              <form onSubmit={executePayment} className="space-y-4">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-center">
                  <span className="text-[11px] font-bold text-slate-450 uppercase">Authorizing Payment</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    ₹{Number(amount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 font-bold leading-normal">
                    debited from {selectedBankName} to {mode === 'self' ? selfDestBankName : payee}
                  </p>
                </div>

                <div className="relative">
                  <Input
                    label="Enter UPI PIN"
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    value={paymentPin}
                    onChange={(val) => {
                      setPaymentPin(val.replace(/\D/g, ''));
                      setPaymentError('');
                    }}
                    placeholder="••••"
                    error={paymentError}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-10 text-slate-400 hover:text-slate-650 transition"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  loading={loading}
                  disabled={paymentPin.length < 4}
                >
                  Confirm & Transfer Securely
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setStage('confirm')}
                  disabled={loading}
                >
                  Go Back
                </Button>
              </form>
            )}
          </div>
        )}

        {/* RESULTS SCREEN STAGE */}
        {stage === 'result' && (
          <div className="text-center py-6 space-y-4">
            
            {/* Success Check / Failed Cross animation hooks */}
            <div className="flex justify-center">
              {resultStatus === 'Success' ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="h-20 w-20 grid place-items-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"
                >
                  <CheckCircle2 size={54} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="h-20 w-20 grid place-items-center rounded-full bg-red-50 dark:bg-red-950/20 text-red-500"
                >
                  <XCircle size={54} />
                </motion.div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {resultStatus === 'Success' ? 'Payment Successful' : 'Payment Failed'}
              </h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                {resultMessage}
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                className="w-full max-w-xs mx-auto"
                onClick={() => {
                  setStage('details');
                  setPayee('');
                  setAmount('');
                  setPaymentPin('');
                }}
              >
                Make Another Transfer
              </Button>
              <Button
                variant="secondary"
                className="w-full max-w-xs mx-auto"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-slate-700 dark:text-slate-350">
      <span className="text-slate-400 dark:text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-900 dark:text-white text-right truncate max-w-xs">{value}</span>
    </div>
  );
}

export default SendMoneyPage;
