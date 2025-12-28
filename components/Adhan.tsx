
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
      } catch (err: any) {
        console.error(err);
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
      audio.src = '';
      audio.load();
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
      setSearchError(e.message || "Location not found.");
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

      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-8 px-2">Adhan</h1>
        <div className="flex bg-white p-2 rounded-[2.5rem] shadow-premium border border-white overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'times', label: 'Times', icon: <Bell size={14} /> },
            { id: 'voices', label: 'Voices', icon: <Mic2 size={14} /> },
            { id: 'location', label: 'Location', icon: <MapIcon size={14} /> },
            { id: 'calc', label: 'Config', icon: <Settings2 size={14} /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'times' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-[3rem] border border-white shadow-premium flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 rounded-[1.8rem] text-emerald-600"><MapPin size={22} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Region</p>
                   <h4 className="font-black text-slate-800 tracking-tight text-lg">{location?.name || '---'}</h4>
                </div>
             </div>
             <button onClick={() => setActiveTab('location')} className="p-4 bg-slate-50 text-slate-400 rounded-2xl"><ChevronRight size={18} /></button>
          </div>

          {nextPrayerInfo && (
            <div className="bg-emerald-950 rounded-[3.5rem] p-10 mb-6 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 block mb-3">Up Next: {nextPrayerInfo.name}</span>
                <div className="flex items-baseline gap-4">
                    <h2 className="text-5xl font-black tracking-tighter">{formatTime12h(nextPrayerInfo.time)}</h2>
                    <span className="text-sm text-emerald-100/40 font-black uppercase tracking-[0.2em]">{nextPrayerInfo.remaining}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {prayerList.map((prayer) => {
              const isCurrent = prayer.name === currentAndNext.current;
              const isNotify = settings.notifications[prayer.name];
              return (
                <div key={prayer.name} className={`flex items-center gap-5 p-6 rounded-[3rem] transition-all ${isCurrent ? 'bg-emerald-700 text-white shadow-xl scale-[1.02] border-emerald-600' : 'bg-white text-slate-800 border border-white shadow-premium'}`}>
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-2xl ${isCurrent ? 'bg-white/10' : 'bg-emerald-50'}`}>{prayer.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-emerald-300' : 'text-slate-400'}`}>{prayer.name}</h3>
                    <p className="text-xl font-black tracking-tight">{formatTime12h(prayer.time)}</p>
                  </div>
                  {prayer.name !== 'Sunrise' && (
                    <button 
                      onClick={() => onUpdateSettings({...settings, notifications: {...settings.notifications, [prayer.name]: !isNotify}})} 
                      className={`p-4 rounded-2xl transition-all ${isNotify ? 'text-amber-400 bg-white/10 shadow-inner' : 'text-slate-200 bg-slate-50'}`}
                    >
                      {isNotify ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'voices' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-emerald-900 text-white p-8 rounded-[3.5rem] mb-8 flex flex-col gap-4 shadow-xl border border-emerald-950">
             <div className="flex items-center gap-3">
                <Mic2 className="text-emerald-400" size={22} />
                <h3 className="font-black uppercase text-[10px] tracking-[0.4em]">Adhan Voices</h3>
             </div>
             <p className="text-sm font-bold text-emerald-100/60 leading-relaxed">Choose a voice for notifications and manual playback.</p>
          </div>
          <div className="space-y-4">
            {ADHAN_OPTIONS.map((option) => {
              const isSelected = settings.voiceId === option.id;
              const playing = isPreviewPlaying === option.id;
              return (
                <div key={option.id} className={`p-6 rounded-[3rem] border transition-all flex flex-col gap-4 ${isSelected ? 'bg-white border-emerald-500 shadow-xl scale-[1.02]' : 'bg-white border-white shadow-premium opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-slate-800 tracking-tight">{option.name}</h4>
                      <p className={`text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1`}>{option.muezzin}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => togglePreview(option.id, option.url)}
                        className={`p-5 rounded-3xl transition-all ${playing ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-50 text-emerald-900 shadow-inner'}`}
                      >
                        {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                      </button>
                      {!isSelected ? (
                        <button 
                          onClick={() => onUpdateSettings({...settings, voiceId: option.id})}
                          className="bg-emerald-950 text-white px-8 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"
                        >
                          Select
                        </button>
                      ) : (
                        <div className="bg-emerald-500 text-white px-8 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
                          <Check size={16} /> Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           <div className="bg-white p-10 rounded-[4rem] shadow-premium border border-white">
              <header className="mb-10">
                 <h3 className="font-black text-3xl tracking-tighter text-slate-800">Set Location</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Find your city globally</p>
              </header>
              
              <div className="relative mb-8">
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Enter city or address..." 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2.5rem] p-7 pr-20 text-base font-bold outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSuggesting && <Loader2 size={20} className="animate-spin text-emerald-600 mr-2" />}
                    <button onClick={() => handleSelection(searchQuery)} className="p-5 bg-emerald-950 text-white rounded-full shadow-lg">
                        <Search size={22} />
                    </button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="bg-slate-50 rounded-[3rem] border border-slate-100 overflow-hidden mb-8 shadow-inner">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSelection(s)} className="w-full text-left p-6 hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-white last:border-0 group">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-900">{s}</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 py-6 mb-2">
                 <div className="h-px flex-1 bg-slate-100" />
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Precision GPS</span>
                 <div className="h-px flex-1 bg-slate-100" />
              </div>

              <button 
                onClick={useCurrentLocation} 
                disabled={isSearching}
                className="w-full bg-emerald-950 text-white p-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Crosshair size={24} />}
                Auto-Locate Me
              </button>
           </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
           <div className="bg-white p-10 rounded-[4rem] shadow-premium border border-white space-y-10">
              <header className="flex items-center gap-4 mb-4">
                 <Calculator className="text-emerald-600" size={24} />
                 <h2 className="font-black text-2xl tracking-tighter">Adjust Calculations</h2>
              </header>

              <div className="space-y-8">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-3">Timing Method</label>
                   <select 
                    value={settings.method}
                    onChange={(e) => onUpdateSettings({...settings, method: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-[1.8rem] p-6 text-sm font-bold outline-none shadow-inner"
                   >
                     {PRAYER_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-3">Asr Juristic School</label>
                   <div className="flex bg-slate-50 p-2 rounded-[2rem] shadow-inner">
                      {PRAYER_SCHOOLS.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => onUpdateSettings({...settings, school: s.id})}
                            className={`flex-1 py-5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${settings.school === s.id ? 'bg-white text-emerald-900 shadow-md' : 'text-slate-400'}`}
                        >
                            {s.name}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-3">Fajr Angle</label>
                       <input 
                        type="number" step="0.1"
                        value={settings.fajrAngle || 18}
                        onChange={(e) => onUpdateSettings({...settings, fajrAngle: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-[1.8rem] p-6 text-sm font-black outline-none shadow-inner"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-3">Isha Angle</label>
                       <input 
                        type="number" step="0.1"
                        value={settings.ishaAngle || 18}
                        onChange={(e) => onUpdateSettings({...settings, ishaAngle: parseFloat(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-[1.8rem] p-6 text-sm font-black outline-none shadow-inner"
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
