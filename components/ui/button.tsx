import React from 'react';
import { cn } from '@/lib';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-white text-black hover:bg-white/90 shadow-lg active:scale-95',
      secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
      ghost: 'text-white/50 hover:text-white hover:bg-white/10',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-xl',
      lg: 'px-6 py-3 text-lg rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
