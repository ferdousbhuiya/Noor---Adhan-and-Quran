
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppSection, PrayerTimes, LocationData, AdhanSettings } from '../types.ts';
import { fetchPrayerTimes } from '../services/api.ts';
import { db } from '../services/db.ts';
import { ADHAN_OPTIONS } from '../constants.tsx';
import { BookOpen, CircleDot, Clock, Heart, MapPin, ChevronRight, Sparkles, Compass, Calendar as CalendarIcon, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface HomeProps {
  onNavigate: (section: AppSection) => void;
  location: LocationData | null;
  adhanSettings: AdhanSettings;
}

const formatTime12h = (time24: string) => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const Home: React.FC<HomeProps> = ({ onNavigate, location, adhanSettings }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [hijriArabic, setHijriArabic] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string} | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const selectedVoiceName = useMemo(() => {
    return ADHAN_OPTIONS.find(o => o.id === adhanSettings.voiceId)?.name || 'Standard';
  }, [adhanSettings.voiceId]);

  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchPrayerTimes(location.lat, location.lng, adhanSettings.method, adhanSettings.school).then(data => {
        setPrayerTimes(data.times);
        setHijriDate(data.hijriDate || '');
        setHijriArabic(data.hijriArabic || '');
        calculateNextPrayer(data.times);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [location, adhanSettings.method, adhanSettings.school]);

  useEffect(() => {
    if (!nextPrayer) return;
    const timer = setInterval(() => {
      const now = new Date();
      const [h, m] = nextPrayer.time.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [nextPrayer]);

  const calculateNextPrayer = (times: PrayerTimes) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const prayers = [
      { name: 'Fajr', time: times.Fajr },
      { name: 'Sunrise', time: times.Sunrise },
      { name: 'Dhuhr', time: times.Dhuhr },
      { name: 'Asr', time: times.Asr },
      { name: 'Maghrib', time: times.Maghrib },
      { name: 'Isha', time: times.Isha }
    ];
    for (let prayer of prayers) {
      const [h, m] = prayer.time.split(':').map(Number);
      if (h * 60 + m > currentMinutes) {
        setNextPrayer(prayer);
        return;
      }
    }
    setNextPrayer(prayers[0]);
  };

  const toggleAdhan = async () => {
    if (!audioRef.current) return;

    if (isAdhanPlaying) {
      audioRef.current.pause();
      setIsAdhanPlaying(false);
      return;
    }

    if (isAudioLoading) return;
    setIsAudioLoading(true);

    try {
      const audioBlob = await db.getAdhanAudio(adhanSettings.voiceId);
      if (!audioBlob) {
        setIsAudioLoading(false);
        if (confirm("Voice not found offline. Download now?")) onNavigate(AppSection.Adhan);
        return;
      }

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(audioBlob);
      objectUrlRef.current = url;

      audioRef.current.src = url;
      audioRef.current.load();
      await audioRef.current.play();
      setIsAdhanPlaying(true);
    } catch (e) {
      console.error("Adhan error", e);
      alert("Audio playback failed. Please check your voice settings.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const hijriParts = hijriDate ? hijriDate.split(' ') : ['--', '...', '----'];

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6f4] relative">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsAdhanPlaying(false)} 
        className="hidden"
      />

      <div className="fixed inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b] via-[#065f46] to-[#f2f6f4]" />
         <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
      </div>

      <div className="relative z-10 flex flex-col">
        <div className="pt-14 pb-16 px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-10 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-xl">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Bismillah</span>
          </div>

          <div className="mb-14 w-full px-4">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-5">{nextPrayer?.name || 'Syncing'} Adhan</p>
            <div className="flex items-center justify-center gap-4">
                <h1 className="text-[6rem] sm:text-[7rem] font-black tracking-tighter text-white leading-none drop-shadow-2xl">
                {nextPrayer ? formatTime12h(nextPrayer.time).split(' ')[0] : '--:--'}
                </h1>
                <button 
                  onClick={toggleAdhan}
                  disabled={isAudioLoading}
                  className={`p-4 rounded-full transition-all active:scale-90 flex items-center justify-center shadow-2xl ${isAdhanPlaying ? 'bg-amber-500 text-emerald-950 animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isAudioLoading ? <Loader2 size={24} className="animate-spin text-white" /> : isAdhanPlaying ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
               <div className="px-8 py-3.5 rounded-full bg-amber-500 text-emerald-950 shadow-2xl flex items-center gap-3 border border-amber-400/50 scale-105">
                  <span className="text-xs font-black tracking-widest uppercase">{remainingTime || '...'}</span>
               </div>
               <div className="flex flex-col items-center gap-1 opacity-80">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-white fill-emerald-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{location?.name || 'Searching...'}</span>
                  </div>
                  <p className="text-[8px] font-black text-emerald-300/60 uppercase tracking-widest mt-1">Voice: {selectedVoiceName}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-10 mb-10">
          <div 
            onClick={() => onNavigate(AppSection.Calendar)}
            className="bg-white p-7 rounded-[3rem] shadow-premium flex items-center justify-between border border-white relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-[1.8rem] bg-emerald-950 flex flex-col items-center justify-center text-white shadow-xl">
                  <span className="text-xl font-black leading-none mb-0.5">{hijriParts[0] || '--'}</span>
                  <span className="text-[8px] uppercase font-black text-emerald-400 tracking-tighter">{hijriParts[1]?.substring(0,3) || '...'}</span>
              </div>
              <div className="flex flex-col text-left">
                <h2 className="arabic-text text-2xl font-bold text-emerald-900 leading-none mb-2">{hijriArabic || 'جاري التحميل...'}</h2>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
                  {hijriDate || 'Determining Date'}
                </p>
              </div>
            </div>
            <button className="w-14 h-14 flex items-center justify-center bg-slate-50 text-emerald-900 rounded-3xl group-hover:bg-emerald-950 group-hover:text-white transition-all border border-slate-100">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="bg-[#f2f6f4] rounded-t-[4rem] px-6 pt-4 pb-36 space-y-10">
          <div className="grid grid-cols-3 gap-5">
            <ActionItem icon={<BookOpen size={24} />} label="Quran" onClick={() => onNavigate(AppSection.Quran)} color="bg-emerald-800" />
            <ActionItem icon={<CircleDot size={24} />} label="Tasbih" onClick={() => onNavigate(AppSection.Tasbih)} color="bg-emerald-700" />
            <ActionItem icon={<Heart size={24} />} label="Dua" onClick={() => onNavigate(AppSection.Dua)} color="bg-emerald-600" />
            <ActionItem icon={<Clock size={24} />} label="Adhan" onClick={() => onNavigate(AppSection.Adhan)} color="bg-emerald-500" />
            <ActionItem icon={<CalendarIcon size={24} />} label="Calendar" onClick={() => onNavigate(AppSection.Calendar)} color="bg-amber-600" />
            <ActionItem icon={<Compass size={24} />} label="Qiblah" onClick={() => onNavigate(AppSection.Qiblah)} color="bg-emerald-400" />
          </div>
          
          <div className="bg-emerald-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/80">Verse of the Day</span>
                 <BookOpen size={16} className="text-white/20" />
              </div>
              <p className="arabic-text text-3xl text-right mb-8 leading-[2.2] font-bold text-emerald-50">إِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
              <div className="space-y-8">
                <p className="text-sm text-emerald-100/70 italic leading-relaxed font-medium bg-black/20 p-6 rounded-[2.5rem] border border-white/5">"For indeed, with hardship [will be] ease."</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Surah Ash-Sharh</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">94:6</span>
                  </div>
                  <button onClick={() => onNavigate(AppSection.Quran)} className="bg-white text-emerald-950 px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95">Read Surah</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionItem: React.FC<{icon: any, label: string, onClick: any, color: string}> = ({ icon, label, onClick, color }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group">
    <div className={`w-full aspect-square rounded-[2.2rem] flex items-center justify-center text-white shadow-xl ${color} active:scale-90 transition-all group-hover:-translate-y-2 duration-500 border border-white/10`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-900 transition-colors">{label}</span>
  </button>
);

export default Home;
