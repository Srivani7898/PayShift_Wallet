import { motion } from 'framer-motion';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-1 shadow-inner ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 py-2 text-xs md:text-sm font-black transition capitalize outline-none rounded-xl ${
              isActive
                ? 'text-brand-700 dark:text-brand-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white dark:bg-slate-900 shadow-sm rounded-xl"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon size={16} />}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
