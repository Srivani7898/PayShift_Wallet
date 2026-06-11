export function Input({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder = '',
  maxLength,
  disabled = false,
  className = '',
  inputClassName = '',
  required = false,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`h-12 w-full rounded-2xl border bg-white/70 dark:bg-slate-950/40 px-4 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm outline-none backdrop-blur-xl transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 dark:focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-500/10 ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-500/10'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } ${inputClassName}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs font-semibold text-red-500 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
