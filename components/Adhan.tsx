
import React, { useState, useEffect } from 'react';
import { fetchPrayerTimes } from '../services/api';
import { PrayerTimes, AdhanSettings } from '../types';
import { ADHAN_OPTIONS, ADHAN_STYLES, PRAYER_METHODS, PRAYER_SCHOOLS } from '../constants';
import { Bell, BellOff, Volume2, MapPin, Loader2, Info, Sliders, ChevronRight } from 'lucide-react';

interface AdhanProps {
  location: { lat: number, lng: number } | null;
  settings: AdhanSettings;
}

const Adhan: React.FC<AdhanProps> = ({ location, settings }) => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  
  const selectedAdhan = ADHAN_OPTIONS.find(a => a.id === settings.voiceId) || ADHAN_OPTIONS[0];

  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchPrayerTimes(location.lat, location.lng, settings.method, settings.school).then(data => {
        setTimes(data.times);
        setLoading(false);
      });
    }
  }, [location, settings.method, settings.school]);

  const previewAdhan = () => {
    const audio = new Audio(selectedAdhan.url);
    audio.play().catch(e => console.error("Preview failed", e));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f2f6f4]">
        <div className="w-16 h-16 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
        <p className="text-emerald-950 font-black uppercase tracking-[0.3em] text-[10px]">Updating Times...</p>
      </div>
    );
  }

  const prayerList = times ? [
    { name: 'Fajr', time: times.Fajr, icon: '🌙' },
    { name: 'Sunrise', time: times.Sunrise, icon: '🌅' },
    { name: 'Dhuhr', time: times.Dhuhr, icon: '☀️' },
    { name: 'Asr', time: times.Asr, icon: '🌇' },
    { name: 'Maghrib', time: times.Maghrib, icon: '🌄' },
    { name: 'Isha', time: times.Isha, icon: '🌃' }
  ] : [];

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-32">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-2">Salat Times</h1>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {location ? 'Current Location' : 'Global Times'}
          </p>
        </div>
        <button onClick={previewAdhan} className="p-5 bg-emerald-900 text-white rounded-[2rem] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2 border border-emerald-800">
          <Volume2 size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Adhan</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-12">
        {prayerList.map(prayer => {
          const isActive = settings.notifications[prayer.name];
          return (
            <div key={prayer.name} className="bg-white p-7 rounded-[3rem] border border-white/50 flex flex-col shadow-premium group hover:shadow-xl transition-all">
              <h3 className="font-black text-slate-300 text-[10px] uppercase tracking-[0.3em] mb-3">{prayer.name}</h3>
              <p className="text-4xl font-black text-slate-900 mb-8 tabular-nums tracking-tighter">{prayer.time}</p>
              {prayer.name !== 'Sunrise' && (
                <div className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                  {isActive ? <Bell size={14} className="animate-bounce" /> : <BellOff size={14} />}
                  {isActive ? 'On' : 'Off'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-emerald-950 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
         <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="font-black text-xl tracking-tighter flex items-center gap-3">
              <Sliders size={24} className="text-emerald-500" /> Configuration
            </h3>
         </div>
         <div className="space-y-5 relative z-10">
            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 flex flex-col gap-1">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Calculation Method</p>
               <p className="text-sm font-bold truncate leading-relaxed">{PRAYER_METHODS.find(m => m.id === settings.method)?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">School</p>
                 <p className="text-sm font-bold">{PRAYER_SCHOOLS.find(s => s.id === settings.school)?.name}</p>
              </div>
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Voice</p>
                 <p className="text-sm font-bold truncate">{selectedAdhan.name}</p>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Adhan;
