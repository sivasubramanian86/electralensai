import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  BellRing,
  Play,
  BookOpen,
  Users,
  Megaphone,
  CheckSquare,
  Trophy,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Volume2,
  Video,
  ExternalLink
} from 'lucide-react';
import { useAgentStream } from '../../../hooks/useAgentStream';
import { useMultimedia } from '../../../hooks/useMultimedia';
import ReactMarkdown from 'react-markdown';

const electionPhases = [
  {
    id: 1,
    title: 'Announcement',
    icon: BellRing,
    color: 'blue',
    desc: 'The official dates are declared. The Model Code of Conduct (MCC) kicks in the moment the announcement is made. No new government schemes can be announced after this.',
    keyActors: 'Election Commission of India, President/Governor',
    yourMission: 'Watch for the official announcement and mark the Silence Period (48h before polling) on your calendar.',
    didYouKnow: 'The MCC has no statutory backing — it relies entirely on moral authority and voluntary compliance by political parties.',
  },
  {
    id: 2,
    title: 'Registration',
    icon: Users,
    color: 'emerald',
    desc: 'This is your last window to get your name on the Electoral Roll. No name, no vote. Check the NVSP portal or visit your local ERO (Electoral Registration Officer).',
    keyActors: 'Electoral Registration Officers, Local Governments, NVSP Portal',
    yourMission: 'Search your name on voters.eci.gov.in. If missing, file Form 6 immediately.',
    didYouKnow: 'India has ~970 million registered voters — the largest democratic electorate on Earth.',
  },
  {
    id: 3,
    title: 'Campaigning',
    icon: Megaphone,
    color: 'violet',
    desc: 'Candidates file nomination papers. After scrutiny and withdrawal windows, the final candidate list is published. Campaigns run until the Silence Period 48 hours before polls open.',
    keyActors: 'Candidates, Political Parties, Returning Officers',
    yourMission: 'Review candidate affidavits (assets, criminal cases) — they are public documents published by the ECI.',
    didYouKnow: 'The Silence Period was introduced to prevent last-minute voter influence and allow voters to decide independently.',
  },
  {
    id: 4,
    title: 'Polling Day',
    icon: Play,
    color: 'orange',
    desc: 'The moment of choice. Typically 7 AM to 6 PM. Bring your Voter ID or any of the 12 approved alternate IDs. Your vote is secret — no one can compel you to reveal your choice.',
    keyActors: 'Presiding Officers, Polling Agents, EVM Technicians, CAPF Personnel',
    yourMission: 'Locate your booth (via the Voter Helpline App), carry approved ID, and cast your VVPAT-backed vote.',
    didYouKnow: 'EVMs are not connected to any network. They are standalone devices — internet-based tampering is technically impossible.',
  },
  {
    id: 5,
    title: 'Counting & Results',
    icon: Trophy,
    color: 'amber',
    desc: 'Votes are counted in Counting Centres by Counting Supervisors and Assistants under strict ECI oversight. Results are declared Constituency by Constituency.',
    keyActors: 'Returning Officers, Counting Agents, Election Observers',
    yourMission: 'Watch the live results on the ECI\'s official results portal — not just media channels that may call premature trends.',
    didYouKnow: 'VVPAT slips from 5 randomly selected EVMs per constituency are now mandatorily cross-verified against the EVM count.',
  },
];

