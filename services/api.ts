
import { Surah, Ayah, PrayerTimes } from '../types';
import { db } from './db';

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const PRAYER_API_BASE = 'https://api.aladhan.com/v1';

export const fetchSurahs = async (): Promise<Surah[]> => {
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

export const fetchPrayerTimes = async (
  latitude: number, 
  longitude: number, 
  method: number = 2, 
  school: number = 0,
  fajrAngle?: number,
  ishaAngle?: number
): Promise<{ times: PrayerTimes; hijriDate: string }> => {
  const dateStr = new Date().toISOString().split('T')[0];
  
  // Construct URL with custom angles if provided
  let url = `${PRAYER_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;
  
  if (fajrAngle || ishaAngle) {
    // If angles are provided, use method 99 (Custom) or append to existing method
    // Aladhan API allows methodSettings for custom tuning
    const settings = `${fajrAngle || 'null'},null,${ishaAngle || 'null'}`;
    url += `&methodSettings=${settings}`;
  }

  // Use a unique cache key for settings combinations
  const cacheKey = `${dateStr}_${method}_${school}_${fajrAngle || 0}_${ishaAngle || 0}`;
  const localTimes = await db.getPrayerTimes(cacheKey);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.data) throw new Error("Invalid API response");

    const timings = data.data.timings;
    const hijri = data.data.date.hijri;
    
    db.saveMonthlyPrayer(cacheKey, timings);
    
    return {
      times: timings,
      hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`
    };
  } catch (e) {
    if (localTimes) return { times: localTimes, hijriDate: 'Offline Mode' };
    throw e;
  }
};
