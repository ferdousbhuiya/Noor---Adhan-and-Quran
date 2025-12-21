
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { HIJRI_MONTHS, ISLAMIC_EVENTS } from '../constants';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => null);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  // Simple Mock calculation for Hijri Month - In production use a library
  const currentHijriMonth = HIJRI_MONTHS[(currentDate.getMonth() + 4) % 12];
  const gregorianMonthName = currentDate.toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-2">Islamic Calendar</h1>
          <div className="flex items-center gap-3">
             <div className="bg-emerald-900 text-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10">
                {currentHijriMonth}
             </div>
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {gregorianMonthName} {currentDate.getFullYear()}
             </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all text-emerald-800"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all text-emerald-800"><ChevronRight size={20} /></button>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200 border border-slate-50 relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        
        <div className="grid grid-cols-7 mb-8 relative z-10">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-black text-slate-300 tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2 relative z-10">
          {padding.map((_, i) => <div key={`p-${i}`} className="h-14" />)}
          {days.map(day => {
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            
            // Mocking some events on calendar days
            const hasEvent = day === 10 || day === 27;

            return (
              <div 
                key={day} 
                className={`relative h-14 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${isToday ? 'bg-emerald-700 text-white shadow-xl shadow-emerald-700/30 scale-105 z-10' : 'hover:bg-emerald-50'}`}
              >
                <span className={`text-sm font-black ${isToday ? 'text-white' : 'text-slate-700'}`}>{day}</span>
                <span className={`text-[9px] font-black mt-1 ${isToday ? 'text-emerald-200' : 'text-emerald-500'}`}>
                  {((day + 12) % 30) + 1}
                </span>
                
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

      <div className="mt-12 space-y-5">
        <div className="flex items-center gap-2 px-2">
            <div className="w-1 h-5 bg-emerald-600 rounded-full" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Key Islamic Dates</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
            {ISLAMIC_EVENTS.map((event, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow group">
                    <div className={`w-14 h-14 rounded-3xl flex flex-col items-center justify-center font-black transition-transform group-hover:scale-110 ${event.color}`}>
                        <span className="text-sm">{event.day}</span>
                        <span className="text-[8px] uppercase tracking-wider">{HIJRI_MONTHS[event.month-1].substring(0, 3)}</span>
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-base tracking-tight mb-0.5">{event.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{HIJRI_MONTHS[event.month-1]}</p>
                    </div>
                    <div className="ml-auto text-emerald-100 group-hover:text-emerald-300 transition-colors">
                        <ChevronRight size={24} />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
