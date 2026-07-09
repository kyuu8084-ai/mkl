import React, { useMemo } from 'react';

export const SnowBackground: React.FC = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 60 }).map(() => ({
      left: `${Math.random() * 100}%`,
      duration: `${4 + Math.random() * 6}s`,
      delay: `${-Math.random() * 10}s`,
      size: `${2 + Math.random() * 4}px`,
      opacity: 0.4 + Math.random() * 0.6
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#1e293b] via-[#334155] to-[#cbd5e1]">
      
      {/* SVG Mountains for cleaner look */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] flex items-end">
        <svg viewBox="0 0 1200 400" className="w-full h-full" preserveAspectRatio="none">
          {/* Back Mountains */}
          <path d="M0 400 L200 150 L400 400 L600 100 L900 400 L1200 250 L1200 400 Z" fill="#475569" />
          <path d="M200 150 L250 210 L150 210 Z" fill="#e2e8f0" opacity="0.5" /> 
          <path d="M600 100 L660 180 L540 180 Z" fill="#e2e8f0" opacity="0.5" />

          {/* Front Mountains */}
          <path d="M-100 400 L150 250 L400 400 L550 280 L800 400 L1000 200 L1300 400 Z" fill="#1e293b" />
          {/* Snow Caps Front */}
          <path d="M150 250 L190 290 L110 290 Z" fill="#fff" />
          <path d="M550 280 L590 320 L510 320 Z" fill="#fff" />
          <path d="M1000 200 L1050 260 L950 260 Z" fill="#fff" />
        </svg>
      </div>

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-12 bg-[#cbd5e1] border-t-4 border-white"></div>

      {/* Falling Snow */}
      {snowflakes.map((flake, i) => (
        <div 
          key={i} 
          className="absolute bg-white rounded-full shadow-[0_0_4px_#fff]" 
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animation: `snowFall ${flake.duration} linear infinite`,
            animationDelay: flake.delay,
            top: '-20px' // Start above screen
          }} 
        />
      ))}
    </div>
  );
};