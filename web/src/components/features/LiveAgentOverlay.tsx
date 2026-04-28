import { Mic, MicOff, X, Sparkles, Volume2 } from 'lucide-react';
import { useLiveAgent } from '../../hooks/useLiveAgent';

export function LiveAgentOverlay() {
  const { isActive, isSpeaking, transcript, startSession, stopSession } = useLiveAgent();

  if (!isActive) {
    return (
      <button
        onClick={startSession}
        className="fixed bottom-10 right-10 z-[100] group flex items-center gap-4 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 border border-white/20"
      >
        <div className="relative">
          <Mic className="w-6 h-6" />
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-hover:block hidden" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-widest opacity-70">Live Assistant</p>
          <p className="text-sm font-bold">Talk to ElectraLens</p>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-10 right-10 z-[100] w-80 glass border border-blue-500/30 rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="p-6 bg-blue-600/10 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live Session</h3>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-emerald-400 uppercase">Listening</span>
            </div>
          </div>
        </div>
        <button 
          onClick={stopSession}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Visualizer & Hologram Area */}
      <div className="p-8 space-y-6 flex flex-col items-center">
        <div className="relative w-48 h-48 group">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-blue-500/20 blur-[40px] rounded-full animate-pulse" />
          
          {/* Hologram Image */}
          <img 
            src="/hologram.png" 
            alt="Hologram Assistant" 
            className={`w-full h-full object-contain relative z-10 transition-all duration-700 ${
              isSpeaking ? 'scale-110 brightness-125' : 'scale-100 brightness-100 opacity-80'
            }`} 
          />
          
          {/* Scanning Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/30 blur-sm animate-scan z-20" />
        </div>

        <div className="flex justify-center items-center gap-2 h-8 w-full">
           {[1,2,3,4,5,6,7].map(i => (
             <div 
               key={i} 
               className={`w-1 rounded-full bg-blue-500 transition-all duration-300 ${
                 isSpeaking ? 'animate-pulse' : ''
               }`} 
               style={{ 
                 height: isSpeaking ? `${40 + (i % 3) * 20}%` : '4px',
                 animationDelay: `${i * 0.1}s` 
               }} 
             />
           ))}
        </div>

        <div className="min-h-[100px] max-h-[200px] overflow-y-auto p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed italic custom-scrollbar">
           {transcript || "Waiting for your first words..."}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-6">
           <button 
             onClick={stopSession}
             className="w-14 h-14 rounded-full bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-lg"
           >
             <MicOff className="w-6 h-6" />
           </button>
           {isSpeaking && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 animate-in fade-in">
                 <Volume2 className="w-3 h-3 animate-bounce" /> Assistant Speaking
              </div>
           )}
        </div>
        <p className="text-[10px] text-center text-slate-500">
           Barge-in enabled. Just start speaking to interrupt.
        </p>
      </div>
    </div>
  );
}
