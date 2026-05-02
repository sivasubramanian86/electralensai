import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCircle, 
  Dices, 
  Settings2, 
  ChevronRight, 
  RotateCcw, 
  Loader2,
  Sparkles
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAgentStream } from '../../../hooks/useAgentStream';
import ReactMarkdown from 'react-markdown';

/**
 * SimulationEngine — Interactive Role-Play and "What-If" Scenario Generator.
 * 
 * Leverages Google Gemini to create immersive election-day simulations,
 * allowing users to experience the process as voters, officials, or leaders.
 */
export function SimulationEngine() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'menu' | 'training' | 'scenario' | 'whatif'>('menu');
  const { output, status, activeAgent, submit, reset } = useAgentStream();
  const [userAction, setUserAction] = useState('');

  const handleStartMode = (selectedMode: 'training' | 'scenario' | 'whatif', title: string) => {
    setMode(selectedMode);
    submit(
      `Start a new interactive module: ${title}. Provide a brief setup scenario and give me 2 options to choose from. Make it engaging and election-focused.`,
      'IN',
      'simulation',
      i18n.language.split('-')[0]
    );
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAction.trim() || status === 'loading' || status === 'streaming') return;
    
    submit(
      `I choose: "${userAction}". Tell me the consequence of this choice and present the next step in the scenario with 2 new options.`,
      'IN',
      'simulation',
      i18n.language.split('-')[0]
    );
    setUserAction('');
  };

  if (mode === 'menu') {
    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col space-y-12 animate-in fade-in duration-1000">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-bold text-white tracking-tight">{t('simulation.title', 'Play Democracy')}</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {t('simulation.subtitle', 'Experience the election process through immersive role-play and "what-if" scenarios powered by AI.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 'training', title: 'Booth Training', icon: UserCircle, desc: 'A step-by-step walkthrough of voting day.', color: 'blue' },
            { id: 'scenario', title: 'Role-Play', icon: Dices, desc: 'Play as a Commissioner and handle real incidents.', color: 'violet' },
            { id: 'whatif', title: 'What-If Engine', icon: Settings2, desc: 'Change election rules and see what happens.', color: 'emerald' }
          ].map((m: {id: string, title: string, icon: LucideIcon, desc: string, color: string}) => (
            <button 
              key={m.id}
              onClick={() => handleStartMode(m.id as 'training' | 'scenario' | 'whatif', m.title)}
              className="glass p-8 rounded-3xl border border-white/5 hover:border-white/20 hover:bg-white/[0.08] transition-all group text-left space-y-6"
            >
              <div className={`w-14 h-14 rounded-2xl bg-${m.color}-500/10 flex items-center justify-center border border-${m.color}-500/20 group-hover:scale-110 transition-transform`}>
                <m.icon className={`w-7 h-7 text-${m.color}-400`} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">{t(`simulation.modes.${m.id}.title`, m.title)}</h3>
                <p className="text-slate-400 leading-relaxed">{t(`simulation.modes.${m.id}.desc`, m.desc)}</p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-blue-400 font-bold text-sm">
                {t('simulation.start_module', 'Start AI Module')} <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500 flex flex-col h-full">
      <div className="flex justify-between items-center">
         <button 
           onClick={() => {
              setMode('menu');
              reset();
           }}
           className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl"
         >
           <RotateCcw className="w-4 h-4" /> {t('simulation.back_menu', 'Back to Menu')}
         </button>
         {activeAgent && (
           <span className="text-xs font-bold bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full border border-violet-500/30 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
             {t('simulation.game_master', 'AI Game Master')}
           </span>
         )}
      </div>

      <div className="flex-1 glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 flex flex-col relative overflow-hidden h-[600px]">
         <div className="flex-1 overflow-y-auto pr-4 mb-6 text-slate-300 markdown-body custom-scrollbar">
            {output ? (
               <ReactMarkdown>{output}</ReactMarkdown>
            ) : (
               <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  <p>{t('simulation.generating', 'Generating dynamic scenario...')}</p>
               </div>
            )}
         </div>

         {/* Interaction Input */}
         <div className="mt-auto pt-6 border-t border-white/10">
            <form onSubmit={handleActionSubmit} className="relative">
               <input 
                  type="text" 
                  value={userAction}
                  onChange={(e) => setUserAction(e.target.value)}
                  disabled={status === 'loading' || status === 'streaming' || status === 'idle'}
                  placeholder={t('simulation.input_placeholder', 'Type your action or choice here...')}
                  className="w-full bg-navy-900 border border-white/10 rounded-2xl py-4 pl-6 pr-32 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
               />
               <button 
                  type="submit"
                  disabled={!userAction.trim() || status === 'loading' || status === 'streaming'}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
               >
                  {status === 'loading' || status === 'streaming' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> {t('simulation.go_button', 'Go')}</>}
               </button>
            </form>
            <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest">
               {t('simulation.footer_note', 'Powered by Google Gemini — Actions influence the generated storyline.')}
            </p>
         </div>
      </div>
    </div>
  );
}
