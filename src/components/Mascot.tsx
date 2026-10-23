import React from 'react';
import { motion } from 'motion/react';

interface MascotProps {
  className?: string;
  imgClassName?: string;
  glow?: boolean;
}

/**
 * Mumus — official mascot.
 * Renders the mascot with a subtle cyan glowing contour and a slow,
 * always-running "cloud squish" float (gentle up/down + soft scale).
 */
export const Mascot: React.FC<MascotProps> = ({ className = '', imgClassName = '', glow = true }) => {
  return (
    <div className={`relative flex items-end justify-center pointer-events-none select-none ${className}`}>
      {glow && (
        <>
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[70%] rounded-full bg-cyan-400/25 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[55%] h-[45%] rounded-full bg-sky-300/30 blur-2xl"
          />
        </>
      )}

      <motion.img
        src="/mumus.png"
        alt="Mumus, the official trench trading mascot"
        draggable={false}
        className={`relative w-auto object-contain ${imgClassName}`}
        style={{
          transformOrigin: 'center bottom',
          filter:
            'drop-shadow(0 0 12px rgba(34, 211, 238, 0.55)) drop-shadow(0 0 34px rgba(34, 211, 238, 0.30))'
        }}
        animate={{
          y: [0, -22, 0],
          scaleX: [1, 1.032, 1],
          scaleY: [1, 0.968, 1]
        }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};
