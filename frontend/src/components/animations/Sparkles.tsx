import React from 'react';
import { motion } from 'framer-motion';

interface SparklesProps {
  className?: string;
  count?: number;
}

export const Sparkles: React.FC<SparklesProps> = ({
  className = '',
  count = 6,
}) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${15 + (i * 14) % 70}%`,
    left: `${10 + (i * 17) % 80}%`,
    size: 2 + (i % 3),
    duration: 2 + (i % 3) * 0.8,
    delay: (i % 4) * 0.4,
  }));

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gold/50 blur-[0.5px]"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0.1, 0.8, 0.1],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default Sparkles;
