
import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Target, ChevronUp, ChevronDown, Edit2, X, Check, Heart } from 'lucide-react';

interface TasbihProps {
  target: number;
  session?: { title: string, text?: string, target: number, image?: string } | null;
  onClearSession?: () => void;
}

const Tasbih: React.FC<TasbihProps> = ({ target: initialTarget, session, onClearSession }) => {
  const [count, setCount] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(initialTarget);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(initialTarget.toString());
  
  const tapSound = useRef<HTMLAudioElement | null>(null);
  const finishSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setCurrentTarget(initialTarget);
    setTempTarget(initialTarget.toString());
    setCount(0); // Reset count when target or session changes
  }, [initialTarget, session]);

  useEffect(() => {
    // Ensuring sound is available
    tapSound.current = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
    finishSound.current = new Audio('https://www.soundjay.com/buttons/sounds/button-30.mp3');
  }, []);

  const handleIncrement = () => {
    // Sound on every press - critical requirement
    if (tapSound.current) {
      tapSound.current.currentTime = 0;
      tapSound.current.play().catch(e => console.error("Sound play blocked", e));
    }

    if (count + 1 === currentTarget) {
      if (window.navigator.vibrate) {
        window.navigator.vibrate([150, 50, 150]);
      }
      if (finishSound.current) {
        finishSound.current.play().catch(() => {});
      }
    }
    setCount(prev => prev + 1);
  };

  const reset = () => {
    setCount(0);
  };

  const handleSaveManualTarget = () => {
    const val = parseInt(tempTarget);
    if (!isNaN(val) && val > 0) {
      setCurrentTarget(val);
      setIsEditingTarget(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#08120d] text-white p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-black text-emerald-400 tracking-tighter">
            {session ? 'Dua Recitation' : 'Digital Tasbih'}
          </h1>
          <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest">
            {session ? session.title : 'Premium Dhikr'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <button 
              onClick={() => setIsEditingTarget(true)}
              className="bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 border border-white/10 transition-colors"
            >
              <Target size={14} className="text-emerald-500" />
              <span className="text-sm font-bold tabular-nums">{currentTarget}</span>
              <Edit2 size={12} className="text-white/30" />
            </button>
            {session && (
                <button 
                  onClick={onClearSession}
                  className="bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-rose-500/20"
                >
                    Exit Session
                </button>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Dua/Dhikr Text Display if in Session */}
        {session && (
            <div className="w-full text-center mb-8 px-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {session.image ? (
                    <div className="max-w-[200px] mx-auto h-24 rounded-2xl overflow-hidden border border-emerald-500/20 mb-4 shadow-lg shadow-emerald-500/10">
                        <img src={session.image} className="w-full h-full object-cover" alt="Dua" />
                    </div>
                ) : (
                    <p className={`arabic-text text-2xl mb-2 text-emerald-200 leading-relaxed font-bold ${session.text?.length && session.text.length > 50 ? 'text-lg' : 'text-2xl'}`}>
                        {session.text}
                    </p>
                )}
            </div>
        )}

        {/* Main Display Area */}
        <div className="relative w-full max-w-xs aspect-square flex items-center justify-center mb-10">
           <div className="absolute inset-0 border-8 border-emerald-900/10 rounded-full" />
           <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              cx="50%" cy="50%" r="45%" fill="none" stroke="#10b981" strokeWidth="12" 
              strokeDasharray="283%" strokeDashoffset={`${283 * (1 - Math.min(count / currentTarget, 1))}%`}
              strokeLinecap="round" className="transition-all duration-300 ease-out"
              strokeOpacity={0.8}
            />
          </svg>
          <div className="text-center z-10">
            <p className="text-[7.5rem] leading-none font-black mb-1 tabular-nums drop-shadow-lg text-emerald-50">{count}</p>
            <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">Count Completed</p>
          </div>
        </div>

        {/* The Tap Button */}
        <button 
          onClick={handleIncrement} 
          className="w-60 h-60 rounded-full bg-gradient-to-tr from-emerald-950 via-emerald-700 to-emerald-500 shadow-[0_25px_80px_-20px_rgba(16,185,129,0.5)] active:scale-[0.85] transition-all duration-75 flex items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-2 border-4 border-white/5 rounded-full group-active:scale-95 transition-transform" />
          <div className="absolute inset-0 bg-white/5 group-active:bg-white/10 transition-colors" />
          <span className="text-4xl font-black tracking-tighter text-white drop-shadow-md">TAP</span>
        </button>

        {/* Controls */}
        <div className="mt-16 w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-[3rem] p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Adjustment</p>
            <button onClick={reset} className="text-rose-500 text-[10px] font-black uppercase flex items-center gap-1.5 hover:text-rose-400 transition-colors bg-rose-500/5 px-3 py-1.5 rounded-full">
              <RotateCcw size={14} /> Clear Count
            </button>
          </div>
          <div className="flex justify-center items-center gap-8">
             <button onClick={() => setCurrentTarget(Math.max(1, currentTarget - 10))} className="p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-colors border border-white/5">
               <ChevronDown size={24} />
             </button>
             <span className="text-4xl font-black w-24 text-center text-emerald-400 tabular-nums">{currentTarget}</span>
             <button onClick={() => setCurrentTarget(currentTarget + 10)} className="p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-colors border border-white/5">
               <ChevronUp size={24} />
             </button>
          </div>
        </div>
      </div>

      {/* Manual Input Modal */}
      {isEditingTarget && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0c1a12] w-full max-w-xs p-10 rounded-[3.5rem] border border-white/10 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-2xl tracking-tight text-white">Target</h3>
                <button onClick={() => setIsEditingTarget(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
             </div>
             <input 
               type="number"
               value={tempTarget}
               onChange={(e) => setTempTarget(e.target.value)}
               placeholder="0"
               className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-5xl font-black text-center text-emerald-400 focus:outline-none focus:border-emerald-500/50 mb-8 shadow-inner"
               autoFocus
             />
             <button 
               onClick={handleSaveManualTarget}
               className="w-full bg-emerald-600 hover:bg-emerald-500 p-6 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-600/20"
             >
                <Check size={24} /> Set Count
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasbih;
