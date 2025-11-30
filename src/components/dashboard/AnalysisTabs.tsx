'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Heatmap, MiniHeatmap } from '@/components/dashboard/Heatmap';
import {
  InsightCard,
  InsightSummary,
  CategoryInsight,
  ActionableInsight,
} from '@/components/dashboard/InsightCard';
import { FilterBar, FilterChip, FilterGroup } from '@/components/ui/Filters';
import {
  CrosshairIcon,
  MapIcon,
  GrenadeIcon,
  EconomyIcon,
  TimingIcon,
  DecisionIcon,
} from '@/components/ui/icons/CS2Icons';

interface AnalysisData {
  overallScore: number;
  aimScore: number;
  positioningScore: number;
  utilityScore: number;
  economyScore: number;
  timingScore: number;
  decisionScore: number;
  aimAnalysis?: any;
  positioningAnalysis?: any;
  utilityAnalysis?: any;
  economyAnalysis?: any;
  timingAnalysis?: any;
  decisionAnalysis?: any;
  strengths?: string[];
  weaknesses?: string[];
  coachingReport?: any;
}

interface AnalysisTabsProps {
  analysis: AnalysisData;
  mapName: string;
  playerDeaths?: Array<{
    x: number;
    y: number;
    round?: number;
    weapon?: string;
    wasTraded?: boolean;
    wasBlind?: boolean;
  }>;
  playerKills?: Array<{
    x: number;
    y: number;
    round?: number;
    weapon?: string;
    wasHeadshot?: boolean;
  }>;
}

