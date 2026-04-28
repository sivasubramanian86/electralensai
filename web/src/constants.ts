/** ElectraLensAI — Application types and constants. */

export type AgentMode =
  | 'timeline'
  | 'ballot'
  | 'rumor_guard'
  | 'simulation';

export interface AgentModeConfig {
  id: AgentMode;
  label: string;
  icon: string;
  description: string;
  accentVar: string;
  placeholder: string;
}

export const AGENT_MODES: AgentModeConfig[] = [
  {
    id: 'timeline',
    label: 'Election Timeline',
    icon: '🗓️',
    description: 'Interactive roadmap of election dates and deadlines for your region.',
    accentVar: '--accent-blue',
    placeholder: 'When is the voter registration deadline in California?',
  },
  {
    id: 'ballot',
    label: 'Ballot & Registration',
    icon: '🗳️',
    description: 'Voter ID requirements, registration steps, and absentee ballot rules.',
    accentVar: '--accent-gold',
    placeholder: 'What ID do I need to vote in Texas?',
  },
  {
    id: 'rumor_guard',
    label: 'Rumor Guard',
    icon: '🛡️',
    description: 'AI fact-checker for viral election claims and misinformation.',
    accentVar: '--accent-teal',
    placeholder: 'I heard that felons cannot vote after serving their sentence. Is this true?',
  },
  {
    id: 'simulation',
    label: 'Voter Simulation',
    icon: '🎮',
    description: 'Step-by-step interactive walkthrough of the physical voting process.',
    accentVar: '--accent-violet',
    placeholder: 'Walk me through the full voting process on election day.',
  },
];

export const REGIONS: { code: string; label: string }[] = [
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'PH', label: '🇵🇭 Philippines' },
  { code: 'ZA', label: '🇿🇦 South Africa' },
  { code: 'BR', label: '🇧🇷 Brazil' },
  { code: 'DE', label: '🇩🇪 Germany' },
];

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8082';
