
import { Surah, Ayah, PrayerTimes } from '../types';

const DB_NAME = 'NoorOfflineDB';
const DB_VERSION = 2;

export class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          console.log("Upgrading IndexedDB to version", DB_VERSION);
          
          if (!db.objectStoreNames.contains('surahs')) {
            db.createObjectStore('surahs', { keyPath: 'number' });
          }
          if (!db.objectStoreNames.contains('ayahs')) {
            db.createObjectStore('ayahs', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('prayerTimes')) {
            db.createObjectStore('prayerTimes', { keyPath: 'date' });
          }
          if (!db.objectStoreNames.contains('adhanAudios')) {
            db.createObjectStore('adhanAudios', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log("IndexedDB initialized successfully");
          resolve();
        };

        request.onerror = (e) => {
          console.error("IndexedDB initialization error:", e);
          reject('Failed to open IndexedDB. This might happen in private browsing mode.');
        };
      } catch (err) {
        console.error("IndexedDB catch-all error:", err);
        reject('IndexedDB is not supported in this browser environment.');
      }
    });
  }

  // Adhan Storage
  async saveAdhanAudio(id: string, audioBlob: Blob): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('adhanAudios', 'readwrite');
      const store = tx.objectStore('adhanAudios');
      const request = store.put({ id, audioBlob });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAdhanAudio(id: string): Promise<Blob | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db!.transaction('adhanAudios', 'readonly');
      const store = tx.objectStore('adhanAudios');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.audioBlob || null);
      request.onerror = () => resolve(null);
    });
  }

  async deleteAdhanAudio(id: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction('adhanAudios', 'readwrite');
      const store = tx.objectStore('adhanAudios');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async getAllDownloadedAdhanIds(): Promise<string[]> {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const tx = this.db!.transaction('adhanAudios', 'readonly');
      const store = tx.objectStore('adhanAudios');
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => resolve([]);
    });
  }

  // Surahs
  async saveSurahs(surahs: Surah[]): Promise<void> {
    if (!this.db) return;
    const tx = this.db!.transaction('surahs', 'readwrite');
    const store = tx.objectStore('surahs');
    surahs.forEach(s => store.put(s));
    return new Promise(resolve => tx.oncomplete = () => resolve());
  }

  async getSurahs(): Promise<Surah[]> {
    if (!this.db) return [];
    const tx = this.db!.transaction('surahs', 'readonly');
    const store = tx.objectStore('surahs');
    const request = store.getAll();
    return new Promise(resolve => request.onsuccess = () => resolve(request.result));
  }

  // Ayahs (Surah content)
  async saveSurahContent(surahNumber: number, ayahs: Ayah[]): Promise<void> {
    if (!this.db) return;
    const tx = this.db!.transaction(['ayahs', 'surahs'], 'readwrite');
    const ayahStore = tx.objectStore('ayahs');
    const surahStore = tx.objectStore('surahs');

    ayahs.forEach(a => ayahStore.put({ ...a, id: `${surahNumber}_${a.numberInSurah}`, surahNumber }));
    
    const surahReq = surahStore.get(surahNumber);
    surahReq.onsuccess = () => {
      if (surahReq.result) {
        surahStore.put({ ...surahReq.result, isDownloaded: true });
      }
    };

    return new Promise(resolve => tx.oncomplete = () => resolve());
  }

  async getSurahContent(surahNumber: number): Promise<Ayah[]> {
    if (!this.db) return [];
    const tx = this.db!.transaction('ayahs', 'readonly');
    const store = tx.objectStore('ayahs');
    const request = store.getAll();
    return new Promise(resolve => request.onsuccess = () => {
      const filtered = request.result.filter((a: any) => a.surahNumber === surahNumber);
      resolve(filtered);
    });
  }

  async removeSurahContent(surahNumber: number): Promise<void> {
    if (!this.db) return;
    const tx = this.db!.transaction(['ayahs', 'surahs'], 'readwrite');
    const ayahStore = tx.objectStore('ayahs');
    const surahStore = tx.objectStore('surahs');

    const request = ayahStore.getAll();
    request.onsuccess = () => {
      request.result.forEach((a: any) => {
        if (a.surahNumber === surahNumber) ayahStore.delete(a.id);
      });
    };

    const surahReq = surahStore.get(surahNumber);
    surahReq.onsuccess = () => {
      if (surahReq.result) {
        surahStore.put({ ...surahReq.result, isDownloaded: false });
      }
    };

    return new Promise(resolve => tx.oncomplete = () => resolve());
  }

  async saveMonthlyPrayer(date: string, times: PrayerTimes): Promise<void> {
    if (!this.db) return;
    const tx = this.db!.transaction('prayerTimes', 'readwrite');
    tx.objectStore('prayerTimes').put({ date, times });
  }

  async getPrayerTimes(date: string): Promise<PrayerTimes | null> {
    if (!this.db) return null;
    const tx = this.db!.transaction('prayerTimes', 'readonly');
    const request = tx.objectStore('prayerTimes').get(date);
    return new Promise(resolve => request.onsuccess = () => resolve(request.result?.times || null));
  }
}

export const db = new LocalDB();
