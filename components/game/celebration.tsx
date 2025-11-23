'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
  colors: string[];
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  velocity: number;
  size: number;
}

export const Celebration: React.FC<CelebrationProps> = ({ colors, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const color = colors[i % colors.length] || '#ffffff';
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        color,
        angle: Math.random() * Math.PI * 2,
        velocity: 0.5 + Math.random() * 1.5,
        size: 4 + Math.random() * 6,
      });
    }
    
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [colors, onComplete]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                backgroundColor: particle.color,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              initial={{ opacity: 1, scale: 0 }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0, 1, 0.5],
                x: `calc(${Math.cos(particle.angle) * particle.velocity * 100}vw)`,
                y: `calc(${Math.sin(particle.angle) * particle.velocity * 100}vh)`,
              }}
              transition={{
                duration: 2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

