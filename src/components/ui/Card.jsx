import { motion } from 'framer-motion';

export function Card({
  children,
  className = '',
  hoverScale = false,
  glass = true,
  onClick,
  ...props
}) {
  const Component = onClick ? motion.div : 'div';
  
  const baseStyle = glass 
    ? 'glass-panel rounded-[28px] p-5 shadow-soft border border-white/60 dark:border-slate-800/60 backdrop-blur-xl' 
    : 'bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-soft border border-slate-100 dark:border-slate-800/80';
  
  const interactivityProps = onClick 
    ? {
        onClick,
        whileHover: hoverScale ? { y: -2, scale: 1.01 } : {},
        whileTap: { scale: 0.99 },
        className: `${baseStyle} cursor-pointer select-none ${className}`,
        ...props
      }
    : {
        className: `${baseStyle} ${className}`,
        ...props
      };

  return <Component {...interactivityProps}>{children}</Component>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-black text-slate-900 dark:text-slate-50 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`mt-5 flex items-center justify-end gap-3 ${className}`}>{children}</div>;
}

export default Card;
