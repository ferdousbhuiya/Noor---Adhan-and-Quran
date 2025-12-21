
import React, { useState, useEffect } from 'react';
import { AppSection, AppSettings } from './types';
import Home from './components/Home';
import Quran from './components/Quran';
import Tasbih from './components/Tasbih';
import Adhan from './components/Adhan';
import Calendar from './components/Calendar';
import DuaView from './components/Dua';
import Qiblah from './components/Qiblah';
import Explore from './components/Explore';
import SettingsView from './components/Settings';
import { Home as HomeIcon, BookOpen, Clock, Heart, CircleDot, Settings as SettingsIcon, Compass, Search } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  quran: {
    fontSize: 24,
    fontFamily: 'Amiri',
    translationId: 'en.sahih',
    reciterId: 'ar.alafasy',
    continuousPlay: true
  },
  adhan: {
    voiceId: 'makkah',
    styleId: 'full',
    method: 2,
    school: 0,
    notifications: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }
  },
  tasbihTarget: 33
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.Home);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('noor_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Track if we are reciting a specific Dua in the Tasbih screen
  const [dhikrSession, setDhikrSession] = useState<{ title: string, text?: string, target: number, image?: string } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Geolocation failed", err)
    );
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('noor_settings', JSON.stringify(newSettings));
  };

  const startDhikrSession = (dua: { title: string, text?: string, target: number, image?: string }) => {
    setDhikrSession(dua);
    setActiveSection(AppSection.Tasbih);
  };

  const clearDhikrSession = () => {
    setDhikrSession(null);
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.Home:
        return <Home onNavigate={setActiveSection} location={location} />;
      case AppSection.Quran:
        return <Quran settings={settings.quran} />;
      case AppSection.Tasbih:
        return <Tasbih 
          target={dhikrSession ? dhikrSession.target : settings.tasbihTarget} 
          session={dhikrSession}
          onClearSession={clearDhikrSession}
        />;
      case AppSection.Adhan:
        return <Adhan location={location} settings={settings.adhan} />;
      case AppSection.Calendar:
        return <Calendar />;
      case AppSection.Dua:
        return <DuaView onRecite={startDhikrSession} />;
      case AppSection.Qiblah:
        return <Qiblah location={location} />;
      case AppSection.Explore:
        return <Explore location={location} />;
      case AppSection.Settings:
        return <SettingsView settings={settings} onSave={handleSaveSettings} />;
      default:
        return <Home onNavigate={setActiveSection} location={location} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6f4] max-w-lg mx-auto shadow-2xl relative overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {renderSection()}
      </main>

      {/* Modern Floating Glass Navigation */}
      <div className="fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <nav className="glass-nav flex justify-around items-center h-18 w-full max-w-sm px-4 rounded-[2.5rem] border border-white/40 shadow-2xl pointer-events-auto overflow-x-auto no-scrollbar py-2">
            <NavItem icon={<HomeIcon size={18} />} label="Home" active={activeSection === AppSection.Home} onClick={() => setActiveSection(AppSection.Home)} />
            <NavItem icon={<BookOpen size={18} />} label="Quran" active={activeSection === AppSection.Quran} onClick={() => setActiveSection(AppSection.Quran)} />
            <NavItem icon={<CircleDot size={18} />} label="Dhikr" active={activeSection === AppSection.Tasbih} onClick={() => setActiveSection(AppSection.Tasbih)} />
            <NavItem icon={<Heart size={18} />} label="Dua" active={activeSection === AppSection.Dua} onClick={() => setActiveSection(AppSection.Dua)} />
            <NavItem icon={<Search size={18} />} label="Explore" active={activeSection === AppSection.Explore} onClick={() => setActiveSection(AppSection.Explore)} />
            <NavItem icon={<Compass size={18} />} label="Qiblah" active={activeSection === AppSection.Qiblah} onClick={() => setActiveSection(AppSection.Qiblah)} />
            <NavItem icon={<SettingsIcon size={18} />} label="Menu" active={activeSection === AppSection.Settings} onClick={() => setActiveSection(AppSection.Settings)} />
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
  <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 transition-all flex-1 min-w-[50px] ${active ? 'text-emerald-800 scale-110' : 'text-slate-400 hover:text-emerald-600'}`}>
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-emerald-100 shadow-sm' : ''}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
  </button>
);

export default App;
