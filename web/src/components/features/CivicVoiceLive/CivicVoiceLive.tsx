import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Activity } from 'lucide-react';

export function CivicVoiceLive() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fake audio visualizer for WOW factor
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const draw = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, ctx.canvas.height / 2);
      
      const segments = 50;
      for (let i = 0; i <= segments; i++) {
        const x = (ctx.canvas.width / segments) * i;
        const amplitude = (isRecording || isProcessing) ? Math.random() * 40 : 2;
        const y = (ctx.canvas.height / 2) + Math.sin(i * 0.5 + performance.now() / 100) * amplitude;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = isProcessing ? '#818cf8' : (isRecording ? '#f43f5e' : '#334155');
      ctx.lineWidth = 3;
      ctx.stroke();
      
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRecording, isProcessing]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      // Simulate network latency & Gemini Live response
      setTimeout(() => {
        setIsProcessing(false);
        setTranscript(prev => [...prev, "User: How do I register to vote?", "CivicVoice: You can register online through the National Voter Service Portal (NVSP) or fill out Form 6. Would you like the link?"]);
      }, 2000);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-6">
      <div className="glass p-8 text-center border border-white/10 rounded-2xl relative overflow-hidden">
        {/* Animated background glow */}
        <div className={`absolute inset-0 bg-gradient-to-r ${isRecording ? 'from-rose-500/10 to-orange-500/10' : 'from-blue-500/10 to-indigo-500/10'} opacity-50 blur-3xl transition-colors duration-700`} />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
              <Activity className="w-12 h-12" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black mb-2 tracking-tight">CivicVoice <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Live</span></h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Powered by Gemini Multimodal Live API. Speak naturally to ask about election laws, polling stations, or candidate requirements.
          </p>

          <div className="h-24 w-full max-w-md mx-auto mb-8 bg-black/20 rounded-xl border border-white/5 overflow-hidden relative">
             <canvas ref={canvasRef} width={400} height={96} className="w-full h-full object-cover" />
          </div>

          <button 
            onClick={toggleRecording}
            className={`group relative px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center gap-3 mx-auto ${
              isRecording 
                ? 'bg-rose-500 text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]' 
                : 'bg-white text-navy-950 hover:bg-slate-200'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            {isRecording ? 'Stop Recording' : 'Hold to Speak'}
          </button>
        </div>
      </div>

      {/* Live Transcript Panel */}
      <div className="flex-1 glass p-6 rounded-2xl border border-white/10 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Live Transcript</h3>
        </div>
        
        <div className="space-y-4">
          {transcript.length === 0 && (
            <p className="text-center text-slate-500 italic mt-10">Say "Hello" to start the conversation...</p>
          )}
          {transcript.map((line, idx) => {
            const isUser = line.startsWith('User:');
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  isUser 
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm' 
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{line.replace(/^(User:|CivicVoice:)\s*/, '')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
