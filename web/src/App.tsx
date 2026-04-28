/**
 * ElectraLensAI — Root application component.
 * Wires gamification context, routing, and all feature panels.
 */

import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header, type TabId } from './components/layout/Header';
import { TabPanel } from './components/layout/TabPanel';

import { Dashboard } from './components/features/Dashboard/Dashboard';
import { TimelineArchitect } from './components/features/TimelineArchitect/TimelineArchitect';
import { BallotScribe } from './components/features/BallotScribe/BallotScribe';
import { RumorGuard } from './components/features/RumorGuard/RumorGuard';
import { SimulationEngine } from './components/features/SimulationEngine/SimulationEngine';
import { InclusiveLearning } from './components/features/InclusiveLearning/InclusiveLearning';
import { AuditDashboard } from './components/features/AuditDashboard';
import { KnowledgeHub } from './components/features/KnowledgeHub/KnowledgeHub';
import { LearningLab } from './components/features/LearningLab/LearningLab';
import { ElectoralData } from './components/features/ElectoralData/ElectoralData';
import { SettingsPanel } from './components/features/Settings/SettingsPanel';
import { LiveAgentOverlay } from './components/features/LiveAgentOverlay';
import { useGamification } from './hooks/useGamification';

type ActiveTabId = TabId | 'dashboard' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabId>('dashboard');
  const gamification = useGamification();

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as ActiveTabId);
  };

  return (
    <div className="flex h-screen bg-navy-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
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
        <main className="flex-1 overflow-y-auto bg-navy-950/50 relative">
          {/* Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-[1400px] mx-auto px-8 py-8 relative z-10 h-full">

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

          </div>
        </main>
      </div>
      <LiveAgentOverlay />
    </div>
  );
}
