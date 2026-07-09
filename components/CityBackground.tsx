import React, { useMemo } from 'react';

export const CityBackground: React.FC = () => {
  // Generate random buildings with more detail
  const generateBuildings = (count: number, minH: number, maxH: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      left: `${i * (100 / count)}%`,
      width: `${(100 / count) + 1}%`, // Overlap slightly to prevent gaps
      height: `${minH + Math.random() * (maxH - minH)}%`,
      type: Math.floor(Math.random() * 3), // 0: Normal, 1: Spire, 2: Sloped
      windows: Array.from({ length: Math.floor(Math.random() * 5) + 3 }).map((_, j) => ({
        top: `${10 + j * 12}%`,
        left: `${20 + Math.random() * 60}%`,
        on: Math.random() > 0.4
      }))
    }));
  };

  const backBuildings = useMemo(() => generateBuildings(12, 30, 60), []);
  const frontBuildings = useMemo(() => generateBuildings(8, 15, 45), []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-[#0f172a] via-[#312e81] to-[#6b21a8]">
      {/* Stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div 
          key={i}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            width: Math.random() > 0.8 ? '3px' : '1px',
            height: Math.random() > 0.8 ? '3px' : '1px',
            opacity: Math.random(),
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}

      {/* Moon */}
      <div className="absolute top-12 right-12 w-20 h-20 rounded-full bg-yellow-100 shadow-[0_0_40px_rgba(253,224,71,0.4)] opacity-90"></div>

      {/* Layer 1: Back Buildings (Slower, Darker) */}
      <div className="absolute inset-0 w-[200%] flex items-end animate-[cityScroll_60s_linear_infinite] opacity-60">
        {[...backBuildings, ...backBuildings].map((b, i) => (
          <div 
            key={`back-${i}`}
            className="relative bg-slate-800 border-t border-slate-600"
            style={{ width: b.width, height: b.height }}
          >
             {/* Simple silhouette windows */}
             {b.windows.filter((_, idx) => idx % 2 === 0).map((w, j) => (
               <div key={j} className="absolute w-1 h-2 bg-yellow-900/50" style={{ top: w.top, left: w.left }} />
             ))}
          </div>
        ))}
      </div>

      {/* Layer 2: Front Buildings (Faster, Detailed) */}
      <div className="absolute inset-0 w-[200%] flex items-end animate-[cityScroll_30s_linear_infinite]">
        {[...frontBuildings, ...frontBuildings].map((b, i) => (
          <div 
            key={`front-${i}`}
            className="relative bg-gradient-to-b from-indigo-900 to-slate-900 border-t-2 border-indigo-400 mx-[1px]"
            style={{ width: b.width, height: b.height }}
          >
             {/* Roof Details */}
             {b.type === 1 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-6 bg-indigo-400"></div>}
             {b.type === 1 && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-2 bg-indigo-500"></div>}
             
             {/* Windows */}
             <div className="w-full h-full flex flex-col items-center pt-4 gap-3">
               {b.windows.map((w, j) => (
                 <div 
                   key={j} 
                   className={`w-[60%] h-3 flex gap-1 justify-center`}
                 >
                    <div className={`flex-1 ${w.on ? 'bg-yellow-300 shadow-[0_0_5px_#fde047]' : 'bg-slate-800'}`}></div>
                    <div className={`flex-1 ${Math.random() > 0.5 && w.on ? 'bg-yellow-300 shadow-[0_0_5px_#fde047]' : 'bg-slate-800'}`}></div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>

      {/* Ground Fog/Glow */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-purple-900/80 to-transparent pointer-events-none"></div>
    </div>
  );
};