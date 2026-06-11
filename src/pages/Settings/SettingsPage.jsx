import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Lock, Moon, Sun, Bell, Shield, 
  ChevronRight, LogOut, ArrowLeft, Eye, EyeOff
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage/storage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
import { showToast } from '../../components/ui/Toast';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  
  // App Lock States
  const [appLockPin, setAppLockPin] = useState(() => storageService.getAppLockPin());
  const [isAppLockOpen, setIsAppLockOpen] = useState(false);
  const [lockPinForm, setLockPinForm] = useState({ pin: '', confirm: '' });
  const [showLockPin, setShowLockPin] = useState(false);
  
  // Payment PIN States
  const [paymentPin, setPaymentPin] = useState(() => storageService.getPaymentPin());
  const [isPaymentPinOpen, setIsPaymentPinOpen] = useState(false);
  const [paymentPinForm, setPaymentPinForm] = useState({ pin: '', confirm: '' });
  const [showPayPin, setShowPayPin] = useState(false);

  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleSetting = (key) => {
    const nextSettings = { ...settings, [key]: !settings[key] };
    setSettings(nextSettings);
    storageService.setSettings(nextSettings);
    showToast('Preference saved successfully');
  };

  const handleSaveAppLock = (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(lockPinForm.pin)) {
      setErrorMsg('App Lock PIN must be 4 to 6 digits');
      return;
    }
    if (lockPinForm.pin !== lockPinForm.confirm) {
      setErrorMsg('PINs do not match');
      return;
    }
    storageService.setAppLockPin(lockPinForm.pin);
    setAppLockPin(lockPinForm.pin);
    setIsAppLockOpen(false);
    setLockPinForm({ pin: '', confirm: '' });
    setErrorMsg('');
    showToast('App Lock PIN configured!', 'success');
  };

  const handleDisableAppLock = () => {
    storageService.setAppLockPin('');
    setAppLockPin('');
    setIsAppLockOpen(false);
    setErrorMsg('');
    showToast('App Lock disabled');
  };

  const handleSavePaymentPin = (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(paymentPinForm.pin)) {
      setErrorMsg('UPI PIN must be 4 to 6 digits');
      return;
    }
    if (paymentPinForm.pin !== paymentPinForm.confirm) {
      setErrorMsg('PINs do not match');
      return;
    }
    storageService.setPaymentPin(paymentPinForm.pin);
    setPaymentPin(paymentPinForm.pin);
    setIsPaymentPinOpen(false);
    setPaymentPinForm({ pin: '', confirm: '' });
    setErrorMsg('');
    showToast('Payment UPI PIN saved successfully!', 'success');
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully');
    navigate('/login');
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
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Settings</h2>
          <p className="text-xs text-slate-400">Manage security preferences and themes</p>
        </div>
      </div>

      {/* Main Settings List */}
      <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-6">
        
        {/* Theme Settings Card */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">
            App Appearance
          </h3>
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">
                {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
              </span>
              <div>
                <p className="text-sm font-black text-slate-850 dark:text-slate-100">Dark Theme</p>
                <p className="text-xs text-slate-400 mt-0.5">Toggle light or dark app appearance</p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                theme === 'dark' ? 'bg-brand-500' : 'bg-slate-250 dark:bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">
            Security & Authentication
          </h3>
          
          <div className="space-y-3">
            {/* App Lock PIN */}
            <div 
              onClick={() => {
                setErrorMsg('');
                setIsAppLockOpen(true);
              }}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-brand-500 dark:hover:border-brand-500 transition duration-150 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450">
                  <Lock size={18} />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-850 dark:text-slate-100">App Lock Screen PIN</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {appLockPin ? 'Active (Tap to edit/disable)' : 'Inactive (Tap to setup)'}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-400" size={16} />
            </div>

            {/* UPI Payment PIN */}
            <div 
              onClick={() => {
                setErrorMsg('');
                setIsPaymentPinOpen(true);
              }}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-brand-500 dark:hover:border-brand-500 transition duration-150 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <Shield size={18} />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-850 dark:text-slate-100">UPI Payment PIN</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {paymentPin ? 'Configured (Tap to reset)' : 'Not configured (Tap to setup)'}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-400" size={16} />
            </div>
          </div>
        </div>

        {/* Notifications & Toggles */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">
            Preference Toggles
          </h3>
          
          <div className="space-y-3">
            {/* Push Notifications */}
            <ToggleOption 
              label="Push Notifications" 
              desc="Receive real-time alerts for credits and debits" 
              active={settings.notificationsEnabled} 
              icon={Bell} 
              onToggle={() => handleToggleSetting('notificationsEnabled')} 
            />

            {/* Email Alerts */}
            <ToggleOption 
              label="Email Statements" 
              desc="Send statements on successful payments" 
              active={settings.emailAlerts} 
              icon={Bell} 
              onToggle={() => handleToggleSetting('emailAlerts')} 
            />
          </div>
        </div>

        {/* Logout Section */}
        <div className="pt-4 border-t border-slate-150 dark:border-slate-800/80">
          <Button
            variant="danger"
            onClick={handleLogout}
            className="w-full text-xs font-black flex items-center justify-center gap-1.5 h-11"
          >
            <LogOut size={16} /> Logout from PayShift
          </Button>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* DRAWERS FOR CONFIGURE */}
      {/* ========================================================================= */}

      {/* APP LOCK PIN SETTINGS */}
      <Drawer
        isOpen={isAppLockOpen}
        onClose={() => setIsAppLockOpen(false)}
        title={appLockPin ? 'Edit App Lock' : 'Enable App Lock'}
      >
        <form onSubmit={handleSaveAppLock} className="space-y-4 pt-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Input
                label={appLockPin ? 'New PIN' : 'Create PIN'}
                type={showLockPin ? 'text' : 'password'}
                maxLength={6}
                value={lockPinForm.pin}
                onChange={(val) => setLockPinForm({ ...lockPinForm, pin: val.replace(/\D/g, '') })}
                placeholder="••••"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowLockPin(!showLockPin)}
              >
                {showLockPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input
              label="Confirm PIN"
              type={showLockPin ? 'text' : 'password'}
              maxLength={6}
              value={lockPinForm.confirm}
              onChange={(val) => setLockPinForm({ ...lockPinForm, confirm: val.replace(/\D/g, '') })}
              placeholder="••••"
              error={errorMsg}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            {appLockPin ? 'Update PIN' : 'Enable Lock'}
          </Button>
          {appLockPin && (
            <Button
              variant="danger"
              className="w-full"
              onClick={handleDisableAppLock}
            >
              Disable App Lock
            </Button>
          )}
        </form>
      </Drawer>

      {/* UPI PIN SETTINGS */}
      <Drawer
        isOpen={isPaymentPinOpen}
        onClose={() => setIsPaymentPinOpen(false)}
        title={paymentPin ? 'Reset UPI PIN' : 'Setup UPI PIN'}
      >
        <form onSubmit={handleSavePaymentPin} className="space-y-4 pt-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Input
                label={paymentPin ? 'New UPI PIN' : 'Create UPI PIN'}
                type={showPayPin ? 'text' : 'password'}
                maxLength={6}
                value={paymentPinForm.pin}
                onChange={(val) => setPaymentPinForm({ ...paymentPinForm, pin: val.replace(/\D/g, '') })}
                placeholder="••••"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPayPin(!showPayPin)}
              >
                {showPayPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input
              label="Confirm UPI PIN"
              type={showPayPin ? 'text' : 'password'}
              maxLength={6}
              value={paymentPinForm.confirm}
              onChange={(val) => setPaymentPinForm({ ...paymentPinForm, confirm: val.replace(/\D/g, '') })}
              placeholder="••••"
              error={errorMsg}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Save UPI PIN
          </Button>
        </form>
      </Drawer>

    </div>
  );
}

// Sub-components
function ToggleOption({ label, desc, active, icon: Icon, onToggle }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-black text-slate-850 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? 'bg-brand-500' : 'bg-slate-250 dark:bg-slate-800'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsPage;
