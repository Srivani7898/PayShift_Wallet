/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, BadgeCheck, ShieldAlert, CreditCard, 
  ChevronRight, ArrowLeft, Mail, Phone, Edit3, Save, X 
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { upiService } from '../../services/api/upiService';
import { storageService } from '../../services/storage/storage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../components/ui/Toast';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // States
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [editing, setEditing] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [kycStatus, setKycStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);

  const loadProfileData = async () => {
    try {
      const currentUser = storageService.getUser() || user;
      if (currentUser) {
        setProfile({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
        });
      }
      
      const banks = await upiService.getBankAccounts();
      setBankAccounts(banks);
      
      const kyc = storageService.getKycStatus('Pending');
      setKycStatus(kyc);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const linkedAccounts = bankAccounts.filter((account) => account.status !== 'Available');
  
  // Calculate Completion Percentage
  const completionCriteria = {
    name: { met: !!profile.name.trim(), weight: 15, label: 'Full Name' },
    email: { met: !!profile.email.trim() && /\S+@\S+\.\S+/.test(profile.email), weight: 15, label: 'Verified Email' },
    phone: { met: !!profile.phone.trim() && profile.phone.length >= 10, weight: 15, label: 'Mobile Linked' },
    bank: { met: linkedAccounts.length > 0, weight: 20, label: 'Bank Account Linked' },
    upi: { met: linkedAccounts.some(acc => acc.upi && acc.upi !== 'Add UPI ID'), weight: 15, label: 'UPI ID Configured' },
    kyc: { met: kycStatus === 'Verified', weight: 20, label: 'KYC Identity Verified' },
  };

  const completionPercentage = Object.values(completionCriteria).reduce((sum, item) => {
    return sum + (item.met ? item.weight : 0);
  }, 0);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      showToast('Name cannot be empty');
      return;
    }
    setLoading(true);
    try {
      const updatedUser = { ...storageService.getUser(), ...profile };
      storageService.setUser(updatedUser);
      setEditing(false);
      showToast('Profile updated successfully!', 'success');
      
      // Update global user context if needed by reloading
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      showToast('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Profile</h2>
          <p className="text-xs text-slate-400">Manage your identity and linkages</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        
        {/* Profile Card & Info Editor */}
        <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 text-brand-700 dark:text-slate-350 shrink-0 font-black text-xl">
              {profile.name.substring(0, 2).toUpperCase() || 'PS'}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-55 truncate">
                  {profile.name || 'PayShift User'}
                </h3>
                {kycStatus === 'Verified' ? (
                  <BadgeCheck className="text-brand-accent shrink-0" size={18} />
                ) : (
                  <ShieldAlert className="text-amber-500 shrink-0" size={18} />
                )}
              </div>
              <p className="text-xs text-slate-450 dark:text-slate-500 truncate">{profile.email}</p>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <Input
                label="Full Name"
                value={profile.name}
                onChange={(val) => setProfile({ ...profile, name: val })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={profile.email}
                onChange={(val) => setProfile({ ...profile, email: val })}
                required
              />
              <Input
                label="Mobile Number"
                type="tel"
                value={profile.phone}
                onChange={(val) => setProfile({ ...profile, phone: val })}
                required
              />

              <div className="flex gap-2.5 pt-2">
                <Button type="submit" loading={loading} className="flex-1 rounded-xl">
                  <Save size={16} className="mr-1.5" /> Save Changes
                </Button>
                <Button variant="secondary" className="rounded-xl" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                <Mail size={16} className="text-brand-500" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                <Phone size={16} className="text-brand-500" />
                <span>{profile.phone}</span>
              </div>

              <Button
                variant="secondary"
                className="w-full rounded-2xl h-11"
                onClick={() => setEditing(true)}
              >
                <Edit3 size={15} className="mr-1.5" /> Edit Profile Details
              </Button>
            </div>
          )}
        </section>

        {/* Completion Progress Index */}
        <section className="glass-panel rounded-[28px] p-6 shadow-soft space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">
              Profile Completeness
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">Complete account checks to unlock high limits</p>
            
            {/* Progress Slider */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-slate-400">Completion index</span>
                <span className="text-brand-700 dark:text-brand-500">{completionPercentage}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Checklist criteria */}
            <div className="mt-5 space-y-2.5">
              {Object.entries(completionCriteria).map(([key, item]) => (
                <div key={key} className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    item.met
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-650'
                  }`}>
                    {item.met ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {completionPercentage < 100 && (
            <div className="mt-5 rounded-2xl bg-brand-500/5 p-4 border border-brand-500/15 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
              <strong className="text-brand-700 dark:text-brand-55 block mb-0.5">Note:</strong>
              Completing identity checks unlocks withdrawals and bank account transfers.
            </div>
          )}
        </section>

      </div>

      {/* Navigation Quick Actions Link list */}
      <section className="glass-panel rounded-[28px] p-5 shadow-soft space-y-3">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-50 mb-3">
          Verification Controls
        </h3>
        
        <div className="space-y-2">
          {/* KYC link */}
          <button
            onClick={() => navigate('/kyc')}
            className="flex w-full items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-brand-500 dark:hover:border-brand-500 transition duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-xl ${
                kycStatus === 'Verified' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
              }`}>
                <BadgeCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-850 dark:text-slate-50">KYC Status</p>
                <p className="text-xs text-slate-400 mt-0.5">Current: {kycStatus}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={16} />
          </button>

          {/* Linked Banks Link */}
          <button
            onClick={() => navigate('/upi')}
            className="flex w-full items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-brand-500 dark:hover:border-brand-500 transition duration-150 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                <CreditCard size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-850 dark:text-slate-50">Linked Bank Accounts</p>
                <p className="text-xs text-slate-400 mt-0.5">{linkedAccounts.length} accounts configured</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={16} />
          </button>
        </div>
      </section>

    </div>
  );
}

export default ProfilePage;
