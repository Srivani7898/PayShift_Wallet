/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type = 'info' } = e.detail || {};
      setToast({ message, type });
      
      // Auto dismiss
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('payswift:toast', handleToast);
    return () => window.removeEventListener('payswift:toast', handleToast);
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
          className="fixed bottom-24 left-1/2 z-50 rounded-2xl bg-slate-900/90 dark:bg-white/90 px-5 py-3 text-sm font-bold text-white dark:text-slate-900 shadow-2xl backdrop-blur-md md:bottom-6 max-w-sm text-center border border-white/10 dark:border-slate-200"
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Utility function to trigger toast from anywhere
export const showToast = (message, type = 'info') => {
  window.dispatchEvent(
    new CustomEvent('payswift:toast', {
      detail: { message, type },
    })
  );
};

export default Toast;
