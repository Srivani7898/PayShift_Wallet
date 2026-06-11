/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AppRoutes } from './routes/AppRoutes';
import { useAuth } from './context/AuthContext';
import { storageService } from './services/storage/storage';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { Toast, showToast } from './components/ui/Toast';

function App() {
  const { isAuthenticated, logout } = useAuth();
  
  // App Lock logic
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [lockError, setLockError] = useState('');

  // App Lock Setup states
  const [isCreatingLock, setIsCreatingLock] = useState(false);
  const [newLockPin, setNewLockPin] = useState({ pin: '', confirm: '' });
  const [creationError, setCreationError] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);

  useEffect(() => {
    const lockPin = storageService.getAppLockPin();
    if (isAuthenticated) {
      if (lockPin) {
        setIsLocked(true);
        setIsCreatingLock(false);
      } else {
        const skipped = sessionStorage.getItem('payswift:skipped-lock');
        if (!skipped) {
          setIsCreatingLock(true);
        } else {
          setIsCreatingLock(false);
        }
        setIsLocked(false);
      }
    } else {
      setIsLocked(false);
      setIsCreatingLock(false);
    }
  }, [isAuthenticated]);

  const handleUnlock = (e) => {
    e.preventDefault();
    const lockPin = storageService.getAppLockPin();
    if (pinInput === lockPin) {
      setIsLocked(false);
      setPinInput('');
      setLockError('');
      showToast('App unlocked successfully');
    } else {
      setLockError('Incorrect App Lock PIN');
      setPinInput('');
    }
  };

  const handleCreateLockPin = (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newLockPin.pin)) {
      setCreationError('App Lock PIN must be 4 to 6 digits');
      return;
    }
    if (newLockPin.pin !== newLockPin.confirm) {
      setCreationError('PINs do not match');
      return;
    }
    storageService.setAppLockPin(newLockPin.pin);
    setIsCreatingLock(false);
    setNewLockPin({ pin: '', confirm: '' });
    setCreationError('');
    showToast('App Lock configured successfully!', 'success');
  };

  const handleSkipLock = () => {
    sessionStorage.setItem('payswift:skipped-lock', 'true');
    setIsCreatingLock(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsLocked(false);
    setIsCreatingLock(false);
    setPinInput('');
    setLockError('');
    setNewLockPin({ pin: '', confirm: '' });
    setCreationError('');
  };

  if (isLocked) {
    return (
      <main className="app-lock-scene relative grid min-h-screen overflow-hidden px-4 text-slate-800 dark:text-white">
        <div className="app-lock-grid absolute inset-0 pointer-events-none" />
        <div className="app-lock-sweep absolute inset-0 pointer-events-none" />
        <div className="app-lock-device absolute left-1/2 top-1/2 hidden h-[34rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white/5 dark:bg-slate-900/5 shadow-[0_40px_120px_rgba(15,23,42,0.08)] md:block pointer-events-none" />

        <section className="relative z-10 mx-auto w-full max-w-sm self-center rounded-[28px] border border-white/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <div className="app-lock-icon mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-500/25">
              <Lock size={30} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">PayShift Locked</h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">Enter your App Lock PIN to continue.</p>
          </div>

          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-950 p-3 text-cyan-100 shadow-inner">
            <div className="relative h-24 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(8,47,73,0.85),rgba(15,23,42,0.96))]">
              <div className="app-lock-radar absolute inset-0" />
              <div className="app-lock-scan absolute inset-x-0 top-0 h-0.5 bg-brand-500 shadow-[0_0_18px_#00BAF2]" />
              <div className="absolute inset-0 grid place-items-center">
                <ShieldCheck className="text-brand-accent" size={34} />
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                <span>Secure</span>
                <span>Encrypted</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <Input
              label="App Lock PIN"
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(val) => setPinInput(val.replace(/\D/g, ''))}
              placeholder="••••"
              error={lockError}
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={pinInput.length < 4}
            >
              Unlock App
            </Button>
            
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </form>
        </section>
      </main>
    );
  }

  if (isCreatingLock) {
    return (
      <main className="app-lock-scene relative grid min-h-screen overflow-hidden px-4 text-slate-800 dark:text-white">
        <div className="app-lock-grid absolute inset-0 pointer-events-none" />
        <div className="app-lock-sweep absolute inset-0 pointer-events-none" />
        <div className="app-lock-device absolute left-1/2 top-1/2 hidden h-[34rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white/5 dark:bg-slate-900/5 shadow-[0_40px_120px_rgba(15,23,42,0.08)] md:block pointer-events-none" />

        <section className="relative z-10 mx-auto w-full max-w-sm self-center rounded-[28px] border border-white/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <div className="app-lock-icon mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-500/25">
              <Lock size={30} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Secure PayShift</h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">Setup a secure PIN to protect your wallet.</p>
          </div>

          <form onSubmit={handleCreateLockPin} className="space-y-4">
            <div className="relative">
              <Input
                label="Create PIN (4-6 digits)"
                type={showNewPin ? 'text' : 'password'}
                maxLength={6}
                value={newLockPin.pin}
                onChange={(val) => {
                  setNewLockPin({ ...newLockPin, pin: val.replace(/\D/g, '') });
                  setCreationError('');
                }}
                placeholder="••••"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-10 text-slate-400 hover:text-slate-650 transition"
                onClick={() => setShowNewPin(!showNewPin)}
              >
                {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              label="Confirm PIN"
              type={showNewPin ? 'text' : 'password'}
              maxLength={6}
              value={newLockPin.confirm}
              onChange={(val) => {
                setNewLockPin({ ...newLockPin, confirm: val.replace(/\D/g, '') });
                setCreationError('');
              }}
              placeholder="••••"
              error={creationError}
              required
            />
            
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={newLockPin.pin.length < 4}
            >
              Enable & Proceed
            </Button>
            
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-brand-500 text-center transition py-1"
                onClick={handleSkipLock}
              >
                Skip for now
              </button>
              <button
                type="button"
                className="text-xs font-bold text-red-500 hover:text-red-650 text-center transition py-1"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      <AppRoutes />
      <Toast />
    </>
  );
}

export default App;
