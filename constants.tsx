
export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit Abdus Samad' },
  { id: 'ar.saoodshuraym', name: 'Saood bin Ibrahim Ash-Shuraym' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi' }
];

export const TRANSLATIONS = [
  { id: 'en.sahih', name: 'English (Sahih Intl)' },
  { id: 'bn.bengali', name: 'Bengali (Muhiuddin Khan)' },
  { id: 'ur.jalandhry', name: 'Urdu (Fateh Muhammad Jalandhry)' },
  { id: 'fr.hamidullah', name: 'French (Hamidullah)' }
];

export const ADHAN_STYLES = [
  { id: 'full', name: 'Full Adhan' },
  { id: '1v4', name: '1 Verse 4 Times' },
  { id: '2v2', name: '2 Verses 2 Times' }
];

export const ADHAN_OPTIONS = [
  { 
    id: 'makkah', 
    name: 'Makkah Adhan', 
    muezzin: 'Sheikh Ali Mullah',
    url: 'https://www.islamcan.com/audio/adhan/azan1.mp3'
  },
  { 
    id: 'madinah', 
    name: 'Madinah Adhan', 
    muezzin: 'Sheikh Essam Bukhari',
    url: 'https://www.islamcan.com/audio/adhan/azan2.mp3'
  },
  { 
    id: 'mishary', 
    name: 'Mishary Rashid', 
    muezzin: 'Sheikh Mishary Rashid Alafasy',
    url: 'https://www.islamcan.com/audio/adhan/azan3.mp3'
  },
  { 
    id: 'alaqsa', 
    name: 'Al-Aqsa Adhan', 
    muezzin: 'Al-Aqsa Mosque',
    url: 'https://www.islamcan.com/audio/adhan/azan4.mp3'
  },
  { 
    id: 'egypt', 
    name: 'Egyptian Adhan', 
    muezzin: 'Egyptian Style',
    url: 'https://www.islamcan.com/audio/adhan/azan5.mp3'
  }
];

export const ARABIC_FONTS: { id: string, name: string }[] = [
  { id: 'Amiri', name: 'Classic Amiri' },
  { id: 'Lateef', name: 'Soft Lateef' },
  { id: 'Scheherazade New', name: 'Elegant Scheherazade' },
  { id: 'sans-serif', name: 'Modern System' }
];

export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
  "Jumada al-ula", "Jumada al-akhira", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

export const ISLAMIC_EVENTS = [
  { month: 9, day: 1, name: "Start of Ramadan", color: "bg-emerald-100 text-emerald-700" },
  { month: 10, day: 1, name: "Eid al-Fitr", color: "bg-amber-100 text-amber-700" },
  { month: 12, day: 10, name: "Eid al-Adha", color: "bg-sky-100 text-sky-700" },
  { month: 1, day: 10, name: "Ashura", color: "bg-rose-100 text-rose-700" },
  { month: 7, day: 27, name: "Isra' and Mi'raj", color: "bg-indigo-100 text-indigo-700" }
];

export const PRAYER_METHODS = [
  { id: 1, name: "University of Islamic Sciences, Karachi" },
  { id: 2, name: "Islamic Society of North America (ISNA)" },
  { id: 3, name: "Muslim World League (MWL)" },
  { id: 4, name: "Umm Al-Qura University, Makkah" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 7, name: "Institute of Geophysics, University of Tehran" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura, Singapore" },
  { id: 12, name: "Union Organization islamic de France" }
];

export const PRAYER_SCHOOLS = [
  { id: 0, name: "Shafi (Standard)" },
  { id: 1, name: "Hanafi" }
];
