import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { HIJRI_MONTHS, ISLAMIC_EVENTS } from '../constants';
import { fetchHijriCalendar, fetchPrayerTimes } from '../services/api';
import { LocationData } from '../types';

interface CalendarProps {
  location: LocationData | null;
}

const Calendar: React.FC<CalendarProps> = ({ location }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDays, setHijriDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayHijri, setTodayHijri] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const gregorianMonthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const gregorianYear = currentDate.getFullYear();

  const loadData = async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const calendarData = await fetchHijriCalendar(
        gregorianYear, 
        currentDate.getMonth() + 1, 
        location.lat, 
        location.lng
      );
      
      if (!calendarData || calendarData.length === 0) {
        throw new Error("Calendar service temporarily unavailable.");
      }
      
      setHijriDays(calendarData);
      
      // Sync today's Hijri for events and local day comparison
      const prayerRes = await fetchPrayerTimes(location.lat, location.lng, 4);
      setTodayHijri(prayerRes.rawHijri);
    } catch (err) {
      console.error("Calendar load error:", err);
      setError("Failed to synchronize lunar dates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate, location]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const hijriMonthHeader = useMemo(() => {
    if (hijriDays && hijriDays.length > 0) {
      // Find the mid-month entry to determine the primary month for the header
      const midDay = hijriDays[Math.floor(hijriDays.length / 2)];
      const hijri = midDay?.date?.hijri || midDay?.hijri;
      if (hijri?.month) {
        return {
          en: `${hijri.month.en} ${hijri.year} AH`,
          ar: `${hijri.month.ar} ${hijri.year} هـ`
        };
      }
    }
    return { en: "Lunar Calendar", ar: "التقويم الهجري" };
  }, [hijriDays]);

  const calculateDaysRemaining = (targetMonth: number, targetDay: number) => {
    if (!todayHijri?.month?.number || !todayHijri?.day) return null;
    
    const curHMonth = parseInt(todayHijri.month.number);
    const curHDay = parseInt(todayHijri.day);
    
    // Simple estimation of lunar day difference
    const currentTotalDays = (curHMonth - 1) * 29.53 + curHDay;
    const targetTotalDays = (targetMonth - 1) * 29.53 + targetDay;
    
    let diff = targetTotalDays - currentTotalDays;
    if (diff < -1) diff += 354.36; // Approx lunar year
    
    return Math.max(0, Math.floor(diff));
  };

  const calendarHeader = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Calculate padding days to align grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  if (!location && !loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6">
          <AlertCircle size={40} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Location Required</h2>
        <p className="text-sm text-slate-400 font-medium mb-8 px-10">Please set your location in Adhan settings to view the Islamic calendar.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f8f9f8] min-h-screen pb-32">
      <header className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-3">Islamic Calendar</h1>
          <div className="flex flex-col gap-1.5">
             <div className="flex items-center gap-2">
                <div className="bg-emerald-900 text-emerald-50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10">
                    {hijriMonthHeader.en}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {gregorianMonthName} {gregorianYear}
                </span>
             </div>
             <p className="arabic-text text-xl font-bold text-emerald-800 leading-none mt-1">{hijriMonthHeader.ar}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all text-emerald-800 hover:bg-emerald-50"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all text-emerald-800 hover:bg-emerald-50"><ChevronRight size={20} /></button>
        </div>
      </header>

      {loading ? (
        <div className="h-96 bg-white rounded-[3rem] shadow-premium flex flex-col items-center justify-center border border-white">
           <div className="relative mb-6">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Moon Phases...</p>
        </div>
      ) : error ? (
        <div className="h-96 bg-white rounded-[3rem] shadow-premium flex flex-col items-center justify-center border border-white p-10 text-center">
           <AlertCircle className="text-rose-400 mb-4" size={32} />
           <p className="text-sm font-bold text-slate-600 mb-6">{error}</p>
           <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-emerald-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
           >
             <RefreshCw size={14} /> Retry Sync
           </button>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200 border border-slate-50 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50" />
          
          <div className="grid grid-cols-7 mb-8 relative z-10 border-b border-slate-50 pb-4">
            {calendarHeader.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-slate-300 tracking-widest">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-3 relative z-10">
            {/* Grid padding for first day offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`p-${i}`} className="h-16" />
            ))}
            
            {hijriDays.map((dayData, idx) => {
              const day = idx + 1;
              const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() && 
                              currentDate.getFullYear() === new Date().getFullYear();
              
              const hijri = dayData?.date?.hijri || dayData?.hijri;
              const hijriDay = hijri?.day;
              const hijriMonthNum = parseInt(hijri?.month?.number || "0");
              const hasEvent = ISLAMIC_EVENTS.some(e => e.month === hijriMonthNum && e.day === parseInt(hijriDay || "0"));

              return (
                <div 
                  key={day} 
                  className={`relative h-16 flex flex-col items-center justify-center rounded-[1.5rem] transition-all cursor-pointer ${isToday ? 'bg-emerald-800 text-white shadow-xl shadow-emerald-900/30 scale-105 z-10' : 'hover:bg-emerald-50'}`}
                >
                  <span className={`text-sm font-black ${isToday ? 'text-white' : 'text-slate-700'}`}>{day}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[9px] font-black ${isToday ? 'text-emerald-200' : 'text-emerald-500'}`}>
                      {hijriDay || '--'}
                    </span>
                    <span className={`arabic-text text-[10px] font-bold ${isToday ? 'text-emerald-300/80' : 'text-slate-300'}`}>
                      {hijriDay ? parseInt(hijriDay).toLocaleString('ar-SA') : ''}
                    </span>
                  </div>
                  
                  {hasEvent && !isToday && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full ring-2 ring-white" />
                  )}
                  {isToday && (
                      <div className="absolute -top-1 -right-1">
                          <Sparkles size={12} className="text-amber-400 animate-pulse" />
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Upcoming Observances</h3>
        </div>
        
        {!todayHijri && !loading && !error && (
           <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex items-center gap-4 text-amber-700 text-xs font-bold shadow-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p>Syncing event countdowns with your current location...</p>
           </div>
        )}

        <div className="grid grid-cols-1 gap-4">
            {ISLAMIC_EVENTS.map((event, idx) => {
                const daysRemaining = calculateDaysRemaining(event.month, event.day);
                return (
                  <div key={idx} className="bg-white p-6 rounded-[2.8rem] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
                      <div className={`w-14 h-14 rounded-3xl flex flex-col items-center justify-center font-black transition-transform group-hover:scale-110 shadow-sm ${event.color}`}>
                          <span className="text-base">{event.day}</span>
                          <span className="text-[8px] uppercase tracking-wider">{HIJRI_MONTHS[event.month-1]?.substring(0, 3)}</span>
                      </div>
                      <div className="flex-1">
                          <h4 className="font-black text-slate-800 text-lg tracking-tight mb-0.5 group-hover:text-emerald-900 transition-colors">{event.name}</h4>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{HIJRI_MONTHS[event.month-1]}</p>
                            {daysRemaining !== null && (
                              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm ${daysRemaining < 15 ? 'bg-rose-100 text-rose-700' : daysRemaining < 45 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                {daysRemaining === 0 ? "Blessed Day" : `${daysRemaining} days left`}
                              </span>
                            )}
                          </div>
                      </div>
                      <div className="text-slate-100 group-hover:text-emerald-500 transition-colors">
                          <ChevronRight size={24} />
                      </div>
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;