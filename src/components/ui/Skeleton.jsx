export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}) {
  const baseStyle = 'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl';
  
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full shrink-0',
    rectangular: 'w-full rounded-2xl',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${className}`}
      style={style}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="40px" height="40px" />
            <div className="space-y-1.5">
              <Skeleton variant="text" width="120px" height="14px" />
              <Skeleton variant="text" width="80px" height="10px" />
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1.5">
            <Skeleton variant="text" width="60px" height="14px" />
            <Skeleton variant="text" width="40px" height="10px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-panel p-5 space-y-4 rounded-[28px]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width="80px" height="12px" />
          <Skeleton variant="text" width="150px" height="28px" />
        </div>
        <Skeleton variant="circular" width="30px" height="30px" />
      </div>
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="rectangular" height="40px" />
            <Skeleton variant="text" height="10px" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
