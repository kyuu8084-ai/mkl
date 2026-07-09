import React, { useEffect, useState } from 'react';

export const OceanBackground: React.FC = () => {
  const [elements, setElements] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const newElements = [];
    
    // Create Fish & Whales
    for(let i = 0; i < 15; i++) { 
      let className = '';
      const rand = Math.random();
      const isRight = Math.random() > 0.5;
      
      // Select class based on random
      if (rand < 0.4) { 
        // Dolphin
        className = 'pixel-dolphin-base';
        if (isRight) className += ' swim-right';
        else className += ' swim-left';
      } else if (rand < 0.7) { 
        // Whale - Bigger
        className = 'pixel-whale';
        if (isRight) className += ' swim-right-whale';
        else className += ' swim-left-whale';
      } else { 
        // Starfish
        className = 'pixel-starfish';
      }
      
      const top = Math.random() * 85;
      const dur = 15 + Math.random() * 20;
      const delay = -Math.random() * dur;

      const style: React.CSSProperties = {
        top: `${top}%`,
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`,
        zIndex: 10
      };
      
      if (className.includes('starfish')) {
          style.left = `${Math.random() * 95}%`;
      }

      newElements.push(
        <div key={`fish-${i}`} className={className} style={style} />
      );
    }

    // Create Bubbles
    for(let i = 0; i < 30; i++) {
        const dur = 5 + Math.random() * 10;
        const style: React.CSSProperties = {
            left: `${Math.random() * 100}%`,
            animationDuration: `${dur}s`,
            animationDelay: `${-Math.random() * dur}s`
        };
        newElements.push(<div key={`bub-${i}`} className="tiny-bubble" style={style} />);
    }

    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#60a5fa] to-[#1e40af]">
      {/* Sun rays effect */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent"></div>
      {elements}
    </div>
  );
};