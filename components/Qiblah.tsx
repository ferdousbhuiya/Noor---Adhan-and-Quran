
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Compass as CompassIcon, Info, RefreshCcw, ShieldCheck, AlertTriangle } from 'lucide-react';

interface QiblahProps {
  location: { lat: number, lng: number } | null;
}

const Qiblah: React.FC<QiblahProps> = ({ location }) => {
  const [heading, setHeading] = useState(0);
  const [qiblahDirection, setQiblahDirection] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  
  const headingRef = useRef(0);

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
      // iOS: webkitCompassHeading provides true north
      let currentHeading = (event as any).webkitCompassHeading;
      
      // Android: alpha provides relative orientation, absolute event provides magnetic north
      if (currentHeading === undefined) {
        if ((event as any).absolute && event.alpha !== null) {
          currentHeading = 360 - event.alpha;
        } else if (event.alpha !== null) {
          currentHeading = 360 - event.alpha;
        }
      }

      if (currentHeading !== undefined) {
        // Simple smoothing to prevent jitter
        const delta = currentHeading - headingRef.current;
        const smoothHeading = headingRef.current + (delta > 180 ? delta - 360 : delta < -180 ? delta + 360 : delta) * 0.2;
        
        headingRef.current = smoothHeading;
        setHeading(smoothHeading);
        setPermissionState('granted');
        
        if (event.absolute) {
          setAccuracy(100);
        } else {
          setAccuracy(50); // Relative accuracy
        }
      }
    };

    // Detect browser capabilities
    if (window.DeviceOrientationEvent) {
      if ('ondeviceorientationabsolute' in window) {
        (window as any).addEventListener('deviceorientationabsolute', handleOrientation);
      } else {
        (window as any).addEventListener('deviceorientation', handleOrientation);
      }
    } else {
      setPermissionState('unsupported');
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
          // Listeners are already added, but some browsers need a quick toggle
          window.location.reload();
        }
      } catch (e) {
        setPermissionState('denied');
      }
    } else {
      // Android usually just works or needs a manual prompt in some niche browsers
      setPermissionState('granted');
    }
  };

  const isPointedAtQiblah = Math.abs((heading % 360) - qiblahDirection) < 5;

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
           <div className={`inline-flex items-center gap-2 backdrop-blur-md px-5 py-2.5 rounded-full border transition-all ${isPointedAtQiblah ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
              <MapPin size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {isPointedAtQiblah ? 'Facing Kaaba' : 'Kaaba • 21.4° N, 39.8° E'}
              </span>
           </div>
        </div>

        <div className="relative w-80 h-80 flex items-center justify-center">
           <div className={`absolute inset-0 border-4 rounded-full transition-colors duration-500 ${isPointedAtQiblah ? 'border-emerald-500/20' : 'border-emerald-900/10'}`} />
           <div className="absolute inset-4 border border-emerald-500/5 rounded-full" />
           
           {/* Compass Card */}
           <div 
            className="relative w-full h-full transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${-heading}deg)` }}
           >
              {/* Cardinals */}
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-black text-rose-500">N</span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-black text-slate-500">S</span>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">W</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">E</span>
              
              {/* Ticks */}
              {[...Array(36)].map((_, i) => (
                <div 
                  key={i} 
                  className={`absolute top-0 left-1/2 h-full border-l ${i % 9 === 0 ? 'border-white/20' : 'border-white/5'}`}
                  style={{ transform: `translateX(-50%) rotate(${i * 10}deg)` }}
                />
              ))}

              {/* Qiblah Needle on the Card */}
              <div 
                className="absolute inset-0 flex flex-col items-center pt-8"
                style={{ transform: `rotate(${qiblahDirection}deg)` }}
              >
                 <div className={`w-1.5 h-24 rounded-full transition-all duration-300 relative ${isPointedAtQiblah ? 'bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.8)]' : 'bg-emerald-800'}`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border-2 transition-all duration-300 ${isPointedAtQiblah ? 'bg-emerald-500 border-white scale-125' : 'bg-black border-emerald-800'}`}>
                       <CompassIcon size={24} className={isPointedAtQiblah ? 'text-white' : 'text-emerald-800'} />
                    </div>
                 </div>
                 <div className={`mt-6 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isPointedAtQiblah ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/20'}`}>QIBLAH</div>
              </div>
           </div>

           {/* Fixed Center Marker */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_20px_white]" />
              <div className="w-0.5 h-20 bg-gradient-to-t from-transparent via-white/10 to-white/60 absolute top-0 left-1/2 -translate-x-1/2" />
           </div>
        </div>

        <div className="mt-12 text-center animate-in slide-in-from-bottom duration-500">
            <h2 className={`text-6xl font-black mb-2 tracking-tighter tabular-nums transition-colors ${isPointedAtQiblah ? 'text-emerald-400' : 'text-white'}`}>
              {Math.round(qiblahDirection)}°
            </h2>
            <div className="flex items-center gap-2 justify-center">
                <ShieldCheck size={14} className={accuracy === 100 ? 'text-emerald-500' : 'text-amber-500'} />
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${accuracy === 100 ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                  {accuracy === 100 ? 'True North Active' : 'Sensor Calibrating...'}
                </p>
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
                  Hold your phone flat and face away from metal objects or electronics to ensure maximum magnetic accuracy.
                </p>
             </div>
          </div>
        ) : permissionState === 'unsupported' ? (
          <div className="flex items-start gap-4 text-rose-400">
             <AlertTriangle size={18} />
             <p className="text-xs font-bold leading-relaxed">Orientation sensors not detected. This feature requires a device with a magnetometer.</p>
          </div>
        ) : (
          <button 
            onClick={requestPermission}
            className="w-full bg-emerald-500 text-black py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
             <ShieldCheck size={18} /> Activate Precision Compass
          </button>
        )}
      </div>
    </div>
  );
};

export default Qiblah;
