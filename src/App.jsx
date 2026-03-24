import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Plus, Star, X, Search, 
  Heart, PlayCircle, Sparkles, 
  ChevronRight, ChevronLeft, Home, Compass, Check
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

// --- CLOUD STORAGE & AUTH SETUP ---
const getFirebaseInit = () => {
  try {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
    if (!firebaseConfig) return { app: null, auth: null, db: null, appId: 'local' };
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    return { app, auth, db, appId };
  } catch (e) {
    console.error("Firebase init error:", e);
    return { app: null, auth: null, db: null, appId: 'local' };
  }
};
const { app, auth, db, appId } = getFirebaseInit();

// --- TMDB API CONFIGURATION ---
// ⚠️ VERCEL INSTRUCTION:
// Change the empty string below to: import.meta.env.VITE_TMDB_API_KEY
// (It is left empty here so the preview canvas parser does not crash)
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ""; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const IMG_BASE_SM = "https://image.tmdb.org/t/p/w500";

// --- FALLBACK MOCK DATA ---
const FALLBACK_DATA = {
  trending: [
    { id: 1, title: "Dune: Part Two", backdrop_path: "/8rpDcsfLJypbO6vtecwmH3X32nd.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2TGbiOoAc.jpg", vote_average: 8.3, release_date: "2024-02-27", overview: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family." },
    { id: 2, title: "Poor Things", backdrop_path: "/kCGlIMHnOm8PhbO32yqELfElw0X.jpg", poster_path: "/kCGlIMHnOm8PhbO32yqELfElw0X.jpg", vote_average: 7.9, release_date: "2023-12-07", overview: "Brought back to life by an unorthodox scientist, a young woman runs off with a debauched lawyer on a whirlwind adventure across the continents." },
    { id: 3, title: "Oppenheimer", backdrop_path: "/fm6KqXpk3M2HVveHwCrBRoOoA0i.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", vote_average: 8.1, release_date: "2023-07-19", overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II." },
    { id: 4, title: "Spider-Man: Across the Spider-Verse", backdrop_path: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", vote_average: 8.4, release_date: "2023-05-31", overview: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence." },
    { id: 5, title: "The Batman", backdrop_path: "/b0PlSFdSmBgZZqglk1WpBnd78zE.jpg", poster_path: "/74xTEgt7R36Fpooo50r9T25onhq.jpg", vote_average: 7.7, release_date: "2022-03-01", overview: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler." },
  ],
  action: [
    { id: 6, title: "John Wick: Chapter 4", backdrop_path: "/vI3aJMj8RucWHvJZLMMfGDjH31s.jpg", poster_path: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", vote_average: 7.8, release_date: "2023-03-22", overview: "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table." },
    { id: 7, title: "Mad Max: Fury Road", backdrop_path: "/nlCHUWjY9XWbuEUQauCBgnY8ymF.jpg", poster_path: "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", vote_average: 7.6, release_date: "2015-05-13", overview: "An apocalyptic story set in the furthest reaches of our planet, in a stark desert landscape where humanity is broken." },
    { id: 8, title: "Mission: Impossible - Dead Reckoning", backdrop_path: "/cwKUydpeeaJjyGtP9mNlZc0wHk1.jpg", poster_path: "/NNxYkU70HPurnNCSiCjYAmacwm.jpg", vote_average: 7.6, release_date: "2023-07-08", overview: "Ethan Hunt and his IMF team embark on their most dangerous mission yet." },
  ],
  scifi: [
    { id: 11, title: "Blade Runner 2049", backdrop_path: "/ilRyazdflIgEqbXIQs1zEGE1q0w.jpg", poster_path: "/gajva2L0rIGDWE4SyB6RoIG8ISS.jpg", vote_average: 7.6, release_date: "2017-10-04", overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret." },
    { id: 12, title: "Interstellar", backdrop_path: "/xJHokMbljvjX5LSWorthIN4219.jpg", poster_path: "/gEU2QlsUUHX4wk5EheA6yVhe21b.jpg", vote_average: 8.4, release_date: "2014-11-05", overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel." },
    { id: 13, title: "Arrival", backdrop_path: "/xT98tLqatZPQApyRmlLCENDemiJ.jpg", poster_path: "/pEzxhe6Z6xXzC830x10f78KzGk7.jpg", vote_average: 7.3, release_date: "2016-11-10", overview: "Taking place after alien crafts land around the world, an expert linguist is recruited by the military to determine whether they come in peace or are a threat." },
  ]
};

// --- REUSABLE COMPONENTS ---

const FilmGrain = () => (
  <div 
    className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.15] mix-blend-overlay"
    style={{ 
      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
    }}
  />
);

// Extracted for consistency across all views
const MovieItem = ({ movie, onSelect, layout = 'row' }) => (
  <div className={`relative ${layout === 'row' ? 'w-[140px] md:w-[200px] snap-start flex-none' : 'w-full'} group/item cursor-pointer`}>
    <div 
      onClick={() => onSelect(movie)}
      className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#111] mb-3 relative shadow-lg ring-1 ring-white/5 transition-all duration-500 ease-out group-hover/item:ring-white/20 group-hover/item:shadow-[0_20px_40px_rgba(0,0,0,0.6)] group-hover/item:-translate-y-2 active:scale-[0.97]"
    >
      <img 
        src={`${IMG_BASE_SM}${movie.poster_path}`} 
        alt={movie.title}
        onError={(e) => { e.target.src = "https://via.placeholder.com/500x750/111/fff?text=" + encodeURIComponent(movie.title) }}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-110"
      />
      <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/30 backdrop-blur-[0px] group-hover/item:backdrop-blur-[2px] transition-all duration-500 ease-out flex items-center justify-center">
        <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover/item:opacity-100 transform scale-50 group-hover/item:scale-100 transition-all duration-500 ease-out drop-shadow-2xl" strokeWidth={1.5} />
      </div>
    </div>
    
    <div className="px-1 transition-transform duration-500 ease-out group-hover/item:translate-x-1">
      <h4 className="font-semibold text-white/90 text-sm md:text-base leading-snug truncate group-hover/item:text-white transition-colors">
        {movie.title}
      </h4>
      <div className="flex items-center gap-2 mt-1 text-xs font-medium text-white/40 group-hover/item:text-white/60 transition-colors">
        <span>{movie.release_date?.substring(0, 4)}</span>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-current text-white/60" />
          <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
    </div>
  </div>
);

const MovieRow = ({ title, movies, onSelect, isSpecial = false }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth + 200 : scrollLeft + clientWidth - 200;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className={`mb-12 md:mb-20 relative group/row ${isSpecial ? 'bg-white/5 py-10 border-y border-white/5 backdrop-blur-md' : ''}`}>
      <div className="px-6 md:px-16 flex items-end justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90 flex items-center gap-2">
          {isSpecial && <Heart className="w-5 h-5 text-emerald-400 fill-current" />}
          {title}
        </h3>
        {!isSpecial && (
          <button className="text-sm font-medium text-white/40 hover:text-white transition-colors flex items-center gap-1">
            Explore <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-12 z-20 w-16 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 flex items-center justify-start pl-4 ${isSpecial ? 'bg-gradient-to-r from-[#111] to-transparent' : 'bg-gradient-to-r from-black via-black/80 to-transparent'}`}
        >
          <ChevronLeft className="w-8 h-8 text-white drop-shadow-2xl hover:scale-110 transition-transform" />
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-12 z-20 w-16 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 flex items-center justify-end pr-4 ${isSpecial ? 'bg-gradient-to-l from-[#111] to-transparent' : 'bg-gradient-to-l from-black via-black/80 to-transparent'}`}
        >
          <ChevronRight className="w-8 h-8 text-white drop-shadow-2xl hover:scale-110 transition-transform" />
        </button>

        <div ref={scrollRef} className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 md:px-16 pb-12 pt-4">
          {movies.map((movie) => (
            <MovieItem key={movie.id} movie={movie} onSelect={onSelect} layout="row" />
          ))}
        </div>
      </div>
    </div>
  );
};


// --- VIEW LAYOUTS ---

const HomeView = ({ featured, data, vault, onSelect, toggleVault, isFeaturedInVault }) => (
  <>
    {featured && (
      <header className="relative w-full h-[80vh] min-h-[650px] md:h-[90vh] flex items-end pb-32 pt-32">
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
          <img 
            src={`${IMG_BASE}${featured.backdrop_path}`} 
            alt={featured.title}
            onError={(e) => { e.target.src = "https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtecwmH3X32nd.jpg" }}
            className="w-full h-full object-cover opacity-80 animate-[slowPan_40s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="container mx-auto px-6 md:px-16 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter mb-4 text-white leading-[1.05]">
              {featured.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-6 text-sm font-semibold tracking-wide text-white/60">
              <span>{featured.release_date?.substring(0, 4)}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>Feature Film</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-white fill-current" />
                <span>{featured.vote_average?.toFixed(1)}</span>
              </div>
            </div>

            <p className="text-lg md:text-xl text-white/70 font-medium mb-10 leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-none">
              {featured.overview}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => onSelect(featured)}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold tracking-tight transition-all hover:scale-105 hover:bg-neutral-200"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Play Trailer</span>
              </button>
              <button 
                onClick={() => toggleVault(featured)}
                className={`flex items-center gap-3 backdrop-blur-xl border px-8 py-4 rounded-full font-semibold tracking-tight transition-all active:scale-95 ${
                  isFeaturedInVault 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isFeaturedInVault ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{isFeaturedInVault ? "In Your Vault" : "Add to Vault"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    )}

    <section className="relative z-10 -mt-8 pb-32">
      {vault.length > 0 && <MovieRow title="Your Personal Vault" movies={vault} onSelect={onSelect} isSpecial={true} />}
      <MovieRow title="The Global Zeitgeist" movies={data.trending} onSelect={onSelect} />
      <MovieRow title="Kinetic Cinema" movies={data.action} onSelect={onSelect} />
      <MovieRow title="Visions of Tomorrow" movies={data.scifi} onSelect={onSelect} />
    </section>
  </>
);

const ExploreView = ({ data, onSelect }) => {
  // Combine all data and remove duplicates based on movie ID
  const allMovies = [...data.trending, ...data.action, ...data.scifi].filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);
  
  return (
    <div className="pt-32 pb-40 px-6 md:px-16 min-h-screen">
      <div className="flex items-center gap-3 mb-10">
        <Compass className="w-8 h-8 text-white/50" />
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Explore</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
        {allMovies.map(movie => <MovieItem key={movie.id} movie={movie} onSelect={onSelect} layout="grid" />)}
      </div>
    </div>
  );
};

const SearchView = ({ data, onSelect }) => {
  const [query, setQuery] = useState('');
  const allMovies = [...data.trending, ...data.action, ...data.scifi].filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);
  const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
  
  return (
    <div className="pt-32 pb-40 px-6 md:px-16 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-4xl relative mb-16 animate-in slide-in-from-top-4 duration-500">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-white/40" />
         <input 
           autoFocus 
           placeholder="Search titles, directors, or genres..." 
           value={query} 
           onChange={e => setQuery(e.target.value)} 
           className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-full py-6 pl-20 pr-8 text-xl md:text-2xl font-medium text-white outline-none focus:border-white/40 focus:bg-white/10 transition-all shadow-2xl" 
         />
      </div>

      {query && filtered.length === 0 ? (
        <div className="text-center text-white/40 mt-12">
          <p className="text-2xl font-medium">No results found for "{query}"</p>
          <p className="mt-2 text-sm">Try asking the Aura Engine to find something similar.</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {filtered.map(movie => <MovieItem key={movie.id} movie={movie} onSelect={onSelect} layout="grid" />)}
        </div>
      )}
    </div>
  );
};

const VaultView = ({ vault, onSelect }) => (
  <div className="pt-32 pb-40 px-6 md:px-16 min-h-screen">
    <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 text-emerald-400 fill-current" />
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Your Vault</h2>
      </div>
      <span className="text-white/40 font-medium">{vault.length} Titles Saved</span>
    </div>
    
    {vault.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-[40vh] text-center">
        <Heart className="w-16 h-16 text-white/10 mb-4" />
        <p className="text-2xl font-semibold text-white/50 mb-2">Your vault is empty</p>
        <p className="text-white/30 max-w-md">Films and series you add to your vault will appear here for easy access across all your devices.</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
        {vault.map(movie => <MovieItem key={movie.id} movie={movie} onSelect={onSelect} layout="grid" />)}
      </div>
    )}
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [vault, setVault] = useState([]);
  
  const [data, setData] = useState({ trending: [], action: [], scifi: [] });
  const [featured, setFeatured] = useState(null);
  const [activeMovie, setActiveMovie] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [promptQuery, setPromptQuery] = useState("");
  const [activeTab, setActiveTab] = useState('home'); // Controls the main view!

  // --- CLOUD AUTHENTICATION ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth error:", e);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- VAULT (MY LIST) SYNCING ---
  useEffect(() => {
    if (!user || !db) return;
    const vaultRef = collection(db, 'artifacts', appId, 'users', user.uid, 'vault');
    const unsubscribe = onSnapshot(vaultRef, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: Number(doc.id), ...doc.data() }));
        setVault(items.sort((a, b) => b.addedAt - a.addedAt));
      },
      (error) => console.error("Vault fetch error:", error)
    );
    return () => unsubscribe();
  }, [user]);

  // --- FETCH MOVIES ---
  useEffect(() => {
    const fetchMovies = async () => {
      if (!TMDB_API_KEY) {
        setData(FALLBACK_DATA);
        setFeatured(FALLBACK_DATA.trending[0]);
        return;
      }

      try {
        const fetchUrl = (endpoint) => fetch(`${BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`).then(res => res.json());
        
        const [trendingRes, actionRes, scifiRes] = await Promise.all([
          fetchUrl("/trending/movie/day"),
          fetchUrl("/discover/movie?with_genres=28"),
          fetchUrl("/discover/movie?with_genres=878")
        ]);

        const newData = {
          trending: trendingRes.results,
          action: actionRes.results,
          scifi: scifiRes.results
        };

        setData(newData);
        setFeatured(newData.trending[0]);
      } catch (error) {
        console.error("Failed to fetch from TMDB:", error);
        setData(FALLBACK_DATA);
        setFeatured(FALLBACK_DATA.trending[0]);
      }
    };

    fetchMovies();
  }, []);

  // --- ADD TO VAULT LOGIC ---
  const toggleVault = async (movie) => {
    if (!movie) return;
    
    if (!db || !user) {
      setVault(prev => {
        const exists = prev.some(m => m.id === movie.id);
        if (exists) return prev.filter(m => m.id !== movie.id);
        return [{...movie, addedAt: Date.now()}, ...prev];
      });
      return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'vault', movie.id.toString());
    const exists = vault.some(m => m.id === movie.id);
    
    try {
      if (exists) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          id: movie.id,
          title: movie.title || "",
          backdrop_path: movie.backdrop_path || "",
          poster_path: movie.poster_path || "",
          vote_average: movie.vote_average || 0,
          release_date: movie.release_date || "",
          overview: movie.overview || "",
          addedAt: Date.now()
        });
      }
    } catch (e) {
      console.error("Error updating vault:", e);
    }
  };

  const isFeaturedInVault = featured ? vault.some(m => m.id === featured.id) : false;
  const isActiveMovieInVault = activeMovie ? vault.some(m => m.id === activeMovie.id) : false;

  return (
    <div className="relative min-h-screen bg-black text-neutral-100 font-sans overflow-x-hidden selection:bg-white/30 selection:text-white">
      <FilmGrain />

      <nav className="absolute top-0 w-full z-40 py-8 px-6 md:px-16 flex justify-between items-center pointer-events-none">
        <div 
          onClick={() => setActiveTab('home')}
          className="text-2xl font-bold tracking-widest text-white drop-shadow-md pointer-events-auto cursor-pointer"
        >
          L U M I N A
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 tracking-widest uppercase bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 shadow-lg backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Cloud Synced
            </span>
          )}
          <div className="w-10 h-10 rounded-full overflow-hidden pointer-events-auto cursor-pointer border border-white/10 hover:border-white/40 transition-colors shadow-xl">
             <img src="https://i.pravatar.cc/100?img=33" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* --- COMMAND CENTER --- */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
        <button onClick={() => setActiveTab('home')} className={`p-3 md:p-4 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-white/15 text-white shadow-inner' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          <Home className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        </button>
        <button onClick={() => setActiveTab('explore')} className={`p-3 md:p-4 rounded-full transition-all duration-300 ${activeTab === 'explore' ? 'bg-white/15 text-white shadow-inner' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          <Compass className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
        </button>

        {/* Improved Aura Button: Sleek glass pill instead of stark white block */}
        <div className="px-1 md:px-2 flex items-center">
          <button 
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 md:py-3.5 bg-white/5 border border-white/10 hover:bg-white hover:text-black hover:border-white text-white rounded-full font-semibold tracking-tight transition-all duration-300 shadow-lg"
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:block text-sm">Aura Engine</span>
          </button>
        </div>

        <button onClick={() => setActiveTab('search')} className={`p-3 md:p-4 rounded-full transition-all duration-300 ${activeTab === 'search' ? 'bg-white/15 text-white shadow-inner' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          <Search className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === 'search' ? 2.5 : 2} />
        </button>
        <button onClick={() => setActiveTab('vault')} className={`p-3 md:p-4 rounded-full transition-all duration-300 relative ${activeTab === 'vault' ? 'bg-emerald-500/20 text-emerald-400 shadow-inner' : 'text-white/40 hover:text-emerald-400 hover:bg-white/5'}`}>
          <Heart className="w-5 h-5 md:w-6 md:h-6" strokeWidth={activeTab === 'vault' ? 2.5 : 2} />
          {vault.length > 0 && <span className="absolute top-2 right-2 md:top-3 md:right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111]" />}
        </button>
      </div>

      {/* --- DYNAMIC VIEWS RENDERER --- */}
      <main className="min-h-screen">
        {activeTab === 'home' && <HomeView featured={featured} data={data} vault={vault} onSelect={setActiveMovie} toggleVault={toggleVault} isFeaturedInVault={isFeaturedInVault} />}
        {activeTab === 'explore' && <ExploreView data={data} onSelect={setActiveMovie} />}
        {activeTab === 'search' && <SearchView data={data} onSelect={setActiveMovie} />}
        {activeTab === 'vault' && <VaultView vault={vault} onSelect={setActiveMovie} />}
      </main>

      {/* --- AI COMMAND PALETTE --- */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4 pointer-events-auto">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-2xl transition-opacity animate-in fade-in"
            onClick={() => setAiModalOpen(false)}
          />
          
          <div className="relative w-full max-w-3xl bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative flex items-center px-6 py-5 border-b border-white/10">
              <Sparkles className="w-6 h-6 text-white/50 mr-4" />
              <input 
                type="text" 
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                autoFocus
                placeholder="Ask Aura to find something specific..."
                className="flex-1 bg-transparent border-none outline-none text-white text-xl md:text-2xl font-medium placeholder:text-white/30"
              />
              <button 
                onClick={() => setAiModalOpen(false)}
                className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 bg-black/20">
              <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-4">Suggested Curations</p>
              <div className="flex flex-col gap-2">
                {[
                  "Cinematography that feels like a painting",
                  "Slow-burn psychological thrillers from the 90s",
                  "Cozy movies set in New York during Autumn"
                ].map((tag) => (
                  <button 
                    key={tag} 
                    onClick={() => { setPromptQuery(tag); setTimeout(() => setAiModalOpen(false), 500); }} 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
                  >
                    <Search className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                    <span className="text-white/70 font-medium group-hover:text-white text-lg">{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOVIE DETAIL MODAL --- */}
      {activeMovie && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in"
            onClick={() => setActiveMovie(null)}
          />
          
          <div className="relative w-full max-w-5xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95">
            <button 
              onClick={() => setActiveMovie(null)}
              className="absolute top-6 right-6 z-50 w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full md:w-[45%] h-64 md:h-auto relative">
              <img 
                src={`${IMG_BASE}${activeMovie.poster_path}`} 
                alt={activeMovie.title}
                onError={(e) => { e.target.src = "https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtecwmH3X32nd.jpg" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#111111] via-[#111111]/20 to-transparent" />
            </div>

            <div className="w-full md:w-[55%] overflow-y-auto p-8 md:p-14 flex flex-col justify-center hide-scrollbar">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-4 leading-tight">
                {activeMovie.title}
              </h2>
              
              <div className="flex items-center gap-3 text-white/50 text-sm font-semibold tracking-wide mb-8">
                <span>{activeMovie.release_date?.substring(0, 4)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-white fill-current" />
                  <span>{activeMovie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
              
              <p className="text-white/80 text-lg leading-relaxed mb-10 font-medium">
                {activeMovie.overview || "No description available for this title."}
              </p>

              <div className="flex gap-4">
                <button className="flex-1 bg-white text-black py-4 rounded-full font-bold tracking-tight flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
                  <Play className="w-5 h-5 fill-current" /> Play Movie
                </button>
                <button 
                  onClick={() => toggleVault(activeMovie)}
                  className={`w-14 h-14 border rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    isActiveMovieInVault 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {isActiveMovieInVault ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
