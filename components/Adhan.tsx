import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchPrayerTimes, geocodeAddress, fetchLocationSuggestions } from '../services/api';
import { PrayerTimes, AdhanSettings, LocationData } from '../types';
import { ADHAN_OPTIONS, PRAYER_METHODS, PRAYER_SCHOOLS } from '../constants';
import { db } from '../services/db';
import { 
  Bell, BellOff, Volume2, Loader2, Check, Settings2, MapPin, X, 
  Trash2, Play, Pause, AlertCircle, Calculator, Crosshair, 
  ChevronRight, Search, Sparkles, Map as MapIcon, Mic2
} from 'lucide-react';

interface AdhanProps {
  location: LocationData | null;
  settings: AdhanSettings;
  onUpdateSettings: (newSettings: AdhanSettings) => void;
  onUpdateLocation: (newLoc: LocationData) => void;
}

const formatTime12h = (time24: string) => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const Adhan: React.FC<AdhanProps> = ({ location, settings, onUpdateSettings, onUpdateLocation }) => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'times' | 'voices' | 'location' | 'calc'>('times');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string, time: string, remaining: string } | null>(null);
  
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (location) {
      setLoading(true);
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
      }).catch(() => setLoading(false));
    }
  }, [location, settings.method, settings.school, settings.fajrAngle, settings.ishaAngle]);

  const prayerList = useMemo(() => {
    if (!times) return [];
    return [
      { name: 'Fajr', time: times.Fajr, icon: '🌙' },
      { name: 'Sunrise', time: times.Sunrise, icon: '🌅' },
      { name: 'Dhuhr', time: times.Dhuhr, icon: '☀️' },
      { name: 'Asr', time: times.Asr, icon: '🌇' },
      { name: 'Maghrib', time: times.Maghrib, icon: '🌄' },
      { name: 'Isha', time: times.Isha, icon: '🌃' }
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
    return { current, next: prayerList[nextIdx] };
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

  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSuggesting(true);
    debounceTimer.current = window.setTimeout(async () => {
      try {
        const results = await fetchLocationSuggestions(searchQuery);
        setSuggestions(results);
        setNeedsKey(false);
      } catch (err: any) {
        if (err.message === "API_KEY_MISSING") setNeedsKey(true);
      } finally {
        setIsSuggesting(false);
      }
    }, 600) as unknown as number;
  }, [searchQuery]);

  const togglePreview = async (id: string, url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPreviewPlaying === id) {
      audio.pause();
      setIsPreviewPlaying(null);
      return;
    }
    try {
      audio.pause();
      audio.src = url;
      audio.load();
      await audio.play();
      setIsPreviewPlaying(id);
    } catch (e) {
      console.error("Preview failed:", e);
      setIsPreviewPlaying(null);
    }
  };

  const handleSelection = async (name: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await geocodeAddress(name);
      onUpdateLocation({ ...result, isManual: true });
      setActiveTab('times');
      setSearchQuery("");
      setSuggestions([]);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") setNeedsKey(true);
      else setSearchError(e.message || "Location not found.");
    } finally {
      setIsSearching(false);
    }
  };

  const useCurrentLocation = () => {
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      onUpdateLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: "Current Location",
        isManual: false
      });
      setActiveTab('times');
      setIsSearching(false);
    }, () => setIsSearching(false));
  };

  if (loading && !times) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f2f6f4]">
      <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-40">
      <audio ref={audioRef} onEnded={() => setIsPreviewPlaying(null)} className="hidden" preload="auto" />

      <header className="mb-8">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Adhan</h1>
        <div className="flex bg-white p-1.5 rounded-[2rem] shadow-premium border border-white overflow-x-auto no-scrollbar">
          {[
            { id: 'times', label: 'Times', icon: <Bell size={14} /> },
            { id: 'voices', label: 'Voices', icon: <Mic2 size={14} /> },
            { id: 'location', label: 'Place', icon: <MapIcon size={14} /> },
            { id: 'calc', label: 'Config', icon: <Settings2 size={14} /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-400'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'times' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-white p-5 rounded-[2.5rem] border border-white shadow-premium flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><MapPin size={20} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Zone</p>
                   <h4 className="font-black text-slate-800 tracking-tight">{location?.name || 'Global'}</h4>
                </div>
             </div>
             <button onClick={() => setActiveTab('location')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><ChevronRight size={18} /></button>
          </div>

          {nextPrayerInfo && (
            <div className="bg-emerald-950 rounded-[3rem] p-8 mb-4 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 block mb-2">Up Next: {nextPrayerInfo.name}</span>
                <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-black tracking-tighter">{formatTime12h(nextPrayerInfo.time)}</h2>
                    <span className="text-xs text-emerald-100/60 font-black uppercase tracking-widest">{nextPrayerInfo.remaining}</span>
                </div>
              </div>
            </div>
          )}
          {prayerList.map((prayer) => {
            const isCurrent = prayer.name === currentAndNext.current;
            const isNotify = settings.notifications[prayer.name];
            return (
              <div key={prayer.name} className={`flex items-center gap-5 p-6 rounded-[2.8rem] transition-all ${isCurrent ? 'bg-emerald-700 text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-800 border border-white'}`}>
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-xl">{prayer.icon}</div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">{prayer.name}</h3>
                  <p className="text-xl font-black tracking-tight">{formatTime12h(prayer.time)}</p>
                </div>
                {prayer.name !== 'Sunrise' && (
                  <button 
                    onClick={() => onUpdateSettings({...settings, notifications: {...settings.notifications, [prayer.name]: !isNotify}})} 
                    className={`p-3 rounded-xl transition-all ${isNotify ? 'text-amber-400 bg-black/10' : 'text-slate-200 bg-slate-50'}`}
                  >
                    {isNotify ? <Bell size={18} fill="currentColor" /> : <BellOff size={18} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'voices' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-emerald-100 p-6 rounded-[2.5rem] border border-emerald-200 mb-6 flex gap-4">
             <Volume2 className="text-emerald-700 shrink-0" size={20} />
             <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">Choose the voice that calls you to prayer. This voice will be used for all notifications.</p>
          </div>
          {ADHAN_OPTIONS.map((option) => {
            const isSelected = settings.voiceId === option.id;
            const playing = isPreviewPlaying === option.id;
            return (
              <div key={option.id} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col gap-4 ${isSelected ? 'bg-emerald-900 text-white border-emerald-950 shadow-xl' : 'bg-white border-white shadow-premium'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-black text-lg">{option.name}</h4>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>{option.muezzin}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => togglePreview(option.id, option.url)}
                      className={`p-4 rounded-2xl transition-all ${playing ? 'bg-amber-500 text-white' : isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-emerald-600'}`}
                    >
                      {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                    </button>
                    {!isSelected && (
                      <button 
                        onClick={() => onUpdateSettings({...settings, voiceId: option.id})}
                        className="bg-emerald-50 text-emerald-900 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                      >
                        Select
                      </button>
                    )}
                    {isSelected && <div className="p-4 bg-emerald-500 rounded-2xl text-white"><Check size={20} /></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'location' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-white">
              <h3 className="font-black text-2xl tracking-tighter mb-6">Location Finder</h3>
              
              <div className="relative mb-6">
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="City or Address..." 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[1.8rem] p-5 pr-16 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSuggesting && <Loader2 size={16} className="animate-spin text-emerald-600 mr-2" />}
                    <button onClick={() => handleSelection(searchQuery)} className="p-3.5 bg-emerald-950 text-white rounded-2xl">
                        <Search size={18} />
                    </button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden mb-6">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSelection(s)} className="w-full text-left p-5 hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-white last:border-0">
                      <span className="text-sm font-bold text-slate-700">{s}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={useCurrentLocation} 
                disabled={isSearching}
                className="w-full bg-emerald-950 text-white p-6 rounded-[2.2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl"
              >
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Crosshair size={20} />}
                Pinpoint via GPS
              </button>
           </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
           <div className="bg-white p-8 rounded-[3.5rem] shadow-premium border border-white space-y-8">
              <header className="flex items-center gap-3 mb-2">
                 <Calculator className="text-emerald-600" size={20} />
                 <h2 className="font-black text-lg tracking-tight">Calculation Engine</h2>
              </header>

              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Method</label>
                   <select 
                    value={settings.method}
                    onChange={(e) => onUpdateSettings({...settings, method: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none"
                   >
                     {PRAYER_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Jurist School (Asr)</label>
                   <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                      {PRAYER_SCHOOLS.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => onUpdateSettings({...settings, school: s.id})}
                            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.school === s.id ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-400'}`}
                        >
                            {s.name}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Fajr Angle</label>
                       <input 
                        type="number" step="0.1"
                        value={settings.fajrAngle || 18}
                        onChange={(e) => onUpdateSettings({...settings, fajrAngle: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Isha Angle</label>
                       <input 
                        type="number" step="0.1"
                        value={settings.ishaAngle || 18}
                        onChange={(e) => onUpdateSettings({...settings, ishaAngle: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none"
                       />
                    </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Adhan;
