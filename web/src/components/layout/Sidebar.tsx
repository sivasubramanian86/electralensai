/**
 * Sidebar — Main navigation with gamification bar.
 * Non-partisan civic education portal navigation.
 */

import {
  LayoutDashboard,
  CalendarDays,
  ShieldCheck,
  Dna,
  Settings,
  ChevronRight,
  Landmark,
  Accessibility,
  ShieldAlert,
  BarChart3,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TabId } from './Header';
import { GamificationBar } from './GamificationBar';
import type { UseGamificationResult } from '../../hooks/useGamification';

interface SidebarProps {
  activeTab: TabId | 'dashboard' | 'settings';
  onTabChange: (tab: TabId | 'dashboard' | 'settings') => void;
  gamification: UseGamificationResult;
}

export function Sidebar({ activeTab, onTabChange, gamification }: SidebarProps) {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', key: 'nav.dashboard', label: 'Awareness Hub', icon: LayoutDashboard },
    { id: 'timeline', key: 'nav.timeline', label: 'Election Journey', icon: CalendarDays },
    { id: 'ballot', key: 'nav.ballot', label: 'Voter Guide', icon: ShieldCheck },
    { id: 'simulation', key: 'nav.simulation', label: 'Play Democracy', icon: Dna },
    { id: 'rumor', key: 'nav.rumor', label: 'Myth-Buster', icon: ShieldAlert },
    { id: 'data', key: 'nav.data', label: 'Data Explorer', icon: BarChart3 },
    { id: 'knowledge', key: 'nav.knowledge', label: 'Knowledge Hub', icon: BookOpen },
    { id: 'learning_lab', key: 'nav.learning_lab', label: 'Learning Lab', icon: Landmark },
    { id: 'inclusive', key: 'nav.inclusive', label: 'Inclusive Learning', icon: Accessibility },
    { id: 'audit', key: 'nav.audit', label: 'Audit & Transparency', icon: Terminal },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-navy-950 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20" aria-hidden="true">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            ElectraLens <span className="text-blue-500">AI</span>
          </h1>
          <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">{t('app.subtitle', 'Voter Education Portal')}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 px-4 py-2 space-y-1 overflow-y-auto hide-scrollbar"
        role="tablist"
        aria-label="Primary Navigation"
      >
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id as TabId | 'dashboard')}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-label={item.label}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group focus:ring-2 focus:ring-blue-500/50 focus:outline-none ${
              activeTab === item.id
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon 
                className={`w-4 h-4 ${activeTab === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} 
                aria-hidden="true"
              />
              <span className="text-sm font-medium">{t(item.key, item.label)}</span>
            </div>
            {activeTab === item.id && (
              <ChevronRight className="w-3.5 h-3.5 animate-in slide-in-from-left-1" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      {/* Gamification Bar */}
      <GamificationBar gamification={gamification} />

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'settings' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-blue-400' : 'text-slate-500'}`} />
          <span className="text-sm font-medium">{t('nav.settings', 'Settings')}</span>
        </button>
      </div>
    </aside>
  );
}
