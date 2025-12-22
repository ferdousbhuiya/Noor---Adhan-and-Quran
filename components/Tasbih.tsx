
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DhikrItem } from '../types';
import { GoogleGenAI } from '@google/genai';
import { 
  Plus, RotateCcw, Target, ChevronLeft, Mic, Image as ImageIcon, 
  Trash2, Play, Check, X, Loader2, Sparkles, AlertCircle, ChevronRight,
  TrendingUp, Calendar as CalendarIcon
} from 'lucide-react';

const Tasbih: React.FC = () => {
  // Navigation & Data State
  const [view, setView] = useState<'list' | 'counter' | 'add'>('list');
  const [dhikrs, setDhikrs] = useState<DhikrItem[]>(() => {
    const saved = localStorage.getItem('noor_dhikr_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeDhikrId, setActiveDhikrId] = useState<string | null>(null);

  // Form State for Adding
  const [newTitle, setNewTitle] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newTarget, setNewTarget] = useState(33);
  const [newImage, setNewImage] = useState<string | undefined>();
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Audio References
  const tapSound = useRef<HTMLAudioElement | null>(null);
  const finishSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tapSound.current = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
    finishSound.current = new Audio('https://www.soundjay.com/buttons/sounds/button-30.mp3');
  }, []);

  useEffect(() => {
    localStorage.setItem('noor_dhikr_list', JSON.stringify(dhikrs));
  }, [dhikrs]);

  const activeDhikr = useMemo(() => dhikrs.find(d => d.id === activeDhikrId), [dhikrs, activeDhikrId]);

  // --- Handlers ---

  const handleIncrement = () => {
    if (!activeDhikrId) return;

    if (tapSound.current) {
      tapSound.current.currentTime = 0;
      tapSound.current.play().catch(() => {});
    }

    setDhikrs(prev => prev.map(d => {
      if (d.id === activeDhikrId) {
        const newCount = d.completedCount + 1;
        if (newCount === d.targetCount) {
          if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
          finishSound.current?.play().catch(() => {});
        }
        return { ...d, completedCount: newCount };
      }
      return d;
    }));
  };

  const handleResetCount = (id: string) => {
    if (confirm("Reset progress for this item?")) {
      setDhikrs(prev => prev.map(d => d.id === id ? { ...d, completedCount: 0 } : d));
    }
  };

  const handleDeleteDhikr = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    // Aggressively stop propagation for both touch and mouse events
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Remove this Dhikr from your daily list?")) {
      setDhikrs(prev => prev.filter(d => d.id !== id));
    }
  };

  // --- AI Logic ---
  const processVoiceToArabic = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsProcessingAI(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Convert this Dhikr description into classical Arabic text only. Transcript: "${transcript}"`,
        });
        setNewArabic(response.text?.trim() || '');
        if (!newTitle) setNewTitle(transcript);
      } catch (e) {
        console.error("AI Error", e);
      } finally {
        setIsProcessingAI(false);
      }
    };
    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setNewImage(reader.result as string);
        setIsProcessingAI(true);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: base64, mimeType: file.type } },
                { text: "Extract the Arabic Dhikr text from this image." }
              ]
            }
          });
          setNewArabic(response.text?.trim() || '');
        } catch (e) {
          console.error("AI Error", e);
        } finally {
          setIsProcessingAI(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveNewDhikr = () => {
    if (!newTitle && !newArabic) return;
    const item: DhikrItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: newTitle || 'Daily Dhikr',
      arabicText: newArabic,
      targetCount: newTarget,
      completedCount: 0,
      image: newImage,
      date: new Date().toLocaleDateString()
    };
    setDhikrs([item, ...dhikrs]);
    setView('list');
    resetForm();
  };

  const resetForm = () => {
    setNewTitle(''); setNewArabic(''); setNewTarget(33); setNewImage(undefined);
  };

  if (view === 'counter' && activeDhikr) {
    const progress = Math.min((activeDhikr.completedCount / activeDhikr.targetCount) * 100, 100);
    return (
      <div className="flex flex-col min-h-screen bg-[#060a08] text-white animate-in fade-in duration-500">
        <header className="p-6 flex justify-between items-center bg-black/40 backdrop-blur-md">
          <button onClick={() => setView('list')} className="p-3 bg-white/5 rounded-2xl active:scale-90 transition-all"><ChevronLeft size={20} /></button>
          <div className="text-center px-4 truncate">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500 truncate">{activeDhikr.title}</h2>
            <p className="text-[9px] font-bold text-white/30 tracking-widest">{activeDhikr.completedCount} / {activeDhikr.targetCount}</p>
          </div>
          <button onClick={() => handleResetCount(activeDhikr.id)} className="p-3 bg-white/5 rounded-2xl active:scale-90 transition-all"><RotateCcw size={20} className="text-rose-400" /></button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
          <div className="w-full text-center mb-12 px-4">
            {activeDhikr.image ? (
              <div className="w-full h-40 rounded-3xl overflow-hidden border border-emerald-500/20 shadow-2xl mb-4">
                <img src={activeDhikr.image} className="w-full h-full object-cover" alt="Dhikr" />
              </div>
            ) : (
              <p className="arabic-text text-4xl text-emerald-50 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] leading-relaxed font-bold">
                {activeDhikr.arabicText || activeDhikr.title}
              </p>
            )}
          </div>

          <div className="relative w-72 h-72 flex items-center justify-center mb-16">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="46%" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
              <circle 
                cx="50%" cy="50%" r="46%" fill="none" stroke="#10b981" strokeWidth="12" 
                strokeDasharray="289%" strokeDashoffset={`${289 * (1 - progress/100)}%`}
                strokeLinecap="round" className="transition-all duration-500 ease-out"
                strokeOpacity={0.9}
              />
            </svg>
            <div className="text-center">
              <span className="text-8xl font-black tabular-nums tracking-tighter text-emerald-50 block">{activeDhikr.completedCount}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-900 bg-emerald-400/10 px-4 py-1.5 rounded-full">Taps</span>
            </div>
          </div>

          <button 
            onClick={handleIncrement}
            className="w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-950 via-emerald-800 to-emerald-600 shadow-[0_20px_100px_-20px_rgba(16,185,129,0.6)] active:scale-90 transition-all duration-75 flex items-center justify-center border-4 border-white/5 relative group overflow-hidden"
          >
             <div className="absolute inset-0 bg-white/5 group-active:bg-transparent" />
             <span className="text-3xl font-black text-white drop-shadow-md uppercase tracking-[0.2em]">Tasbih</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-40">
      <header className="flex justify-between items-end mb-10 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <CalendarIcon size={14} className="text-emerald-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">My Dhikr</h1>
        </div>
        <button 
          onClick={() => setView('add')}
          className="p-5 bg-emerald-950 text-white rounded-[2.5rem] shadow-2xl active:scale-95 transition-all border border-white/5 flex items-center gap-3"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-white flex flex-col gap-1">
            <TrendingUp size={16} className="text-emerald-500 mb-1" />
            <span className="text-xl font-black text-slate-800 tabular-nums">{dhikrs.reduce((acc, curr) => acc + curr.completedCount, 0)}</span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Taps</span>
         </div>
         <div className="bg-emerald-900 p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col gap-1">
            <Target size={16} className="text-emerald-400 mb-1" />
            <span className="text-xl font-black tabular-nums">{dhikrs.filter(d => d.completedCount >= d.targetCount).length}</span>
            <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">Finished</span>
         </div>
      </div>

      <div className="space-y-4">
        {dhikrs.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center px-10">
             <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-premium mb-6">
                <Sparkles size={32} className="text-emerald-200" />
             </div>
             <p className="text-slate-400 font-bold text-sm leading-relaxed italic">Add your daily targets to stay consistent.</p>
          </div>
        ) : (
          dhikrs.map((dhikr) => {
            const progress = Math.min((dhikr.completedCount / dhikr.targetCount) * 100, 100);
            return (
              <div 
                key={dhikr.id}
                onClick={() => { setActiveDhikrId(dhikr.id); setView('counter'); }}
                className="group relative bg-white p-6 rounded-[2.8rem] shadow-premium border border-white active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${progress >= 100 ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'}`}>
                    {progress >= 100 ? <Check size={24} /> : <span className="text-xs font-black">{Math.round(progress)}%</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 tracking-tight text-lg truncate mb-1">{dhikr.title}</h3>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{dhikr.completedCount} / {dhikr.targetCount}</span>
                       <div className="h-1.5 flex-1 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                       </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onPointerDown={(e) => handleDeleteDhikr(e, dhikr.id)}
                    className="p-4 text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-2xl active:scale-90"
                    title="Remove Dhikr"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {view === 'add' && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-end justify-center p-4 animate-in fade-in" onClick={() => { if(!isProcessingAI) setView('list'); }}>
          <div className="bg-white w-full max-w-lg rounded-t-[4rem] p-8 shadow-2xl animate-in slide-in-from-bottom border-t border-white" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center mb-10">
              <h3 className="font-black text-2xl tracking-tighter">New Goal</h3>
              <button onClick={() => setView('list')} className="p-3 bg-slate-50 rounded-full"><X size={20} /></button>
            </header>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-3 ml-2">Name</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Istighfar" className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] p-5 text-sm font-bold outline-none" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <button onClick={processVoiceToArabic} className={`p-6 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center gap-3 transition-all ${isListening ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                    <Mic size={24} className={isListening ? 'animate-pulse text-rose-500' : 'text-slate-300'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Voice to Arabic</span>
                  </button>
                  <div className="relative group cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="p-6 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center gap-3">
                       <ImageIcon size={24} className="text-slate-300" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image to Arabic</span>
                    </div>
                  </div>
               </div>

               {(newArabic || isProcessingAI) && (
                  <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 relative">
                    {isProcessingAI && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10"><Loader2 size={24} className="animate-spin text-emerald-600" /></div>}
                    <textarea value={newArabic} onChange={e => setNewArabic(e.target.value)} className="w-full bg-transparent border-none text-right arabic-text text-3xl font-bold resize-none h-24" />
                  </div>
               )}

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 ml-2">Target</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem]">
                    <input type="range" min="1" max="1000" step="1" value={newTarget} onChange={e => setNewTarget(parseInt(e.target.value))} className="flex-1 accent-emerald-600" />
                    <span className="text-xl font-black text-emerald-950 tabular-nums w-16 text-right">{newTarget}</span>
                  </div>
               </div>

               <button onClick={saveNewDhikr} disabled={isProcessingAI || (!newTitle && !newArabic)} className="w-full bg-emerald-950 text-white p-7 rounded-[2.8rem] font-black uppercase tracking-[0.2em] shadow-xl disabled:opacity-30">
                 Create Daily Goal
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasbih;
