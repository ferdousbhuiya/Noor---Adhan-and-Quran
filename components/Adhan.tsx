
import React, { useState, useEffect, useMemo } from 'react';
import { fetchPrayerTimes } from '../services/api';
import { PrayerTimes, AdhanSettings } from '../types';
import { ADHAN_OPTIONS, PRAYER_METHODS, PRAYER_SCHOOLS } from '../constants';
import { Bell, BellOff, Volume2, Loader2, Sliders, ChevronRight, AlertCircle, Check, Settings2, Compass, Clock, MapPin } from 'lucide-react';

interface AdhanProps {
  location: { lat: number, lng: number } | null;
  settings: AdhanSettings;
  onUpdateSettings: (newSettings: AdhanSettings) => void;
}

const formatTime12h = (time24: string) => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const Adhan: React.FC<AdhanProps> = ({ location, settings, onUpdateSettings }) => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'times' | 'config'>('times');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string, time: string, remaining: string } | null>(null);
  
  const selectedAdhan = ADHAN_OPTIONS.find(a => a.id === settings.voiceId) || ADHAN_OPTIONS[0];

  useEffect(() => {
    if (location) {
      setLoading(true);
      setError(null);
      fetchPrayerTimes(
        location.lat, 
        location.lng, 
        settings.method, 
        settings.school,
        settings.fajrAngle,
        settings.ishaAngle
      ).then(data => {
        setTimes(data.times);
        setLoading(false);
      }).catch(err => {
        setError("Unable to sync prayer times. Check your connection.");
        setLoading(false);
      });
    }
  }, [location, settings.method, settings.school, settings.fajrAngle, settings.ishaAngle]);

  const prayerList = useMemo(() => {
    if (!times) return [];
    return [
      { name: 'Fajr', time: times.Fajr, icon: '🌙', theme: 'indigo' },
      { name: 'Sunrise', time: times.Sunrise, icon: '🌅', theme: 'orange' },
      { name: 'Dhuhr', time: times.Dhuhr, icon: '☀️', theme: 'amber' },
      { name: 'Asr', time: times.Asr, icon: '🌇', theme: 'orange' },
      { name: 'Maghrib', time: times.Maghrib, icon: '🌄', theme: 'rose' },
      { name: 'Isha', time: times.Isha, icon: '🌃', theme: 'slate' }
    ];
  }, [times]);

  const currentAndNext = useMemo(() => {
    if (!times) return { current: null, next: null };
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    let current = 'Isha';
    let nextIdx = 0;

    const pairs = prayerList.map(p => {
      const [h, m] = p.time.split(':').map(Number);
      return h * 60 + m;
    });

    for (let i = 0; i < pairs.length; i++) {
      if (currentMin >= pairs[i]) {
        current = prayerList[i].name;
        nextIdx = (i + 1) % prayerList.length;
      }
    }

    if (currentMin < pairs[0]) {
      current = 'Isha';
      nextIdx = 0;
    }

    return { 
      current, 
      next: prayerList[nextIdx] 
    };
  }, [prayerList, times]);

  useEffect(() => {
    if (!currentAndNext.next) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const [h, m] = currentAndNext.next!.time.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const hh = Math.floor(diff / (1000 * 60 * 60));
      const mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const ss = Math.floor((diff % (1000 * 60)) / 1000);
      
      setNextPrayerInfo({
        name: currentAndNext.next!.name,
        time: currentAndNext.next!.time,
        remaining: `${hh}h ${mm}m ${ss}s`
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentAndNext]);

  const previewAdhan = () => {
    const audio = new Audio(selectedAdhan.url);
    audio.play().catch(e => console.error("Preview failed", e));
  };

  const handleToggleNotify = (prayerName: string) => {
    onUpdateSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [prayerName]: !settings.notifications[prayerName]
      }
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f2f6f4]">
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-[2.8rem] shadow-2xl flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
          <div className="absolute -inset-6 border-2 border-emerald-100 rounded-[3.5rem] animate-ping opacity-20" />
        </div>
        <p className="mt-10 text-emerald-950 font-black uppercase tracking-[0.5em] text-[11px]">Calculating...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-40">
      <header className="flex justify-between items-end mb-10 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">Prayer Times</h1>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Auto-detected location</span>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab(activeTab === 'times' ? 'config' : 'times')} 
          className={`p-4 rounded-2xl shadow-premium border transition-all active:scale-95 flex items-center gap-2 ${activeTab === 'config' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-slate-600 border-white'}`}
        >
          {activeTab === 'times' ? <Settings2 size={20} /> : <Check size={20} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{activeTab === 'times' ? 'Settings' : 'Done'}</span>
        </button>
      </header>

      {activeTab === 'times' && nextPrayerInfo && (
        <div className="bg-emerald-950 rounded-[3rem] p-8 mb-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Next Prayer</span>
                <Clock size={16} className="text-emerald-500" />
             </div>
             <div className="flex items-baseline gap-3 mb-2">
                <h2 className="text-4xl font-black tracking-tighter">{nextPrayerInfo.name}</h2>
                <span className="text-xl font-bold text-emerald-400/80">{formatTime12h(nextPrayerInfo.time)}</span>
             </div>
             <p className="text-xs font-medium text-emerald-100/60 tracking-wide">Starts in {nextPrayerInfo.remaining}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] mb-8 flex items-center gap-4 text-rose-700 shadow-sm">
           <AlertCircle size={24} />
           <p className="text-xs font-bold leading-relaxed">{error}</p>
        </div>
      )}

      {activeTab === 'times' ? (
        <div className="grid gap-4">
          {prayerList.map((prayer) => {
            const isCurrent = prayer.name === currentAndNext.current;
            const isNotify = settings.notifications[prayer.name];
            
            return (
              <div 
                key={prayer.name} 
                className={`group relative p-1 rounded-[3rem] transition-all duration-500 ${isCurrent ? 'bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-xl shadow-emerald-900/20' : 'bg-white border border-white/60 shadow-premium'}`}
              >
                <div className={`flex items-center gap-5 p-6 rounded-[2.8rem] transition-colors ${isCurrent ? 'bg-transparent text-white' : 'bg-white text-slate-800'}`}>
                  <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110 ${isCurrent ? 'bg-white/10' : 'bg-slate-50'}`}>
                    {prayer.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-black text-[11px] uppercase tracking-[0.2em] ${isCurrent ? 'text-emerald-100' : 'text-slate-300'}`}>
                        {prayer.name}
                      </h3>
                      {isCurrent && <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full font-black uppercase">Now</span>}
                    </div>
                    <p className="text-2xl font-black tracking-tighter tabular-nums leading-none">{formatTime12h(prayer.time)}</p>
                  </div>

                  {prayer.name !== 'Sunrise' && (
                    <button 
                      onClick={() => handleToggleNotify(prayer.name)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isCurrent ? 'bg-white/20 text-white' : isNotify ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-200 border border-transparent'}`}
                    >
                      {isNotify ? <Bell size={18} fill="currentColor" /> : <BellOff size={18} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button onClick={previewAdhan} className="w-full mt-6 p-7 bg-white border border-emerald-100 rounded-[3rem] shadow-premium flex items-center justify-between group active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                 <Volume2 size={20} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-0.5">Test Audio</p>
                <h4 className="text-sm font-black text-slate-700 tracking-tight">{selectedAdhan.name}</h4>
              </div>
            </div>
            <ChevronRight size={20} className="text-emerald-200 group-hover:text-emerald-600 transition-colors" />
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
          <section className="bg-white p-8 rounded-[3.5rem] shadow-premium space-y-10 border border-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Sliders size={20} /></div>
              <h2 className="font-black text-xl tracking-tight text-slate-800">Calculation Method</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 ml-2">Authority</label>
                <select 
                  value={settings.method}
                  onChange={(e) => onUpdateSettings({...settings, method: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] p-5 text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  {PRAYER_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 ml-2">Asr School</label>
                  <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                    {PRAYER_SCHOOLS.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => onUpdateSettings({...settings, school: s.id})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.school === s.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400'}`}
                      >
                        {s.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 ml-2">Adhan Voice</label>
                  <select 
                    value={settings.voiceId}
                    onChange={(e) => onUpdateSettings({...settings, voiceId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                  >
                    {ADHAN_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.name.split(' ')[0]}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Compass size={18} /></div>
                  <h3 className="font-black text-sm tracking-tight text-slate-800">Precision Angle Adjustment</h3>
                </div>
                
                <div className="grid gap-8">
                  <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fajr Angle</label>
                        <span className="text-[9px] text-slate-300 font-bold uppercase">Morning Twilight</span>
                      </div>
                      <span className="text-lg font-black text-emerald-600 tabular-nums">{settings.fajrAngle || 18}°</span>
                    </div>
                    <input 
                      type="range" min="12" max="22" step="0.5" 
                      value={settings.fajrAngle || 18}
                      onChange={(e) => onUpdateSettings({...settings, fajrAngle: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Isha Angle</label>
                        <span className="text-[9px] text-slate-300 font-bold uppercase">Nightfall Depth</span>
                      </div>
                      <span className="text-lg font-black text-emerald-600 tabular-nums">{settings.ishaAngle || 18}°</span>
                    </div>
                    <input 
                      type="range" min="12" max="22" step="0.5" 
                      value={settings.ishaAngle || 18}
                      onChange={(e) => onUpdateSettings({...settings, ishaAngle: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
                
                <p className="mt-8 text-[10px] text-slate-400 font-medium leading-relaxed text-center px-4 italic">
                  Most regions use 15° to 19.5°. Increasing the angle makes Fajr earlier and Isha later.
                </p>
              </div>
            </div>
          </section>

          <button 
            onClick={() => setActiveTab('times')}
            className="w-full bg-emerald-950 text-white p-7 rounded-[2.8rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-emerald-950/30 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Save & View Timings
          </button>
        </div>
      )}
    </div>
  );
};

export default Adhan;
