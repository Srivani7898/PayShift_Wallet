import { Search, X } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search here...',
  className = '',
}) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-4 h-4.5 w-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 pl-11 pr-11 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-500 dark:focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/10 placeholder:text-slate-450 dark:placeholder:text-slate-500"
      />
      {value && (
        <button
          onClick={() => onChange?.('')}
          className="absolute right-4 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
