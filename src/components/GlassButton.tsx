import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'glass' | 'rust' | 'subtle' | 'half';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'glass',
  size = 'md',
  type = 'button',
  disabled = false,
}) => {
  const { theme } = useTheme();

  // Size-specific height and padding
  const sizeClasses = {
    sm: 'h-8 px-3.5 text-xs',
    md: 'h-10 px-6 text-xs sm:text-[13px]',
    lg: 'h-12 px-8 text-xs sm:text-[13px]',
  }[size];

  if (variant === 'rust') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full font-sans-clean font-medium tracking-wide text-white border border-[#e25a3e]/70 hover:border-[#e25a3e] bg-[#ad3822]/90 hover:bg-[#ad3822] backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50 select-none active:scale-[0.98] ${sizeClasses} ${className}`}
      >
        {children}
      </button>
    );
  }

  // 50% opacity fill variant
  if (variant === 'half') {
    const halfThemeClasses = theme === 'light'
      ? 'border-slate-900/30 hover:border-slate-900/50 bg-slate-900/50 hover:bg-slate-900/60 text-white font-medium'
      : 'border-white/30 hover:border-white/60 bg-white/50 hover:bg-white/60 text-white font-medium';

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full font-sans-clean tracking-wide border backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50 select-none active:scale-[0.98] text-white ${halfThemeClasses} ${sizeClasses} ${className}`}
      >
        {children}
      </button>
    );
  }

  // Pure glassmorphic button: theme-aware, no drop shadow, backdrop filter blur
  const glassThemeClasses = theme === 'light'
    ? 'border-slate-900/25 hover:border-slate-900/50 bg-slate-900/[0.06] hover:bg-slate-900/[0.12] text-slate-900 font-medium'
    : 'border-white/50 hover:border-white/80 bg-white/[0.08] hover:bg-white/[0.16] text-white font-normal';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full font-sans-clean tracking-wide border backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50 select-none active:scale-[0.98] ${glassThemeClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </button>
  );
};
