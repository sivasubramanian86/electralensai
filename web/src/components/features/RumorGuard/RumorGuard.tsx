import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  Search, 
  Flame,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAgentStream } from '../../../hooks/useAgentStream';
import ReactMarkdown from 'react-markdown';

const trendingMyths = [
  {
    id: 1,
    claim: "You can vote using your digital Aadhaar card on Digilocker.",
    verdict: "TRUE",
    time: "10 mins ago"
  },
  {
    id: 2,
    claim: "Polling booths are closing 2 hours early due to unexpected rain.",
    verdict: "FALSE",
    time: "1 hour ago"
  },
  {
    id: 3,
    claim: "Voting age has been reduced to 16 for student elections.",
    verdict: "MISLEADING",
    time: "2 hours ago"
  }
];

export function RumorGuard() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const { output, status, activeAgent, submit } = useAgentStream();
  const [currentClaim, setCurrentClaim] = useState('');

  const handleSearch = (claimOverride?: string) => {
    const claim = claimOverride || query;
    if (!claim.trim()) return;
    
    setCurrentClaim(claim);
    // Send to agent mesh. The Root orchestrator will route it to MythBuster.
    submit(
      t('rumor.agent_prompt', { claim }), 
      'IN', // India region by default
      'rumor_guard',
      i18n.language.split('-')[0]
    );
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      <div className="text-left space-y-2">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="text-blue-400 w-10 h-10" />
          {t('rumor.title', 'Myth-Buster Companion')}
        </h2>
        <p className="text-slate-400 max-w-2xl">
          {t('rumor.subtitle', "Don't let rumors cloud your decision. We help you verify viral claims against official rules and teach you how to check for yourself.")}
        </p>
      </div>

      {/* Input Section */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        </div>
        <label htmlFor="rumor-search" className="sr-only">{t('rumor.input_label', 'Enter claim to verify')}</label>
        <input
          id="rumor-search"
          type="text"
          className="w-full bg-navy-950 border border-white/10 rounded-3xl py-6 pl-14 pr-32 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-2xl"
          placeholder={t('rumor.placeholder', 'Paste a viral forward or claim here...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={status === 'loading' || status === 'streaming'}
        />
        <button 
          onClick={() => handleSearch()}
          disabled={status === 'loading' || status === 'streaming'}
          aria-label={t('rumor.verify_aria', 'Verify this claim')}
          className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {status === 'loading' || status === 'streaming' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : t('rumor.verify_button', 'Verify')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Left: Detailed Analysis */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="flex-1 glass rounded-3xl border border-white/10 p-8 relative overflow-hidden flex flex-col">
            {(status !== 'idle' || output) ? (
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-500 h-full flex flex-col">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400">
                    {t('rumor.analysis_title', 'LIVE AI ANALYSIS')}
                  </span>
                  {activeAgent && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {t('rumor.agent_label', 'Agent')}: {activeAgent}
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-100 italic">"{currentClaim}"</h3>
                
                <div className="flex-1 overflow-y-auto p-5 bg-white/5 rounded-2xl border border-white/5 markdown-body text-slate-300" aria-live="polite">
                   {output ? (
                      <ReactMarkdown>{output}</ReactMarkdown>
                   ) : (
                      <div className="flex items-center gap-2 text-slate-500 italic">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('rumor.consulting', 'Consulting official election guidelines...')}
                      </div>
                   )}
                </div>

                <div className="pt-6 border-t border-white/5 mt-auto flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('rumor.grounded_note', 'Grounded in Google Search & Official Sources')}</span>
                  </div>
                  <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold">
                    {t('rumor.official_link', 'Official Link')} <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 text-slate-500">
                <ShieldQuestion className="w-16 h-16 opacity-20" />
                <div>
                  <p className="font-bold">{t('rumor.select_claim', 'Enter a claim to begin analysis')}</p>
                  <p className="text-sm max-w-xs mx-auto">{t('rumor.select_claim_desc', 'We use Gemini and live Search to cross-reference with actual election law.')}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Safe Deflection Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-500/80 leading-relaxed">
              <strong>{t('rumor.deflection_title', 'Safe Deflection')}:</strong> {t('rumor.deflection_desc', 'If a topic is too sensitive or results are inconclusive, we will always refer you to your local Election Authority. We prioritize accuracy over instant answers.')}
            </p>
          </div>
        </div>

        {/* Right: Trending Myths */}
        <div className="glass rounded-3xl border border-white/10 flex flex-col overflow-hidden">
          <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Viral Now
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {trendingMyths.map((m) => (
              <button 
                key={m.id}
                onClick={() => {
                   setQuery(t(`rumor.myths.m${m.id}.claim`, m.claim));
                   handleSearch(t(`rumor.myths.m${m.id}.claim`, m.claim));
                }}
                aria-label={`${t(`rumor.myths.m${m.id}.verdict`, m.verdict)}: ${t(`rumor.myths.m${m.id}.claim`, m.claim)}`}
                className="w-full text-left p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-2" aria-hidden="true">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    m.verdict === 'TRUE' ? 'text-emerald-400 bg-emerald-400/10' :
                    m.verdict === 'FALSE' ? 'text-red-400 bg-red-400/10' :
                    'text-amber-400 bg-amber-400/10'
                  }`}>{t(`rumor.myths.m${m.id}.verdict`, m.verdict)}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs font-medium text-slate-300 line-clamp-2">"{t(`rumor.myths.m${m.id}.claim`, m.claim)}"</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
