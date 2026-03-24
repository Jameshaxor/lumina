import React, { useState, useEffect } from 'react';
import { Home, Compass, Search, Bookmark, Sparkles, Play, Plus, Check, X, ChevronRight } from 'lucide-react';

// --- CONFIGURATION ---
// Vercel will inject your API key here from your Environment Variables.
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ""; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/original";

// --- FALLBACK DATA ---
// Used if the API key is missing or fails to load.
const MOCK_MOVIES = [
  { id: 1, title: "Dune: Part Two", backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", poster_path: "/1pdfLvkbY9ohJlCjQH2JGjjcNsV.jpg", release_date: "2024-02-27", vote_average: 8.3, overview: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family." },
  { id: 2, title: "Civil War", backdrop_path: "/5zmiBoMzeeVdQ62no55JOJMY498.jpg", poster_path: "/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg", release_date: "2024-04-10", vote_average: 7.4, overview: "In a dystopian future America, a team of military-embedded journalists takes a risky journey to Washington, D.C., to interview the president." },
  { id: 3, title: "Challengers", backdrop_path: "/tpiqEVTLRz2Mq7eLq5DT8jSpmXT.jpg", poster_path: "/H6vke7zGtzMicnfTotGOkKKTcg.jpg", release_date: "2024-04-18", vote_average: 7.3, overview: "Tennis player turned coach Tashi has taken her husband, Art, and transformed him into a world-famous grand slam champion." },
  { id: 4, title: "Furiosa: A Mad Max Saga", backdrop_path: "/xvdNIYqWQ0CYAms9O3nU71IinK4.jpg", poster_path: "/iADOJ8Zymht2JPMoy3R7xceZprc.jpg", release_date: "2024-05-22", vote_average: 7.6, overview: "As the world fell, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great Biker Horde." },
  { id: 5, title: "Oppenheimer", backdrop_path: "/fm6KqXpk3M2HVveHwCrBRoOoA0i.jpg", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", release_date: "2023-07-19", vote_average: 8.1, overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II." }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [movies, setMovies] = useState({
    trending: MOCK_MOVIES,
    action: MOCK_MOVIES,
    scifi: MOCK_MOVIES
  });
  const [vault, setVault] = useState([]);

  // Fetch from TMDB if API key exists
  useEffect(() => {
    if (!TMDB_API_KEY) return;

    const fetchMovies = async (endpoint) => {
      try {
        const res = await fetch(`${BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        return data.results.filter(m => m.backdrop_path && m.poster_path);
      } catch (err) {
        console.error("Failed to fetch:", err);
        return [];
      }
    };

    const loadAll = async () => {
      const trending = await fetchMovies('/trending/movie/week');
      const action = await fetchMovies('/discover/movie?with_genres=28');
      const scifi = await fetchMovies('/discover/movie?with_genres=878');
      
      if (trending.length > 0) {
        setMovies({ trending, action, scifi });
      }
    };

    loadAll();
  }, []);

  const toggleVault = (movie) => {
    if (vault.find(m => m.id === movie.id)) {
      setVault(vault.filter(m => m.id !== movie.id));
    } else {
      setVault([...vault, movie]);
    }
  };

  // --- VIEWS ---
  const HomeView = () => {
    const heroMovie = movies.trending[0] || MOCK_MOVIES[0];
    const isSaved = vault.some(m => m.id === heroMovie.id);

    return (
      <div className="pb-32">
        {/* HERO SECTION */}
        <div className="relative w-full h-[85vh] min-h-[700px] flex flex-col justify-end pb-24 px-12 group">
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={heroMovie.backdrop_path.startsWith('/') ? `${IMAGE_BASE}${heroMovie.backdrop_path}` : heroMovie.backdrop_path} 
              alt={heroMovie.title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/40 to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-serif text-white tracking-tight leading-[1.1] mb-4">
              {heroMovie.title}
            </h1>
            <div className="flex items-center gap-4 text-xs font-sans tracking-widest text-white/60 uppercase mb-6">
              <span>{heroMovie.release_date?.split('-')[0]}</span>
              <span>•</span>
              <span>Feature Film</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Sparkles size={12}/> {heroMovie.vote_average?.toFixed(1)}</span>
            </div>
            <p className="text-lg text-white/70 max-w-xl leading-relaxed font-sans font-light mb-8">
              {heroMovie.overview}
            </p>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-sm font-sans text-sm font-semibold hover:bg-white/90 transition-colors">
                <Play size={18} fill="currentColor" /> Play Feature
              </button>
              <button 
                onClick={() => toggleVault(heroMovie)}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-sm font-sans text-sm border border-white/10 hover:bg-white/20 transition-colors"
              >
                {isSaved ? <><Check size={18} /> Saved to Vault</> : <><Plus size={18} /> Add to Vault</>}
              </button>
            </div>
          </div>
        </div>

        {/* ROWS */}
        <div className="px-12 mt-12 space-y-20">
          {vault.length > 0 && <MovieRow title="Your Personal Vault" data={vault} />}
          <MovieRow title="The Global Zeitgeist" data={movies.trending.slice(1)} />
          <MovieRow title="Kinetic Cinema" data={movies.action} />
          <MovieRow title="Visions of Tomorrow" data={movies.scifi} />
        </div>
      </div>
    );
  };

  const ExploreView = () => (
    <div className="pt-32 px-12 pb-32 min-h-screen">
      <h2 className="text-4xl font-serif text-white mb-12">Curated Collections</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {movies.trending.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );

  const SearchView = () => (
    <div className="pt-40 px-12 pb-32 min-h-screen flex flex-col items-center">
      <input 
        type="text" 
        placeholder="Search for directors, films, or moods..." 
        className="w-full max-w-3xl bg-transparent border-b-2 border-white/20 text-4xl font-serif text-white placeholder-white/30 pb-4 focus:outline-none focus:border-white transition-colors"
      />
    </div>
  );

  const VaultView = () => (
    <div className="pt-32 px-12 pb-32 min-h-screen">
      <h2 className="text-4xl font-serif text-white mb-12">Your Vault</h2>
      {vault.length === 0 ? (
        <p className="text-white/40 font-sans">Your vault is currently empty. Curate your collection by adding films.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {vault.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );

  // --- COMPONENTS ---
  const MovieRow = ({ title, data }) => (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif text-white tracking-wide">{title}</h3>
        <button className="text-xs font-sans tracking-widest text-white/50 uppercase hover:text-white flex items-center gap-1 transition-colors">
          View All <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
        {data.map((movie) => (
          <div key={movie.id} className="min-w-[240px] md:min-w-[280px] snap-start">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );

  const MovieCard = ({ movie }) => (
    <div className="group flex flex-col gap-4 cursor-pointer">
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-white/5">
        <img 
          src={movie.poster_path.startsWith('/') ? `${IMAGE_BASE}${movie.poster_path}` : movie.poster_path}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white transform scale-50 group-hover:scale-100 transition-all duration-300 ease-out">
            <Play size={24} fill="currentColor" />
          </button>
        </div>
      </div>
      <div>
        <h4 className="text-white font-serif text-lg leading-tight group-hover:text-white/80 transition-colors">{movie.title}</h4>
        <div className="flex items-center gap-3 text-xs font-sans text-white/40 mt-1">
          <span>{movie.release_date?.split('-')[0]}</span>
          <span className="flex items-center gap-1"><Sparkles size={10}/> {movie.vote_average?.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030303] selection:bg-white selection:text-black font-sans">
      {/* TOP LOGO BAR */}
      <header className="absolute top-0 w-full p-12 z-50 flex justify-between items-center pointer-events-none">
        <div className="text-2xl font-serif text-white tracking-[0.2em] font-medium pointer-events-auto">
          L U M I N A
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden pointer-events-auto border border-white/20">
          <img src="https://i.pravatar.cc/150?u=lumina" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* DYNAMIC VIEW ROUTING */}
      <main>
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'explore' && <ExploreView />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'vault' && <VaultView />}
      </main>

      {/* CENTRAL CONTROL HUB (BOTTOM DOCK) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`p-3 rounded-xl transition-all ${activeTab === 'home' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>
          <button onClick={() => setActiveTab('explore')} className={`p-3 rounded-xl transition-all ${activeTab === 'explore' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Compass size={20} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-2" />
          
          <button 
            onClick={() => setIsAuraOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <Sparkles size={18} className="group-hover:animate-pulse" />
            <span className="text-sm font-sans tracking-wide">Aura</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <button onClick={() => setActiveTab('search')} className={`p-3 rounded-xl transition-all ${activeTab === 'search' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Search size={20} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
          </button>
          <button onClick={() => setActiveTab('vault')} className={`p-3 rounded-xl transition-all ${activeTab === 'vault' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Bookmark size={20} strokeWidth={activeTab === 'vault' ? 2.5 : 2} />
          </button>
        </div>
      </div>

      {/* AURA AI MODAL */}
      {isAuraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsAuraOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2 text-white/50 font-sans text-sm tracking-widest uppercase">
                  <Sparkles size={14} /> Aura Intelligence
                </div>
                <button onClick={() => setIsAuraOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h2 className="text-3xl font-serif text-white mb-6">Describe the exact cinematic mood you are seeking.</h2>
              <textarea 
                className="w-full bg-transparent border-none text-xl font-sans font-light text-white/80 placeholder-white/30 resize-none focus:outline-none focus:ring-0 mb-8"
                rows={3}
                placeholder="e.g., A slow-burn psychological thriller set in a snowy landscape with a synth soundtrack..."
              />
              <div className="flex justify-end">
                <button className="bg-white text-black px-6 py-3 rounded-sm font-sans text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2">
                  <Sparkles size={16} /> Generate Curated Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INLINE CSS FOR SCROLLBAR HIDING */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
