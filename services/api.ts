import { Surah, Ayah, PrayerTimes } from '../types';
import { db } from './db';
import { GoogleGenAI, Type } from "@google/genai";

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

export const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number, name: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Resolve this location string into geographical coordinates: "${address}". Return the official city name, latitude, and longitude.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
          name: { type: Type.STRING }
        },
        required: ["lat", "lng", "name"]
      }
    }
  });
  
  return JSON.parse(response.text);
};

export const fetchHijriCalendar = async (year: number, month: number, lat: number, lng: number): Promise<any[]> => {
  // Use /calendar endpoint which is more robust than /gCalendar
  const url = `${PRAYER_API_BASE}/calendar?latitude=${lat}&longitude=${lng}&method=4&month=${month}&year=${year}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    
    // The calendar endpoint returns an array of days for the month
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // Fallback if data structure is unexpected
    if (data.data && typeof data.data === 'object') {
       return Object.keys(data.data)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => data.data[key]);
    }
    
    return [];
  } catch (e) {
    console.error("fetchHijriCalendar failed:", e);
    return [];
  }
};

export const fetchPrayerTimes = async (
  latitude: number, 
  longitude: number, 
  method: number = 4, // Default to Umm al-Qura
  school: number = 0,
  fajrAngle?: number,
  ishaAngle?: number
): Promise<{ times: PrayerTimes; hijriDate: string; hijriArabic: string; locationName: string; rawHijri: any }> => {
  const dateStr = new Date().toISOString().split('T')[0];
  
  let url = `${PRAYER_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;
  
  if (fajrAngle || ishaAngle) {
    const settings = `${fajrAngle || 'null'},null,${ishaAngle || 'null'}`;
    url += `&methodSettings=${settings}`;
  }

  const cacheKey = `${dateStr}_${method}_${school}_${fajrAngle || 0}_${ishaAngle || 0}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
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
      hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`,
      hijriArabic: `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`,
      locationName: data.data.meta.timezone,
      rawHijri: hijri
    };
  } catch (e) {
    if (localTimes) return { times: localTimes, hijriDate: 'Offline Mode', hijriArabic: '', locationName: '', rawHijri: null };
    throw e;
  }
};