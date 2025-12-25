
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchPrayerTimes, geocodeAddress, fetchLocationSuggestions } from '../services/api';
import { PrayerTimes, AdhanSettings, LocationData } from '../types';
import { ADHAN_OPTIONS, PRAYER_METHODS, PRAYER_SCHOOLS } from '../constants';
import { db } from '../services/db';
import { Bell, BellOff, Volume2, Loader2, Check, Settings2, MapPin, X, Download, Trash2, CheckCircle2, Play, Pause, AlertCircle, Calculator, Crosshair, ChevronRight, Search, Sparkles } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'times' | 'voices' | 'calc'>('times');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string, time: string, remaining: string } | null>(null);
  
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    db.getAllDownloadedAdhanIds().then(setDownloadedIds);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    };
  }, []);

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
      }).catch(() => {
        setLoading(false);
      });
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
        if (err.message === "API_KEY_MISSING") {
          setNeedsKey(true);
        }
      } finally {
        setIsSuggesting(false);
      }
    }, 600) as unknown as number;

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const togglePreview = (id: string, url: string) => {
    if (!audioRef.current) return;
    if (isPreviewPlaying === id) {
      audioRef.current.pause();
      setIsPreviewPlaying(null);
      return;
    }
    setIsPreviewPlaying(id);
    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.load();
    audioRef.current.play().catch(() => setIsPreviewPlaying(null));
  };

  const handleSelection = async (name: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await geocodeAddress(name);
      onUpdateLocation({ ...result, isManual: true });
      setShowLocationModal(false);
      setSearchQuery("");
      setSuggestions([]);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        setNeedsKey(true);
      } else {
        setSearchError(e.message || "Failed to find coordinates for this location.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    handleSelection(searchQuery);
  };

  const useCurrentLocation = () => {
    setIsSearching(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition((pos) => {
      onUpdateLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: "Current Location",
        isManual: false
      });
      setShowLocationModal(false);
      setIsSearching(false);
    }, () => {
      setSearchError("Location access denied or GPS disabled.");
      setIsSearching(false);
    }, { timeout: 10000 });
  };

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      // After selection, retry suggestion if search query exists
      if (searchQuery.length >= 2) {
        try {
          const results = await fetchLocationSuggestions(searchQuery);
          setSuggestions(results);
        } catch (e) {
          console.error("Retry failed", e);
        }
      }
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f2f6f4]">
      <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Adjusting Angles...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-40">
      <audio ref={audioRef} onEnded={() => setIsPreviewPlaying(null)} className="hidden" />

      <header className="mb-8 px-2">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">Adhan</h1>
            <button onClick={() => { setSearchError(null); setShowLocationModal(true); }} className="flex items-center gap-2 text-emerald-600 group">
              <MapPin size={12} fill="currentColor" className="group-hover:animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">{location?.name || 'Set Location'}</span>
            </button>
          </div>
          <div className="flex bg-white p-1.5 rounded-[1.8rem] shadow-premium border border-white">
            <button 
                onClick={() => setActiveTab('times')}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'times' ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-400'}`}
            >
                Times
            </button>
            <button 
                onClick={() => setActiveTab('calc')}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'calc' ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-400'}`}
            >
                Config
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'times' && (
        <div className="space-y-4 animate-in fade-in duration-500">
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
          
          <button onClick={() => setActiveTab('voices')} className="w-full bg-white p-7 rounded-[2.5rem] border border-white flex items-center justify-between group active:scale-[0.98] transition-all mt-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Volume2 size={24} /></div>
                <div className="text-left">
                   <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Adhan Voice</h4>
                   <p className="text-xs font-bold text-slate-400">Current: {ADHAN_OPTIONS.find(o => o.id === settings.voiceId)?.name}</p>
                </div>
             </div>
             <ChevronRight className="text-slate-200 group-hover:translate-x-1 transition-transform" />
          </button>
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
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-emerald-500/20 transition-all"
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
              
              <div className="p-5 bg-amber-50 rounded-[2rem] flex gap-4">
                 <AlertCircle size={18} className="text-amber-600 shrink-0" />
                 <p className="text-[10px] font-bold text-amber-800 leading-relaxed">Adjusting angles is recommended only for high-latitude regions or specific local requirements.</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'voices' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-3 mb-6 px-2">
             <button onClick={() => setActiveTab('times')} className="p-2 bg-white rounded-xl shadow-sm text-slate-400"><X size={18} /></button>
             <h2 className="font-black text-xl tracking-tight">Adhan Voices</h2>
          </div>
          {ADHAN_OPTIONS.map((option) => {
            const isSelected = settings.voiceId === option.id;
            const playing = isPreviewPlaying === option.id;
            return (
              <div key={option.id} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col gap-4 ${isSelected ? 'bg-emerald-900 text-white border-emerald-950' : 'bg-white border-white shadow-premium'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-black text-base">{option.name}</h4>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>{option.muezzin}</p>
                  </div>
                  <button 
                    onClick={() => togglePreview(option.id, option.url)}
                    className={`p-4 rounded-2xl transition-all ${playing ? 'bg-amber-500 text-white' : isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-emerald-600'}`}
                  >
                    {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  </button>
                </div>
                {!isSelected && (
                    <button 
                        onClick={() => onUpdateSettings({...settings, voiceId: option.id})}
                        className="w-full py-4 bg-emerald-950/10 text-emerald-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-950 hover:text-white transition-all"
                    >
                        Select Voice
                    </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[4rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col max-h-[90vh]">
            <header className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="font-black text-2xl tracking-tighter">Location Finder</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI Assisted Search</p>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="p-3 bg-slate-50 rounded-full"><X size={20} /></button>
            </header>

            <div className="space-y-5 overflow-y-auto no-scrollbar pb-10">
              {needsKey && (
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-[2.2rem] flex flex-col gap-4 animate-in zoom-in duration-300">
                   <div className="flex gap-3">
                      <Sparkles size={18} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] font-black text-amber-900 uppercase tracking-tight">AI Activation Required</p>
                   </div>
                   <p className="text-[10px] font-bold text-amber-800 leading-relaxed">To use the Smart Location Finder, please select an API key from your project.</p>
                   <button 
                    onClick={handleSelectKey}
                    className="bg-emerald-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                   >
                     Select API Key
                   </button>
                   <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-center text-[8px] font-black text-amber-600/50 underline uppercase">Billing Documentation</a>
                </div>
              )}

              {searchError && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-3xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                   <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-rose-800 leading-tight">{searchError}</p>
                </div>
              )}

              <div className="relative group">
                <input 
                  value={searchQuery} 
                  onChange={e => { setSearchQuery(e.target.value); setSearchError(null); }} 
                  placeholder="e.g. London, UK" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] p-5 pr-16 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500/20 transition-all shadow-inner"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSuggesting && <Loader2 size={16} className="animate-spin text-emerald-600 mr-2" />}
                    <button 
                        onClick={handleManualSearch}
                        disabled={isSearching || !searchQuery}
                        className="p-3.5 bg-emerald-950 text-white rounded-2xl disabled:opacity-30 transition-all active:scale-90"
                    >
                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl shadow-slate-200/50">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest p-4 pb-2">Did you mean?</p>
                  {suggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSelection(s)}
                      className="w-full text-left p-5 hover:bg-emerald-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                            <MapPin size={16} className="text-slate-400 group-hover:text-emerald-600" />
                         </div>
                         <span className="text-sm font-black text-slate-700">{s}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 py-2">
                 <div className="h-px flex-1 bg-slate-100" />
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">or use sensors</span>
                 <div className="h-px flex-1 bg-slate-100" />
              </div>

              <button 
                onClick={useCurrentLocation} 
                disabled={isSearching}
                className="w-full bg-white border-2 border-emerald-900 text-emerald-950 p-6 rounded-[2.2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/5"
              >
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Crosshair size={20} />}
                Pinpoint via GPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adhan;
