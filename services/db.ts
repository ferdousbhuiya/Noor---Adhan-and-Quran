
import { Surah, Ayah, PrayerTimes } from '../types';

const DB_NAME = 'NoorOfflineDB';
const DB_VERSION = 1;

export class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('surahs')) {
          db.createObjectStore('surahs', { keyPath: 'number' });
        }
        if (!db.objectStoreNames.contains('ayahs')) {
          db.createObjectStore('ayahs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prayerTimes')) {
          db.createObjectStore('prayerTimes', { keyPath: 'date' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject('Failed to open IndexedDB');
    });
  }

  // Surahs
  async saveSurahs(surahs: Surah[]): Promise<void> {
    const tx = this.db!.transaction('surahs', 'readwrite');
    const store = tx.objectStore('surahs');
    surahs.forEach(s => store.put(s));
    return new Promise(resolve => tx.oncomplete = () => resolve());
  }

  async getSurahs(): Promise<Surah[]> {
    const tx = this.db!.transaction('surahs', 'readonly');
    const store = tx.objectStore('surahs');
    const request = store.getAll();
    return new Promise(resolve => request.onsuccess = () => resolve(request.result));
  }

  // Ayahs (Surah content)
  async saveSurahContent(surahNumber: number, ayahs: Ayah[]): Promise<void> {
    const tx = this.db!.transaction(['ayahs', 'surahs'], 'readwrite');
    const ayahStore = tx.objectStore('ayahs');
    const surahStore = tx.objectStore('surahs');

    ayahs.forEach(a => ayahStore.put({ ...a, id: `${surahNumber}_${a.numberInSurah}`, surahNumber }));
    
    // Mark surah as downloaded
    const surahReq = surahStore.get(surahNumber);
    surahReq.onsuccess = () => {
      if (surahReq.result) {
        surahStore.put({ ...surahReq.result, isDownloaded: true });
      }
    };

    return new Promise(resolve => tx.oncomplete = () => resolve());
  }

  async getSurahContent(surahNumber: number): Promise<Ayah[]> {
    const tx = this.db!.transaction('ayahs', 'readonly');
    const store = tx.objectStore('ayahs');
    const request = store.getAll();
    return new Promise(resolve => request.onsuccess = () => {
      const filtered = request.result.filter((a: any) => a.surahNumber === surahNumber);
      resolve(filtered);
    });
  }

  async removeSurahContent(surahNumber: number): Promise<void> {
    const tx = this.db!.transaction(['ayahs', 'surahs'], 'readwrite');
    const ayahStore = tx.objectStore('ayahs');
    const surahStore = tx.objectStore('surahs');

    // Remove Ayahs
    const request = ayahStore.getAll();
    request.onsuccess = () => {
      request.result.forEach((a: any) => {
        if (a.surahNumber === surahNumber) ayahStore.delete(a.id);
      });
    };

    // Mark surah as NOT downloaded
    const surahReq = surahStore.get(surahNumber);
    surahReq.onsuccess = () => {
      if (surahReq.result) {
        surahStore.put({ ...surahReq.result, isDownloaded: false });
      }
    };

    return new Promise(resolve => tx.oncomplete = () => resolve());
  }

  // Prayer Times Caching
  async saveMonthlyPrayer(date: string, times: PrayerTimes): Promise<void> {
    const tx = this.db!.transaction('prayerTimes', 'readwrite');
    tx.objectStore('prayerTimes').put({ date, times });
  }

  async getPrayerTimes(date: string): Promise<PrayerTimes | null> {
    const tx = this.db!.transaction('prayerTimes', 'readonly');
    const request = tx.objectStore('prayerTimes').get(date);
    return new Promise(resolve => request.onsuccess = () => resolve(request.result?.times || null));
  }
}

export const db = new LocalDB();
