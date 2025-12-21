
import React, { useState, useEffect } from 'react';
import { MapPin, Compass as CompassIcon, Info, RefreshCcw } from 'lucide-react';

interface QiblahProps {
  location: { lat: number, lng: number } | null;
}

const Qiblah: React.FC<QiblahProps> = ({ location }) => {
  const [heading, setHeading] = useState(0);
  const [qiblahDirection, setQiblahDirection] = useState(0);
  const [hasOrientation, setHasOrientation] = useState(false);

  useEffect(() => {
    if (location) {
      const calculateQiblah = (lat: number, lng: number) => {
        const phi1 = lat * Math.PI / 180;
        const lambda1 = lng * Math.PI / 180;
        const phi2 = 21.4225 * Math.PI / 180; // Makkah lat
        const lambda2 = 39.8262 * Math.PI / 180; // Makkah lng
        
        const y = Math.sin(lambda2 - lambda1);
        const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lambda2 - lambda1);
        let q = Math.atan2(y, x) * 180 / Math.PI;
        return (q + 360) % 360;
      };
      setQiblahDirection(calculateQiblah(location.lat, location.lng));
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Use webkitCompassHeading for iOS or alpha for Android
      // Note: absolute alpha can be tricky depending on the device
      const compassHeading = (event as any).webkitCompassHeading || (360 - (event.alpha || 0));
      if (compassHeading !== undefined) {
        setHeading(compassHeading);
        setHasOrientation(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [location]);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', () => {});
        }
      } catch (e) {
        console.error("Permission error", e);
      }
    }
  };

  return (
    <div className="p-6 bg-[#08120d] min-h-screen text-white flex flex-col items-center">
      <header className="w-full flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-emerald-400 tracking-tighter leading-none">Qiblah Finder</h1>
          <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mt-1">Holy Direction</p>
        </div>
        <button onClick={requestPermission} className="p-3 bg-white/5 rounded-2xl border border-white/10">
          <RefreshCcw size={18} className="text-emerald-500" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        {/* Distance Info Overlay */}
        <div className="absolute top-0 left-0 right-0 text-center animate-in fade-in duration-700">
           <div className="inline-flex items-center gap-2 bg-emerald-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/20">
              <MapPin size={12} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Makkah, Saudi Arabia</span>
           </div>
        </div>

        {/* Compass Visualizer */}
        <div className="relative w-80 h-80 flex items-center justify-center">
           {/* Background Rings */}
           <div className="absolute inset-0 border-4 border-emerald-900/20 rounded-full" />
           <div className="absolute inset-8 border border-white/5 rounded-full" />
           
           {/* Rotating Compass Disc */}
           <div 
            className="relative w-full h-full transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-heading}deg)` }}
           >
              {/* Compass Labels */}
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-black text-rose-500">N</span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-black text-slate-500">S</span>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">W</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">E</span>
              
              {/* Degrees markers */}
              {[...Array(36)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 left-1/2 h-full border-l border-white/10"
                  style={{ transform: `translateX(-50%) rotate(${i * 10}deg)` }}
                />
              ))}

              {/* Qiblah Indicator */}
              <div 
                className="absolute inset-0 flex flex-col items-center pt-10"
                style={{ transform: `rotate(${qiblahDirection}deg)` }}
              >
                 <div className="w-1.5 h-20 bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)] relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                       <CompassIcon size={24} fill="#10b981" />
                    </div>
                 </div>
                 <div className="mt-4 bg-emerald-500 text-black text-[9px] font-black uppercase px-2 py-1 rounded">QIBLAH</div>
              </div>
           </div>

           {/* Fixed Pointer */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4">
              <div className="w-1 h-8 bg-white/20 rounded-full" />
           </div>

           {/* Center Point */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-white shadow-xl" />
           </div>
        </div>

        {/* Direction Data */}
        <div className="mt-12 text-center">
            <h2 className="text-4xl font-black text-white mb-2">{Math.round(qiblahDirection)}°</h2>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Relative to True North</p>
        </div>
      </div>

      <div className="w-full bg-white/5 rounded-[2.5rem] p-6 border border-white/10 mb-8">
        <div className="flex items-start gap-4">
           <div className="p-3 bg-emerald-900/40 rounded-2xl">
              <Info className="text-emerald-400" size={18} />
           </div>
           <div>
              <p className="text-xs font-bold text-white leading-relaxed">
                To get the most accurate result, place your device on a flat surface away from metal objects or magnetic fields.
              </p>
              {!hasOrientation && (
                <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest mt-2">
                   Calibrate your compass or allow sensor access
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Qiblah;