export function AnalysisTabs({
  analysis,
  mapName,
  playerDeaths = [],
  playerKills = [],
}: AnalysisTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Générer les positions pour la heatmap
  const heatmapPositions = [
    ...playerDeaths.map((d) => ({
      ...d,
      type: 'death' as const,
    })),
    ...playerKills.map((k) => ({
      ...k,
      type: 'kill' as const,
    })),
  ];

  // Générer les insights automatiquement
  const generateInsights = () => {
    const insights: Array<{
      type: 'improvement' | 'strength' | 'warning' | 'tip';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      category: string;
      metric?: { label: string; value: number; target: number; unit: string };
    }> = [];

    // Aim insights
    if (analysis.aimScore < 60) {
      insights.push({
        type: 'improvement',
        title: 'Précision à améliorer',
        description: 'Ton aim est en dessous de la moyenne. Focus sur le crosshair placement et la first bullet accuracy.',
        priority: 'high',
        category: 'aim',
        metric: { label: 'Score Aim', value: analysis.aimScore, target: 70, unit: '' },
      });
    } else if (analysis.aimScore >= 80) {
      insights.push({
        type: 'strength',
        title: 'Excellent aim',
        description: 'Ton aim est un de tes points forts. Continue à maintenir cette performance.',
        priority: 'low',
        category: 'aim',
      });
    }

    // Positioning insights
    if (analysis.positioningScore < 50) {
      insights.push({
        type: 'warning',
        title: 'Positionnement risqué',
        description: 'Tu meurs souvent dans des positions non tradables. Privilégie des angles où tes teammates peuvent te trade.',
        priority: 'high',
        category: 'positioning',
      });
    }

    // Utility insights
    if (analysis.utilityScore < 60) {
      insights.push({
        type: 'tip',
        title: 'Utilise mieux tes utilitaires',
        description: 'Apprends 2-3 smokes par map et utilise tes flashs pour aider tes teammates.',
        priority: 'medium',
        category: 'utility',
      });
    }

    // Economy insights
    if (analysis.economyScore < 55) {
      insights.push({
        type: 'improvement',
        title: 'Gestion économique',
        description: 'Évite les force buy inutiles et sauvegarde ton arme quand le round est perdu.',
        priority: 'medium',
        category: 'economy',
      });
    }

    // Timing insights
    if (analysis.timingScore < 60) {
      insights.push({
        type: 'tip',
        title: 'Timing des trades',
        description: 'Sois plus proche de tes teammates pour pouvoir les trade rapidement.',
        priority: 'medium',
        category: 'timing',
      });
    }

    // Decision insights
    if (analysis.decisionScore < 55) {
      insights.push({
        type: 'warning',
        title: 'Prises de décision',
        description: 'Tu prends des engagements risqués. Joue plus pour l\'équipe et moins solo.',
        priority: 'high',
        category: 'decision',
      });
    }

    return insights;
  };

  const insights = generateInsights();
  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter((i) => i.category === selectedCategory);

  // Count insights by type
  const insightCounts = {
    improvements: insights.filter((i) => i.type === 'improvement').length,
    strengths: insights.filter((i) => i.type === 'strength').length,
    warnings: insights.filter((i) => i.type === 'warning').length,
    tips: insights.filter((i) => i.type === 'tip').length,
  };

  // Categories for filter
  const categories = [
    { value: 'all', label: 'Tous', icon: null },
    { value: 'aim', label: 'Aim', icon: <CrosshairIcon size={14} /> },
    { value: 'positioning', label: 'Position', icon: <MapIcon size={14} /> },
    { value: 'utility', label: 'Utility', icon: <GrenadeIcon size={14} /> },
    { value: 'economy', label: 'Économie', icon: <EconomyIcon size={14} /> },
    { value: 'timing', label: 'Timing', icon: <TimingIcon size={14} /> },
    { value: 'decision', label: 'Décision', icon: <DecisionIcon size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="insights">
        <TabsList variant="gaming" className="mb-6">
          <TabsTrigger
            value="insights"
            icon={<span className="text-lg">💡</span>}
            badge={insights.length}
          >
            Insights
          </TabsTrigger>
          <TabsTrigger
            value="heatmap"
            icon={<MapIcon size={18} />}
            badge={heatmapPositions.length}
          >
            Heatmap
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            icon={<span className="text-lg">📊</span>}
          >
            Catégories
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            icon={<span className="text-lg">🎯</span>}
          >
            Plan d&apos;action
          </TabsTrigger>
        </TabsList>

        {/* Tab: Insights */}
        <TabsContent value="insights">
          <div className="space-y-6">
            {/* Summary */}
            <InsightSummary
              improvements={insightCounts.improvements}
              strengths={insightCounts.strengths}
              warnings={insightCounts.warnings}
              tips={insightCounts.tips}
              topPriority={
                insights.find((i) => i.priority === 'high')
                  ? {
                      title: insights.find((i) => i.priority === 'high')!.title,
                      type: insights.find((i) => i.priority === 'high')!.type,
                    }
                  : undefined
              }
            />

            {/* Filters */}
            <FilterBar activeFiltersCount={selectedCategory !== 'all' ? 1 : 0} onReset={() => setSelectedCategory('all')}>
              <FilterGroup
                options={categories}
                value={selectedCategory}
                onChange={(v) => setSelectedCategory(v as string)}
              />
            </FilterBar>

            {/* Insight Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredInsights.map((insight, i) => (
                <InsightCard
                  key={i}
                  type={insight.type}
                  title={insight.title}
                  description={insight.description}
                  priority={insight.priority}
                  metric={insight.metric}
                />
              ))}
              {filteredInsights.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  Aucune insight pour ce filtre
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Heatmap */}
        <TabsContent value="heatmap">
          {heatmapPositions.length > 0 ? (
            <Heatmap
              positions={heatmapPositions}
              mapName={mapName}
              title="Positions de jeu"
              height={500}
              showLegend
              showControls
              showInsights
            />
          ) : (
            <div className="p-8 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
              <MapIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Heatmap non disponible
              </h3>
              <p className="text-gray-400">
                Les données de position ne sont pas disponibles pour cette analyse.
                <br />
                Cela peut arriver si le fichier démo n&apos;a pas été parsé avec les coordonnées.
              </p>
            </div>
          )}

          {/* Mini heatmaps par type */}
          {heatmapPositions.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-400">💀</span>
                  <span className="text-sm text-gray-400">Morts</span>
                  <span className="ml-auto text-white font-bold">
                    {playerDeaths.length}
                  </span>
                </div>
                <MiniHeatmap
                  positions={playerDeaths.map((d) => ({ ...d, type: 'death' as const }))}
                  mapName={mapName}
                  size={100}
                  className="mx-auto"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-400">🎯</span>
                  <span className="text-sm text-gray-400">Kills</span>
                  <span className="ml-auto text-white font-bold">
                    {playerKills.length}
                  </span>
                </div>
                <MiniHeatmap
                  positions={playerKills.map((k) => ({ ...k, type: 'kill' as const }))}
                  mapName={mapName}
                  size={100}
                  className="mx-auto"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab: Categories */}
        <TabsContent value="categories">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CategoryInsight
              category="Aim"
              score={analysis.aimScore}
              icon={<CrosshairIcon size={20} />}
              color="cs2-accent"
              insights={[
                { type: analysis.aimScore >= 70 ? 'good' : 'bad', text: `Score: ${analysis.aimScore}/100` },
                ...(analysis.aimAnalysis?.headshotRate
                  ? [{ type: (analysis.aimAnalysis.headshotRate >= 0.45 ? 'good' : 'neutral') as 'good' | 'bad' | 'neutral', text: `HS%: ${Math.round(analysis.aimAnalysis.headshotRate * 100)}%` }]
                  : []),
              ]}
            />

            <CategoryInsight
              category="Positionnement"
              score={analysis.positioningScore}
              icon={<MapIcon size={20} />}
              color="cs2-ct"
              insights={[
                { type: analysis.positioningScore >= 70 ? 'good' : 'bad', text: `Score: ${analysis.positioningScore}/100` },
              ]}
            />

            <CategoryInsight
              category="Utilitaires"
              score={analysis.utilityScore}
              icon={<GrenadeIcon size={20} />}
              color="cs2-t"
              insights={[
                { type: analysis.utilityScore >= 70 ? 'good' : 'bad', text: `Score: ${analysis.utilityScore}/100` },
              ]}
            />

            <CategoryInsight
              category="Économie"
              score={analysis.economyScore}
              icon={<EconomyIcon size={20} />}
              insights={[
                { type: analysis.economyScore >= 70 ? 'good' : 'bad', text: `Score: ${analysis.economyScore}/100` },
              ]}
            />

            <CategoryInsight
              category="Timing"
              score={analysis.timingScore}
              icon={<TimingIcon size={20} />}
              insights={[
                { type: analysis.timingScore >= 70 ? 'good' : 'bad', text: `Score: ${analysis.timingScore}/100` },
              ]}
            />

            <CategoryInsight
              category="Décisions"
              score={analysis.decisionScore}
              icon={<DecisionIcon size={20} />}
              insights={[
                { type: analysis.decisionScore >= 70 ? 'good' : 'bad', text: `Score: ${analysis.decisionScore}/100` },
              ]}
            />
          </div>
        </TabsContent>

        {/* Tab: Plan d'action */}
        <TabsContent value="actions">
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-cs2-accent/10 to-transparent border border-cs2-accent/30">
              <h3 className="text-lg font-bold text-white mb-2">
                🎯 Ton plan d&apos;action personnalisé
              </h3>
              <p className="text-gray-400">
                Basé sur ton analyse, voici les actions prioritaires pour progresser.
              </p>
            </div>

            {/* Actions prioritaires */}
            <div className="space-y-4">
              {insights
                .filter((i) => i.type === 'improvement' || i.type === 'warning')
                .sort((a, b) => {
                  const priority = { high: 0, medium: 1, low: 2 };
                  return priority[a.priority] - priority[b.priority];
                })
                .slice(0, 3)
                .map((insight, i) => (
                  <ActionableInsight
                    key={i}
                    title={insight.title}
                    problem={insight.description}
                    solution={
                      insight.category === 'aim'
                        ? 'Entraîne-toi 15 min par jour sur Aim Botz ou Aim Lab pour améliorer ta précision.'
                        : insight.category === 'positioning'
                        ? 'Regarde des VODs de pros et note les positions qu\'ils utilisent. Pratique-les en DM.'
                        : insight.category === 'utility'
                        ? 'Apprends 3 smokes essentielles par map sur YouTube et pratique-les en privé.'
                        : insight.category === 'economy'
                        ? 'Communique avec ton équipe et suis les calls d\'éco. Ne force pas seul.'
                        : insight.category === 'timing'
                        ? 'Reste plus proche de tes teammates pour pouvoir trade rapidement.'
                        : 'Prends le temps de réfléchir avant chaque engagement. Patience.'
                    }
                    impact={insight.priority}
                    exercise={
                      insight.category === 'aim'
                        ? {
                            name: 'Aim Botz - Training',
                            workshopId: '243702660',
                            duration: '15 min/jour',
                          }
                        : insight.category === 'utility'
                        ? {
                            name: 'Yprac Practice Maps',
                            workshopId: '1222094548',
                            duration: '20 min/map',
                          }
                        : undefined
                    }
                  />
                ))}
            </div>

            {/* Message si pas d'actions prioritaires */}
            {insights.filter((i) => i.type === 'improvement' || i.type === 'warning').length === 0 && (
              <div className="p-8 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                <span className="text-4xl mb-4 block">🏆</span>
                <h3 className="text-lg font-bold text-green-400 mb-2">
                  Excellent travail !
                </h3>
                <p className="text-gray-400">
                  Aucune amélioration critique détectée. Continue sur cette lancée !
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
