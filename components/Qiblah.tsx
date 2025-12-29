
import React, { useState, useEffect } from 'react';
import { MapPin, Compass as CompassIcon, Info, RefreshCcw, ShieldCheck } from 'lucide-react';

interface QiblahProps {
  location: { lat: number, lng: number } | null;
}

const Qiblah: React.FC<QiblahProps> = ({ location }) => {
  const [heading, setHeading] = useState(0);
  const [qiblahDirection, setQiblahDirection] = useState(0);
  const [hasOrientation, setHasOrientation] = useState(false);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');

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
      // Prioritize True North via webkitCompassHeading (iOS)
      // or absolute alpha (Android)
      let compassHeading = (event as any).webkitCompassHeading;
      
      if (compassHeading === undefined) {
        // Fallback for Android absolute orientation
        if ((event as any).absolute || event.alpha !== null) {
          compassHeading = 360 - (event.alpha || 0);
        }
      }

      if (compassHeading !== undefined) {
        setHeading(compassHeading);
        setHasOrientation(true);
        setPermissionState('granted');
      }
    };

    // Use Absolute event for Android if possible
    // Cast window to any to avoid TypeScript narrowing to 'never' on unrecognised properties
    if ('ondeviceorientationabsolute' in window) {
      (window as any).addEventListener('deviceorientationabsolute', handleOrientation);
    } else {
      (window as any).addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      (window as any).removeEventListener('deviceorientationabsolute', handleOrientation);
      (window as any).removeEventListener('deviceorientation', handleOrientation);
    };
  }, [location]);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const state = await (DeviceOrientationEvent as any).requestPermission();
        setPermissionState(state);
        if (state === 'granted') {
          window.location.reload(); // Re-init listeners
        }
      } catch (e) {
        console.error("Permission error", e);
        setPermissionState('denied');
      }
    } else {
      // For devices that don't need explicit permission (Android mostly)
      setPermissionState('granted');
    }
  };

  return (
    <div className="p-6 bg-[#08120d] min-h-screen text-white flex flex-col items-center">
      <header className="w-full flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-emerald-400 tracking-tighter leading-none">Qiblah</h1>
          <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mt-1">Satellite Compass</p>
        </div>
        <button onClick={requestPermission} className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-all">
          <RefreshCcw size={18} className="text-emerald-500" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        <div className="absolute top-0 left-0 right-0 text-center animate-in fade-in duration-700">
           <div className="inline-flex items-center gap-2 bg-emerald-900/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-emerald-500/20">
              <MapPin size={12} className="text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest">Kaaba • 21.4° N, 39.8° E</span>
           </div>
        </div>

        <div className="relative w-80 h-80 flex items-center justify-center">
           <div className="absolute inset-0 border-4 border-emerald-900/10 rounded-full" />
           <div className="absolute inset-4 border border-emerald-500/5 rounded-full" />
           
           <div 
            className="relative w-full h-full transition-transform duration-150 ease-out"
            style={{ transform: `rotate(${-heading}deg)` }}
           >
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-black text-rose-500">N</span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-black text-slate-500">S</span>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">W</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">E</span>
              
              {[...Array(36)].map((_, i) => (
                <div 
                  key={i} 
                  className={`absolute top-0 left-1/2 h-full border-l ${i % 9 === 0 ? 'border-white/20' : 'border-white/5'}`}
                  style={{ transform: `translateX(-50%) rotate(${i * 10}deg)` }}
                />
              ))}

              <div 
                className="absolute inset-0 flex flex-col items-center pt-8"
                style={{ transform: `rotate(${qiblahDirection}deg)` }}
              >
                 <div className="w-1.5 h-24 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-1.5 rounded-full border-2 border-emerald-400">
                       <CompassIcon size={24} className="text-emerald-400" />
                    </div>
                 </div>
                 <div className="mt-5 bg-emerald-500 text-black text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">QIBLAH</div>
              </div>
           </div>

           <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4">
              <div className="w-1 h-8 bg-white/40 rounded-full" />
           </div>

           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_20px_white]" />
           </div>
        </div>

        <div className="mt-12 text-center">
            <h2 className="text-5xl font-black text-white mb-2 tracking-tighter tabular-nums">{Math.round(qiblahDirection)}°</h2>
            <div className="flex items-center gap-2 justify-center">
                <ShieldCheck size={14} className="text-emerald-500" />
                <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-[0.2em]">Accuracy High</p>
            </div>
        </div>
      </div>

      <div className="w-full bg-white/5 rounded-[2.5rem] p-8 border border-white/10 mb-8 backdrop-blur-xl">
        {permissionState === 'granted' ? (
          <div className="flex items-start gap-4">
             <div className="p-3 bg-emerald-900/30 rounded-2xl text-emerald-400">
                <Info size={18} />
             </div>
             <div>
                <p className="text-xs font-bold text-white/80 leading-relaxed">
                  Calibrated successfully. Tilt your phone horizontally and face away from electronics for best results.
                </p>
             </div>
          </div>
        ) : (
          <button 
            onClick={requestPermission}
            className="w-full bg-emerald-500 text-black py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
             <ShieldCheck size={18} /> Enable Precise Compass
          </button>
        )}
      </div>
    </div>
  );
};

export default Qiblah;
