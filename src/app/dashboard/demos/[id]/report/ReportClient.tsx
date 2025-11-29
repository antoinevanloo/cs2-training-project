'use client';

import { useState } from 'react';
import { TabNavigation, Tab } from '@/components/ui/TabNavigation';
import { BarChart3, Target, Lightbulb, Calendar } from 'lucide-react';
import { SummaryTab } from './tabs/SummaryTab';
import { MetricsTab } from './tabs/MetricsTab';
import { CoachingTab } from './tabs/CoachingTab';
import { ActionPlanTab } from './tabs/ActionPlanTab';

interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  headshotPercentage: number;
  kast: number;
  entryKills: number;
  clutchesWon: number;
  clutchesLost: number;
}

interface ReportData {
  demo: {
    id: string;
    mapName: string;
    matchDate: string;
    matchResult: 'WIN' | 'LOSS' | 'TIE';
    scoreTeam1: number;
    scoreTeam2: number;
  };
  analysis: {
    overallScore: number;
    aimScore: number;
    positioningScore: number;
    utilityScore: number;
    economyScore: number;
    timingScore: number;
    decisionScore: number;
    strengths: string[];
    weaknesses: string[];
    aimAnalysis: unknown;
    positioningAnalysis: unknown;
    utilityAnalysis: unknown;
    economyAnalysis: unknown;
    timingAnalysis: unknown;
    decisionAnalysis: unknown;
  };
  playerStats: PlayerStats | null;
}

interface ReportClientProps {
  data: ReportData;
}

type TabId = 'summary' | 'metrics' | 'coaching' | 'plan';

export function ReportClient({ data }: ReportClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const tabs: Tab[] = [
    {
      id: 'summary',
      label: 'Résumé',
      icon: BarChart3,
    },
    {
      id: 'metrics',
      label: 'Métriques',
      icon: Target,
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: Lightbulb,
      badge: data.analysis.weaknesses.length > 0
        ? { text: `${data.analysis.weaknesses.length}`, variant: 'warning' as const }
        : undefined,
    },
    {
      id: 'plan',
      label: 'Plan d\'action',
      icon: Calendar,
    },
  ];

  const categoryScores = {
    aim: data.analysis.aimScore,
    positioning: data.analysis.positioningScore,
    utility: data.analysis.utilityScore,
    economy: data.analysis.economyScore,
    timing: data.analysis.timingScore,
    decision: data.analysis.decisionScore,
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        variant="default"
        size="md"
      />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'summary' && (
          <SummaryTab
            overallScore={data.analysis.overallScore}
            categoryScores={categoryScores}
            strengths={data.analysis.strengths}
            weaknesses={data.analysis.weaknesses}
            playerStats={data.playerStats}
            matchResult={data.demo.matchResult}
            onViewCoaching={() => setActiveTab('coaching')}
            onViewPlan={() => setActiveTab('plan')}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsTab
            categoryScores={categoryScores}
            analyses={{
              aim: data.analysis.aimAnalysis,
              positioning: data.analysis.positioningAnalysis,
              utility: data.analysis.utilityAnalysis,
              economy: data.analysis.economyAnalysis,
              timing: data.analysis.timingAnalysis,
              decision: data.analysis.decisionAnalysis,
            }}
            playerStats={data.playerStats}
          />
        )}

        {activeTab === 'coaching' && (
          <CoachingTab demoId={data.demo.id} />
        )}

        {activeTab === 'plan' && (
          <ActionPlanTab demoId={data.demo.id} />
        )}
      </div>
    </div>
  );
}
