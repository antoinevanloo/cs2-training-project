'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  headshotPercentage: number;
  kast: number;
  entryKills?: number;
  clutchesWon?: number;
  clutchesLost?: number;
}

interface CategoryScores {
  aim?: number;
  positioning?: number;
  utility?: number;
  economy?: number;
  timing?: number;
  decision?: number;
}

interface MetricsTabProps {
  categoryScores: CategoryScores;
  analyses: {
    aim: unknown | null;
    positioning: unknown | null;
    utility: unknown | null;
    economy: unknown | null;
    timing: unknown | null;
    decision: unknown | null;
  };
  playerStats: PlayerStats | null;
}

const CATEGORY_CONFIG = {
  aim: {
    label: 'Aim',
    icon: '🎯',
    description: 'Précision, headshots, spray control',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  positioning: {
    label: 'Positionnement',
    icon: '📍',
    description: 'Placement, couverture d\'angles, rotations',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  utility: {
    label: 'Utilitaires',
    icon: '💣',
    description: 'Smokes, flashs, molotovs, HE grenades',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  economy: {
    label: 'Économie',
    icon: '💰',
    description: 'Gestion de l\'argent, achats, saves',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  timing: {
    label: 'Timing',
    icon: '⏱️',
    description: 'Peeks, rotations, exécutions',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  decision: {
    label: 'Décisions',
    icon: '🧠',
    description: 'Game sense, clutch, trades',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

export function MetricsTab({ categoryScores, analyses, playerStats }: MetricsTabProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  };

  return (
    <div className="space-y-6">
      {/* Stats détaillées du joueur */}
      {playerStats && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Statistiques du match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Kills" value={playerStats.kills} />
              <StatCard label="Deaths" value={playerStats.deaths} />
              <StatCard label="Assists" value={playerStats.assists} />
              <StatCard label="Rating" value={playerStats.rating.toFixed(2)} highlight />
              <StatCard label="ADR" value={Math.round(playerStats.adr)} />
              <StatCard label="HS%" value={`${Math.round(playerStats.headshotPercentage)}%`} />
              <StatCard label="KAST" value={`${Math.round(playerStats.kast)}%`} />
              <StatCard
                label="K/D Ratio"
                value={(playerStats.kills / Math.max(1, playerStats.deaths)).toFixed(2)}
              />
              {playerStats.entryKills !== undefined && (
                <StatCard label="Entry Kills" value={playerStats.entryKills} />
              )}
              {playerStats.clutchesWon !== undefined && (
                <StatCard
                  label="Clutches"
                  value={`${playerStats.clutchesWon}/${(playerStats.clutchesWon || 0) + (playerStats.clutchesLost || 0)}`}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catégories avec scores */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold">Analyse par catégorie</h3>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const score = categoryScores[key as keyof CategoryScores];
          const analysis = analyses[key as keyof typeof analyses];
          const isExpanded = expandedCategory === key;

          // Skip disabled/unavailable analyzers
          if (score === undefined || score === null) {
            return null;
          }

          return (
            <Card
              key={key}
              className={`${config.bgColor} border-gray-700/30 transition-all cursor-pointer`}
              onClick={() => toggleCategory(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <h4 className="text-white font-medium">{config.label}</h4>
                      <p className="text-xs text-gray-400">{config.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {Math.round(score)}
                      </div>
                      <div className="text-xs text-gray-400">{getScoreLabel(score)}</div>
                    </div>
                    {analysis !== null && analysis !== undefined && (
                      isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      score >= 80 ? 'bg-green-500' :
                      score >= 60 ? 'bg-yellow-500' :
                      score >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Détails expandables */}
                {isExpanded && analysis !== null && analysis !== undefined && (
                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    <AnalysisDetails category={key} analysis={analysis as Record<string, unknown>} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 bg-gray-900/30 rounded-lg text-center">
      <div className={`text-xl font-bold ${highlight ? 'text-cs2-accent' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function AnalysisDetails({ category, analysis }: { category: string; analysis: Record<string, unknown> }) {
  // Rendre les détails de l'analyse de manière dynamique
  if (!analysis || typeof analysis !== 'object') {
    return <p className="text-gray-400 text-sm">Pas de détails disponibles</p>;
  }

  const data = analysis;

  // Filtrer les métriques intéressantes selon la catégorie
  const renderMetric = (key: string, value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return null;

    // Formater selon le type de valeur
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('rate')) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (value % 1 !== 0) {
        return value.toFixed(2);
      }
      return value.toString();
    }
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const metrics = Object.entries(data)
    .map(([key, value]) => ({
      key,
      label: formatKey(key),
      value: renderMetric(key, value),
    }))
    .filter((m) => m.value !== null)
    .slice(0, 8); // Limiter à 8 métriques

  if (metrics.length === 0) {
    return <p className="text-gray-400 text-sm">Pas de détails disponibles</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric) => (
        <div key={metric.key} className="text-center p-2 bg-gray-800/30 rounded">
          <div className="text-white font-medium text-sm">{metric.value}</div>
          <div className="text-xs text-gray-500">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
