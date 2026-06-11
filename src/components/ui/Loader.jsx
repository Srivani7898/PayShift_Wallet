import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export function Loader({
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'h-4 w-4 stroke-[3]',
    md: 'h-8 w-8 stroke-[2.5]',
    lg: 'h-12 w-12 stroke-[2]',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin text-brand-500 ${sizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        {/* Animated logo mark */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="payswift-logo-mark mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-xl shadow-brand-500/20"
        >
          <Wallet size={30} />
        </motion.div>
        
        {/* Brand name */}
        <h2 className="text-2xl font-black tracking-normal text-slate-800 dark:text-slate-100">
          PAYSHIFT
        </h2>
        
        {/* Subtitle */}
        <p className="mt-1 text-sm font-semibold text-slate-400 dark:text-slate-500">
          Loading secure wallet...
        </p>

        {/* Inline spinner */}
        <Loader size="sm" className="mt-4" />
      </div>
    </div>
  );
}

export default Loader;
