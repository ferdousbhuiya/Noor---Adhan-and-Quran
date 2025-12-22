
import React, { useState, useEffect } from 'react';
import { Dua } from '../types';
import { Heart, Plus, Trash2, X, Image as ImageIcon, Check, PlayCircle, Sparkles, BookOpen } from 'lucide-react';

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
      reader.onloadend = () => setNewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addDua = () => {
    if (!newTitle) return;
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
    setNewTitle(''); setNewArabic(''); setNewTrans(''); setNewBenefit(''); setNewTarget(33); setNewImage(undefined);
  };

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-32">
      <header className="flex justify-between items-center mb-10">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <BookOpen size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library</span>
           </div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Supplications</h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="p-5 bg-emerald-950 text-white rounded-[2rem] shadow-2xl active:scale-95 transition-all">
          <Plus size={24} />
        </button>
      </header>

      <div className="space-y-6">
        {duas.map(dua => (
          <div key={dua.id} className="bg-white rounded-[3rem] p-8 border border-white shadow-premium relative group hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
                  <h3 className="font-black text-slate-800 tracking-tight text-xl">{dua.title}</h3>
               </div>
               <button onClick={() => setDuas(duas.filter(d => d.id !== dua.id))} className="p-3 text-slate-200 hover:text-rose-400 transition-all"><Trash2 size={18} /></button>
            </div>

            {dua.image ? (
                <div className="w-full h-52 bg-slate-50 rounded-[2.5rem] mb-6 overflow-hidden border border-slate-100 shadow-inner group-hover:scale-[1.01] transition-transform">
                    <img src={dua.image} className="w-full h-full object-cover" alt="Dua" />
                </div>
            ) : (
                <p className="arabic-text text-4xl text-right mb-8 leading-relaxed text-emerald-950 font-bold">{dua.arabicText}</p>
            )}

            <div className="space-y-4 mb-8">
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic bg-slate-50/50 p-5 rounded-[2rem]">"{dua.translation}"</p>
                {dua.benefit && (
                  <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100/50 flex gap-4">
                      <Sparkles size={16} className="text-emerald-600 shrink-0" />
                      <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">{dua.benefit}</p>
                  </div>
                )}
            </div>

            <button 
              onClick={() => onRecite({ title: dua.title, text: dua.arabicText || dua.translation, target: dua.targetCount, image: dua.image })}
              className="w-full bg-emerald-600 text-white py-5 rounded-[2.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <PlayCircle size={22} /> Recite in Tasbih
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-end justify-center p-4 animate-in fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[4rem] p-10 animate-in slide-in-from-bottom duration-500" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl tracking-tighter">Add to Library</h3>
              <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-5 h-[50vh] overflow-y-auto no-scrollbar pb-10">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Title</label>
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Protection Dua" className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-sm font-bold outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Arabic</label>
                  <textarea value={newArabic} onChange={e => setNewArabic(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-2xl arabic-text text-right outline-none" />
               </div>
               <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] p-6 text-center cursor-pointer relative hover:border-emerald-200 transition-all">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {newImage ? <img src={newImage} className="w-20 h-20 rounded-xl object-cover" /> : <div className="text-slate-300 flex flex-col items-center gap-2"><ImageIcon size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Add Picture</span></div>}
               </div>
               <button onClick={addDua} className="w-full bg-emerald-950 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <Check size={20} /> Save Library
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuaView;
