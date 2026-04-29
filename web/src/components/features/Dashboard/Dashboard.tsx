/**
 * Dashboard — Cinematic Journey Hub with Gamified Quest System.
 *
 * NON-PARTISAN: All civic education, no party/candidate promotion.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Users,
  MapPin,
  ShieldCheck,
  Calendar,
  Sparkles,
  BookOpen,
  Gamepad2,
  ChevronRight,
  Play,
  Trophy,
  Flame,
  Star,
  Zap,
  Target,
  CheckCircle2,
  Lock,
  BarChart3,
  ScrollText,
  Mic,
  Bookmark,
} from 'lucide-react';
import type { UseGamificationResult } from '../../../hooks/useGamification';

interface DashboardProps {
  gamification: UseGamificationResult;
  onNavigate: (tab: string) => void;
}

const journeyChapters = [
  {
    id: 'ch1',
    tab: 'ballot',
    chapterNum: 1,
    title: 'Get on the Voter List',
    desc: 'Understand registration, voter ID documents, and how to check your name on rolls.',
    xp: 50,
    badge: 'voter_registration_pro',
    icon: ShieldCheck,
    color: 'blue',
  },
  {
    id: 'ch2',
    tab: 'timeline',
    chapterNum: 2,
    title: 'The Election Countdown',
    desc: 'Follow the 5 phases — Announcement → Nomination → Campaign → Polling → Results.',
    xp: 75,
    badge: 'timeline_explorer',
    icon: Calendar,
    color: 'emerald',
  },
  {
    id: 'ch3',
    tab: 'simulation',
    chapterNum: 3,
    title: 'Play Democracy',
    desc: 'Step into a polling booth simulation. Handle real scenarios as a Booth Officer.',
    xp: 80,
    badge: 'counting_room_insider',
    icon: Gamepad2,
    color: 'violet',
  },
  {
    id: 'ch4',
    tab: 'rumor',
    chapterNum: 4,
    title: 'Myth-Buster Mission',
    desc: 'Fact-check 3 viral election claims and learn to verify them yourself.',
    xp: 60,
    badge: 'myth_buster',
    icon: ShieldCheck,
    color: 'rose',
  },
  {
    id: 'ch5',
    tab: 'knowledge',
    chapterNum: 5,
    title: 'Constitution Explorer',
    desc: 'Read 5 constitutional articles and understand your rights and duties.',
    xp: 100,
    badge: 'constitution_explorer',
    icon: ScrollText,
    color: 'amber',
  },
  {
    id: 'ch6',
    tab: 'data',
    chapterNum: 6,
    title: 'Data Detective',
    desc: 'Explore electoral statistics: turnout trends, seat distribution, and demographics.',
    xp: 60,
    badge: 'data_detective',
    icon: BarChart3,
    color: 'cyan',
  },
  {
    id: 'ch7',
    tab: 'learning_lab',
    chapterNum: 7,
    title: 'Learning Lab',
    desc: 'Test your knowledge with interactive quizzes and civic flashcards.',
    xp: 50,
    badge: 'civic_scholar',
    icon: Bookmark,
    color: 'emerald',
  },
  {
    id: 'ch8',
    tab: 'inclusive',
    chapterNum: 8,
    title: 'Inclusive Learning Hub',
    desc: 'Explore audio stories, visual mind maps, and accessibility-first civic content.',
    xp: 40,
    badge: null,
    icon: Mic,
    color: 'indigo',
  },
];

const quests = [
  {
    id: 'q1',
    title: 'Name Check Challenge',
    desc: 'Can you list the 3 main documents needed to vote in India?',
    hint: 'Think: Voter ID, Aadhaar, Passport — which are on the ECI approved list?',
    xp: 15,
    tab: 'ballot',
  },
  {
    id: 'q2',
    title: 'Timeline Detective',
    desc: 'What does MCC stand for, and when does it come into force?',
    hint: 'Model Code of Conduct — it starts the moment elections are announced.',
    xp: 15,
    tab: 'timeline',
  },
  {
    id: 'q4',
    title: 'Quiz Whiz',
    desc: 'Score 100% on a civic basics quiz.',
    hint: 'Review the registration and ID guide before starting!',
    xp: 25,
    tab: 'learning_lab',
  },
  {
    id: 'q3',
    title: 'Data Explorer Quest',
    desc: 'Which Indian state historically has the highest voter turnout?',
    hint: 'Look at the North-East — states like Manipur and Tripura often top 80%.',
    xp: 20,
    tab: 'data',
  },
];

const personas = [
  {
    id: 'voter',
    name: 'First-Time Voter',
    icon: Sparkles,
    desc: 'Walk through your journey from registration to results.',
    suggestedStart: 'ch1',
  },
  {
    id: 'student',
    name: 'Student / Educator',
    icon: BookOpen,
    desc: 'Explore deep civics, role-plays, and simulations.',
    suggestedStart: 'ch5',
  },
  {
    id: 'official',
    name: 'Civic Leader',
    icon: Gamepad2,
    desc: 'Run mock elections and test your decision-making skills.',
    suggestedStart: 'ch3',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Dashboard({ gamification, onNavigate }: DashboardProps) {
  const { t } = useTranslation();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [shownHint, setShownHint] = useState<string | null>(null);

  const completedChapterIds = gamification.completedChapters;
  const totalChapters = journeyChapters.length;
  const completedCount = completedChapterIds.filter((id) =>
    journeyChapters.some((c) => c.id === id),
  ).length;
  const progressPercent = Math.round((completedCount / totalChapters) * 100);

  const stats = [
    { label: 'Citizens Trained', value: '1.2M', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Education Reach', value: '84%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Fact-Checks Done', value: '12.5K', icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Training Centers', value: '450', icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">

      {/* Welcome Header + Gamification Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.title', 'Voter Awareness Hub')}</h2>
          <p className="text-slate-400 mt-1">{t('dashboard.subtitle', 'Your cinematic guide to understanding and participating in democracy.')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* XP Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">{gamification.xp} XP</span>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-300">{gamification.streak} day streak</span>
          </div>
          {/* Date */}
          <div className="flex items-center gap-2 bg-navy-900 border border-white/10 px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">
              {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Journey Progress Bar */}
      <div className="glass p-5 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Civic Journey Progress</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-amber-400">{completedCount}/{totalChapters} Chapters</span>
            <span className="text-[10px] font-mono text-slate-500">{progressPercent}% complete</span>
          </div>
        </div>
        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {gamification.badges.filter((b) => b.unlocked).map((b) => (
            <span key={b.id} title={b.label} className="text-base cursor-help">{b.icon}</span>
          ))}
          {gamification.badges.filter((b) => b.unlocked).length === 0 && (
            <span className="text-[10px] text-slate-600">Complete chapters to unlock badges</span>
          )}
        </div>
      </div>

      {/* Persona Selection */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Choose Your Journey</h3>
          <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Select a Persona</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" role="list" aria-label="Persona selection">
          {personas.map((p) => (
            <button
              key={p.id}
              role="listitem"
              aria-label={`Select ${p.name} journey: ${p.desc}`}
              aria-pressed={selectedPersona === p.id}
              onClick={() => {
                setSelectedPersona(p.id);
                gamification.awardXP(5);
                // Navigate to suggested start chapter
                const chapter = journeyChapters.find(c => c.id === p.suggestedStart);
                if (chapter) onNavigate(chapter.tab);
              }}
              className={`group relative text-left p-6 rounded-3xl border transition-all duration-500 overflow-hidden ${
                selectedPersona === p.id
                  ? 'bg-blue-600 border-blue-500 scale-[1.02] shadow-2xl shadow-blue-500/20'
                  : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/[0.08]'
              }`}
            >
              <div className={`p-3 rounded-2xl inline-block mb-4 transition-colors ${selectedPersona === p.id ? 'bg-white/20' : 'bg-blue-500/10'}`}>
                <p.icon className={`w-6 h-6 ${selectedPersona === p.id ? 'text-white' : 'text-blue-400'}`} />
              </div>
              <h4 className={`text-lg font-bold mb-2 transition-colors ${selectedPersona === p.id ? 'text-white' : 'text-slate-100'}`}>{p.name}</h4>
              <p className={`text-sm leading-relaxed transition-colors ${selectedPersona === p.id ? 'text-blue-50/80' : 'text-slate-400'}`}>{p.desc}</p>
              <div className={`absolute bottom-6 right-6 transition-all duration-500 ${selectedPersona === p.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Cinematic Journey Chapters */}
      <section className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">The Election Storyline</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list" aria-label="Election storylines">
          {journeyChapters.map((chapter, idx) => {
            const isCompleted = completedChapterIds.includes(chapter.id);
            const isLocked = idx > 0 && !completedChapterIds.includes(journeyChapters[idx - 1].id) && !isCompleted;
            const Icon = chapter.icon;

            return (
              <button
                key={chapter.id}
                role="listitem"
                aria-label={`Chapter ${chapter.chapterNum}: ${chapter.title}. ${chapter.desc}. ${isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Available'}`}
                onClick={() => {
                  if (!isLocked) {
                    gamification.completeChapter(chapter.id);
                    if (chapter.badge) gamification.unlockBadge(chapter.badge);
                    onNavigate(chapter.tab);
                  }
                }}
                disabled={isLocked}
                className={`relative text-left p-5 rounded-2xl border transition-all group ${
                  isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                    : isLocked
                    ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/[0.08] hover:scale-[1.02]'
                } transition-all duration-300`}
              >
                {/* Chapter Icon */}
                <div className={`w-10 h-10 rounded-xl bg-${chapter.color}-500/10 border border-${chapter.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {isLocked ? (
                    <Lock className="w-5 h-5 text-slate-600" />
                  ) : isCompleted ? (
                    <CheckCircle2 className={`w-5 h-5 text-${chapter.color}-400`} />
                  ) : (
                    <Icon className={`w-5 h-5 text-${chapter.color}-400`} />
                  )}
                </div>

                {/* Chapter Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      Chapter {chapter.chapterNum}
                    </span>
                    <span className={`text-[9px] font-bold text-${chapter.color}-400`}>+{chapter.xp} XP</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-tight">{chapter.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{chapter.desc}</p>
                </div>

                {/* CTA */}
                {!isLocked && !isCompleted && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Start Chapter
                  </div>
                )}
                {isCompleted && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Completed
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Quests / Challenges */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Active Quests</h3>
          <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {quests.length} quests available
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="glass p-5 rounded-2xl border border-amber-500/15 hover:border-amber-500/30 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold text-amber-400">+{quest.xp} XP</span>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Challenge</p>
                <h4 className="text-sm font-bold text-white">{quest.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{quest.desc}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setExpandedQuest(expandedQuest === quest.id ? null : quest.id);
                    setShownHint(null);
                  }}
                  aria-label={`Reveal hint for ${quest.title}`}
                  aria-expanded={expandedQuest === quest.id}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold hover:bg-amber-500/20 transition-all"
                >
                  Reveal Hint
                </button>
                <button
                  onClick={() => {
                    gamification.awardXP(quest.xp);
                    onNavigate(quest.tab);
                  }}
                  aria-label={`Explore ${quest.title}`}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all"
                >
                  Go Explore
                </button>
              </div>
              {expandedQuest === quest.id && (
                <div
                  onMouseEnter={() => setShownHint(quest.id)}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 animate-in slide-in-from-top-2 duration-200 cursor-pointer"
                >
                  <p className="text-[11px] text-amber-400/80">
                    {shownHint === quest.id ? quest.hint : '👆 Hover to reveal answer...'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-6 border-t border-white/5">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/15 transition-all group cursor-default">
            <div className={`p-3 rounded-xl ${stat.bg} w-fit`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="p-5 rounded-2xl bg-blue-600/5 border border-blue-500/20">
        <p className="text-sm font-bold text-blue-400 mb-2">What you can do next</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '1. Start Chapter 1 → Voter Registration', tab: 'ballot' },
            { label: '2. Explore Election Timeline', tab: 'timeline' },
            { label: '3. Try the Data Explorer', tab: 'data' },
            { label: '4. Read Constitutional Articles', tab: 'knowledge' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.tab)}
              className="px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-600/20 transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
