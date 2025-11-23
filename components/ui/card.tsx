import React from 'react';
import { cn } from '@/lib';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-black/30 backdrop-blur-md border border-white/10',
    glass: 'bg-black/20 backdrop-blur-md border border-white/10',
    solid: 'bg-slate-900 border border-white/10',
  };

  return (
    <div className={cn('rounded-2xl p-4 shadow-xl', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

