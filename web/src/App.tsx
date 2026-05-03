/**
 * ElectraLensAI — Root application component.
 * Wires gamification context, routing, and all feature panels.
 */

import { useState, lazy, Suspense } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header, type TabId } from './components/layout/Header';
import { TabPanel } from './components/layout/TabPanel';
import { useGamification } from './hooks/useGamification';
import { LiveAgentOverlay } from './components/features/LiveAgentOverlay';

// Lazy load feature components for code splitting
const Dashboard = lazy(() => import('./components/features/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const TimelineArchitect = lazy(() => import('./components/features/TimelineArchitect/TimelineArchitect').then(m => ({ default: m.TimelineArchitect })));
const BallotScribe = lazy(() => import('./components/features/BallotScribe/BallotScribe').then(m => ({ default: m.BallotScribe })));
const RumorGuard = lazy(() => import('./components/features/RumorGuard/RumorGuard').then(m => ({ default: m.RumorGuard })));
const SimulationEngine = lazy(() => import('./components/features/SimulationEngine/SimulationEngine').then(m => ({ default: m.SimulationEngine })));
const InclusiveLearning = lazy(() => import('./components/features/InclusiveLearning/InclusiveLearning').then(m => ({ default: m.InclusiveLearning })));
const AuditDashboard = lazy(() => import('./components/features/AuditDashboard').then(m => ({ default: m.AuditDashboard })));
const KnowledgeHub = lazy(() => import('./components/features/KnowledgeHub/KnowledgeHub').then(m => ({ default: m.KnowledgeHub })));
const LearningLab = lazy(() => import('./components/features/LearningLab/LearningLab').then(m => ({ default: m.LearningLab })));
const ElectoralData = lazy(() => import('./components/features/ElectoralData/ElectoralData').then(m => ({ default: m.ElectoralData })));
const SettingsPanel = lazy(() => import('./components/features/Settings/SettingsPanel').then(m => ({ default: m.SettingsPanel })));

type ActiveTabId = TabId | 'dashboard' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabId>('dashboard');
  const gamification = useGamification();

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as ActiveTabId);
  };

  return (
    <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg">
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        gamification={gamification}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Scrollable Feature Area */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-navy-950/50 relative" tabIndex={-1}>
          {/* Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-[1400px] mx-auto px-8 py-8 relative z-10 h-full">
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
            }>
              <TabPanel activeTab={activeTab} id="dashboard">
                <Dashboard gamification={gamification} onNavigate={handleNavigate} />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="timeline">
                <TimelineArchitect />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="ballot">
                <BallotScribe />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="rumor">
                <RumorGuard />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="simulation">
                <SimulationEngine />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="data">
                <ElectoralData gamification={gamification} />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="knowledge">
                <KnowledgeHub gamification={gamification} />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="learning_lab">
                <LearningLab />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="inclusive">
                <InclusiveLearning />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="audit">
                <AuditDashboard />
              </TabPanel>

              <TabPanel activeTab={activeTab} id="settings">
                <SettingsPanel />
              </TabPanel>
            </Suspense>
          </div>
        </main>
      </div>
      <LiveAgentOverlay />
    </div>
  );
}
