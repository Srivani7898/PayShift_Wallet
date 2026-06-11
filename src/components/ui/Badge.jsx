export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const baseStyle = 'inline-flex items-center justify-center font-black rounded-full';
  
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/20',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/20',
    failed: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100/20',
    primary: 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400 border border-brand-100/20',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450 border border-blue-100/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wide uppercase',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
