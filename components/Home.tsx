
import React, { useState, useEffect } from 'react';
import { AppSection, PrayerTimes } from '../types';
import { fetchPrayerTimes } from '../services/api';
import { HIJRI_MONTHS, ISLAMIC_EVENTS } from '../constants';
import { BookOpen, CircleDot, Clock, Heart, MapPin, Share2, ChevronRight, Sparkles, Compass, Search } from 'lucide-react';

interface HomeProps {
  onNavigate: (section: AppSection) => void;
  location: { lat: number, lng: number } | null;
}

const Home: React.FC<HomeProps> = ({ onNavigate, location }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [hijriMonth, setHijriMonth] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string} | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    if (location) {
      fetchPrayerTimes(location.lat, location.lng).then(data => {
        setPrayerTimes(data.times);
        setHijriDate(data.hijriDate);
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
    <div className="flex flex-col min-h-screen bg-[#f2f6f4]">
      {/* Hero Header with refined Mesh Gradient Effect */}
      <div className="relative h-80 bg-emerald-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.3)_0%,_transparent_70%)]" />
        <img 
          src="https://images.unsplash.com/photo-1591604021695-0c69b7c05981?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-20" 
          alt="Mosque" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/40 to-emerald-950" />
        
        <div className="absolute top-12 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                    <Sparkles size={18} className="text-emerald-400" />
                </div>
                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Noor</span>
            </div>
            <button className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 text-white">
                <Share2 size={18} />
            </button>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 mt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">{nextPrayer?.name} Prayer</p>
          <h1 className="text-7xl font-black tracking-tighter mb-4">{nextPrayer?.time || '--:--'}</h1>
          <div className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-tight">{remainingTime}</span>
          </div>
        </div>
      </div>

      <div className="p-6 -mt-10 bg-[#f2f6f4] rounded-t-[3.5rem] relative z-10 flex-1 space-y-8">
        {/* Date Display Section with improved Contrast */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-white/50 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.8rem] bg-emerald-900 flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-900/20">
                <span className="text-xl font-black">{hijriDate.split(' ')[0]}</span>
                <span className="text-[9px] uppercase font-bold text-emerald-300 tracking-tighter">{hijriMonth.substring(0, 3)}</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1.5">{hijriDate || '...'}</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                {englishMonth} {new Date().getFullYear()}
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate(AppSection.Calendar)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-emerald-800 rounded-2xl hover:bg-emerald-50 transition-colors border border-slate-100">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Action Grid with Vibrant Icons */}
        <div className="grid grid-cols-3 gap-5">
          <ActionItem icon={<BookOpen size={22} />} label="Quran" onClick={() => onNavigate(AppSection.Quran)} color="bg-emerald-600 shadow-emerald-600/30" />
          <ActionItem icon={<CircleDot size={22} />} label="Dhikr" onClick={() => onNavigate(AppSection.Tasbih)} color="bg-amber-500 shadow-amber-500/30" />
          <ActionItem icon={<Heart size={22} />} label="Dua" onClick={() => onNavigate(AppSection.Dua)} color="bg-rose-500 shadow-rose-500/30" />
          <ActionItem icon={<Clock size={22} />} label="Salat" onClick={() => onNavigate(AppSection.Adhan)} color="bg-sky-500 shadow-sky-500/30" />
          <ActionItem icon={<Compass size={22} />} label="Qiblah" onClick={() => onNavigate(AppSection.Qiblah)} color="bg-slate-800 shadow-slate-800/30" />
          <ActionItem icon={<Search size={22} />} label="Explore" onClick={() => onNavigate(AppSection.Explore)} color="bg-indigo-600 shadow-indigo-600/30" />
        </div>

        {/* Horizontal Calendar Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Sacred Dates</h3>
            <button onClick={() => onNavigate(AppSection.Calendar)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b-2 border-emerald-100 pb-0.5">Full View</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
            {ISLAMIC_EVENTS.map((event, idx) => (
              <div key={idx} className="min-w-[150px] bg-white p-5 rounded-[2.5rem] border border-white/50 shadow-premium flex flex-col items-center text-center group active:scale-95 transition-all">
                <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${event.color} shadow-lg transition-transform group-hover:scale-110`}>
                   <span className="text-sm font-black">{event.day}</span>
                </div>
                <h4 className="font-black text-slate-800 text-[11px] leading-tight mb-1">{event.name}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{HIJRI_MONTHS[event.month-1]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Verse with Premium Dark Card */}
        <div className="bg-emerald-950 p-8 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden group mb-12">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Verse of the Day</span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><BookOpen size={14} /></div>
            </div>
            <p className="arabic-text text-4xl text-right mb-8 leading-[1.8] font-bold text-emerald-50">وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا</p>
            <div className="border-t border-white/10 pt-6">
              <p className="text-[12px] text-emerald-100/80 italic leading-relaxed font-medium">"And whoever fears Allah - He will make for him a way out."</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Surah At-Talaq • 65:2</span>
                <button onClick={() => onNavigate(AppSection.Quran)} className="text-[10px] font-black bg-emerald-800 text-emerald-100 px-5 py-2 rounded-2xl border border-emerald-700 active:scale-95 transition-all uppercase tracking-widest">Read</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionItem: React.FC<{icon: any, label: string, onClick: any, color: string}> = ({ icon, label, onClick, color }) => (
  <button onClick={onClick} className="flex flex-col items-center space-y-3 group">
    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-xl ${color} active:scale-90 transition-all hover:translate-y-[-4px]`}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500/80 group-hover:text-emerald-700 transition-colors">{label}</span>
  </button>
);

export default Home;
