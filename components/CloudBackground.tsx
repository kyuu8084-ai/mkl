import React, { useEffect, useState } from 'react';

// Simple pixel art cloud SVG string
const PixelCloudSVG = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    viewBox="0 0 100 60" 
    className={className} 
    style={style} 
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Bolder colors: removed transparency or increased it significantly */}
    <path d="M20 40 h10 v-10 h10 v-10 h20 v10 h20 v10 h10 v10 h-70 z" fill="#FFFFFF" fillOpacity="1" />
    <path d="M25 45 h10 v-10 h10 v-10 h10 v10 h10 v10 h10 v5 h-50 z" fill="#BAE6FD" fillOpacity="1" />
  </svg>
);

interface Cloud {
  id: number;
  top: number;
  left: number;
  scale: number;
  speed: number;
  opacity: number;
  delay: number;
}

export const CloudBackground: React.FC = () => {
  const [clouds, setClouds] = useState<Cloud[]>([]);

  useEffect(() => {
    // Generate more clouds, bigger size
    const initialClouds = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      scale: 1 + Math.random() * 3, // Big clouds
      speed: 20 + Math.random() * 40, 
      opacity: 0.8 + Math.random() * 0.2, // High opacity for bold look
      delay: -(Math.random() * 60)
    }));
    setClouds(initialClouds);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-sky-500 via-sky-300 to-sky-100">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute will-change-transform"
          style={{
            top: `${cloud.top}%`,
            left: `-30%`, 
            width: `${100 * cloud.scale}px`,
            height: `${60 * cloud.scale}px`,
            opacity: cloud.opacity,
            animation: `floatCloud ${cloud.speed}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
            filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.1))' // Add pixel-art style shadow
          }}
        >
          <PixelCloudSVG className="w-full h-full" />
        </div>
      ))}
      <style>{`
        @keyframes floatCloud {
          0% { transform: translateX(0vw); }
          100% { transform: translateX(150vw); }
        }
      `}</style>
    </div>
  );
};