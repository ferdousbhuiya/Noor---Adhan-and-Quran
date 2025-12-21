
import React, { useState, useEffect, useRef } from 'react';
import { Dua } from '../types';
import { Heart, Plus, Trash2, X, Image as ImageIcon, Check, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';

const DEFAULT_DUAS: Dua[] = [
  {
    id: '1',
    title: 'Dua for Knowledge',
    arabicText: 'رَّبِّ زِدْنِي عِلْمًا',
    translation: 'My Lord, increase me in knowledge.',
    benefit: 'Seeking wisdom and clarity in learning.',
    targetCount: 33,
    currentCount: 0
  },
  {
    id: '2',
    title: 'Dua for Forgiveness',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ',
    translation: 'I seek forgiveness from Allah.',
    benefit: 'Cleansing the heart and seeking mercy.',
    targetCount: 100,
    currentCount: 0
  }
];

interface DuaViewProps {
  onRecite: (dua: { title: string, text?: string, target: number, image?: string }) => void;
}

const DuaView: React.FC<DuaViewProps> = ({ onRecite }) => {
  const [duas, setDuas] = useState<Dua[]>(() => {
    const saved = localStorage.getItem('noor_duas');
    return saved ? JSON.parse(saved) : DEFAULT_DUAS;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Dua Form State
  const [newTitle, setNewTitle] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newTrans, setNewTrans] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newTarget, setNewTarget] = useState(33);
  const [newImage, setNewImage] = useState<string | undefined>();

  useEffect(() => {
    localStorage.setItem('noor_duas', JSON.stringify(duas));
  }, [duas]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addDua = () => {
    if (!newTitle || (!newArabic && !newImage)) return;
    const dua: Dua = {
      id: Date.now().toString(),
      title: newTitle,
      arabicText: newArabic,
      translation: newTrans,
      benefit: newBenefit,
      targetCount: newTarget,
      currentCount: 0,
      image: newImage
    };
    setDuas([dua, ...duas]);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewArabic('');
    setNewTrans('');
    setNewBenefit('');
    setNewTarget(33);
    setNewImage(undefined);
  };

  const deleteDua = (id: string) => {
    setDuas(duas.filter(d => d.id !== id));
  };

  const handleReciteClick = (dua: Dua) => {
    onRecite({
      title: dua.title,
      text: dua.arabicText || dua.translation,
      target: dua.targetCount,
      image: dua.image
    });
  };

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-32">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-2">Supplications</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Sacred Connection</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="p-5 bg-emerald-950 text-white rounded-[2rem] shadow-2xl active:scale-95 transition-all border border-emerald-900"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {duas.map(dua => (
          <div key={dua.id} className="bg-white rounded-[3.5rem] p-8 border border-white shadow-premium relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-50" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                  <div>
                    <h3 className="font-black text-slate-800 tracking-tight text-lg">{dua.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal: {dua.targetCount} Recitations</p>
                  </div>
               </div>
               <button onClick={() => deleteDua(dua.id)} className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
            </div>

            {dua.image ? (
                <div className="w-full h-52 bg-slate-50 rounded-[2.5rem] mb-6 overflow-hidden border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                    <img src={dua.image} className="w-full h-full object-cover" alt="Dua visualization" />
                </div>
            ) : (
                <p className="arabic-text text-4xl text-right mb-6 leading-relaxed text-emerald-950 font-bold drop-shadow-sm">{dua.arabicText}</p>
            )}

            <div className="space-y-4 mb-8 relative z-10">
                <p className="text-sm text-slate-600 italic font-medium leading-relaxed bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100/50">"{dua.translation}"</p>
                <div className="bg-emerald-900 p-5 rounded-[2rem] shadow-lg shadow-emerald-900/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-emerald-400" />
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Divine Benefit</p>
                    </div>
                    <p className="text-[11px] text-emerald-50 font-medium leading-relaxed">{dua.benefit}</p>
                </div>
            </div>

            <button 
              onClick={() => handleReciteClick(dua)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <PlayCircle size={22} /> Start Recitation
            </button>
          </div>
        ))}
      </div>

      {/* Add Modal with consistent polished look */}
      {showAddModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-end justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-500 border-t border-white" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-2xl text-slate-800 tracking-tighter">New Supplication</h3>
              <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all"><X size={24} /></button>
            </div>
            
            <div className="space-y-6 h-[55vh] overflow-y-auto pr-3 no-scrollbar pb-10">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-2">Display Name</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Morning Azkar" className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] p-5 text-sm font-bold focus:ring-2 ring-emerald-500/10 focus:outline-none transition-all" />
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-2">Arabic (Optional)</label>
                  <textarea value={newArabic} onChange={e => setNewArabic(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] p-5 text-2xl arabic-text text-right focus:outline-none focus:ring-2 ring-emerald-500/10 transition-all" placeholder="...أدعية" />
               </div>

               <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center group cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {newImage ? (
                        <div className="w-full h-36 rounded-2xl overflow-hidden relative shadow-md">
                             <img src={newImage} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest">Tap to Replace</div>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                                <ImageIcon className="text-slate-300" size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-700">Add Visualization Picture</p>
                        </>
                    )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-2">Translation</label>
                      <input value={newTrans} onChange={e => setNewTrans(e.target.value)} placeholder="English Meaning" className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-xs font-bold focus:outline-none focus:ring-2 ring-emerald-500/10" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-2">Virtue</label>
                      <input value={newBenefit} onChange={e => setNewBenefit(e.target.value)} placeholder="Divine Benefit" className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-xs font-bold focus:outline-none focus:ring-2 ring-emerald-500/10" />
                   </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-3 px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recitation Target</label>
                    <span className="text-xs font-black text-emerald-600">{newTarget}x</span>
                  </div>
                  <input type="range" min="1" max="1000" value={newTarget} onChange={e => setNewTarget(parseInt(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-full" />
               </div>

               <button 
                onClick={addDua}
                className="w-full bg-emerald-950 text-white p-6 rounded-[2.2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-950/20"
               >
                  <Check size={24} /> Save to My List
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuaView;
