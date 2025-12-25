
import React, { useState } from 'react';
import { AppSettings, QuranFont } from '../types';
import { TRANSLATIONS, ARABIC_FONTS, ADHAN_OPTIONS, PRAYER_METHODS, PRAYER_SCHOOLS, RECITERS } from '../constants';
import { Save, Book, Volume2, Target, Compass, Bell, Type, User, Info, Smartphone, RefreshCw, Languages, PlayCircle, Calculator } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleToggleNotify = (prayer: string) => {
    setLocalSettings({
      ...localSettings,
      adhan: {
        ...localSettings.adhan,
        notifications: {
          ...localSettings.adhan.notifications,
          [prayer]: !localSettings.adhan.notifications[prayer]
        }
      }
    });
  };

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-40">
      <header className="flex justify-between items-center mb-10 px-2">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Preferences</h1>
        <button 
          onClick={() => {
            onSave(localSettings);
            alert("Settings saved successfully.");
          }} 
          className="bg-emerald-950 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2"
        >
          <Save size={18} /> Save
        </button>
      </header>

      <div className="space-y-12">
        {/* Quran Settings */}
        <section>
          <h2 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 ml-4">
            <Book size={14} /> Quranic Experience
          </h2>
          <div className="bg-white p-8 rounded-[3.5rem] border border-white shadow-premium space-y-8">
            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => setLocalSettings({...localSettings, quran: {...localSettings.quran, continuousPlay: !localSettings.quran.continuousPlay}})}
                className={`p-5 rounded-[2rem] border flex flex-col items-center gap-3 transition-all ${localSettings.quran.continuousPlay ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
               >
                 <PlayCircle size={24} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Auto Play</span>
               </button>
               <button 
                onClick={() => setLocalSettings({...localSettings, quran: {...localSettings.quran, showTranslation: !localSettings.quran.showTranslation}})}
                className={`p-5 rounded-[2rem] border flex flex-col items-center gap-3 transition-all ${localSettings.quran.showTranslation ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
               >
                 <Languages size={24} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Translation</span>
               </button>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Preferred Qari</label>
              <select 
                value={localSettings.quran.reciterId}
                onChange={(e) => setLocalSettings({...localSettings, quran: {...localSettings.quran, reciterId: e.target.value}})}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none"
              >
                {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Translation</label>
              <select 
                value={localSettings.quran.translationId}
                onChange={(e) => setLocalSettings({...localSettings, quran: {...localSettings.quran, translationId: e.target.value}})}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none"
              >
                {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 ml-2 flex justify-between">
                <span>Font Size</span>
                <span className="text-emerald-600 font-black">{localSettings.quran.fontSize}px</span>
              </label>
              <input 
                type="range" min="16" max="42" step="1" 
                value={localSettings.quran.fontSize}
                onChange={(e) => setLocalSettings({...localSettings, quran: {...localSettings.quran, fontSize: parseInt(e.target.value)}})}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </section>

        {/* Prayer & Precision Settings */}
        <section>
          <h2 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 ml-4">
            <Calculator size={14} /> Calculation & Precision
          </h2>
          <div className="bg-white p-8 rounded-[3.5rem] border border-white shadow-premium space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Adhan Alerts</label>
              <div className="grid grid-cols-2 gap-3">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
                  <button 
                    key={p}
                    onClick={() => handleToggleNotify(p)}
                    className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${localSettings.adhan.notifications[p] ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-slate-50 border-transparent text-slate-300'}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                    <div className={`w-2 h-2 rounded-full ${localSettings.adhan.notifications[p] ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Method</label>
                <select 
                  value={localSettings.adhan.method}
                  onChange={(e) => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, method: parseInt(e.target.value)}})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none"
                >
                  {PRAYER_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Fajr Angle</label>
                    <input 
                      type="number" step="0.1"
                      value={localSettings.adhan.fajrAngle || 18}
                      onChange={(e) => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, fajrAngle: parseFloat(e.target.value)}})}
                      className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Isha Angle</label>
                    <input 
                      type="number" step="0.1"
                      value={localSettings.adhan.ishaAngle || 18}
                      onChange={(e) => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, ishaAngle: parseFloat(e.target.value)}})}
                      className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none"
                    />
                  </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Asr Juristic School</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl">
                   {PRAYER_SCHOOLS.map(s => (
                     <button 
                        key={s.id}
                        onClick={() => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, school: s.id}})}
                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${localSettings.adhan.school === s.id ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-400'}`}
                     >
                       {s.name}
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* General Device Settings */}
        <section>
          <h2 className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 ml-4">
            <Smartphone size={14} /> Interaction
          </h2>
          <div className="bg-white p-8 rounded-[3.5rem] border border-white shadow-premium">
            <button 
              onClick={() => window.location.reload()}
              className="w-full p-5 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group"
            >
              <RefreshCw size={16} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sync Local Database</span>
            </button>
          </div>
        </section>

        <footer className="text-center px-10">
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">Noor Companion v1.2</p>
           <div className="flex justify-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
           </div>
        </footer>
      </div>
    </div>
  );
};

export default SettingsView;
