/**
 * KnowledgeHub — Constitution Explorer, FAQ, and deep-dive reading paths.
 *
 * NON-PARTISAN: Purely educational. Contains constitutional provisions,
 * electoral law FAQs, and civic education references.
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  HelpCircle,
  Search,
  ChevronRight,
  ExternalLink,
  Scale,
  Users,
  Landmark,
  ScrollText,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import type { UseGamificationResult } from '../../../hooks/useGamification';

// ─── Data ──────────────────────────────────────────────────────────────────────

const constitutionArticles = [
  {
    id: 'art324',
    article: 'Article 324',
    title: 'Election Commission of India',
    category: 'Electoral Authority',
    color: 'blue',
    icon: Landmark,
    summary:
      'Vests superintendence, direction, and control of elections in the Election Commission of India (ECI). The ECI is an independent constitutional body.',
    keyPoints: [
      'ECI has full control over elections to Parliament and State Legislatures.',
      'The Chief Election Commissioner can only be removed like a Supreme Court judge.',
      'Election Commissioners are appointed by the President.',
    ],
    deepDive: 'Read full text of Article 324 in the Constitution of India (Part XV, Elections).',
    link: 'https://legislative.gov.in/constitution-of-india/',
    xpId: 'art_324',
  },
  {
    id: 'art326',
    article: 'Article 326',
    title: 'Universal Adult Franchise',
    category: 'Voting Rights',
    color: 'emerald',
    icon: Users,
    summary:
      'Every citizen of India who is 18 years of age or older is entitled to vote, regardless of religion, race, caste, sex, literacy level, or wealth.',
    keyPoints: [
      'Minimum voting age is 18 (amended from 21 by the 61st Amendment, 1988).',
      'Non-residents and persons of unsound mind may be disqualified.',
      'Convicted persons serving sentences may have restrictions.',
    ],
    deepDive: 'Explore how Article 326 defines universal adult suffrage in Part XV.',
    link: 'https://legislative.gov.in/constitution-of-india/',
    xpId: 'art_326',
  },
  {
    id: 'art101',
    article: 'Article 101',
    title: 'Vacation of Seats in Parliament',
    category: 'Parliamentary Rules',
    color: 'violet',
    icon: ScrollText,
    summary:
      'Specifies conditions under which a member\'s seat becomes vacant — such as dual membership, resignation, or prolonged absence.',
    keyPoints: [
      'A person cannot be a member of both Houses simultaneously.',
      'Absent for 60+ consecutive days without permission = seat vacated.',
      'Anti-defection law (10th Schedule) also triggers disqualification.',
    ],
    deepDive: 'Read the 10th Schedule (Anti-Defection Law) added by the 52nd Amendment, 1985.',
    link: 'https://legislative.gov.in/constitution-of-india/',
    xpId: 'art_101',
  },
  {
    id: 'art51a',
    article: 'Article 51A',
    title: 'Fundamental Duties',
    category: 'Civic Duties',
    color: 'amber',
    icon: Shield,
    summary:
      'Lists 11 fundamental duties of every citizen, including the duty to uphold the Constitution, protect the environment, and develop scientific temper.',
    keyPoints: [
      'Added by the 42nd Amendment (1976) — not originally in the Constitution.',
      'Duty to vote is not explicitly listed but is a civic expectation.',
      '11th duty (for parents/guardians re: education) added in 2002.',
    ],
    deepDive: 'Compare Fundamental Rights (Part III) with Fundamental Duties (Part IVA).',
    link: 'https://legislative.gov.in/constitution-of-india/',
    xpId: 'art_51a',
  },
  {
    id: 'art329',
    article: 'Article 329',
    title: 'Bar to Interference in Electoral Matters',
    category: 'Judicial Limits',
    color: 'rose',
    icon: Scale,
    summary:
      'Prohibits courts from questioning the validity of any law relating to delimitation of constituencies or allotment of seats, and from interfering mid-election.',
    keyPoints: [
      'Courts cannot question delimitation orders under Article 327.',
      'Election disputes can only be raised via an Election Petition AFTER results.',
      'This protects election timelines from judicial delays.',
    ],
    deepDive: 'Read together with the Representation of the People Act, 1951.',
    link: 'https://legislative.gov.in/constitution-of-india/',
    xpId: 'art_329',
  },
];

const faqs = [
  {
    id: 'f1',
    question: 'What if my name is missing from the voter list?',
    answer:
      'File Form 6 at your local Electoral Registration Office (ERO) or online via the National Voter Service Portal (NVSP) at voters.eci.gov.in. You can claim registration up to the last date specified in the election schedule.',
    source: 'ECI Official',
  },
  {
    id: 'f2',
    question: 'Can elections be postponed?',
    answer:
      'Yes, but only in exceptional circumstances such as natural disasters, widespread violence, or threats to free and fair elections. The Election Commission has the power to countermand (cancel) and re-schedule elections under Article 324.',
    source: 'ECI Manual, Article 324',
  },
  {
    id: 'f3',
    question: 'What happens in a hung assembly?',
    answer:
      'If no single party wins a majority (50%+1 seats), the Governor (for states) or President (for Parliament) invites the largest party/coalition to form the government. If no stable majority is demonstrated, fresh elections may be called. This is governed by convention and constitutional practice.',
    source: 'Constitution, Convention',
  },
  {
    id: 'f4',
    question: 'What is the Model Code of Conduct (MCC)?',
    answer:
      'The MCC is a set of guidelines issued by the ECI that comes into effect from the date of election announcement. It restricts incumbent governments from announcing new schemes, using state resources for campaigning, and applies to all political parties and candidates.',
    source: 'ECI — Model Code of Conduct',
  },
  {
    id: 'f5',
    question: 'Can I vote using my Aadhaar card?',
    answer:
      'Aadhaar is on the list of 12 acceptable photo IDs. However, your name must be on the electoral roll — Aadhaar alone does not guarantee voting eligibility. The Voter ID (EPIC) is the primary document.',
    source: 'ECI Circular',
  },
  {
    id: 'f6',
    question: 'What is an EVM and is it tamper-proof?',
    answer:
      'Electronic Voting Machines (EVMs) are standalone, non-networked devices. They store votes on a microchip and are factory-sealed. The Supreme Court has upheld their validity multiple times. VVPATs (Voter Verified Paper Audit Trails) provide a physical paper slip for verification.',
    source: 'Supreme Court Judgments, ECI Technical Manual',
  },
  {
    id: 'f7',
    question: 'What is the difference between an MLA and an MP?',
    answer:
      'An MLA (Member of Legislative Assembly) represents a constituency in a State Legislature (Vidhan Sabha). An MP (Member of Parliament) represents a constituency in the Lok Sabha (Lower House) or is elected by state legislators to the Rajya Sabha (Upper House). MLAs make state laws; MPs make national laws.',
    source: 'Constitution, Articles 168–172 and 79–88',
  },
  {
    id: 'f8',
    question: 'How many Lok Sabha constituencies are there?',
    answer:
      'There are 543 elected constituencies (seats) in the Lok Sabha. 2 seats are nominated by the President for the Anglo-Indian community (this practice was discontinued in 2020 via the 104th Amendment). Delimitation of constituencies is done by the Delimitation Commission.',
    source: 'Constitution, Article 81 — Delimitation Commission Act',
  },
];

const readingPaths = [
  {
    id: 'rp1',
    title: 'Election Basics Path',
    steps: ['Article 324 (ECI Powers)', 'Article 326 (Voting Rights)', 'RPA 1951 Basics', 'Model Code of Conduct'],
    difficulty: 'Beginner',
    color: 'emerald',
    xp: 50,
  },
  {
    id: 'rp2',
    title: 'Anti-Defection Deep Dive',
    steps: ['Article 101 (Vacation of Seats)', '10th Schedule (Anti-Defection)', 'Kihoto Hollohan Case 1993', 'Nabam Rebia Case 2016'],
    difficulty: 'Intermediate',
    color: 'blue',
    xp: 100,
  },
  {
    id: 'rp3',
    title: 'Judicial vs Electoral Boundary',
    steps: ['Article 329 (Bar to interference)', 'Article 105 (Parliamentary Privileges)', 'Election Petition Process (RPA 1951, Sec 80)', 'NOTA — Background and Impact'],
    difficulty: 'Advanced',
    color: 'violet',
    xp: 150,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface KnowledgeHubProps {
  gamification: UseGamificationResult;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KnowledgeHub({ gamification }: KnowledgeHubProps) {
  const [activeTab, setActiveTab] = useState<'constitution' | 'faq' | 'paths'>('constitution');
  const [activeArticle, setActiveArticle] = useState<typeof constitutionArticles[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [readArticles, setReadArticles] = useState<string[]>([]);

  const filteredArticles = constitutionArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.article.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleReadArticle = (article: typeof constitutionArticles[0]) => {
    setActiveArticle(article);
    if (!readArticles.includes(article.id)) {
      const newRead = [...readArticles, article.id];
      setReadArticles(newRead);
      gamification.awardXP(15);
      if (newRead.length >= 5) {
        gamification.unlockBadge('constitution_explorer');
      }
    }
  };

  // Award Data Detective badge when visiting this tab
  useEffect(() => {
    gamification.unlockBadge('data_detective');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
            <BookOpen className="w-9 h-9 text-violet-400" />
            Knowledge Hub
          </h2>
          <p className="text-slate-400 mt-1">
            Constitution, FAQ, and curated reading paths — your civic reference library.
          </p>
        </div>
        {readArticles.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <Star className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-violet-300">{readArticles.length} articles read</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search articles, topics, or questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
        {[
          { id: 'constitution', label: 'Constitution', icon: ScrollText },
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
          { id: 'paths', label: 'Reading Paths', icon: ArrowRight },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Constitution Tab ─── */}
      {activeTab === 'constitution' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Article List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredArticles.map((article) => {
              const Icon = article.icon;
              const isRead = readArticles.includes(article.id);
              return (
                <button
                  key={article.id}
                  onClick={() => handleReadArticle(article)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all group ${
                    activeArticle?.id === article.id
                      ? 'bg-violet-600/10 border-violet-500/50 shadow-xl'
                      : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-${article.color}-500/10 border border-${article.color}-500/20 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 text-${article.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                          {article.article}
                        </span>
                        {isRead && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-sm font-bold text-white mt-0.5 truncate">{article.title}</p>
                      <span className={`text-[10px] font-bold text-${article.color}-400`}>
                        {article.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Article Detail */}
          <div className="lg:col-span-3">
            {activeArticle ? (
              <div className="glass p-8 rounded-3xl border border-white/10 space-y-6 animate-in slide-in-from-right-4 duration-400 sticky top-24">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                      {activeArticle.article}
                    </span>
                    <span className="text-[10px] text-slate-500">{activeArticle.category}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{activeArticle.title}</h3>
                </div>

                <p className="text-slate-300 leading-relaxed text-base">{activeArticle.summary}</p>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Points</h4>
                  {activeArticle.keyPoints.map((point, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-300">{point}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-bold text-amber-400 mb-1">Deep Dive Suggestion</p>
                  <p className="text-sm text-slate-400">{activeArticle.deepDive}</p>
                </div>

                <a
                  href={activeArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Read Official Source <ExternalLink className="w-4 h-4" />
                </a>

                <div className="pt-2 border-t border-white/5 text-center">
                  <p className="text-[10px] text-slate-600">
                    +15 XP awarded for reading this article
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center min-h-[400px] space-y-4">
                <ScrollText className="w-16 h-16 text-slate-700" />
                <div>
                  <p className="text-lg font-bold text-slate-400">Select an Article</p>
                  <p className="text-sm text-slate-600 max-w-xs mx-auto mt-1">
                    Choose a constitutional provision to read its summary, key points, and deep-dive path.
                  </p>
                </div>
                <div className="text-[10px] text-slate-700">
                  Reading 5 articles unlocks the "Constitution Explorer" badge
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FAQ Tab ─── */}
      {activeTab === 'faq' && (
        <div className="space-y-3 max-w-3xl">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="glass rounded-2xl border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 group hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
                  <span className="text-sm font-bold text-white">{faq.question}</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${
                    expandedFaq === faq.id ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {expandedFaq === faq.id && (
                <div className="px-5 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-slate-300 leading-relaxed pl-8">{faq.answer}</p>
                  <div className="pl-8 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-500">
                      Source: {faq.source}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Reading Paths Tab ─── */}
      {activeTab === 'paths' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {readingPaths.map((path) => (
            <div
              key={path.id}
              className="glass p-6 rounded-3xl border border-white/10 space-y-5 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{path.title}</h3>
                  <span className={`text-[10px] font-bold text-${path.color}-400 uppercase tracking-widest`}>
                    {path.difficulty}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded-lg bg-${path.color}-500/10 border border-${path.color}-500/20`}>
                  <span className={`text-[10px] font-bold text-${path.color}-400`}>+{path.xp} XP</span>
                </div>
              </div>

              <div className="space-y-2">
                {path.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className={`w-5 h-5 rounded-full bg-${path.color}-500/10 border border-${path.color}-500/20 flex items-center justify-center text-[9px] font-bold text-${path.color}-400 shrink-0`}>
                      {i + 1}
                    </div>
                    <p className="text-xs text-slate-400">{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  gamification.awardXP(path.xp);
                  setActiveTab('constitution');
                }}
                className={`w-full py-2.5 rounded-xl bg-${path.color}-600/10 border border-${path.color}-500/20 text-${path.color}-400 text-sm font-bold hover:bg-${path.color}-600/20 transition-all flex items-center justify-center gap-2`}
              >
                Start Path <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Next Steps */}
      <div className="p-6 rounded-3xl bg-violet-600/5 border border-violet-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-violet-400">What you can do next</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Continue your civic journey — read 5 articles to unlock the Constitution Explorer badge.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('faq')}
            className="px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-600/20 transition-all"
          >
            Explore FAQs
          </button>
          <button
            onClick={() => setActiveTab('paths')}
            className="px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-600/20 transition-all"
          >
            View Reading Paths
          </button>
        </div>
      </div>
    </div>
  );
}