export function TimelineArchitect() {
  const { t, i18n } = useTranslation();
  const [activePhase, setActivePhase] = useState(1);
  const exploredRef = useRef<Set<number>>(new Set([1]));
  const { output, activeAgent, submit } = useAgentStream();
  const { generateContent, content: multimedia, loading: multimediaLoading } = useMultimedia();
  const [showAiInsights, setShowAiInsights] = useState(false);

  useEffect(() => {
    exploredRef.current.add(activePhase);
    setShowAiInsights(false); // Reset AI insights panel when changing phase
  }, [activePhase]);

  const phase = electionPhases[activePhase - 1];
  const PhaseIcon = phase.icon;

  const handleLearnMore = () => {
    setShowAiInsights(true);
    submit(
      `Provide a detailed overview of the election phase: ${phase.title}. Explain the key mechanics, typical timeline duration, and the role of the ${phase.keyActors}. Include an ASCII process graph.`,
      'IN',
      'timeline',
      i18n.language.split('-')[0]
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
            <BookOpen className="text-blue-400 w-8 h-8" />
            {t('timeline.title', 'Election Journey Storyboard')}
          </h2>
          <p className="text-slate-400 mt-2">
            {t('timeline.subtitle', 'Scrub through the 5 chapters of an election to understand the mechanics of democracy.')}
          </p>
        </div>
        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all">
          <BellRing className="w-4 h-4 text-blue-400" /> Sync to My Calendar
        </button>
      </div>

      {/* Scrubbable Phase Selector */}
      <div className="relative pt-12 pb-8">
        <div className="absolute top-[4.5rem] left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-amber-500/20 -z-10" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {electionPhases.map((p) => {
            const Icon = p.icon;
            const explored = exploredRef.current.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className="flex flex-col items-center gap-4 group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                  activePhase === p.id
                    ? `bg-${p.color}-600 border-${p.color}-400 scale-110 shadow-2xl shadow-${p.color}-500/40`
                    : explored
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-navy-950 border-white/10 group-hover:border-white/30'
                }`}>
                  <Icon className={`w-6 h-6 ${activePhase === p.id ? 'text-white' : explored ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${activePhase === p.id ? `text-${p.color}-400` : 'text-slate-500'}`}>
                    Chapter {p.id}
                  </p>
                  <p className={`text-sm font-bold ${activePhase === p.id ? 'text-white' : 'text-slate-400'}`}>
                    {p.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Phase Narrative Card */}
        <div className="lg:col-span-2 glass rounded-3xl border border-white/10 p-8 flex flex-col space-y-6 relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <PhaseIcon className="w-48 h-48" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-start">
               <h3 className="text-2xl font-bold text-white">
                 {t('timeline.phase_heading', 'What happens during')} <span className={`text-${phase.color}-400`}>{t(`timeline.phases.${phase.id}.title`, phase.title)}</span>?
               </h3>
               {activeAgent && showAiInsights && (
                 <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                   {activeAgent} Active
                 </span>
               )}
            </div>
            {!showAiInsights && (
               <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">{phase.desc}</p>
            )}
          </div>

          {!showAiInsights ? (
            <>
              {/* Did You Know */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15">
                <p className="text-xs font-bold text-blue-400 mb-1">Did You Know?</p>
                <p className="text-sm text-slate-400 leading-relaxed">{phase.didYouKnow}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Key Actors</h4>
                  <p className="text-sm text-slate-400">{phase.keyActors}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Your Mission</h4>
                  <p className="text-sm text-slate-400">{phase.yourMission}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center gap-4">
                <button 
                  onClick={handleLearnMore}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Sparkles className="w-4 h-4" /> Deep Dive with AI Guide
                </button>
                {activePhase < 5 && (
                  <button
                    onClick={() => setActivePhase((prev) => Math.min(prev + 1, 5))}
                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold transition-all"
                  >
                    Next Chapter →
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col space-y-4 h-96 relative z-10 animate-in fade-in zoom-in-95 duration-300">
               <div className="flex-1 overflow-y-auto p-6 bg-navy-900/50 rounded-2xl border border-white/5 text-slate-300 markdown-body custom-scrollbar">
                  {output ? (
                     <ReactMarkdown>{output}</ReactMarkdown>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 italic">
                       <Loader2 className="w-8 h-8 animate-spin text-blue-400" /> 
                       <p>Synthesizing granular chapter insights...</p>
                     </div>
                  )}
               </div>
               <button 
                  onClick={() => setShowAiInsights(false)}
                  className="py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-slate-300 transition-all text-sm"
               >
                  Close AI Insights
               </button>
            </div>
          )}
        </div>

        {/* MultiModal Inclusive Learning Section */}
        <div className="lg:col-span-3 glass rounded-3xl border border-blue-500/20 p-8 bg-blue-500/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Sparkles className="text-blue-400 w-6 h-6" />
                {t('multimodal.title', 'Inclusive Learning Experience')}
              </h3>
              <p className="text-sm text-slate-400">
                {t('multimodal.subtitle', 'Generate infographics, audio guides, and videos for an accessible journey.')}
              </p>
            </div>
            <button 
              onClick={() => generateContent(phase.title, i18n.language.split('-')[0])}
              disabled={multimediaLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              {multimediaLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('multimodal.generating', 'Generating Assets...')}
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  {t('multimodal.button', 'Generate MultiModal Pack')}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Infographic Card */}
            <div className="p-6 rounded-2xl bg-navy-900/50 border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-blue-400 font-bold text-sm">
                <ImageIcon className="w-4 h-4" /> Visual Infographic
              </div>
              <div className="aspect-square rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 group relative">
                {multimedia?.infographic_url ? (
                  <>
                    <img src={multimedia.infographic_url} alt="Infographic" className="w-full h-full object-cover" />
                    <a href={multimedia.infographic_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink className="text-white" />
                    </a>
                  </>
                ) : (
                  <p className="text-slate-600 text-xs italic text-center p-4">Click generate to build a custom visual guide for this phase.</p>
                )}
              </div>
            </div>

            {/* Audio Guide Card */}
            <div className="p-6 rounded-2xl bg-navy-900/50 border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
                <Volume2 className="w-4 h-4" /> Audio Walkthrough
              </div>
              <div className="space-y-4">
                {multimedia?.audio_url ? (
                  <div className="py-4">
                    <audio key={multimedia.audio_url} controls className="w-full h-10 accent-blue-500">
                      <source src={multimedia.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : (
                  <div className="h-32 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <p className="text-slate-600 text-xs italic text-center p-4 text-balance">Listen to the story of this phase in your local language.</p>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-500/70 leading-relaxed">
                  Tip: Use headphones for an immersive spatial audio experience of the election process.
                </div>
              </div>
            </div>

            {/* Video Tutorial Card */}
            <div className="p-6 rounded-2xl bg-navy-900/50 border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-violet-400 font-bold text-sm">
                <Video className="w-4 h-4" /> Video Explainer
              </div>
              <div className="aspect-video rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 relative group">
                {multimedia?.video_url ? (
                  <iframe 
                    className="w-full h-full"
                    src={multimedia.video_url}
                    title="Video guide"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <p className="text-slate-600 text-xs italic text-center p-4">Cinematic video tutorials are generated on demand based on your persona.</p>
                )}
              </div>
              <p className="text-[10px] text-slate-500 italic text-center">
                Videos are optimized for low-bandwidth mobile networks.
              </p>
            </div>
          </div>
        </div>

        {/* Critical Milestones */}
        <div className="glass rounded-3xl border border-white/10 p-8 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Critical Milestones
          </h3>
          <div className="space-y-8 flex-1 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/5" />
            {[
              { id: 1, title: 'Voter Roll Draft', date: 'Jan 15', status: 'done' },
              { id: 2, title: 'Final List Public', date: 'Feb 10', status: 'done' },
              { id: 3, title: 'Registration Ends', date: 'Mar 15', status: 'active' },
              { id: 4, title: 'Nomination Deadline', date: 'Apr 01', status: 'pending' },
              { id: 5, title: 'Polling Day', date: 'May 10', status: 'pending' },
              { id: 6, title: 'Results Day', date: 'May 13', status: 'pending' },
            ].map((step) => (
              <div key={step.id} className="relative flex gap-6 items-start">
                <div className={`w-6 h-6 rounded-full border-4 z-10 flex-shrink-0 transition-all duration-500 ${
                  step.status === 'done'
                    ? 'bg-emerald-500 border-emerald-500/20'
                    : step.status === 'active'
                    ? 'bg-blue-600 border-blue-500/20 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                    : 'bg-navy-950 border-white/10'
                }`}>
                  {step.status === 'done' && <CheckSquare className="w-3 h-3 text-white absolute inset-0 m-auto" />}
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-bold ${step.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs font-mono text-slate-500 uppercase">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
