
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  isDownloaded?: boolean;
}

export interface Ayah {
  id?: string;
  number: number;
  audio: string;
  text: string;
  numberInSurah: number;
  juz: number;
  translation?: string;
  surahNumber?: number;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export type QuranFont = 'Amiri' | 'Lateef' | 'Scheherazade New' | 'System';

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export interface DhikrItem {
  id: string;
  title: string;
  arabicText: string;
  targetCount: number;
  completedCount: number;
  image?: string;
  date: string;
}

export interface Dua {
  id: string;
  title: string;
  arabicText: string;
  translation: string;
  benefit: string;
  targetCount: number;
  currentCount: number;
  image?: string;
}

export interface QuranSettings {
  fontSize: number;
  fontFamily: QuranFont;
  translationId: string;
  reciterId: string;
  continuousPlay: boolean;
  showTranslation: boolean;
}

export interface AdhanSettings {
  voiceId: string;
  styleId: string;
  method: number;
  school: number;
  fajrAngle?: number;
  ishaAngle?: number;
  notifications: Record<string, boolean>;
}

export interface LocationData {
  lat: number;
  lng: number;
  name: string;
  isManual: boolean;
}

export interface AppSettings {
  quran: QuranSettings;
  adhan: AdhanSettings;
  tasbihTarget: number;
  location?: LocationData;
}

export enum AppSection {
  Home = 'home',
  Quran = 'quran',
  Tasbih = 'tasbih',
  Calendar = 'calendar',
  Adhan = 'adhan',
  Dua = 'dua',
  Explore = 'explore',
  Qiblah = 'qiblah',
  Settings = 'settings'
}
