
import React, { useState } from 'react';
import { AppSettings, QuranFont } from '../types';
import { TRANSLATIONS, ARABIC_FONTS, ADHAN_OPTIONS, ADHAN_STYLES, PRAYER_METHODS, PRAYER_SCHOOLS } from '../constants';
import { Save, Book, Volume2, Target, Settings2 } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button onClick={() => onSave(localSettings)} className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform">
          <Save size={18} /> Save All
        </button>
      </div>

      <div className="space-y-8">
        {/* Quran Settings */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4"><Book size={16} /> Quran Settings</h2>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="text-xs font-bold block mb-2">Translation Language</label>
              <select 
                value={localSettings.quran.translationId}
                onChange={(e) => setLocalSettings({...localSettings, quran: {...localSettings.quran, translationId: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm"
              >
                {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-2">Arabic Font Style</label>
              <div className="grid grid-cols-2 gap-2">
                {ARABIC_FONTS.map(font => (
                  <button 
                    key={font.id}
                    onClick={() => setLocalSettings({...localSettings, quran: {...localSettings.quran, fontFamily: font.id as QuranFont}})}
                    className={`p-3 rounded-xl border text-xs font-medium ${localSettings.quran.fontFamily === font.id ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-slate-50'}`}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-2">Font Size ({localSettings.quran.fontSize}px)</label>
              <input 
                type="range" min="16" max="48" 
                value={localSettings.quran.fontSize} 
                onChange={(e) => setLocalSettings({...localSettings, quran: {...localSettings.quran, fontSize: parseInt(e.target.value)}})}
                className="w-full accent-emerald-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Adhan & Prayer Calculation Settings */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4"><Volume2 size={16} /> Salat & Adhan</h2>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="text-xs font-bold block mb-2">Prayer Calculation Method</label>
              <select 
                value={localSettings.adhan.method}
                onChange={(e) => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, method: parseInt(e.target.value)}})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm"
              >
                {PRAYER_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-2">Juristic School (Asr Calculation)</label>
              <div className="grid grid-cols-2 gap-2">
                {PRAYER_SCHOOLS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, school: s.id}})}
                    className={`p-3 rounded-xl border text-xs font-medium ${localSettings.adhan.school === s.id ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-slate-50'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-2">Adhan Voice</label>
              <select 
                value={localSettings.adhan.voiceId}
                onChange={(e) => setLocalSettings({...localSettings, adhan: {...localSettings.adhan, voiceId: e.target.value}})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm"
              >
                {ADHAN_OPTIONS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Tasbih Settings */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4"><Target size={16} /> Tasbih Settings</h2>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <label className="text-xs font-bold block mb-3">Default Target Count</label>
             <div className="grid grid-cols-4 gap-2">
                {[33, 99, 100, 500].map(val => (
                   <button 
                    key={val}
                    onClick={() => setLocalSettings({...localSettings, tasbihTarget: val})}
                    className={`p-3 rounded-xl border text-sm font-bold ${localSettings.tasbihTarget === val ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50'}`}
                   >
                    {val}
                   </button>
                ))}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
