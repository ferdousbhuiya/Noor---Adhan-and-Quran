
import { Surah, Ayah, PrayerTimes } from '../types';

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const PRAYER_API_BASE = 'https://api.aladhan.com/v1';

export const fetchSurahs = async (): Promise<Surah[]> => {
  const res = await fetch(`${QURAN_API_BASE}/surah`);
  const data = await res.json();
  return data.data;
};

export const fetchSurahAyahs = async (surahNumber: number, reciter: string = 'ar.alafasy', translation: string = 'en.sahih'): Promise<Ayah[]> => {
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
  const res = await fetch(`${PRAYER_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`);
  const data = await res.json();
  const timings = data.data.timings;
  const hijri = data.data.date.hijri;
  return {
    times: timings,
    hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`
  };
};
