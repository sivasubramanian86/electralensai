import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlayCircle, 
  Network, 
  Pause, 
  Repeat, 
  ChevronRight, 
  MessageCircle,
  Eye,
  Ear,
  Accessibility,
  Loader2,
  ImageIcon,
  Video,
  Download,
  Captions
} from 'lucide-react';
import { useMultimedia } from '../../../hooks/useMultimedia';

const multimodalModules = [
  {
    id: 'audio-story',
    title: "How to Vote (Audio Story)",
    type: "AUDIO",
    duration: "AI Generated",
    desc: "A radio-style walkthrough of your polling booth experience in simple language.",
    icon: Ear,
    color: "blue",
    topic: "Voter Registration and Polling Booth Experience"
  },
  {
    id: 'mind-map',
    title: "The Election Mind-Map",
    type: "VISUAL",
    duration: "Interactive",
    desc: "A simplified visual journey from registration to results. Tap nodes to listen.",
    icon: Network,
    color: "emerald",
    topic: "Election Journey Phases"
  },
  {
    id: 'evm-guide',
    title: "EVM Walkthrough",
    type: "VIDEO",
    duration: "Cinematic",
    desc: "Visual guide with audio description showing how to press the blue button.",
    icon: PlayCircle,
    color: "violet",
    topic: "Electronic Voting Machine and VVPAT Guide"
  }
];

/**
 * InclusiveLearning — Multimodal Learning Hub for Accessible Civics.
 * 
 * Offers AI-generated audio stories, visual mind maps, and video walkthroughs
 * to ensure civic education is accessible to all citizens, including those
 * with visual or auditory impairments.
 */
