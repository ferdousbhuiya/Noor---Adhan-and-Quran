
import { Surah, Ayah, PrayerTimes } from '../types';
import { db } from './db';
import { GoogleGenAI, Type } from "@google/genai";

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const PRAYER_API_BASE = 'https://api.aladhan.com/v1';

/**
 * Utility to safely extract and parse JSON from AI response
 */
const safeParseJSON = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error", e, text);
    throw new Error("Invalid AI response format from server.");
  }
};

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

export const fetchLocationSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  try {
    // Instantiate right before use to ensure updated key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 5 real-world cities or locations matching "${query}". Include the country name for clarity. Return only as a JSON string array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return safeParseJSON(response.text);
  } catch (e: any) {
    if (e.message?.includes("not found")) {
      // Trigger re-selection if key is missing or invalid
      if (window.aistudio?.openSelectKey) window.aistudio.openSelectKey();
    }
    throw e;
  }
};

export const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number, name: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the precise coordinates (latitude, longitude) and official full name for the location: "${address}". Return the data as a JSON object with properties 'lat', 'lng', and 'name'.`,
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
  
  return safeParseJSON(response.text);
};

export const fetchHijriCalendar = async (year: number, month: number, lat: number, lng: number): Promise<any[]> => {
  const url = `${PRAYER_API_BASE}/calendar?latitude=${lat}&longitude=${lng}&method=4&month=${month}&year=${year}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : Object.values(data.data || {});
  } catch (e) {
    console.error("fetchHijriCalendar failed:", e);
    return [];
  }
};

export const fetchPrayerTimes = async (
  latitude: number, 
  longitude: number, 
  method: number = 4, 
  school: number = 0,
  fajrAngle?: number,
  ishaAngle?: number
): Promise<{ times: PrayerTimes; hijriDate: string; hijriArabic: string; locationName: string; rawHijri: any }> => {
  const dateStr = new Date().toISOString().split('T')[0];
  let url = `${PRAYER_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;
  
  if (fajrAngle || ishaAngle) {
    url += `&methodSettings=${fajrAngle || 'null'},null,${ishaAngle || 'null'}`;
  }

  const cacheKey = `${dateStr}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const timings = data.data.timings;
    const hijri = data.data.date.hijri;
    
    return {
      times: timings,
      hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`,
      hijriArabic: `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`,
      locationName: data.data.meta.timezone,
      rawHijri: hijri
    };
  } catch (e) {
    const localTimes = await db.getPrayerTimes(cacheKey);
    if (localTimes) return { times: localTimes, hijriDate: 'Offline Mode', hijriArabic: '', locationName: '', rawHijri: null };
    throw e;
  }
};
