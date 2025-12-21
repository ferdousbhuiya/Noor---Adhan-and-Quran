
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MapPin, Search, Loader2, Navigation, Utensils, Star, ExternalLink, Info } from 'lucide-react';

interface ExploreProps {
  location: { lat: number, lng: number } | null;
}

const Explore: React.FC<ExploreProps> = ({ location }) => {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState<'masjid' | 'halal'>('masjid');

  const fetchNearby = async (type: 'masjid' | 'halal') => {
    if (!location) return;
    setLoading(true);
    setQueryType(type);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = type === 'masjid' 
        ? "Find the 5 closest and best-rated Masjids or Islamic centers near me." 
        : "Find the 5 best-rated and most popular Halal restaurants nearby.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: location.lat,
                longitude: location.lng
              }
            }
          }
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedPlaces = chunks
        .filter((c: any) => c.maps)
        .map((c: any) => ({
          title: c.maps.title,
          uri: c.maps.uri,
          address: c.maps.address || "Near you"
        }));

      setPlaces(extractedPlaces);
    } catch (error) {
      console.error("Explore failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) fetchNearby('masjid');
  }, [location]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-32">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-2">Explore Nearby</h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Find sacred places & halal food</p>
      </header>

      {/* Toggle */}
      <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
         <button 
          onClick={() => fetchNearby('masjid')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${queryType === 'masjid' ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400'}`}
         >
            <Navigation size={16} /> Masjids
         </button>
         <button 
          onClick={() => fetchNearby('halal')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${queryType === 'halal' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400'}`}
         >
            <Utensils size={16} /> Halal Food
         </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 relative">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <div className="absolute inset-0 rounded-full animate-ping bg-emerald-100/50" />
           </div>
           <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Scanning local area...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {places.length === 0 ? (
            <div className="bg-white p-10 rounded-[2.5rem] text-center border border-slate-100">
               <Search size={40} className="mx-auto text-slate-200 mb-4" />
               <p className="text-sm font-bold text-slate-500">No places found in this area.</p>
               <button onClick={() => fetchNearby(queryType)} className="mt-4 text-emerald-600 font-black uppercase text-[10px] tracking-widest">Try Again</button>
            </div>
          ) : (
            places.map((place, idx) => (
              <a 
                key={idx} 
                href={place.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm active:scale-95 transition-all group"
              >
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${queryType === 'masjid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                   {queryType === 'masjid' ? <Navigation size={22} /> : <Utensils size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-black text-slate-800 tracking-tight leading-tight truncate mb-1">{place.title}</h3>
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <MapPin size={10} className="text-rose-500" />
                      <span className="truncate">{place.address}</span>
                   </div>
                </div>
                <div className="text-slate-200 group-hover:text-emerald-500 transition-colors">
                   <ExternalLink size={20} />
                </div>
              </a>
            ))
          )}
        </div>
      )}

      <div className="mt-10 bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100">
         <div className="flex gap-4 items-start">
            <Info className="text-emerald-600 shrink-0" size={20} />
            <div>
               <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                  Results are generated using Google Maps real-time data. Ratings and popularity are factored in for the best recommendations.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Explore;
