
import React, { useState, useEffect } from 'react';
import { AppSection, AppSettings, AdhanSettings, LocationData } from './types.ts';
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
import { Home as HomeIcon, BookOpen, Clock, Heart, CircleDot, Settings as SettingsIcon } from 'lucide-react';

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
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('noor_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const location = settings.location || null;

  useEffect(() => {
    db.init()
      .then(() => console.log("DB Ready"))
      .catch(err => console.error("DB Error", err))
      .finally(() => setIsDbReady(true));

    const timeout = setTimeout(() => setIsDbReady(true), 3000);

    if (!settings.location || !settings.location.isManual) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: LocationData = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: "Current Location",
            isManual: false
          };
          updateLocation(loc);
        },
        (err) => {
          if (!settings.location) {
             updateLocation({ lat: 21.4225, lng: 39.8262, name: "Mecca", isManual: false });
          }
        },
        { timeout: 5000 }
      );
    }
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isDbReady) {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.visibility = 'hidden';
        }, 500);
      }
    }
  }, [isDbReady]);

  const updateLocation = (newLoc: LocationData) => {
    const newSettings = { ...settings, location: newLoc };
    setSettings(newSettings);
    localStorage.setItem('noor_settings', JSON.stringify(newSettings));
  };

  if (!isDbReady) return null;

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('noor_settings', JSON.stringify(newSettings));
  };

  const handleUpdateAdhanSettings = (newAdhanSettings: AdhanSettings) => {
    const newSettings = { ...settings, adhan: newAdhanSettings };
    handleSaveSettings(newSettings);
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.Home:
        return <Home onNavigate={setActiveSection} location={location} adhanSettings={settings.adhan} />;
      case AppSection.Quran:
        return <Quran settings={settings.quran} onUpdateSettings={(s) => handleSaveSettings({...settings, quran: s})} />;
      case AppSection.Tasbih:
        return <Tasbih />;
      case AppSection.Adhan:
        return <Adhan location={location} settings={settings.adhan} onUpdateSettings={handleUpdateAdhanSettings} onUpdateLocation={updateLocation} />;
      case AppSection.Calendar:
        return <Calendar location={location} />;
      case AppSection.Dua:
        return <DuaView onRecite={() => setActiveSection(AppSection.Tasbih)} />;
      case AppSection.Qiblah:
        return <Qiblah location={location} />;
      case AppSection.Explore:
        return <Explore location={location} />;
      case AppSection.Settings:
        return <SettingsView settings={settings} onSave={handleSaveSettings} />;
      default:
        return <Home onNavigate={setActiveSection} location={location} adhanSettings={settings.adhan} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6f4] max-w-lg mx-auto shadow-2xl relative overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        {renderSection()}
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
