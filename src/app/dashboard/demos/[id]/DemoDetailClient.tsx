'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GranularityBadge } from '@/components/ui/GranularityBadge';
import { DeleteDemoButton } from '@/components/demos/DeleteDemoButton';
import { DemoStatusBanner } from '@/components/demos/DemoStatusBanner';
import { TabNavigation, Tab } from '@/components/ui/TabNavigation';
import {
  FileText,
  BarChart3,
  Clock,
  Users,
  ChevronLeft,
  Target,
  Lightbulb,
  Calendar,
  Map,
} from 'lucide-react';

import type { Round } from '@/types/rounds';
import { FeatureProvider } from '@/lib/features/context';
import type { SubscriptionTier, UserFeaturePreferences, UserFeatureOverride } from '@/lib/features/types';

// Import tab content components
import { SummaryTab } from './tabs/SummaryTab';
import { MetricsTab } from './tabs/MetricsTab';
import { CoachingTab } from './tabs/CoachingTab';
import { ActionPlanTab } from './tabs/ActionPlanTab';
import { PlayersTab } from './tabs/PlayersTab';
import { RoundsTab } from './tabs/RoundsTab';
import type { ChartData } from '@/lib/rounds';

// Shared types - should be moved to a dedicated file
interface PlayerStats {
  id: string;
  playerName: string;
  steamId: string;
  teamNumber: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  headshotPercentage: number;
  adr: number;
  kast: number;
  rating: number;
  entryKills: number;
  entryDeaths: number;
  clutchesWon: number;
  clutchesLost: number;
  isMainPlayer: boolean;
}

interface Analysis {
  overallScore: number;
  aimScore?: number;
  positioningScore?: number;
  utilityScore?: number;
  economyScore?: number;
  timingScore?: number;
  decisionScore?: number;
  movementScore?: number | null;
  awarenessScore?: number | null;
  teamplayScore?: number | null;
  strengths: string[];
  weaknesses: string[];
  aimAnalysis: unknown | null;
  positioningAnalysis: unknown | null;
  utilityAnalysis: unknown | null;
  economyAnalysis: unknown | null;
  timingAnalysis: unknown | null;
  decisionAnalysis: unknown | null;
  movementAnalysis: unknown | null;
  awarenessAnalysis: unknown | null;
  teamplayAnalysis: unknown | null;
}

interface DemoData {
  id: string;
  mapName: string;
  matchDate: string;
  matchResult: string;
  scoreTeam1: number;
  scoreTeam2: number;
  status: string;
  statusMessage: string | null;
  playerStats: PlayerStats[];
  analysis: Analysis | null;
  rounds: Round[];
  mainPlayerTeam: number;
  mainPlayerSteamId: string;
}

interface FeatureData {
  tier: SubscriptionTier;
  isBetaTester: boolean;
  isAlphaTester: boolean;
  preferences: UserFeaturePreferences;
  overrides: UserFeatureOverride[];
  enabledAnalyzers: string[];
  priorityCategories: string[];
}

interface DemoDetailClientProps {
  demo: DemoData;
  globalStats: {
    avgRating: number;
    avgAdr: number;
    avgHsPercent: number;
    avgKast: number;
  } | null;
  featureData: FeatureData;
  chartData: ChartData | null;
}

type TabId = 'summary' | 'metrics' | 'rounds' | 'coaching' | 'plan' | 'players';

