import React, { useState, useEffect, useRef } from 'react';
import { AppSection, AppSettings, AdhanSettings, LocationData, PrayerTimes } from './types.ts';
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
import { ADHAN_OPTIONS } from './constants.tsx';
import { Home as HomeIcon, BookOpen, Clock, Heart, CircleDot, Settings as SettingsIcon, Volume2, ShieldAlert } from 'lucide-react';

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
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('noor_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [currentPrayerTimes, setCurrentPrayerTimes] = useState<PrayerTimes | null>(null);
  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAdhanTriggered = useRef<string | null>(null);

  const location = settings.location || null;

  // Initialize DB and Location
  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
      } catch (e) {
        console.warn("DB initialization failed, proceeding with limited features", e);
      } finally {
        setIsDbReady(true);
        // Call the global function to hide loader
        if (typeof (window as any).hideAppLoader === 'function') {
          (window as any).hideAppLoader();
        }
      }

      // Geolocation with timeout to prevent hanging
      if (!settings.location || !settings.location.isManual) {
        const geoOptions = { timeout: 8000, maximumAge: 60000 };
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updateLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              name: "Current Location",
              isManual: false
            });
          },
          () => {
            if (!settings.location) {
              updateLocation({ lat: 21.4225, lng: 39.8262, name: "Mecca", isManual: false });
            }
          },
          geoOptions
        );
      }
    };

    initApp();
  }, []);

  // Sync Prayer Times for the Adhan Monitor
  useEffect(() => {
    if (location && isDbReady) {
      fetchPrayerTimes(location.lat, location.lng, settings.adhan.method, settings.adhan.school)
        .then(data => setCurrentPrayerTimes(data.times))
        .catch(err => console.error("Could not sync prayer times for monitor", err));
    }
  }, [location, settings.adhan.method, settings.adhan.school, isDbReady]);

  // AUTOMATIC ADHAN MONITOR
  useEffect(() => {
    if (!currentPrayerTimes || !isAudioUnlocked) return;

    const checkAdhan = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentTimeStr = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
      
      const prayersToCheck = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      
      for (const pName of prayersToCheck) {
        const pTime = (currentPrayerTimes as any)[pName];
        if (pTime === currentTimeStr && lastAdhanTriggered.current !== `${pName}_${currentTimeStr}`) {
          if (settings.adhan.notifications[pName]) {
            triggerAdhan(pName, currentTimeStr);
          }
        }
      }
    };

    const triggerAdhan = async (pName: string, timeStr: string) => {
      lastAdhanTriggered.current = `${pName}_${timeStr}`;
      
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Time for ${pName}`, {
          body: `It is currently ${timeStr}. Calling the Adhan.`,
          icon: '/favicon.ico'
        });
      }

      if (adhanAudioRef.current) {
        try {
          const blob = await db.getAdhanAudio(settings.adhan.voiceId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            adhanAudioRef.current.src = url;
          } else {
            const voice = ADHAN_OPTIONS.find(v => v.id === settings.adhan.voiceId) || ADHAN_OPTIONS[0];
            adhanAudioRef.current.src = voice.url;
          }
          adhanAudioRef.current.load();
          await adhanAudioRef.current.play();
        } catch (e) {
          console.error("Adhan Playback Error", e);
        }
      }
    };

    const interval = setInterval(checkAdhan, 30000); 
    return () => clearInterval(interval);
  }, [currentPrayerTimes, isAudioUnlocked, settings.adhan]);

  const unlockAudio = () => {
    // Immediate dismissal to ensure UI doesn't hang
    setIsAudioUnlocked(true);
    
    // Request notification permission if available
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Try to "ping" the audio context to unlock it
    if (adhanAudioRef.current) {
      // Use a very short silent blob if needed, but usually play/pause on current state is enough
      adhanAudioRef.current.play().then(() => {
        setTimeout(() => {
          if (adhanAudioRef.current) adhanAudioRef.current.pause();
        }, 100);
      }).catch((e) => {
        console.warn("Audio Context Unlock Ping failed (this is expected in some environments)", e);
      });
    }
  };

  const updateLocation = (newLoc: LocationData) => {
    const newSettings = { ...settings, location: newLoc };
    setSettings(newSettings);
    localStorage.setItem('noor_settings', JSON.stringify(newSettings));
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('noor_settings', JSON.stringify(newSettings));
  };

  if (!isDbReady) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6f4] max-w-lg mx-auto shadow-2xl relative overflow-hidden">
      <audio ref={adhanAudioRef} className="hidden" />

      {/* Unlock Overlay */}
      {!isAudioUnlocked && (
        <div className="fixed inset-0 z-[2000] bg-[#064e3b] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/islamic-art.png')` }} />
            
            <div className="relative z-10 w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
               <Volume2 size={40} className="text-emerald-400" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-tighter mb-4">Enable Automatic Adhan</h2>
              <p className="text-emerald-100/60 text-sm font-medium leading-relaxed mb-10 px-4">
                  To allow Noor to call the Adhan at prayer times, we need your permission to start the audio engine.
              </p>
              
              <button 
                onClick={unlockAudio}
                className="w-full bg-emerald-500 text-emerald-950 py-6 px-12 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-400"
              >
                  Bismillah
              </button>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-widest">
                 <ShieldAlert size={12} />
                 <span>Keep this tab open to receive alerts</span>
              </div>
            </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-28 no-scrollbar relative z-10">
        {activeSection === AppSection.Home && <Home onNavigate={setActiveSection} location={location} adhanSettings={settings.adhan} />}
        {activeSection === AppSection.Quran && <Quran settings={settings.quran} onUpdateSettings={(s) => handleSaveSettings({...settings, quran: s})} />}
        {activeSection === AppSection.Tasbih && <Tasbih />}
        {activeSection === AppSection.Adhan && <Adhan location={location} settings={settings.adhan} onUpdateSettings={(s) => handleSaveSettings({...settings, adhan: s})} onUpdateLocation={updateLocation} />}
        {activeSection === AppSection.Calendar && <Calendar location={location} />}
        {activeSection === AppSection.Dua && <DuaView onRecite={() => setActiveSection(AppSection.Tasbih)} />}
        {activeSection === AppSection.Qiblah && <Qiblah location={location} />}
        {activeSection === AppSection.Explore && <Explore location={location} />}
        {activeSection === AppSection.Settings && <SettingsView settings={settings} onSave={handleSaveSettings} />}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-sm pointer-events-none">
        <nav className="glass-nav flex justify-between items-center h-20 w-full px-2 rounded-[2.5rem] shadow-2xl pointer-events-auto">
            <NavItem icon={<HomeIcon size={20} />} label="Home" active={activeSection === AppSection.Home} onClick={() => setActiveSection(AppSection.Home)} />
            <NavItem icon={<BookOpen size={20} />} label="Quran" active={activeSection === AppSection.Quran} onClick={() => setActiveSection(AppSection.Quran)} />
            <NavItem icon={<CircleDot size={20} />} label="Dhikr" active={activeSection === AppSection.Tasbih} onClick={() => setActiveSection(AppSection.Tasbih)} />
            <NavItem icon={<Heart size={20} />} label="Dua" active={activeSection === AppSection.Dua} onClick={() => setActiveSection(AppSection.Dua)} />
            <NavItem icon={<SettingsIcon size={20} />} label="Settings" active={activeSection === AppSection.Settings} onClick={() => setActiveSection(AppSection.Settings)} />
        </nav>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all flex-1 h-full ${active ? 'text-emerald-800' : 'text-slate-400'}`}>
    <div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-emerald-100/80 shadow-sm scale-110' : 'hover:bg-slate-50'}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 transition-all ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-75 h-0 overflow-hidden'}`}>{label}</span>
  </button>
);

export default App;