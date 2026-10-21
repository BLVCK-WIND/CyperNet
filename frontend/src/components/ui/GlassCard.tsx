import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  glowOnHover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevated = false,
  glowOnHover = false,
  ...props
}) => {
  const baseClasses = elevated
    ? 'glass-panel-elevated shadow-2xl'
    : 'glass-panel shadow-lg';

  const hoverClasses = glowOnHover
    ? 'transition-all duration-300 hover:border-gold/40 hover:shadow-[0_4px_24px_rgba(181,136,99,0.15)]'
    : 'transition-all duration-300';

  return (
    <div
      className={`rounded-xl p-5 ${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