export function DemoDetailClient({ demo, globalStats, featureData, chartData }: DemoDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const isProcessing = ['PENDING', 'QUEUED', 'PROCESSING', 'ANALYZING'].includes(
    demo.status
  );

  const resultColor =
    demo.matchResult === 'WIN'
      ? 'text-green-400'
      : demo.matchResult === 'LOSS'
      ? 'text-red-400'
      : 'text-gray-400';

  const tabs: Tab[] = [
    { id: 'summary', label: 'Resume', icon: BarChart3 },
    { id: 'metrics', label: 'Metriques', icon: Target },
    {
      id: 'rounds',
      label: 'Rounds',
      icon: Clock,
      badge: demo.rounds.length > 0
        ? { text: `${demo.rounds.length}`, variant: 'default' }
        : undefined,
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: Lightbulb,
      badge:
        demo.analysis && demo.analysis.weaknesses.length > 0
          ? { text: `${demo.analysis.weaknesses.length}`, variant: 'warning' }
          : undefined,
    },
    { id: 'plan', label: 'Plan d\'action', icon: Calendar },
    { id: 'players', label: 'Joueurs', icon: Users },
  ];

  const mainPlayerStats = demo.playerStats.find((p) => p.isMainPlayer);

  // All scores (for displaying grayed out disabled categories)
  const allCategoryScores = demo.analysis ? {
    aim: demo.analysis.aimScore,
    positioning: demo.analysis.positioningScore,
    utility: demo.analysis.utilityScore,
    economy: demo.analysis.economyScore,
    timing: demo.analysis.timingScore,
    decision: demo.analysis.decisionScore,
    movement: demo.analysis.movementScore ?? undefined,
    awareness: demo.analysis.awarenessScore ?? undefined,
    teamplay: demo.analysis.teamplayScore ?? undefined,
  } : null;

  // Only include scores for enabled analyzers (v1 + v2 categories)
  const categoryScores = demo.analysis ? {
    aim: featureData.enabledAnalyzers.includes('analysis.aim') ? demo.analysis.aimScore : undefined,
    positioning: featureData.enabledAnalyzers.includes('analysis.positioning') ? demo.analysis.positioningScore : undefined,
    utility: featureData.enabledAnalyzers.includes('analysis.utility') ? demo.analysis.utilityScore : undefined,
    economy: featureData.enabledAnalyzers.includes('analysis.economy') ? demo.analysis.economyScore : undefined,
    timing: featureData.enabledAnalyzers.includes('analysis.timing') ? demo.analysis.timingScore : undefined,
    decision: featureData.enabledAnalyzers.includes('analysis.decision') ? demo.analysis.decisionScore : undefined,
    // v2 categories
    movement: featureData.enabledAnalyzers.includes('analysis.movement') ? (demo.analysis.movementScore ?? undefined) : undefined,
    awareness: featureData.enabledAnalyzers.includes('analysis.awareness') ? (demo.analysis.awarenessScore ?? undefined) : undefined,
    teamplay: featureData.enabledAnalyzers.includes('analysis.teamplay') ? (demo.analysis.teamplayScore ?? undefined) : undefined,
  } : null;

  const comparison = mainPlayerStats && globalStats ? {
    rating: mainPlayerStats.rating - globalStats.avgRating,
    adr: mainPlayerStats.adr - globalStats.avgAdr,
    hsPercent: mainPlayerStats.headshotPercentage - globalStats.avgHsPercent,
    kast: mainPlayerStats.kast - globalStats.avgKast,
  } : null;

  return (
    <FeatureProvider
      tier={featureData.tier}
      isBetaTester={featureData.isBetaTester}
      isAlphaTester={featureData.isAlphaTester}
      initialPreferences={featureData.preferences}
      overrides={featureData.overrides}
    >
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/demos"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Mes démos
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white capitalize">
              {demo.mapName.replace('de_', '')}
            </h1>
            <span className={`text-xl font-bold ${resultColor}`}>
              {demo.scoreTeam1} - {demo.scoreTeam2}
            </span>
            <GranularityBadge level="demo" showLabel />
          </div>
          <p className="text-gray-400 mt-1">
            {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/maps/${demo.mapName.replace('de_', '')}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <Map className="w-4 h-4" />
              Voir la map
            </Button>
          </Link>
          <DeleteDemoButton
            demoId={demo.id}
            demoName={`${demo.mapName} - ${demo.scoreTeam1}:${demo.scoreTeam2}`}
          />
        </div>
      </div>

      {/* Status Banner */}
      {(isProcessing || demo.status === 'UPLOADED') && (
        <DemoStatusBanner
          demoId={demo.id}
          initialStatus={demo.status}
          initialStatusMessage={demo.statusMessage}
        />
      )}

      {demo.status === 'FAILED' && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="font-medium text-red-400">Erreur de traitement</p>
          <p className="text-sm text-gray-400">{demo.statusMessage}</p>
        </Card>
      )}

      {/* Unified Tab Navigation */}
      {demo.status === 'COMPLETED' && demo.analysis ? (
        <>
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
            variant="default"
            size="md"
          />

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'summary' && categoryScores && (
              <SummaryTab
                overallScore={demo.analysis.overallScore}
                categoryScores={categoryScores}
                allCategoryScores={allCategoryScores || undefined}
                strengths={demo.analysis.strengths}
                weaknesses={demo.analysis.weaknesses}
                playerStats={mainPlayerStats || null}
                matchResult={demo.matchResult as 'WIN' | 'LOSS' | 'TIE'}
                onViewCoaching={() => setActiveTab('coaching')}
                onViewPlan={() => setActiveTab('plan')}
                comparison={comparison}
                enabledAnalyzers={featureData.enabledAnalyzers}
                priorityCategories={featureData.priorityCategories as import('@/lib/preferences/types').AnalysisCategory[]}
              />
            )}

            {activeTab === 'metrics' && categoryScores && (
              <MetricsTab
                categoryScores={categoryScores}
                analyses={{
                  aim: demo.analysis.aimAnalysis,
                  positioning: demo.analysis.positioningAnalysis,
                  utility: demo.analysis.utilityAnalysis,
                  economy: demo.analysis.economyAnalysis,
                  timing: demo.analysis.timingAnalysis,
                  decision: demo.analysis.decisionAnalysis,
                  // v2 analyses
                  movement: demo.analysis.movementAnalysis,
                  awareness: demo.analysis.awarenessAnalysis,
                  teamplay: demo.analysis.teamplayAnalysis,
                }}
                playerStats={mainPlayerStats || null}
                chartData={chartData || undefined}
                enabledAnalyzers={featureData.enabledAnalyzers}
              />
            )}

            {activeTab === 'rounds' && (
              <RoundsTab
                demoId={demo.id}
                mapName={demo.mapName}
                matchDate={demo.matchDate}
                scoreTeam1={demo.scoreTeam1}
                scoreTeam2={demo.scoreTeam2}
                matchResult={demo.matchResult}
                rounds={demo.rounds}
                mainPlayerTeam={demo.mainPlayerTeam}
                mainPlayerSteamId={demo.mainPlayerSteamId}
              />
            )}

            {activeTab === 'coaching' && <CoachingTab demoId={demo.id} />}
            
            {activeTab === 'plan' && <ActionPlanTab demoId={demo.id} />}
            
            {activeTab === 'players' && <PlayersTab demo={demo} />}
          </div>
        </>
      ) : (
        !isProcessing && demo.status !== 'FAILED' && (
           <Card className="p-12 text-center">
             <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
             <p className="text-gray-400">L'analyse de cette démo n'est pas encore disponible.</p>
           </Card>
        )
      )}
    </div>
    </FeatureProvider>
  );
}