export function InclusiveLearning() {
  const { t, i18n } = useTranslation();
  const [activeModule, setActiveModule] = useState<typeof multimodalModules[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { generateContent, content, loading, error } = useMultimedia();

  useEffect(() => {
    if (activeModule) {
      generateContent(activeModule.topic, i18n.language.split('-')[0]);
    }
  }, [activeModule, i18n.language, generateContent]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold flex items-center gap-4 text-white">
            <Accessibility className="text-blue-400 w-12 h-12" />
            {t('inclusive.title', 'Inclusive Learning Hub')}
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            {t('inclusive.subtitle', 'Democracy is for everyone. Choose how you want to learn: listen to stories, watch simplified guides, or explore visual maps.')}
          </p>
        </div>
        <div className="flex gap-4">
           <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('inclusive.ai_assisted', 'AI Assisted Learning')}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Module List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {multimodalModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod)}
              className={`w-full text-left p-6 rounded-3xl border transition-all group flex items-start gap-4 ${
                activeModule?.id === mod.id 
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-xl' 
                  : 'bg-navy-900/50 border-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-${mod.color}-500/10 flex items-center justify-center border border-${mod.color}-500/20 shrink-0 group-hover:scale-110 transition-transform`}>
                <mod.icon className={`w-6 h-6 text-${mod.color}-400`} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-${mod.color}-400`}>{mod.type}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{mod.duration}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{t(`inclusive.modules.m${mod.id === 'audio-story' ? '1' : mod.id === 'mind-map' ? '2' : '3'}.title`, mod.title)}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{t(`inclusive.modules.m${mod.id === 'audio-story' ? '1' : mod.id === 'mind-map' ? '2' : '3'}.desc`, mod.desc)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Immersive Player Area (8 cols) */}
        <div className="lg:col-span-8 glass rounded-[2.5rem] border border-white/10 relative overflow-hidden flex flex-col min-h-[600px] bg-navy-900/40">
          {activeModule ? (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-500 h-full">
              {/* Media Preview / Content Area */}
              <div className="flex-1 bg-black/40 relative group flex items-center justify-center">
                {loading ? (
                   <div className="flex flex-col items-center gap-4 text-blue-400">
                      <Loader2 className="w-12 h-12 animate-spin" />
                      <p className="text-sm font-bold animate-pulse">{t('multimodal.generating', 'Generating Inclusive Assets')} for {i18n.language.toUpperCase()}...</p>
                   </div>
                ) : error ? (
                   <div className="p-8 text-center space-y-4">
                      <p className="text-rose-400 font-bold">Content Generation Failed</p>
                      <p className="text-slate-500 text-xs">{error}</p>
                   </div>
                ) : (
                  <div className="flex-1 w-full relative">
                    {activeModule.type === 'VIDEO' ? (
                       <div className="absolute inset-0 w-full h-full">
                         {content?.video_url ? (
                           <iframe 
                             className="w-full h-full rounded-2xl"
                             src={content.video_url}
                             title="Video guide"
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                             allowFullScreen
                           />
                         ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                              <Video className="w-16 h-16 opacity-20 mb-4" />
                              <p>Video explainer coming soon</p>
                           </div>
                         )}
                       </div>
                    ) : activeModule.type === 'VISUAL' ? (
                       <div className="w-full h-full flex items-center justify-center p-6">
                         {content?.infographic_url ? (
                           <div className="relative group/img w-full h-full flex items-center justify-center">
                              <img 
                                src={content.infographic_url} 
                                alt="Visual Mind Map" 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                <a href={content.infographic_url} target="_blank" rel="noreferrer" className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                                  <ImageIcon className="text-white w-8 h-8" />
                                </a>
                              </div>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center gap-4 text-slate-500">
                              <Network className="w-16 h-16 opacity-20" />
                              <p>Generating interactive map...</p>
                           </div>
                         )}
                       </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-12">
                         <div className="flex items-center gap-4">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`w-2 bg-blue-500 rounded-full transition-all duration-500 ${isPlaying ? 'h-24 animate-pulse' : 'h-8'}`} style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                         </div>
                         <div className="text-center space-y-2">
                            <h4 className="text-2xl font-bold text-white">{t('inclusive.narrated_by', 'Narrated by ElectraLens AI')}</h4>
                            <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
                               {t('inclusive.language_label', 'Language')}: {i18n.language === 'en' ? 'English' : i18n.language.toUpperCase()}
                            </p>
                         </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-8 bg-white/5 border-t border-white/10 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={loading || !content?.audio_url}
                      className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                    </button>
                    {content?.audio_url && isPlaying && (
                       <audio autoPlay onEnded={() => setIsPlaying(false)} className="hidden">
                          <source src={content.audio_url} type="audio/mpeg" />
                       </audio>
                    )}
                    <button className="p-4 rounded-full border border-white/10 text-slate-400 hover:text-white transition-colors">
                      <Repeat className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
                      <Download className="w-3 h-3" /> {t('inclusive.transcript', 'Transcript')}
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
                      <Captions className="w-3 h-3" /> {t('inclusive.sign_language', 'Sign Language')}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-blue-500 transition-all duration-[2000ms] ${isPlaying ? 'w-full' : 'w-0'}`} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{isPlaying ? t('inclusive.playing', 'Playing...') : '0:00'}</span>
                    <span>{activeModule.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 text-slate-500">
               <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Eye className="w-10 h-10 opacity-20" />
               </div>
               <div>
                 <p className="text-xl font-bold text-slate-400">{t('inclusive.ready_learn', 'Ready to Learn?')}</p>
                 <p className="max-w-sm mx-auto mt-2 text-balance">{t('inclusive.ready_learn_desc', 'Select a module from the left to generate immersive, AI-powered civic content tailored to your language and persona.')}</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Classroom/Educator Mode Prompt */}
      <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-400" />
           </div>
           <div>
              <h4 className="font-bold text-white">{t('inclusive.educator_title', 'Educator / Classroom Mode')}</h4>
              <p className="text-sm text-slate-400">{t('inclusive.educator_desc', 'Sync audio narration with group-view mind maps and discussion pause points.')}</p>
           </div>
        </div>
        <button className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
           {t('inclusive.activate_group', 'Activate Group Session')} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
