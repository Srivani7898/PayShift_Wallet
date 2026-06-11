export function Avatar({
  name = '',
  src = '',
  size = 'md',
  className = '',
}) {
  const getInitials = (fullName) => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base font-black',
    xl: 'h-20 w-20 text-xl font-black',
  };

  const hasImage = Boolean(src);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-2xl font-bold bg-gradient-to-br from-brand-100 to-indigo-100 text-brand-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 overflow-hidden ${sizes[size]} ${className}`}
    >
      {hasImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name) || 'PS'}</span>
      )}
    </div>
  );
}

export default Avatar;
