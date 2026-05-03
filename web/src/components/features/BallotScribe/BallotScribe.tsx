import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  UserCheck, 
  Fingerprint, 
  MapPin, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAgentStream } from '../../../hooks/useAgentStream';
import ReactMarkdown from 'react-markdown';

const readinessSteps = [
  { id: 1, title: "Identity Proof", icon: Fingerprint, desc: "Aadhaar, Voter ID, or other valid government photo ID.", status: "compulsory" },
  { id: 2, title: "Registration Status", icon: UserCheck, desc: "Check if your name is on the electoral roll.", status: "compulsory" },
  { id: 3, title: "Locate Booth", icon: MapPin, desc: "Find your assigned polling station and serial number.", status: "recommended" },
  { id: 4, title: "Forms & Affidavits", icon: FileText, desc: "Review candidate profiles and required declarations.", status: "recommended" }
];

/**
 * BallotScribe — Voter Readiness and Document Verification Module.
 * 
 * Provides a step-by-step guide for voters to prepare identity proof,
 * check registration status, and locate polling booths using AI coaching.
 */
export function BallotScribe() {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const { output, activeAgent, submit } = useAgentStream();
  
  const ActiveIcon = activeStep ? readinessSteps.find(s => s.id === activeStep)?.icon : null;
  const activeStepDetails = activeStep ? readinessSteps.find(s => s.id === activeStep) : null;

  useEffect(() => {
    if (activeStepDetails) {
      // Trigger the ReadinessCoach agent with a localized prompt
      const localizedTitle = t(`ballot.steps.s${activeStep}.title`, activeStepDetails.title);
      const localizedDesc = t(`ballot.steps.s${activeStep}.desc`, activeStepDetails.desc);
      
      submit(
        t('ballot.agent_prompt', { title: localizedTitle, desc: localizedDesc }),
        'IN',
        'ballot',
        i18n.language.split('-')[0]
      );
    }
  }, [activeStep, submit, activeStepDetails, i18n.language, t]);

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col space-y-8 animate-in fade-in duration-1000">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-white tracking-tight">{t('ballot.title', 'Voter Readiness Guide')}</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            {t('ballot.subtitle', 'Ensure you have everything ready before you head to the polling booth. No surprises, just a smooth voting experience.')}
          </p>
        </div>
        <div className="hidden md:flex gap-4">
           <div className="px-6 py-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex flex-col">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{t('ballot.readiness_score', 'Your Readiness')}</span>
              <div className="flex items-end gap-2">
                 <span className="text-3xl font-bold text-white">75%</span>
                 <span className="text-xs text-slate-500 mb-1">{t('ballot.ready_label', 'Ready')}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Step List */}
        <div className="space-y-4 overflow-y-auto pr-2">
          {readinessSteps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-300 group relative overflow-hidden ${
                activeStep === step.id 
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl scale-[1.02]' 
                  : 'bg-navy-900/50 border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start gap-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                  activeStep === step.id ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-slate-400 border-white/10 group-hover:border-white/20'
                }`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      step.status === 'compulsory' ? 'text-red-400' : 'text-emerald-400'
                     }`}>{t(`ballot.status.${step.status}`, step.status)}</span>
                     {activeStep === step.id && <CheckCircle2 className="w-5 h-5 text-blue-400 animate-in zoom-in" />}
                  </div>
                  <h3 className="text-xl font-bold text-white">{t(`ballot.steps.s${step.id}.title`, step.title)}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{t(`ballot.steps.s${step.id}.desc`, step.desc)}</p>
                </div>
              </div>
              
              {/* Decorative accent for active state */}
              {activeStep === step.id && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Detailed Action Panel */}
        <div className="glass rounded-[3rem] border border-white/10 p-10 flex flex-col items-center justify-center text-left relative overflow-hidden h-full">
          {activeStep && ActiveIcon ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 w-full h-full flex flex-col">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg">
                        <ActiveIcon className="w-6 h-6 text-blue-400" />
                     </div>
                     <h3 className="text-2xl font-bold text-white">{t(`ballot.steps.s${activeStep}.title`, activeStepDetails?.title || '')}</h3>
                  </div>
                  {activeAgent && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      {activeAgent}
                    </span>
                  )}
               </div>
               
               <div className="flex-1 overflow-y-auto p-5 bg-white/5 rounded-2xl border border-white/5 text-slate-300 markdown-body">
                  {output ? (
                     <ReactMarkdown>{output}</ReactMarkdown>
                  ) : (
                     <div className="space-y-4 animate-pulse">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <p className="text-blue-400 font-bold mb-1">{t('ballot.quick_tip', 'Quick Tip')}:</p>
                          <p className="text-slate-300 italic">{t(`ballot.steps.s${activeStep}.desc`, activeStepDetails?.desc || '')}</p>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                          <Loader2 className="w-4 h-4 animate-spin" /> 
                          {t('ballot.consulting_agent', 'Consulting the ElectraLens agent for your personalized guide...')}
                        </div>
                     </div>
                  )}
               </div>

               <div className="pt-4 grid grid-cols-2 gap-4">
                  <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2">
                     {t('ballot.actions.verify_online', 'Verify Online')} <ExternalLink className="w-4 h-4" />
                  </button>
                  <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition-all">
                     {t('ballot.actions.download_guide', 'Download Guide')}
                  </button>
               </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                 <HelpCircle className="w-8 h-8 text-slate-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-400">{t('ballot.select_step', 'Select a Step')}</h3>
                <p className="text-slate-500 max-w-xs mx-auto">{t('ballot.select_step_desc', 'Choose a readiness item from the left to see detailed requirements verified by our AI Coach.')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
