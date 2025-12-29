
import React, { useState, useEffect, useRef } from 'react';
import { AppSection, AppSettings, LocationData } from './types.ts';
import Home from './components/Home.tsx';
import Quran from './components/Quran.tsx';
import Tasbih from './components/Tasbih.tsx';
import Adhan from './components/Adhan.tsx';
import Calendar from './components/Calendar.tsx';
import DuaView from './components/Dua.tsx';
import Qiblah from './components/Qiblah.tsx';
import Explore from './components/Explore.tsx';
import SettingsView from './components/Settings.tsx';
import { db } from './services/db.ts';
import { fetchPrayerTimes } from './services/api.ts';
import { Home as HomeIcon, BookOpen, Settings as SettingsIcon, Navigation, Sparkles, Volume2, ShieldAlert, MapPin, Key, Bell } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  quran: {
    fontSize: 24,
    fontFamily: 'Amiri',
    translationId: 'en.sahih',
    reciterId: 'ar.alafasy',
    continuousPlay: true,
    showTranslation: true
  },
  adhan: {
    voiceId: 'makkah',
    styleId: 'full',
    method: 4, 
    school: 0,
    fajrAngle: 18,
    ishaAngle: 18,
    notifications: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }
  },
  tasbihTarget: 33
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState(true);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('noor_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [location, setLocation] = useState<LocationData | null>(() => {
    const saved = localStorage.getItem('noor_location');
    return saved ? JSON.parse(saved) : null;
  });

  // Background Adhan Watcher
  useEffect(() => {
    if (!location || !isAudioUnlocked) return;
    
    const checkPrayerTime = async () => {
      try {
        const data = await fetchPrayerTimes(location.lat, location.lng, settings.adhan.method, settings.adhan.school);
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        Object.entries(data.times).forEach(([name, time]) => {
          if (time === currentTime && settings.adhan.notifications[name]) {
            // Trigger Notification
            if (Notification.permission === 'granted') {
              // Removed 'vibrate' from NotificationOptions due to TS type mismatch
              new Notification(`Time for ${name}`, {
                body: `It is now time for ${name} prayer in ${location.name}.`,
                icon: '/icon.png'
              });
            }
          }
        });
      } catch (e) {
        console.error("Adhan watcher error", e);
      }
    };

    const interval = setInterval(checkPrayerTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [location, isAudioUnlocked, settings.adhan]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey);
        }
        
        // Auto-request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (e) {
        console.warn("Init error", e);
      } finally {
        setIsDbReady(true);
        if (typeof (window as any).hideAppLoader === 'function') {
          (window as any).hideAppLoader();
        }
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    localStorage.setItem('noor_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist location whenever it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem('noor_location', JSON.stringify(location));
    }
  }, [location]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const handleBismillah = async () => {
    // Resume audio context
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') await ctx.resume();
    }
    
    setIsAudioUnlocked(true);

    // Only locate if we don't have one saved
    if (!location) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude, 
            name: "Current Location", 
            isManual: false 
          };
          setLocation(newLoc);
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  };

  if (!isDbReady) return null;

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl flex flex-col font-['Plus_Jakarta_Sans'] select-none overflow-hidden">
      
      {!isKeySelected && (
        <div className="fixed inset-0 z-[3000] bg-[#064e3b] flex flex-col items-center justify-center p-10 text-center">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
            <div className="relative z-10 mb-8">
               <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl text-emerald-950">
                  <Key size={32} />
               </div>
               <h2 className="text-2xl font-black text-white tracking-tighter mt-8 mb-4">Activation Required</h2>
               <p className="text-emerald-100/60 text-[11px] font-medium leading-relaxed px-4">
                  To enable smart search and location features, please select a valid Google Gemini API key.
               </p>
            </div>
            
            <button 
              onClick={handleOpenKeySelector}
              className="relative z-10 w-full bg-white text-[#064e3b] py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                Select API Key
            </button>
        </div>
      )}

      {isKeySelected && !isAudioUnlocked && (
        <div className="fixed inset-0 z-[2000] bg-[#064e3b] flex flex-col items-center justify-center p-10 text-center">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
            <div className="relative z-10 mb-12">
               <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/20 shadow-2xl">
                  <Volume2 size={40} className="text-emerald-400" />
               </div>
               <h2 className="text-3xl font-black text-white tracking-tighter mt-8 mb-4">Bismillah</h2>
               <p className="text-emerald-100/60 text-xs font-medium leading-relaxed px-4">
                  Tap to initialize your experience and enable Adhan audio notifications.
               </p>
            </div>
            
            <button 
              onClick={handleBismillah}
              disabled={isLocating}
              className="relative z-10 w-full bg-white text-[#064e3b] py-6 px-12 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {isLocating ? "Syncing..." : "Start Journey"}
            </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {activeSection === AppSection.Home && <Home onNavigate={setActiveSection} location={location} adhanSettings={settings.adhan} isAudioReady={isAudioUnlocked} />}
        {activeSection === AppSection.Quran && <Quran settings={settings.quran} onUpdateSettings={(s) => setSettings({ ...settings, quran: s })} />}
        {activeSection === AppSection.Tasbih && <Tasbih />}
        {activeSection === AppSection.Adhan && <Adhan location={location} settings={settings.adhan} onUpdateSettings={(s) => setSettings({ ...settings, adhan: s })} onUpdateLocation={setLocation} />}
        {activeSection === AppSection.Calendar && <Calendar location={location} />}
        {activeSection === AppSection.Dua && <DuaView onRecite={() => setActiveSection(AppSection.Tasbih)} />}
        {activeSection === AppSection.Qiblah && <Qiblah location={location} />}
        {activeSection === AppSection.Explore && <Explore location={location} />}
        {activeSection === AppSection.Settings && <SettingsView settings={settings} onSave={setSettings} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[360px] bg-emerald-950/90 backdrop-blur-2xl rounded-[2.5rem] p-2 flex items-center justify-around shadow-2xl border border-white/10 z-[100]">
        <NavItem active={activeSection === AppSection.Home} onClick={() => setActiveSection(AppSection.Home)} icon={<HomeIcon size={20} />} label="Home" />
        <NavItem active={activeSection === AppSection.Quran} onClick={() => setActiveSection(AppSection.Quran)} icon={<BookOpen size={20} />} label="Quran" />
        <NavItem active={activeSection === AppSection.Explore} onClick={() => setActiveSection(AppSection.Explore)} icon={<Navigation size={20} />} label="Explore" />
        <NavItem active={activeSection === AppSection.Settings} onClick={() => setActiveSection(AppSection.Settings)} icon={<SettingsIcon size={20} />} label="Config" />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{active: boolean, onClick: () => void, icon: any, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-3.5 rounded-[1.8rem] transition-all duration-500 ease-out active:scale-90 ${active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'text-emerald-500/40 hover:text-emerald-400'}`}
  >
    {icon}
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'block opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-1'}`}>{label}</span>
  </button>
);

export default App;
