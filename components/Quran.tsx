
import React, { useState, useEffect, useRef } from 'react';
import { Surah, Ayah, QuranSettings, Bookmark } from '../types';
import { fetchSurahs, fetchSurahAyahs } from '../services/api';
import { db } from '../services/db';
import { ChevronLeft, Play, Pause, Bookmark as BookmarkIcon, Trash2, X, ChevronRight, Download, CheckCircle, Loader2, Languages, Volume2 } from 'lucide-react';

interface QuranProps {
  settings: QuranSettings;
  onUpdateSettings?: (s: QuranSettings) => void;
}

const BASMALA_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

const Quran: React.FC<QuranProps> = ({ settings, onUpdateSettings }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('noor_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingScrollTo, setPendingScrollTo] = useState<number | null>(null);

  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchSurahs().then(setSurahs);
  }, []);

  useEffect(() => {
    if (selectedSurah) {
      setLoading(true);
      ayahRefs.current = {}; 
      fetchSurahAyahs(selectedSurah.number, settings.reciterId, settings.translationId).then(data => {
        setAyahs(data);
        setLoading(false);
      });
    }
  }, [selectedSurah, settings.reciterId, settings.translationId]);

  // Auto-scroll logic when playingIndex changes
  useEffect(() => {
    if (playingIndex !== null) {
      const ayahNumber = ayahs[playingIndex]?.numberInSurah;
      const element = ayahRefs.current[ayahNumber];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingIndex, ayahs]);

  useEffect(() => {
    if (!loading && ayahs.length > 0 && pendingScrollTo !== null) {
      const scrollTimer = setTimeout(() => {
        const element = ayahRefs.current[pendingScrollTo];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.transition = 'background-color 0.5s ease';
          element.style.backgroundColor = '#ecfdf5';
          setTimeout(() => {
            element.style.backgroundColor = 'white';
          }, 2000);
          setPendingScrollTo(null);
        }
      }, 500); 
      return () => clearTimeout(scrollTimer);
    }
  }, [ayahs, loading, pendingScrollTo]);

  useEffect(() => {
    localStorage.setItem('noor_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleTranslation = () => {
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings, showTranslation: !settings.showTranslation });
    }
  };

  const handleDownload = async (e: React.MouseEvent, surah: Surah) => {
    e.stopPropagation();
    if (surah.isDownloaded) {
      if (confirm(`Remove ${surah.englishName} from offline storage?`)) {
        await db.removeSurahContent(surah.number);
        setSurahs(surahs.map(s => s.number === surah.number ? { ...s, isDownloaded: false } : s));
      }
      return;
    }

    setDownloading(surah.number);
    try {
      const content = await fetchSurahAyahs(surah.number, settings.reciterId, settings.translationId);
      await db.saveSurahContent(surah.number, content);
      setSurahs(surahs.map(s => s.number === surah.number ? { ...s, isDownloaded: true } : s));
    } catch (e) {
      alert("Download failed. Check your connection.");
    } finally {
      setDownloading(null);
    }
  };

  const isBookmarked = (ayahNumber: number) => {
    return bookmarks.some(b => b.surahNumber === selectedSurah?.number && b.ayahNumber === ayahNumber);
  };

  const toggleBookmark = (ayah: Ayah) => {
    if (!selectedSurah) return;
    const existing = bookmarks.findIndex(b => b.surahNumber === selectedSurah.number && b.ayahNumber === ayah.numberInSurah);
    
    if (existing !== -1) {
      setBookmarks(bookmarks.filter((_, i) => i !== existing));
    } else {
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        surahNumber: selectedSurah.number,
        surahName: selectedSurah.englishName,
        ayahNumber: ayah.numberInSurah,
        timestamp: Date.now()
      };
      setBookmarks([newBookmark, ...bookmarks]);
    }
  };

  const jumpToBookmark = (b: Bookmark) => {
    const surah = surahs.find(s => s.number === b.surahNumber);
    if (surah) {
      setPendingScrollTo(b.ayahNumber);
      setSelectedSurah(surah);
      setShowBookmarks(false);
    }
  };

  const handlePlayAyah = (index: number) => {
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      setPlayingIndex(index);
      if (audioRef.current) {
        audioRef.current.src = ayahs[index].audio;
        audioRef.current.play();
      }
    }
  };

  const handleAudioEnded = () => {
    if (settings.continuousPlay && playingIndex !== null && playingIndex < ayahs.length - 1) {
      handlePlayAyah(playingIndex + 1);
    } else {
      setPlayingIndex(null);
    }
  };

  const nextSurah = () => {
    if (selectedSurah && selectedSurah.number < 114) {
      const nextS = surahs.find(s => s.number === selectedSurah.number + 1);
      if (nextS) {
        setSelectedSurah(nextS);
        window.scrollTo(0,0);
      }
    }
  };

  const getCleanedAyahText = (ayah: Ayah, surahNumber: number) => {
    if (ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
      const text = ayah.text.trim();
      const words = text.split(/\s+/);
      if (words.length >= 4 && words[0].includes('بِسْمِ')) {
        return words.slice(4).join(' ').trim();
      }
    }
    return ayah.text;
  };

  if (selectedSurah) {
    return (
      <div className="bg-[#f8f6f0] min-h-screen flex flex-col pb-10">
        <header className="sticky top-0 bg-emerald-950 text-white p-5 flex items-center justify-between shadow-2xl z-20 rounded-b-[2.5rem]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedSurah(null)} className="p-2 bg-white/10 rounded-2xl active:scale-90 transition-all"><ChevronLeft size={20} /></button>
            <div className="max-w-[120px]">
              <h2 className="font-black text-xl tracking-tight truncate">{selectedSurah.englishName}</h2>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] truncate">{selectedSurah.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTranslation}
              className={`p-3 rounded-2xl transition-all border border-white/10 flex items-center gap-2 ${settings.showTranslation ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-emerald-400'}`}
              title="Toggle Translation"
            >
              <Languages size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Translate</span>
            </button>
            <button onClick={() => setShowBookmarks(true)} className="p-3 bg-white/10 rounded-2xl active:scale-90 transition-all border border-white/5 relative">
              <BookmarkIcon size={18} />
              {bookmarks.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-emerald-950" />}
            </button>
          </div>
        </header>

        <div className="flex-1 p-5 space-y-8 max-w-lg mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-6">
               <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center shadow-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800"></div>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900">Fetching Ayahs...</p>
            </div>
          ) : (
            <>
              {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
                <div className="py-10 text-center animate-in fade-in zoom-in duration-700">
                  <p className="arabic-text text-4xl text-emerald-900/80 font-bold" style={{ fontFamily: settings.fontFamily }}>
                    {BASMALA_TEXT}
                  </p>
                  <div className="flex justify-center mt-6">
                     <div className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                  </div>
                </div>
              )}

              {ayahs.map((ayah, idx) => {
                const cleanedText = getCleanedAyahText(ayah, selectedSurah.number);
                const bookmarked = isBookmarked(ayah.numberInSurah);
                const isPlaying = playingIndex === idx;
                
                return (
                  <div 
                    key={`${selectedSurah.number}_${ayah.numberInSurah}`} 
                    ref={el => { ayahRefs.current[ayah.numberInSurah] = el; }}
                    className={`p-7 rounded-[3rem] transition-all duration-500 border ${isPlaying ? 'bg-emerald-50 border-emerald-300 shadow-2xl scale-[1.02] ring-4 ring-emerald-500/10' : 'bg-white border-white/50 shadow-premium'} ${bookmarked ? 'border-amber-200' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-black shadow-lg transition-colors ${isPlaying ? 'bg-emerald-600 text-white' : 'bg-emerald-900 text-white'}`}>
                          {ayah.numberInSurah}
                        </div>
                        <button onClick={() => toggleBookmark(ayah)} className={`${bookmarked ? 'text-amber-500' : 'text-slate-200'} transition-all p-2 hover:scale-110 active:scale-95`}>
                          <BookmarkIcon size={18} fill={bookmarked ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <button onClick={() => handlePlayAyah(idx)} className={`p-4 rounded-2xl transition-all active:scale-90 border flex items-center gap-2 ${isPlaying ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-emerald-50 text-emerald-800 border-emerald-100/50'}`}>
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        {isPlaying && <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Playing</span>}
                      </button>
                    </div>
                    <p className="arabic-text text-right mb-6 leading-[2.6] font-bold text-slate-900 transition-all" style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}>
                      {cleanedText}
                    </p>
                    {settings.showTranslation && (
                      <div className="text-slate-500 text-sm font-medium leading-relaxed italic border-t border-slate-50 pt-6 animate-in slide-in-from-top-2 duration-300">
                        {ayah.translation}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {selectedSurah.number < 114 && (
                <button 
                  onClick={nextSurah}
                  className="w-full bg-emerald-950 text-white p-8 rounded-[3.5rem] flex items-center justify-between group active:scale-[0.98] transition-all shadow-2xl shadow-emerald-950/40 relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent" />
                   <div className="relative z-10 text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Continue Journey</p>
                      <h4 className="font-black text-2xl tracking-tight">{surahs.find(s => s.number === selectedSurah.number + 1)?.englishName}</h4>
                   </div>
                   <div className="relative z-10 bg-white/10 p-5 rounded-3xl group-hover:bg-white/20 transition-all group-hover:translate-x-1">
                      <ChevronRight size={28} />
                   </div>
                </button>
              )}
            </>
          )}
        </div>
        <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

        {showBookmarks && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center" onClick={() => setShowBookmarks(false)}>
            <div className="bg-[#f8f6f0] w-full max-w-lg rounded-t-[4rem] p-10 h-[75vh] flex flex-col shadow-2xl border-t border-white/20" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter">Bookmarks</h3>
                <button onClick={() => setShowBookmarks(false)} className="p-3 bg-white rounded-full shadow-sm"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pb-10 no-scrollbar">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Your journey starts here</p>
                  </div>
                ) : bookmarks.map(b => (
                  <div key={b.id} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border border-white/50 shadow-premium hover:border-emerald-200 active:scale-95 transition-all">
                    <button onClick={() => jumpToBookmark(b)} className="flex-1 text-left">
                      <h4 className="font-black text-slate-800 tracking-tight">{b.surahName}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ayah {b.ayahNumber} • {new Date(b.timestamp).toLocaleDateString()}</p>
                    </button>
                    <button onClick={() => setBookmarks(bookmarks.filter(x => x.id !== b.id))} className="text-rose-300 p-3 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#f2f6f4] min-h-screen pb-32">
      <div className="flex justify-between items-center mb-10 px-2">
         <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Holy Quran</h1>
         <button onClick={() => setShowBookmarks(true)} className="p-4 bg-white text-emerald-900 rounded-[1.8rem] shadow-premium relative border border-white/50 group active:scale-90 transition-all">
            <BookmarkIcon size={24} />
            {bookmarks.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white text-[11px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-lg">{bookmarks.length}</span>}
         </button>
      </div>

      <div className="space-y-4 px-1 pb-20">
        {surahs.map((surah) => {
          const surahBookmarks = bookmarks.filter(b => b.surahNumber === surah.number).length;
          return (
            <button key={surah.number} onClick={() => setSelectedSurah(surah)} className="w-full bg-white p-4 sm:p-6 rounded-[2.8rem] border border-white/50 shadow-premium flex items-center gap-3 sm:gap-5 text-left active:scale-[0.97] transition-all group hover:border-emerald-100 overflow-hidden">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center font-black text-base sm:text-lg shadow-inner transition-all ${surah.isDownloaded ? 'bg-emerald-900 text-white' : 'bg-emerald-50 text-emerald-800'}`}>
                {surah.number}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 tracking-tight text-base sm:text-lg truncate mb-0.5 sm:mb-1">{surah.englishName}</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">{surah.englishNameTranslation}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="text-right flex flex-col items-end">
                  <p className="arabic-text font-black text-xl sm:text-2xl text-emerald-950 leading-none mb-1">{surah.name}</p>
                  {surahBookmarks > 0 && <span className="text-[7px] sm:text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm whitespace-nowrap">{surahBookmarks} SAVED</span>}
                </div>
                <button 
                  onClick={(e) => handleDownload(e, surah)}
                  className={`p-2 rounded-xl transition-all ${surah.isDownloaded ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 bg-slate-50'}`}
                >
                  {downloading === surah.number ? <Loader2 size={16} className="animate-spin" /> : surah.isDownloaded ? <CheckCircle size={16} /> : <Download size={16} />}
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Quran;
