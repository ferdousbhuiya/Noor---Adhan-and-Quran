
import { Surah, Ayah, PrayerTimes } from '../types';
import { db } from './db';

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const PRAYER_API_BASE = 'https://api.aladhan.com/v1';

export const fetchSurahs = async (): Promise<Surah[]> => {
  // Check DB first
  const localSurahs = await db.getSurahs();
  if (localSurahs.length > 0) return localSurahs;

  try {
    const res = await fetch(`${QURAN_API_BASE}/surah`);
    const data = await res.json();
    await db.saveSurahs(data.data);
    return data.data;
  } catch (e) {
    return localSurahs;
  }
};

export const fetchSurahAyahs = async (surahNumber: number, reciter: string = 'ar.alafasy', translation: string = 'en.sahih'): Promise<Ayah[]> => {
  // Check if downloaded
  const localAyahs = await db.getSurahContent(surahNumber);
  if (localAyahs.length > 0) return localAyahs;

  const [arabicRes, transRes] = await Promise.all([
    fetch(`${QURAN_API_BASE}/surah/${surahNumber}/${reciter}`),
    fetch(`${QURAN_API_BASE}/surah/${surahNumber}/${translation}`)
  ]);
  
  const arabicData = await arabicRes.json();
  const transData = await transRes.json();

  return arabicData.data.ayahs.map((ayah: any, index: number) => ({
    ...ayah,
    translation: transData.data.ayahs[index].text
  }));
};

export const fetchPrayerTimes = async (latitude: number, longitude: number, method: number = 2, school: number = 0): Promise<{ times: PrayerTimes; hijriDate: string }> => {
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Try local cache first
  const localTimes = await db.getPrayerTimes(dateStr);
  
  try {
    const res = await fetch(`${PRAYER_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`);
    const data = await res.json();
    const timings = data.data.timings;
    const hijri = data.data.date.hijri;
    
    // Background save
    db.saveMonthlyPrayer(dateStr, timings);
    
    return {
      times: timings,
      hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`
    };
  } catch (e) {
    if (localTimes) return { times: localTimes, hijriDate: 'Offline Mode' };
    throw e;
  }
};
