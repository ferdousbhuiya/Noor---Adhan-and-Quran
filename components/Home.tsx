import React, { useState, useEffect } from 'react';
import { AppSection, PrayerTimes } from '../types.ts';
import { fetchPrayerTimes } from '../services/api.ts';
import { HIJRI_MONTHS, ISLAMIC_EVENTS } from '../constants.tsx';
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
  const [hijriDateArabic, setHijriDateArabic] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string} | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchPrayerTimes(location.lat, location.lng).then(data => {
        setPrayerTimes(data.times);
        setHijriDate(data.hijriDate);
        
        // Use Intl as a backup but the API hijriDate is primary for locality
        try {
          const arabicDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }).format(new Date());
          setHijriDateArabic(arabicDate);
        } catch (e) {
          setHijriDateArabic(data.hijriDate);
        }

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
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-emerald-900 to-[#f2f6f4]" />
         <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
      </div>

      <div className="relative z-10 flex flex-col">
        {/* Header Hero */}
        <div className="pt-12 pb-16 px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-8 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <Sparkles size={14} className="text-emerald-400" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Alhamdulillah</span>
          </div>

          <div className="mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-4">{nextPrayer?.name || 'Loading'} Prayer</p>
            <h1 className="text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
              {nextPrayer ? formatTime12h(nextPrayer.time).split(' ')[0] : '--:--'}
            </h1>
            <div className="mt-6 flex flex-col items-center gap-2">
               <div className="px-6 py-2.5 rounded-full bg-emerald-500 text-white shadow-lg flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">{remainingTime || '...'} Remaining</span>
               </div>
            </div>
          </div>
        </div>

        {/* Floating Calendar Bar */}
        <div className="px-6 -mt-10 mb-8">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-premium flex items-center justify-between border border-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-lg font-black">{hijriDate.split(' ')[0] || '--'}</span>
                  <span className="text-[7px] uppercase font-black text-emerald-400 tracking-tighter">{hijriDate.split(' ')[1]?.substring(0,3) || '...'}</span>
              </div>
              <div>
                <h2 className="arabic-text text-xl font-bold text-emerald-900 leading-none mb-1">{hijriDateArabic || 'التقويم الهجري'}</h2>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={10} className="text-emerald-500" />
                  Local Time • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button onClick={() => onNavigate(AppSection.Calendar)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-emerald-900 rounded-2xl hover:bg-emerald-50 transition-all border border-slate-100 active:scale-90">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-[#f2f6f4] rounded-t-[3.5rem] px-6 pt-2 pb-32 space-y-8">
          {/* Action Grid */}
          <div className="grid grid-cols-3 gap-4">
            <ActionItem icon={<BookOpen size={22} />} label="Quran" onClick={() => onNavigate(AppSection.Quran)} color="bg-emerald-800" />
            <ActionItem icon={<CircleDot size={22} />} label="Dhikr" onClick={() => onNavigate(AppSection.Tasbih)} color="bg-emerald-700" />
            <ActionItem icon={<Heart size={22} />} label="Dua" onClick={() => onNavigate(AppSection.Dua)} color="bg-emerald-600" />
            <ActionItem icon={<Clock size={22} />} label="Salat" onClick={() => onNavigate(AppSection.Adhan)} color="bg-emerald-500" />
            <ActionItem icon={<Compass size={22} />} label="Qiblah" onClick={() => onNavigate(AppSection.Qiblah)} color="bg-emerald-400" />
            <ActionItem icon={<Search size={22} />} label="Explore" onClick={() => onNavigate(AppSection.Explore)} color="bg-emerald-300" />
          </div>

          {/* Verse of the Day Card */}
          <div className="bg-emerald-950 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                 <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500">Daily Wisdom</span>
                 <BookOpen size={14} className="text-white/20" />
              </div>
              <p className="arabic-text text-3xl text-right mb-6 leading-relaxed font-bold text-emerald-50">وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا</p>
              <div className="space-y-6">
                <p className="text-xs text-emerald-100/70 italic leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5">"And whoever fears Allah - He will make for him a way out."</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Surah At-Talaq</span>
                    <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">65:2</span>
                  </div>
                  <button onClick={() => onNavigate(AppSection.Quran)} className="bg-white text-emerald-950 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Read Surah</button>
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
  <button onClick={onClick} className="flex flex-col items-center gap-2 group">
    <div className={`w-full aspect-square rounded-[2rem] flex items-center justify-center text-white shadow-lg ${color} active:scale-90 transition-all group-hover:-translate-y-1 duration-300`}>
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-900 transition-colors">{label}</span>
  </button>
);

export default Home;