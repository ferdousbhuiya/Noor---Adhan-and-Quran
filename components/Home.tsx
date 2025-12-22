
import React, { useState, useEffect } from 'react';
import { AppSection, PrayerTimes } from '../types';
import { fetchPrayerTimes } from '../services/api';
import { HIJRI_MONTHS, ISLAMIC_EVENTS } from '../constants';
import { BookOpen, CircleDot, Clock, Heart, MapPin, Share2, ChevronRight, Sparkles, Compass, Search } from 'lucide-react';

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
  const [hijriMonth, setHijriMonth] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string} | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    if (location) {
      fetchPrayerTimes(location.lat, location.lng).then(data => {
        setPrayerTimes(data.times);
        setHijriDate(data.hijriDate);
        
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

        const parts = data.hijriDate.split(' ');
        if (parts.length > 1) setHijriMonth(parts[1]);
        calculateNextPrayer(data.times);
      });
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

      setRemainingTime(`${hours}h ${minutes}m ${seconds}s left`);
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

  const englishMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6f4] relative">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-emerald-900 to-[#f2f6f4]" />
         <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="pt-16 pb-12 px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-8 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-2xl border border-white/10">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Alhamdulillah</span>
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-4">{nextPrayer?.name} Prayer</p>
          <h1 className="text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">{formatTime12h(nextPrayer?.time || '').split(' ')[0]}</h1>
          
          <div className="flex flex-col items-center gap-4">
             <div className="px-8 py-3.5 rounded-[2rem] bg-emerald-500 text-white shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-black tracking-widest uppercase">{remainingTime}</span>
             </div>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Until the call to prayer</p>
          </div>
        </div>

        <div className="bg-[#f2f6f4] rounded-t-[4rem] px-6 pt-10 pb-32 space-y-8 shadow-[0_-40px_100px_-20px_rgba(0,0,0,0.1)]">
          {/* Calendar Header Card */}
          <div className="bg-white p-6 rounded-[3rem] shadow-premium border border-white flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[2rem] bg-emerald-950 flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-900/20">
                  <span className="text-xl font-black">{hijriDate.split(' ')[0]}</span>
                  <span className="text-[9px] uppercase font-black text-emerald-500 tracking-tighter">{hijriMonth.substring(0, 3)}</span>
              </div>
              <div className="flex-1">
                <p className="arabic-text text-xl font-bold text-emerald-800 leading-none mb-2">{hijriDateArabic}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={10} className="text-emerald-500" />
                  {englishMonth} {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <button onClick={() => onNavigate(AppSection.Calendar)} className="w-14 h-14 flex items-center justify-center bg-slate-50 text-emerald-900 rounded-[1.8rem] hover:bg-emerald-50 transition-all border border-slate-100 active:scale-90">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-3 gap-5">
            <ActionItem icon={<BookOpen size={22} />} label="Quran" onClick={() => onNavigate(AppSection.Quran)} color="bg-emerald-800" />
            <ActionItem icon={<CircleDot size={22} />} label="Dhikr" onClick={() => onNavigate(AppSection.Tasbih)} color="bg-emerald-700" />
            <ActionItem icon={<Heart size={22} />} label="Dua" onClick={() => onNavigate(AppSection.Dua)} color="bg-emerald-600" />
            <ActionItem icon={<Clock size={22} />} label="Salat" onClick={() => onNavigate(AppSection.Adhan)} color="bg-emerald-500" />
            <ActionItem icon={<Compass size={22} />} label="Qiblah" onClick={() => onNavigate(AppSection.Qiblah)} color="bg-emerald-400" />
            <ActionItem icon={<Search size={22} />} label="Explore" onClick={() => onNavigate(AppSection.Explore)} color="bg-emerald-300" />
          </div>

          {/* Sacred Dates Feed */}
          <div className="space-y-5">
            <div className="flex justify-between items-center px-4">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Upcoming Events</h3>
              <button onClick={() => onNavigate(AppSection.Calendar)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Full View</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-4">
              {ISLAMIC_EVENTS.map((event, idx) => (
                <div key={idx} className="min-w-[160px] bg-white p-6 rounded-[2.8rem] border border-white shadow-premium flex flex-col items-center text-center group active:scale-95 transition-all">
                  <div className={`w-14 h-14 rounded-3xl mb-4 flex items-center justify-center ${event.color} shadow-inner transition-transform group-hover:scale-110`}>
                     <span className="text-sm font-black">{event.day}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-[11px] leading-tight mb-1">{event.name}</h4>
                  <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">{HIJRI_MONTHS[event.month-1]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verse of the Day Card */}
          <div className="bg-emerald-950 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Daily Wisdom</span>
                </div>
                <BookOpen size={16} className="text-white/20" />
              </div>
              <p className="arabic-text text-4xl text-right mb-10 leading-[1.8] font-black text-emerald-50 drop-shadow-md">وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا</p>
              <div className="space-y-8">
                <p className="text-[13px] text-emerald-100/70 italic leading-relaxed font-medium bg-white/5 p-6 rounded-[2rem] border border-white/5">"And whoever fears Allah - He will make for him a way out."</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Surah At-Talaq</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Verse 65:2</span>
                  </div>
                  <button onClick={() => onNavigate(AppSection.Quran)} className="bg-white text-emerald-950 px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-90 transition-all">Continue Reading</button>
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
    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-xl ${color} active:scale-90 transition-all group-hover:-translate-y-2 duration-300`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-900 transition-colors">{label}</span>
  </button>
);

export default Home;
