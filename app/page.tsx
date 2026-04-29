"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Download, 
  RefreshCcw, 
  X, 
  ArrowRight, 
  Loader2,
  Maximize2,
  ChevronLeft,
  Lightbulb
} from "lucide-react";
import { sdk } from "@farcaster/miniapp-sdk";
import { generateWallpapers, getVibeSuggestions, GeneratedImage } from "@/lib/gemini";
import { cn } from "@/lib/utils";

export default function Home() {
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"generate" | "remix" | null>(null);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[][]>([]);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1" | "4:5">("9:16");
  const [selectedStyle, setSelectedStyle] = useState<string>("Artistic");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [creativity, setCreativity] = useState(1.0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const styles = [
    { name: "Artistic", icon: "🎨" },
    { name: "Photorealistic", icon: "📸" },
    { name: "Anime", icon: "🎌" },
    { name: "Abstract", icon: "🌀" },
    { name: "Minimalist", icon: "⚪" },
    { name: "Cyberpunk", icon: "🌃" }
  ];

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("vibewall-history-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => setHistory(parsed), 0);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (history.length >= 0) {
      try {
        // Limit to 5 batches to stay within localStorage limits (approx 5MB)
        const pruned = history.slice(0, 5);
        localStorage.setItem("vibewall-history-v1", JSON.stringify(pruned));
      } catch (e) {
        console.warn("Storage limit reached, could not save all history items", e);
      }
    }
  }, [history]);

  const aspectClasses = {
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-[16/9]",
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
  };
  
  // Farcaster SDK init
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.error("SDK Ready failed", e);
      }
    };
    init();
  }, []);

  const handleGenerate = async (remixVibe?: string) => {
    const prompt = remixVibe || vibe;
    if (!prompt.trim()) return;

    setLoading(true);
    setLoadingType(remixVibe ? "remix" : "generate");
    try {
      if (results.length > 0) {
        setHistory(prev => [results, ...prev].slice(0, 10));
      }
      const newImages = await generateWallpapers(
        prompt, 
        selectedImage?.url, 
        aspectRatio, 
        selectedStyle, 
        negativePrompt, 
        creativity
      );
      setResults(newImages);
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDownload = async (imgUrl: string, format: 'png' | 'jpg' = 'png') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imgUrl;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    if (ctx) {
      if (format === 'jpg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
    }

    const dataUrl = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.9);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `vibewall-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const historyPrompts = history.map(batch => batch[0].prompt);
      const newSuggestions = await getVibeSuggestions(historyPrompts);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] atmospheric-bg flex flex-col items-center p-4 pb-24 md:pb-4 overflow-x-hidden content-center">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-8 pt-8 px-2 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1">
            Lumina <span className="text-cyan-400">Gen</span>
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer">
          <Maximize2 size={18} />
        </div>
      </motion.div>

      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass rounded-3xl p-5 mb-8 overflow-hidden relative"
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/60 mb-2 font-bold px-1">
          Current Vibe
        </div>
        <div className="relative group">
          <textarea
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="rainy cyberpunk lo-fi, neon reflections, ultra-detailed..."
            className="w-full bg-transparent border-none text-white placeholder:text-white/10 focus:ring-0 resize-none h-20 text-base font-medium leading-normal scrollbar-hide pr-12"
          />
          <div className="absolute bottom-0 right-0 flex items-center gap-1">
            <button
              onClick={handleGetSuggestions}
              disabled={loadingSuggestions}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
                loadingSuggestions 
                  ? "text-cyan-400/50 cursor-not-allowed" 
                  : "text-white/20 hover:text-cyan-400 hover:scale-110 active:scale-90"
              )}
              title="Get AI Suggestions"
            >
              {loadingSuggestions ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Lightbulb size={20} />
              )}
            </button>
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !vibe.trim()}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
                loading || !vibe.trim() 
                  ? "text-white/10 cursor-not-allowed" 
                  : "text-cyan-400 hover:text-cyan-300 hover:scale-110 active:scale-90"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <ArrowRight size={24} />
              )}
            </button>
          </div>
        </div>

        {/* AI Suggestions Chips */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5 overflow-hidden"
            >
              {suggestions.map((s, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setVibe(s);
                    setSuggestions([]);
                  }}
                  className="px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-[10px] text-cyan-400/80 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all text-left max-w-full truncate"
                >
                  {s}
                </motion.button>
              ))}
              <button 
                onClick={() => setSuggestions([])}
                className="px-2 py-1.5 text-[10px] text-white/20 hover:text-white/60"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Style Selector */}
        <div className="grid grid-cols-3 gap-2 mt-4 pb-4 border-b border-white/5">
          {styles.map((style) => (
            <button
              key={style.name}
              onClick={() => setSelectedStyle(style.name)}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all border",
                selectedStyle === style.name
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-transparent text-white/30 hover:text-white/50"
              )}
            >
              <span>{style.icon}</span>
              <span>{style.name}</span>
            </button>
          ))}
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
          {(["9:16", "1:1", "4:5", "16:9"] as const).map((ratio) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={cn(
                "flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border",
                aspectRatio === ratio
                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                  : "bg-white/5 border-transparent text-white/40 hover:text-white/60"
              )}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* Advanced Settings Toggle */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white transition-colors"
          >
            <div className={cn("transition-transform duration-300", showAdvanced ? "rotate-180" : "")}>
              <ChevronLeft className="-rotate-90" size={12} />
            </div>
            Advanced Settings
          </button>
          
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-4"
              >
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold flex justify-between">
                    <span>Negative Prompt</span>
                    <span className="text-white/20 font-normal italic">Exclude these elements</span>
                  </div>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="blurry, distorted, text, low resolution..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold flex justify-between">
                    <span>Creativity</span>
                    <span className="text-cyan-400">{creativity.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={creativity}
                    onChange={(e) => setCreativity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] uppercase tracking-tighter text-white/20">
                    <span>Steady</span>
                    <span>Wild</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Grid Results */}
      <div className="w-full max-w-lg flex-1">
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {results.map((img, i) => (
                <motion.div
                  key={`${i}-${img.url.substring(0, 20)}`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.05, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "group relative rounded-2xl overflow-hidden glass border-white/5 cursor-pointer active:scale-95 transition-all duration-300 shadow-lg",
                    aspectClasses[aspectRatio]
                  )}
                >
                  <img 
                    src={img.url} 
                    alt="Generated wallpaper" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="p-2 rounded-full glass">
                      <Maximize2 className="text-white" size={20} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : !loading && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-6 text-cyan-400/40 shadow-xl">
                <Sparkles size={32} />
              </div>
              <p className="text-sm font-medium tracking-wide text-slate-500 uppercase">Input a vibe to manifest art</p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && results.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="animate-spin text-cyan-400/40 mb-4" size={48} />
            <p className="text-xs text-slate-500 uppercase tracking-widest animate-pulse">
              {loadingType === "remix" ? "Iterating Aesthetics..." : "Engaging Neural Engines..."}
            </p>
          </div>
        )}
      </div>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center"
          >
            <div className="absolute top-0 left-0 right-0 h-20 flex items-center px-6 justify-between">
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <p className="text-white/60 font-medium text-[10px] uppercase tracking-widest">{selectedImage.prompt}</p>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 w-full max-w-sm flex items-center justify-center p-6 mt-12">
              <motion.img 
                layoutId={`img-${selectedImage.url}`}
                src={selectedImage.url} 
                className={cn(
                  "w-full h-auto max-h-full object-contain rounded-[32px] shadow-2xl border border-white/20",
                   aspectClasses[aspectRatio]
                )}
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full max-w-sm p-6 space-y-4 pb-12">
              <div className="flex gap-2 p-1 glass rounded-xl w-fit mx-auto">
                {(['png', 'jpg'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDownloadFormat(f)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      downloadFormat === f ? "bg-white text-black" : "text-white/40 hover:text-white"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownload(selectedImage.url, downloadFormat)}
                  className="w-full bg-white text-slate-950 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
                >
                  <Download size={20} />
                  {downloadFormat.toUpperCase()}
                </button>
                <button
                  onClick={() => handleGenerate(selectedImage.prompt)}
                  disabled={loading}
                  className="w-full bg-cyan-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-95 hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && loadingType === "remix" ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Refining...
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={20} />
                      Remix
                    </>
                  )}
                </button>
              </div>
              
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-full text-slate-500 text-sm font-medium py-2"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating Vibe History Bar */}
      {!selectedImage && history.length > 0 && (
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 glass rounded-2xl border-white/5 flex items-center px-4 gap-3 overflow-x-auto hide-scrollbar shadow-2xl group/bar">
           <button 
             onClick={() => {
               setHistory([]);
               localStorage.removeItem("vibewall-history-v1");
             }}
             className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors"
             title="Clear History"
           >
             <X size={16} />
           </button>
           <div className="flex-shrink-0 text-cyan-400/40">
             <RefreshCcw size={16} />
           </div>
           {history.map((batch, i) => (
             <button
              key={i}
              onClick={() => setResults(batch)}
              className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-white/10 ring-2 ring-transparent hover:ring-cyan-500/40 transition-all"
             >
               <img 
                 src={batch[0].url} 
                 alt={`History batch ${i}`}
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer" 
               />
             </button>
           ))}
         </div>
      )}
    </main>
  );
}
