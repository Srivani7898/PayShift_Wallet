/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BadgeCheck, Clock, CheckCircle2, ArrowLeft, 
  Loader2, ShieldCheck, FileText, ArrowRight
} from 'lucide-react';
import { mockDelay } from '../../services/api.js';
import { storageService } from '../../services/storage/storage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../components/ui/Toast';

export function KYCPage() {
  const navigate = useNavigate();
  
  // Statuses: 'Pending', 'Verified'
  const [kycStatus, setKycStatus] = useState(() => storageService.getKycStatus('Pending'));
  const [step, setStep] = useState('details'); // 'details', 'otp', 'review', 'verified'
  
  // Form Details
  const [form, setForm] = useState({
    pan: '',
    aadhaar: '',
    dob: '',
    address: '',
    otp: '',
  });

  const [loading, setLoading] = useState(false);
  const [kycError, setKycError] = useState('');

  useEffect(() => {
    if (kycStatus === 'Verified') {
      setStep('verified');
    }
  }, [kycStatus]);

  // Validations
  const isPanValid = /^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan);
  const isAadhaarValid = form.aadhaar.length === 12;
  const isDetailsValid = isPanValid && isAadhaarValid && form.dob && form.address.trim().length > 8;
  const isOtpValid = /^\d{6}$/.test(form.otp);

  const handleFillDemoDetails = () => {
    setForm({
      pan: 'ABCDE1234F',
      aadhaar: '987654321012',
      dob: '2001-05-04',
      address: 'Indiranagar, Bengaluru, Karnataka',
      otp: '',
    });
    setKycError('');
    showToast('Demo details auto-filled');
  };

  const handleSendOtp = async () => {
    if (!isDetailsValid) {
      setKycError('Please complete all form fields correctly first');
      return;
    }
    setKycError('');
    setLoading(true);
    try {
      await mockDelay(true, 850);
      setStep('otp');
      showToast('OTP code sent to Aadhaar linked mobile ending 3210');
    } catch {
      setKycError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (form.otp !== '123456' && !isOtpValid) {
      setKycError('Invalid OTP code. Enter 123456 for testing.');
      return;
    }
    setKycError('');
    setLoading(true);
    try {
      await mockDelay(true, 800);
      setStep('review');
      showToast('OTP Code verified. Identity details retrieved.');
    } catch {
      setKycError('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKyc = async () => {
    setLoading(true);
    try {
      await mockDelay(true, 1200);
      storageService.setKycStatus('Verified');
      
      // Update profile status in storage
      const user = storageService.getUser();
      if (user) {
        user.kyc = 'Verified';
        storageService.setUser(user);
      }
      
      // Notify
      const notifService = (await import('../../services/api/notificationService')).notificationService;
      await notifService.addNotification(
        'KYC Approved',
        'KYC Identity Verified',
        'Your profile has been verified successfully. Higher limits unlocked.'
      );

      setKycStatus('Verified');
      setStep('verified');
      showToast('KYC successfully verified!', 'success');
    } catch {
      setKycError('KYC submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/profile')}
            className="p-1 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 transition shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">KYC Verification</h2>
            <p className="text-xs text-slate-400">Complete Aadhaar/PAN validation</p>
          </div>
        </div>

        <span className={`px-4 py-1.5 rounded-full text-xs font-black self-start sm:self-center ${
          kycStatus === 'Verified' 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
        }`}>
          Status: {kycStatus}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        
        {/* Step Indicator Panel */}
        <section className="glass-panel rounded-[28px] p-5 shadow-soft space-y-3.5 h-fit">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 mb-2">
            Verification Steps
          </h3>
          
          <StepButton 
            active={step === 'details'} 
            done={step !== 'details'} 
            title="PAN and Aadhaar" 
            desc="Enter verified tax and identity numbers." 
            onClick={() => { if (kycStatus !== 'Verified') setStep('details'); }} 
          />
          <StepButton 
            active={step === 'otp'} 
            done={['review', 'verified'].includes(step)} 
            title="SMS OTP Code" 
            desc="Confirm Aadhaar linked mobile." 
            onClick={() => { if (isDetailsValid && kycStatus !== 'Verified') setStep('otp'); }} 
          />
          <StepButton 
            active={step === 'review'} 
            done={step === 'verified'} 
            title="Details Review" 
            desc="Review details before ledger submit." 
            onClick={() => { if (isOtpValid && kycStatus !== 'Verified') setStep('review'); }} 
          />
          <StepButton 
            active={step === 'verified'} 
            done={step === 'verified'} 
            title="Verification Success" 
            desc="Limits unlocked on PayShift." 
            onClick={() => {}} 
          />
        </section>

        {/* Dynamic Form Content */}
        <section className="glass-panel rounded-[28px] p-6 shadow-soft">
          
          {/* STEP 1: DETAILS */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="PAN Card Number"
                  maxLength={10}
                  value={form.pan}
                  onChange={(val) => setForm({ ...form, pan: val.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="e.g. ABCDE1234F"
                  error={form.pan && !isPanValid ? 'Invalid PAN format (ABCDE1234F)' : ''}
                  required
                />

                <Input
                  label="Aadhaar ID Number"
                  maxLength={12}
                  value={form.aadhaar}
                  onChange={(val) => setForm({ ...form, aadhaar: val.replace(/\D/g, '') })}
                  placeholder="12-digit number"
                  error={form.aadhaar && !isAadhaarValid ? 'Must be exactly 12 digits' : ''}
                  required
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={(val) => setForm({ ...form, dob: val })}
                  required
                />

                <Input
                  label="Current Address"
                  value={form.address}
                  onChange={(val) => setForm({ ...form, address: val })}
                  placeholder="Street details, city, state"
                  error={form.address && form.address.trim().length <= 8 ? 'Please enter a complete address' : ''}
                  required
                />
              </div>

              {kycError && (
                <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400">
                  {kycError}
                </p>
              )}

              <div className="flex flex-wrap gap-2.5 pt-4">
                <Button
                  loading={loading}
                  disabled={!isDetailsValid}
                  onClick={handleSendOtp}
                  className="flex-1 rounded-xl h-11"
                >
                  Send OTP Code
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleFillDemoDetails}
                  className="rounded-xl h-11"
                >
                  Fill Demo Details
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-brand-500/5 border border-brand-500/15 p-4 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                <strong className="text-brand-700 dark:text-brand-55 block mb-1">OTP Dispatched</strong>
                Enter the 6 digit confirmation code sent to Aadhaar linked mobile. Use <strong className="text-brand-700 font-black">123456</strong> to verify.
              </div>

              <Input
                label="SMS OTP Code"
                maxLength={6}
                value={form.otp}
                onChange={(val) => setForm({ ...form, otp: val.replace(/\D/g, '') })}
                placeholder="123456"
                error={kycError}
                required
              />

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  loading={loading}
                  onClick={handleVerifyOtp}
                  className="flex-1 rounded-xl"
                >
                  Verify OTP
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => setForm({ ...form, otp: '123456' })}
                >
                  Demo OTP
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => setStep('details')}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/10 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-450">
                Identity matches found on the government portal. Please submit to finalize linkage.
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850 rounded-2xl border border-slate-100 dark:border-slate-850/60 font-bold text-xs">
                <ReviewRow label="PAN Identification" value={form.pan} />
                <ReviewRow label="Aadhaar ID" value={`XXXX XXXX ${form.aadhaar.slice(-4)}`} />
                <ReviewRow label="Date of Birth" value={form.dob} />
                <ReviewRow label="Registered Address" value={form.address} />
              </div>

              {kycError && (
                <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400">
                  {kycError}
                </p>
              )}

              <Button
                loading={loading}
                onClick={handleSubmitKyc}
                className="w-full mt-2"
              >
                Submit KYC Application
              </Button>
            </div>
          )}

          {/* STEP 4: VERIFIED */}
          {step === 'verified' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                  <ShieldCheck size={44} />
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">KYC Verified</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                  Your identity has been verified successfully. Higher transaction limits and bank withdrawal checks are fully active.
                </p>
              </div>

              <Button
                className="w-full max-w-xs mx-auto mt-4"
                onClick={() => navigate('/profile')}
              >
                Back to Profile
              </Button>
            </div>
          )}

        </section>
      </div>

    </div>
  );
}

// Sub-components
function StepButton({ active, done, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3.5 text-left transition duration-150 ${
        active
          ? 'border-brand-300 dark:border-brand-500/30 bg-brand-500/5 dark:bg-brand-500/10'
          : done
          ? 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-500/5 dark:bg-emerald-950/5'
          : 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10'
      }`}
    >
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        ) : (
          <Clock size={16} className={active ? 'text-brand-500 shrink-0' : 'text-slate-400 shrink-0'} />
        )}
        <p className="text-sm font-black text-slate-850 dark:text-slate-100 leading-tight">
          {title}
        </p>
      </div>
      <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 leading-snug pl-5">
        {desc}
      </p>
    </button>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-slate-700 dark:text-slate-350">
      <span className="text-slate-400 dark:text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-900 dark:text-white text-right truncate max-w-xs">{value}</span>
    </div>
  );
}

export default KYCPage;
