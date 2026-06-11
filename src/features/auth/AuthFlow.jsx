import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../components/ui/Toast';

export function AuthFlow({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const { login, verifyOtp, signup } = useAuth();
  
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot'
  const [step, setStep] = useState('form'); // 'form', 'otp'
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    identifier: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  const validation = useMemo(() => {
    if (mode === 'forgot') return form.mobile.length === 10;
    if (step === 'otp') return /^\d{6}$/.test(form.otp);
    if (mode === 'signup') {
      return (
        form.name.length > 2 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        form.mobile.length === 10 &&
        form.password.length >= 6 &&
        form.confirmPassword === form.password
      );
    }
    // Login: identifier (email/name) and password >= 6
    return (
      (/\S+@\S+\.\S+/.test(form.identifier) || form.identifier.trim().length > 2) &&
      form.password.length >= 6
    );
  }, [form, mode, step]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    if (!validation) {
      setError('Please fill in all details correctly.');
      return;
    }
    
    setLoading(true);
    try {
      if (step === 'otp') {
        if (mode === 'forgot') {
          // Reset simulated
          setResetComplete(true);
          showToast('OTP verified. You can now reset your password.');
          return;
        }
        
        await verifyOtp(form.otp);
        showToast('Successfully logged in!');
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await signup(form);
        showToast('Registration successful! Please login to continue.', 'success');
        setMode('login');
        setStep('form');
        setError('');
        setForm((prev) => ({
          ...prev,
          identifier: form.email || form.name,
          password: '',
          confirmPassword: '',
          otp: '',
        }));
      } else {
        // Login step 1: send OTP
        await login(form);
        setStep('otp');
        showToast('OTP sent to your registered mobile/email.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-scene relative grid min-h-screen overflow-hidden px-4 py-8 text-white">
      <div className="auth-grid absolute inset-0 pointer-events-none" />
      <div className="auth-light-sweep absolute inset-0 pointer-events-none" />
      <div className="auth-orbit auth-orbit-one absolute h-72 w-72 rounded-full border border-cyan-200/20 pointer-events-none" />
      <div className="auth-orbit auth-orbit-two absolute h-96 w-96 rounded-full border border-violet-200/15 pointer-events-none" />

      <section className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-8 self-center lg:grid-cols-[1fr_0.88fr]">
        {/* Left Side branding */}
        <div className="hidden lg:block">
          <div className="auth-chip mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-cyan-50 shadow-2xl backdrop-blur-xl">
            <ShieldCheck size={17} className="text-brand-500" />
            Bank-grade wallet protection
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-tight tracking-normal">
            Pay, recharge, and manage your wallet in seconds.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-350">
            A fast mobile-first payments experience with OTP security, clear confirmations, and instant transaction feedback.
          </p>
          
          <div className="auth-wallet-preview mt-8 max-w-lg rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-100">Live wallet</p>
                <p className="mt-1 text-3xl font-black">₹18,450.75</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-emerald-250">
                <ShieldCheck size={26} className="text-brand-accent" />
              </div>
            </div>
            <div className="auth-card-line mb-4 h-2 rounded-full bg-cyan-300/70" />
            <div className="grid grid-cols-3 gap-3">
              {[
                ['₹18.4k', 'Wallet ready'],
                ['2 sec', 'Fast checkout'],
                ['24/7', 'Secure access'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-350">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side auth form */}
        <section className="auth-login-card w-full rounded-[28px] border border-white/20 bg-white/10 p-1 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div className="rounded-[24px] border border-slate-100/10 dark:border-slate-800/50 bg-white dark:bg-slate-900 p-5 text-slate-800 dark:text-slate-100 shadow-soft sm:p-7">
            
            {/* Header logo */}
            <div className="mb-6 flex items-center gap-3">
              <div className="payswift-logo-mark auth-logo grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
                <Wallet size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-normal text-slate-900 dark:text-white">PayShift</h1>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-400/80">Payments, wallet, bills in one place</p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="mb-6 grid grid-cols-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/60 p-1 text-xs sm:text-sm font-black shadow-inner">
              {['login', 'signup', 'forgot'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-xl px-2 py-2 capitalize transition-all ${
                    mode === item
                      ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  onClick={() => {
                    setMode(item);
                    setStep('form');
                    setError('');
                    setResetComplete(false);
                  }}
                >
                  {item === 'forgot' ? 'Reset' : item}
                </button>
              ))}
            </div>

            {resetComplete ? (
              <div className="grid place-items-center py-6 text-center">
                <div className="h-16 w-16 grid place-items-center rounded-full bg-emerald-50/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 mb-4">
                  <ShieldCheck size={36} />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Password Reset Link Sent</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                  We sent reset instructions to your mobile ending with 3210.
                </p>
                <Button
                  className="mt-6 w-full max-w-xs"
                  onClick={() => {
                    setMode('login');
                    setStep('form');
                    setResetComplete(false);
                    setForm({ name: '', email: '', mobile: '', identifier: '', password: '', confirmPassword: '', otp: '' });
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
                {mode === 'signup' && step === 'form' && (
                  <>
                    <Input
                      label="Full Name"
                      value={form.name}
                      onChange={(name) => setForm({ ...form, name })}
                      placeholder="e.g. John Doe"
                      error={form.name && form.name.length <= 2 ? 'Enter your full name' : ''}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(email) => setForm({ ...form, email })}
                      placeholder="e.g. name@domain.com"
                      error={form.email && !/\S+@\S+\.\S+/.test(form.email) ? 'Enter a valid email' : ''}
                      required
                    />
                  </>
                )}
                
                {step === 'form' && mode === 'login' ? (
                  <>
                    <Input
                      label="Email or Username"
                      value={form.identifier}
                      onChange={(identifier) => setForm({ ...form, identifier })}
                      placeholder="Enter registered email or name"
                      error={
                        form.identifier &&
                        !/\S+@\S+\.\S+/.test(form.identifier) &&
                        form.identifier.trim().length <= 2
                          ? 'Enter your email or name'
                          : ''
                      }
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(password) => setForm({ ...form, password })}
                      placeholder="••••••••"
                      error={form.password && form.password.length < 6 ? 'Minimum 6 characters' : ''}
                      required
                    />
                  </>
                ) : step === 'form' ? (
                  <>
                    <Input
                      label="Mobile Number"
                      type="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={(mobile) => setForm({ ...form, mobile: mobile.replace(/\D/g, '') })}
                      placeholder="10-digit number"
                      error={form.mobile && form.mobile.length !== 10 ? 'Use a 10 digit mobile number' : ''}
                      required
                    />
                    {mode !== 'forgot' && (
                      <Input
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={(password) => setForm({ ...form, password })}
                        placeholder="••••••••"
                        error={form.password && form.password.length < 6 ? 'Minimum 6 characters' : ''}
                        required
                      />
                    )}
                    {mode === 'signup' && (
                      <Input
                        label="Confirm Password"
                        type="password"
                        value={form.confirmPassword}
                        onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
                        placeholder="••••••••"
                        error={
                          form.confirmPassword && form.confirmPassword !== form.password
                            ? 'Passwords do not match'
                            : ''
                        }
                        required
                      />
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 p-4">
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">OTP Sent</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Use <strong className="text-brand-700 dark:text-brand-500">123456</strong> for testing this OTP verification.
                      </p>
                    </div>
                    <Input
                      label="Enter 6-digit OTP"
                      maxLength={6}
                      value={form.otp}
                      onChange={(otp) => setForm({ ...form, otp: otp.replace(/\D/g, '') })}
                      placeholder="123456"
                      error={form.otp && form.otp.length !== 6 ? 'OTP must be 6 digits' : ''}
                      required
                    />
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-xs font-bold text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  disabled={!validation}
                >
                  {mode === 'forgot'
                    ? step === 'otp'
                      ? 'Verify Reset OTP'
                      : 'Send Reset OTP'
                    : step === 'otp'
                    ? 'Verify OTP & Log In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
                </Button>
              </form>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default AuthFlow;
