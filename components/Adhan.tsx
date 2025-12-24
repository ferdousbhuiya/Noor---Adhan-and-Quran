
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchPrayerTimes, geocodeAddress } from '../services/api';
import { PrayerTimes, AdhanSettings, LocationData } from '../types';
import { ADHAN_OPTIONS } from '../constants';
import { db } from '../services/db';
import { Bell, BellOff, Volume2, Loader2, Check, Settings2, MapPin, X, Download, Trash2, CheckCircle2, Play, Pause, AlertCircle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'times' | 'config'>('times');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string, time: string, remaining: string } | null>(null);
  
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    db.getAllDownloadedAdhanIds().then(setDownloadedIds);
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

  const togglePreview = (id: string, url: string) => {
    if (!audioRef.current) return;

    if (isPreviewPlaying === id) {
      audioRef.current.pause();
      setIsPreviewPlaying(null);
      setIsBuffering(false);
      return;
    }

    setIsBuffering(true);
    setIsPreviewPlaying(id);
    audioRef.current.src = url;
    audioRef.current.load();
    audioRef.current.play().catch(e => {
      console.error("Play failed", e);
      setIsPreviewPlaying(null);
      setIsBuffering(false);
    });
  };

  const downloadAdhan = async (option: typeof ADHAN_OPTIONS[0]) => {
    setIsDownloading(option.id);
    try {
      const res = await fetch(option.url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      await db.saveAdhanAudio(option.id, blob);
      setDownloadedIds(prev => [...prev, option.id]);
    } catch (e) {
      alert("Download failed. Check your connection.");
    } finally {
      setIsDownloading(null);
    }
  };

  const deleteAdhan = async (id: string) => {
    if (confirm("Remove offline audio?")) {
      await db.deleteAdhanAudio(id);
      setDownloadedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await geocodeAddress(searchQuery);
      onUpdateLocation({ ...result, isManual: true });
      setShowLocationModal(false);
      setSearchQuery("");
    } catch (e) {
      alert("Location not found.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f2f6f4]">
      <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Syncing...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#f2f6f4] min-h-screen pb-40">
      <audio 
        ref={audioRef} 
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={() => { setIsPreviewPlaying(null); setIsBuffering(false); }}
        onError={() => { setIsPreviewPlaying(null); setIsBuffering(false); }}
        className="hidden"
      />

      <header className="flex justify-between items-end mb-10 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">Prayer Times</h1>
          <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 text-emerald-600">
            <MapPin size={12} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest">{location?.name || 'Set Location'}</span>
          </button>
        </div>
        <button 
          onClick={() => setActiveTab(activeTab === 'times' ? 'config' : 'times')} 
          className={`p-4 rounded-2xl shadow-premium border transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-slate-600 border-white'}`}
        >
          {activeTab === 'times' ? <Settings2 size={20} /> : <Check size={20} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{activeTab === 'times' ? 'Voices' : 'Done'}</span>
        </button>
      </header>

      {activeTab === 'times' ? (
        <div className="space-y-4">
          {nextPrayerInfo && (
            <div className="bg-emerald-950 rounded-[3rem] p-8 mb-4 text-white shadow-2xl relative overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 block mb-2">Up Next: {nextPrayerInfo.name}</span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl font-black tracking-tighter">{formatTime12h(nextPrayerInfo.time)}</h2>
                <span className="text-xs text-emerald-100/60">{nextPrayerInfo.remaining}</span>
              </div>
            </div>
          )}
          {prayerList.map((prayer) => {
            const isCurrent = prayer.name === currentAndNext.current;
            const isNotify = settings.notifications[prayer.name];
            return (
              <div key={prayer.name} className={`flex items-center gap-5 p-6 rounded-[2.8rem] transition-all ${isCurrent ? 'bg-emerald-700 text-white shadow-xl' : 'bg-white text-slate-800 border border-white'}`}>
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-xl">{prayer.icon}</div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">{prayer.name}</h3>
                  <p className="text-xl font-black tracking-tight">{formatTime12h(prayer.time)}</p>
                </div>
                {prayer.name !== 'Sunrise' && (
                  <button 
                    onClick={() => {
                        const newSettings = {...settings, notifications: {...settings.notifications, [prayer.name]: !isNotify}};
                        onUpdateSettings(newSettings);
                    }} 
                    className={`p-3 rounded-xl transition-all ${isNotify ? 'text-amber-400 bg-black/10' : 'text-slate-200 bg-slate-50'}`}
                  >
                    {isNotify ? <Bell size={18} fill="currentColor" /> : <BellOff size={18} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
          <section className="bg-white p-8 rounded-[3.5rem] shadow-premium border border-white">
            <h2 className="font-black text-xl tracking-tight text-slate-800 flex items-center gap-3 mb-6">
              <Volume2 size={20} className="text-amber-500" /> Choose Adhan Voice
            </h2>
            <div className="space-y-4">
              {ADHAN_OPTIONS.map((option) => {
                const isDownloaded = downloadedIds.includes(option.id);
                const downloading = isDownloading === option.id;
                const playing = isPreviewPlaying === option.id;
                const isSelected = settings.voiceId === option.id;

                return (
                  <div key={option.id} className={`p-5 rounded-[2.5rem] border transition-all flex flex-col gap-4 ${isSelected ? 'bg-emerald-900 text-white border-emerald-950 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base">{option.name}</h4>
                          {isSelected && <span className="bg-emerald-400 text-emerald-950 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">SELECTED</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                              {isDownloaded ? 'Offline Enabled' : 'Preview Available'}
                            </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => togglePreview(option.id, option.url)} 
                        className={`p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-2 ${playing ? 'bg-amber-500 text-white border-amber-400' : isSelected ? 'bg-white/10 text-white border-white/20' : 'bg-white text-emerald-600 border-emerald-100'}`}
                      >
                        {playing && isBuffering ? <Loader2 size={18} className="animate-spin" /> : playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{playing ? (isBuffering ? 'Loading' : 'Stop') : 'Preview'}</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                        {isDownloaded ? (
                          <div className="flex-1 flex gap-2">
                            <button 
                              onClick={() => onUpdateSettings({...settings, voiceId: option.id})}
                              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2 ${isSelected ? 'bg-white text-emerald-900' : 'bg-emerald-950 text-white active:scale-95'}`}
                            >
                              {isSelected ? <CheckCircle2 size={14} /> : null}
                              {isSelected ? 'Currently Selected' : 'Use this Voice'}
                            </button>
                            {!isSelected && (
                                <button onClick={() => deleteAdhan(option.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><Trash2 size={18} /></button>
                            )}
                          </div>
                        ) : (
                          <button 
                            disabled={downloading}
                            onClick={() => downloadAdhan(option)}
                            className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 active:scale-95 transition-all"
                          >
                            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {downloading ? 'Downloading...' : 'Download for Offline'}
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[4rem] p-10 shadow-2xl">
            <header className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl tracking-tighter">Set Location</h3>
              <button onClick={() => setShowLocationModal(false)} className="p-2"><X size={24} /></button>
            </header>
            <div className="space-y-6">
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Enter city..." 
                className="w-full bg-slate-50 rounded-3xl p-6 text-sm font-bold outline-none"
              />
              <button onClick={handleManualSearch} disabled={isSearching} className="w-full bg-emerald-950 text-white p-6 rounded-3xl font-black uppercase flex items-center justify-center gap-3">
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'Find Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adhan;
