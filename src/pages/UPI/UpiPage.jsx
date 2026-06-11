import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { 
  Landmark, Link2, QrCode, Plus, Edit2, Trash2, 
  CheckCircle2, Download, Share2, Camera, ArrowLeft, 
  HelpCircle, Eye, RefreshCw, XCircle, ShieldCheck
} from 'lucide-react';

import { upiService } from '../../services/api/upiService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
import { Badge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';

export function UpiPage() {
  const navigate = useNavigate();
  
  // Navigation tabs: 'accounts', 'personal-qr', 'scan-qr'
  const [activeSubTab, setActiveSubTab] = useState('accounts');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom UPI states
  const [isUpiEditOpen, setIsUpiEditOpen] = useState(false);
  const [targetBank, setTargetBank] = useState(null);
  const [customUpiId, setCustomUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // PIN Setup / Change states
  const [isPinDrawerOpen, setIsPinDrawerOpen] = useState(false);
  const [pinActionType, setPinActionType] = useState('link'); // 'link' | 'change'
  const [pinTargetBank, setPinTargetBank] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmEnteredPin, setConfirmEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Personal QR state
  const [selectedQrAccount, setSelectedQrAccount] = useState(null);

  // Scan QR simulator states
  const [cameraOn, setCameraOn] = useState(false);
  const [scannedMerchant, setScannedMerchant] = useState(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadAccounts() {
      try {
        const accounts = await upiService.getBankAccounts();
        if (active) {
          setBankAccounts(accounts);
          
          const linked = accounts.filter(acc => acc.status !== 'Available');
          if (linked.length > 0) {
            setSelectedQrAccount(linked.find(a => a.status === 'Primary') || linked[0]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching bank accounts:', err);
      }
    }
    loadAccounts();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenPinDrawer = (bankName, actionType = 'link') => {
    setPinTargetBank(bankName);
    setPinActionType(actionType);
    setEnteredPin('');
    setConfirmEnteredPin('');
    setPinError('');
    setIsPinDrawerOpen(true);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    
    if (!/^\d{4,6}$/.test(enteredPin)) {
      setPinError('UPI PIN must be 4 to 6 digits');
      return;
    }
    
    if (enteredPin !== confirmEnteredPin) {
      setPinError('UPI PINs do not match');
      return;
    }
    
    setPinLoading(true);
    try {
      if (pinActionType === 'link') {
        const updated = await upiService.linkBank(pinTargetBank, enteredPin);
        setBankAccounts(updated);
        showToast(`${pinTargetBank} linked with secure UPI PIN!`, 'success');
        
        // Auto select QR account if none is set
        const linked = updated.filter(acc => acc.status !== 'Available');
        if (linked.length > 0 && !selectedQrAccount) {
          setSelectedQrAccount(linked[0]);
        }
      } else {
        const updated = await upiService.updateBankPin(pinTargetBank, enteredPin);
        setBankAccounts(updated);
        showToast(`UPI PIN updated for ${pinTargetBank}!`, 'success');
      }
      setIsPinDrawerOpen(false);
    } catch (err) {
      console.error(err);
      setPinError(err.message || 'Failed to set UPI PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleUnlinkBank = async (bankName) => {
    try {
      const updated = await upiService.unlinkBank(bankName);
      setBankAccounts(updated);
      showToast(`${bankName} unlinked.`);
      
      // Sync selected QR bank
      const linked = updated.filter(acc => acc.status !== 'Available');
      if (linked.length > 0) {
        setSelectedQrAccount(linked[0]);
      } else {
        setSelectedQrAccount(null);
      }
    } catch (err) {
      console.error('Error unlinking bank:', err);
      showToast('Failed to unlink bank');
    }
  };

  const handleSetPrimary = async (bankName) => {
    try {
      const updated = await upiService.setPrimaryAccount(bankName);
      setBankAccounts(updated);
      showToast(`${bankName} set as Primary Account`, 'success');
    } catch (err) {
      console.error('Error setting primary:', err);
      showToast('Failed to change primary account');
    }
  };

  const handleOpenUpiEdit = (account) => {
    setTargetBank(account);
    setCustomUpiId(account.upi === 'Add UPI ID' ? '' : account.upi);
    setUpiError('');
    setIsUpiEditOpen(true);
  };

  const handleSaveUpiId = async (e) => {
    e.preventDefault();
    if (!upiService.verifyUpiId(customUpiId)) {
      setUpiError('Invalid UPI ID. Use format name@bank (e.g. user@ybl)');
      return;
    }
    
    setLoading(true);
    try {
      const updated = await upiService.addUpiId(targetBank.bank, customUpiId);
      setBankAccounts(updated);
      setIsUpiEditOpen(false);
      setUpiError('');
      showToast('UPI ID updated!', 'success');
    } catch (err) {
      console.error('Error updating UPI ID:', err);
      setUpiError(err.message || 'Failed to update UPI ID');
    } finally {
      setLoading(false);
    }
  };

  // SVG QR Code Downloader
  const handleDownloadQr = () => {
    try {
      const svg = document.getElementById("payswift-qr-svg");
      if (!svg) {
        showToast('QR SVG not found');
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `payswift-${selectedQrAccount.bank.toLowerCase().replace(/\s+/g, '')}-qr.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast('QR SVG downloaded to device!', 'success');
    } catch (err) {
      console.error('Error downloading QR:', err);
      showToast('Failed to download QR code');
    }
  };

  const handleShareQr = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PayShift QR Code',
          text: `Scan to pay me on UPI ID: ${selectedQrAccount.upi}`,
          url: window.location.origin,
        });
      } catch (err) {
        console.warn('Share API failed, using clipboard copy fallback:', err);
        navigator.clipboard.writeText(selectedQrAccount.upi);
        showToast('UPI ID copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(selectedQrAccount.upi);
      showToast('UPI ID copied to clipboard!');
    }
  };

  const handleStartScanner = async () => {
    setCameraError('');
    setScannedMerchant(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera permission needs HTTPS or localhost. Click "Demo Scan" below to test.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraOn(true);
      // Immediately stop track to simulate checking
      stream.getTracks().forEach(track => track.stop());
      
      // Simulate scan success after 1.5 seconds
      setTimeout(() => {
        setCameraOn(false);
        setScannedMerchant({ name: 'Blue Mart Shop', upi: 'bluemart@ybl', amount: '549.00' });
        showToast('QR Code identified!', 'success');
      }, 1500);
    } catch (err) {
      console.error('Camera capture error:', err);
      setCameraError('Camera access denied. Try utilizing the demo scan button instead.');
    }
  };

  const handleDemoScan = () => {
    setCameraError('');
    setCameraOn(true);
    setTimeout(() => {
      setCameraOn(false);
      setScannedMerchant({ name: 'Blue Mart Shop', upi: 'bluemart@ybl', amount: '549.00' });
      showToast('Demo QR scan identified!', 'success');
    }, 1500);
  };

  const handleGoToPayMerchant = () => {
    if (!scannedMerchant) return;
    navigate('/send-money', {
      state: {
        mode: 'upi',
        payee: scannedMerchant.upi,
        amount: scannedMerchant.amount,
      }
    });
  };

  const linkedAccounts = bankAccounts.filter((account) => account.status !== 'Available');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">UPI & QR Core</h2>
          <p className="text-xs text-slate-400">Configure linked banks and scan merchants</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-1 shadow-inner">
        {[
          { id: 'accounts', label: 'Bank Accounts', icon: Landmark },
          { id: 'personal-qr', label: 'Personal QR', icon: QrCode },
          { id: 'scan-qr', label: 'Scan QR Code', icon: Camera },
        ].map((subTab) => {
          const Icon = subTab.icon;
          const active = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              type="button"
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-black transition-all ${
                active
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-500 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              onClick={() => {
                setActiveSubTab(subTab.id);
                setCameraOn(false);
                setScannedMerchant(null);
                setCameraError('');
              }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BANK ACCOUNTS AND UPI MANAGING */}
      {activeSubTab === 'accounts' && (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {bankAccounts.map((account) => {
              const isLinked = account.status !== 'Available';
              const isPrimary = account.status === 'Primary';
              
              return (
                <Card 
                  key={account.bank} 
                  className={`border transition duration-155 p-4 ${
                    isPrimary 
                      ? 'border-brand-500 ring-2 ring-brand-500/10' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${account.tone}`}>
                        <Landmark size={20} />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{account.bank}</h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 leading-none mt-1">{account.type}</p>
                      </div>
                    </div>

                    <Badge variant={isPrimary ? 'primary' : isLinked ? 'success' : 'default'} size="sm">
                      {account.status}
                    </Badge>
                  </div>

                  {isLinked ? (
                    <div className="mt-4 space-y-2.5">
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs space-y-1.5 font-bold">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account:</span>
                          <span className="text-slate-800 dark:text-slate-200">{account.account}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IFSC:</span>
                          <span className="text-slate-800 dark:text-slate-200">{account.ifsc}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">UPI ID:</span>
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <span className="truncate max-w-[120px]">{account.upi}</span>
                            <button 
                              onClick={() => handleOpenUpiEdit(account)}
                              className="text-brand-500 hover:text-brand-650 p-0.5"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Balance:</span>
                          <span className="text-brand-700 dark:text-brand-500">{account.balance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">UPI PIN:</span>
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <span className="tracking-widest">••••</span>
                            <button 
                              type="button"
                              onClick={() => handleOpenPinDrawer(account.bank, 'change')}
                              className="text-brand-500 hover:text-brand-650 p-0.5"
                              title="Change UPI PIN"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-150/40 dark:border-slate-800/40 pt-1.5 mt-1">
                          <span className="text-slate-400">QR Code:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQrAccount(account);
                              setActiveSubTab('personal-qr');
                            }}
                            className="text-brand-700 dark:text-brand-500 hover:text-brand-650 flex items-center gap-1 font-black"
                          >
                            <QrCode size={13} />
                            Show QR Code
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        {!isPrimary && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-[11px] py-1.5 rounded-xl border border-slate-200 bg-white"
                            onClick={() => handleSetPrimary(account.bank)}
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-[11px] py-1.5 px-3 rounded-xl bg-red-500 text-white"
                          onClick={() => handleUnlinkBank(account.bank)}
                        >
                          Unlink
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full rounded-xl text-xs py-2"
                        onClick={() => handleOpenPinDrawer(account.bank, 'link')}
                      >
                        Link Bank Account
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: PERSONAL QR GENERATION */}
      {activeSubTab === 'personal-qr' && (
        <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-6 max-w-md mx-auto">
          {linkedAccounts.length === 0 ? (
            <div className="py-12 text-center">
              <QrCode className="mx-auto text-slate-300 dark:text-slate-700 mb-2.5" size={44} />
              <p className="text-sm font-bold text-slate-400">No linked bank account</p>
              <p className="text-xs text-slate-450 mt-1">Please link a bank account to generate your personal QR code.</p>
              <Button variant="primary" size="sm" className="mt-3 rounded-xl" onClick={() => setActiveSubTab('accounts')}>
                Link Account
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-5">
              
              {/* Bank selector dropdown */}
              <label className="block w-full">
                <span className="mb-1.5 block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">
                  Associated Bank Account
                </span>
                <select
                  value={selectedQrAccount ? selectedQrAccount.bank : ''}
                  onChange={(e) => {
                    const matched = linkedAccounts.find(a => a.bank === e.target.value);
                    if (matched) setSelectedQrAccount(matched);
                  }}
                  className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500"
                >
                  {linkedAccounts.map((acc) => (
                    <option key={acc.bank} value={acc.bank}>{acc.bank} ({acc.account})</option>
                  ))}
                </select>
              </label>

              {/* Generated QR Container */}
              {selectedQrAccount && (
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-inner">
                  <div className="relative">
                    <QRCode
                      id="payswift-qr-svg"
                      value={selectedQrAccount.upi}
                      size={170}
                      bgColor="#ffffff"
                      fgColor="#14213d"
                      level="Q"
                    />
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {selectedQrAccount.holder}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 leading-none">
                      UPI ID: {selectedQrAccount.upi}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions row */}
              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <Button variant="secondary" onClick={handleDownloadQr} className="rounded-xl h-11 text-xs">
                  <Download size={15} className="mr-1.5 text-brand-500" /> Download QR
                </Button>
                <Button variant="secondary" onClick={handleShareQr} className="rounded-xl h-11 text-xs">
                  <Share2 size={15} className="mr-1.5 text-brand-500" /> Share ID
                </Button>
              </div>

            </div>
          )}
        </section>
      )}

      {/* TAB 3: SCAN QR CODE MOCK */}
      {activeSubTab === 'scan-qr' && (
        <section className="glass-panel rounded-[28px] p-6 shadow-soft max-w-md mx-auto space-y-5">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-950 text-white shadow-inner flex flex-col justify-center items-center">
            
            {cameraOn ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900">
                {/* Fake camera scanner sweep */}
                <div className="scan-line pointer-events-none absolute left-8 right-8 h-0.5 bg-brand-500 shadow-[0_0_18px_#00BAF2]" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  Scanning Government QR...
                </span>
              </div>
            ) : scannedMerchant ? (
              <div className="p-5 text-center space-y-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 mx-auto">
                  <CheckCircle2 size={28} />
                </span>
                <div>
                  <h4 className="text-lg font-black text-white">{scannedMerchant.name}</h4>
                  <p className="text-xs text-slate-450 mt-1">UPI ID: {scannedMerchant.upi}</p>
                  <p className="text-lg font-black text-brand-500 mt-2">Amount: ₹{scannedMerchant.amount}</p>
                </div>
                
                <Button onClick={handleGoToPayMerchant} className="rounded-xl w-full">
                  Pay Now
                </Button>
              </div>
            ) : (
              <div className="text-center p-6 space-y-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-brand-500 mx-auto">
                  <Camera size={26} />
                </span>
                <p className="text-xs font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Start scanner to read Paytm/PhonePe merchant codes.
                </p>
              </div>
            )}

            {/* Aesthetic scanner guides */}
            <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-brand-500/50 shadow-[0_0_0_999px_rgba(2,6,23,0.38)]">
              <span className="absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-3xl border-l-4 border-t-4 border-white" />
              <span className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-3xl border-r-4 border-t-4 border-white" />
              <span className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-3xl border-b-4 border-l-4 border-white" />
              <span className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-3xl border-b-4 border-r-4 border-white" />
            </div>
          </div>

          <div className="space-y-2.5">
            <Button onClick={handleStartScanner} disabled={cameraOn} className="w-full">
              Start QR Camera
            </Button>
            <Button variant="secondary" onClick={handleDemoScan} disabled={cameraOn} className="w-full">
              Demo QR Scan
            </Button>
          </div>

          {cameraError && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-450">
              {cameraError}
            </p>
          )}
        </section>
      )}

      {/* UPI EDIT DRAWER */}
      <Drawer
        isOpen={isUpiEditOpen}
        onClose={() => setIsUpiEditOpen(false)}
        title={targetBank ? `Modify UPI: ${targetBank.bank}` : 'Modify UPI'}
      >
        {targetBank && (
          <form onSubmit={handleSaveUpiId} className="space-y-4 pt-1">
            <Input
              label="Custom UPI ID"
              value={customUpiId}
              onChange={(val) => {
                setCustomUpiId(val.replace(/\s+/g, ''));
                setUpiError('');
              }}
              placeholder="e.g. name@paytm"
              error={upiError}
              required
            />
            
            <p className="text-[10px] font-bold text-slate-400 leading-normal">
              Acceptable formats: user@paytm, user@ybl, user@oksbi, user@sbi. Ensure the handle represents verified banks.
            </p>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Save UPI Address
            </Button>
          </form>
        )}
      </Drawer>

      {/* PIN CONFIGURATION DRAWER */}
      <Drawer
        isOpen={isPinDrawerOpen}
        onClose={() => setIsPinDrawerOpen(false)}
        title={pinActionType === 'link' ? `Link Bank: ${pinTargetBank}` : `Change PIN: ${pinTargetBank}`}
      >
        <form onSubmit={handleSavePin} className="space-y-4 pt-1">
          <div className="rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100/10 p-4">
            <p className="text-xs font-black text-brand-900 dark:text-brand-400">
              {pinActionType === 'link' ? 'Configure Security PIN' : 'Modify Security PIN'}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Your UPI PIN will be used to authorize all payments from this bank account. Keep it confidential.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="UPI PIN (4-6 digits)"
              type="password"
              maxLength={6}
              value={enteredPin}
              onChange={(val) => {
                setEnteredPin(val.replace(/\D/g, ''));
                setPinError('');
              }}
              placeholder="••••"
              required
            />
            
            <Input
              label="Confirm UPI PIN"
              type="password"
              maxLength={6}
              value={confirmEnteredPin}
              onChange={(val) => {
                setConfirmEnteredPin(val.replace(/\D/g, ''));
                setPinError('');
              }}
              placeholder="••••"
              error={pinError}
              required
            />
          </div>

          <Button type="submit" loading={pinLoading} className="w-full mt-2">
            {pinActionType === 'link' ? 'Set PIN & Link Account' : 'Save UPI PIN'}
          </Button>
        </form>
      </Drawer>

    </div>
  );
}

export default UpiPage;
