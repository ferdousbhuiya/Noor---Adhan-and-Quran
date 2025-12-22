import React, { useState, useEffect } from 'react';
import { AppSection, PrayerTimes } from '../types.ts';
import { fetchPrayerTimes } from '../services/api.ts';
import { BookOpen, CircleDot, Clock, Heart, MapPin, ChevronRight, Sparkles, Compass, Search } from 'lucide-react';

interface HomeProps {
  onNavigate: (section: AppSection) => void;
  location: { lat: number, lng: number } | null;
}

const formatTime12h = (time24: string) => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const Home: React.FC<HomeProps> = ({ onNavigate, location }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [hijriArabic, setHijriArabic] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string} | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchPrayerTimes(location.lat, location.lng).then(data => {
        setPrayerTimes(data.times);
        setHijriDate(data.hijriDate);
        setHijriArabic(data.hijriArabic);
        setLocationName(data.locationName.split('/')[1]?.replace('_', ' ') || 'Local Area');
        calculateNextPrayer(data.times);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [location]);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6f4] relative">
      {/* Sacred Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b] via-[#065f46] to-[#f2f6f4]" />
         <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
      </div>

      <div className="relative z-10 flex flex-col">
        {/* Dynamic Header */}
        <div className="pt-14 pb-16 px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-10 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-xl">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Bismillah</span>
          </div>

          <div className="mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-5">{nextPrayer?.name || 'Syncing'} Adhan</p>
            <h1 className="text-[7rem] font-black tracking-tighter text-white leading-none drop-shadow-2xl">
              {nextPrayer ? formatTime12h(nextPrayer.time).split(' ')[0] : '--:--'}
            </h1>
            <div className="mt-8 flex flex-col items-center gap-4">
               <div className="px-8 py-3.5 rounded-full bg-amber-500 text-emerald-950 shadow-2xl flex items-center gap-3 border border-amber-400/50 scale-105">
                  <Clock size={16} className="animate-spin-slow" />
                  <span className="text-xs font-black tracking-widest uppercase">{remainingTime || '...'}</span>
               </div>
               <div className="flex items-center gap-2 opacity-60">
                  <MapPin size={10} className="text-white" />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{locationName}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Hijri Calendar Feature Card */}
        <div className="px-6 -mt-10 mb-10">
          <div className="bg-white p-7 rounded-[3rem] shadow-premium flex items-center justify-between border border-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-[1.8rem] bg-emerald-950 flex flex-col items-center justify-center text-white shadow-xl">
                  <span className="text-xl font-black leading-none mb-0.5">{hijriDate.split(' ')[0] || '--'}</span>
                  <span className="text-[8px] uppercase font-black text-emerald-400 tracking-tighter">{hijriDate.split(' ')[1]?.substring(0,3) || '...'}</span>
              </div>
              <div className="flex flex-col">
                <h2 className="arabic-text text-2xl font-bold text-emerald-900 leading-none mb-2">{hijriArabic || 'جاري التحميل...'}</h2>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
                  {hijriDate || 'Determining Date'}
                </p>
              </div>
            </div>
            
            <button onClick={() => onNavigate(AppSection.Calendar)} className="w-14 h-14 flex items-center justify-center bg-slate-50 text-emerald-900 rounded-3xl hover:bg-emerald-950 hover:text-white transition-all border border-slate-100 active:scale-90 shadow-sm">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="bg-[#f2f6f4] rounded-t-[4rem] px-6 pt-4 pb-36 space-y-10">
          {/* Main Action Grid */}
          <div className="grid grid-cols-3 gap-5">
            <ActionItem icon={<BookOpen size={24} />} label="Quran" onClick={() => onNavigate(AppSection.Quran)} color="bg-emerald-800" />
            <ActionItem icon={<CircleDot size={24} />} label="Tasbih" onClick={() => onNavigate(AppSection.Tasbih)} color="bg-emerald-700" />
            <ActionItem icon={<Heart size={24} />} label="Dua" onClick={() => onNavigate(AppSection.Dua)} color="bg-emerald-600" />
            <ActionItem icon={<Clock size={24} />} label="Adhan" onClick={() => onNavigate(AppSection.Adhan)} color="bg-emerald-500" />
            <ActionItem icon={<Compass size={24} />} label="Qiblah" onClick={() => onNavigate(AppSection.Qiblah)} color="bg-emerald-400" />
            <ActionItem icon={<Search size={24} />} label="Explore" onClick={() => onNavigate(AppSection.Explore)} color="bg-emerald-300" />
          </div>

          {/* Inspiration Verse Card */}
          <div className="bg-emerald-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/80">Verse of the Day</span>
                 <BookOpen size={16} className="text-white/20" />
              </div>
              <p className="arabic-text text-3xl text-right mb-8 leading-[2.2] font-bold text-emerald-50 drop-shadow-lg">إِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
              <div className="space-y-8">
                <p className="text-sm text-emerald-100/70 italic leading-relaxed font-medium bg-black/20 p-6 rounded-[2.5rem] border border-white/5">"For indeed, with hardship [will be] ease."</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Surah Ash-Sharh</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">94:6</span>
                  </div>
                  <button onClick={() => onNavigate(AppSection.Quran)} className="bg-white text-emerald-950 px-8 py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Read Surah</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
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