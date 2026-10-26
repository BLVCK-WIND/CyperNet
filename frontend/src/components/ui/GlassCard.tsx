import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  glowOnHover?: boolean;
  pill?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevated = false,
  glowOnHover = false,
  pill = false,
  ...props
}) => {
  const baseClasses = elevated
    ? 'glass-panel-elevated shadow-2xl'
    : 'glass-panel shadow-lg';

  const hoverClasses = glowOnHover
    ? 'transition-all duration-300 hover:border-gold/50 hover:border-t-[rgba(220,185,150,0.8)] hover:shadow-[0_12px_32px_-4px_rgba(189,152,117,0.30)] hover:-translate-y-0.5'
    : 'transition-all duration-300';

  const roundedClasses = pill ? 'rounded-full' : 'rounded-2xl';

  return (
    <div
      className={`${roundedClasses} p-5 ${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
