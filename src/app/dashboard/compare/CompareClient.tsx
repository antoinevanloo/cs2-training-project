'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CategoryRadarChart } from '@/components/charts';
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Map,
  Trophy,
  Skull,
  Download,
  Share2,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { CATEGORY_ORDER, getCategoryStyle, getScoreColor } from '@/lib/design/tokens';
import type { AnalysisCategory } from '@/lib/preferences/types';
import { cn } from '@/lib/utils';

interface DemoData {
  id: string;
  mapName: string;
  matchDate: string;
  matchResult: string;
  scoreTeam1: number;
  scoreTeam2: number;
  analysis: {
    overallScore: number;
    aimScore: number;
    positioningScore: number;
    utilityScore: number;
    economyScore: number;
    timingScore: number;
    decisionScore: number;
    movementScore: number | null;
    awarenessScore: number | null;
    teamplayScore: number | null;
  } | null;
  playerStats: {
    kills: number;
    deaths: number;
    assists: number;
    adr: number;
    rating: number;
    headshotPercentage: number;
    kast: number;
  } | null;
}

interface CompareClientProps {
  demos: DemoData[];
  userStats: {
    avgRating: number;
    avgAdr: number;
    avgKast: number;
    avgHsPercent: number;
  } | null;
  /** IDs des analyseurs activés (ex: ['analysis.aim', 'analysis.positioning']) */
  enabledAnalyzers: string[];
}

type CompareMode = 'demos' | 'periods';

// Mapping feature ID -> category key
const FEATURE_TO_CATEGORY: Record<string, AnalysisCategory> = {
  'analysis.aim': 'aim',
  'analysis.positioning': 'positioning',
  'analysis.utility': 'utility',
  'analysis.economy': 'economy',
  'analysis.timing': 'timing',
  'analysis.decision': 'decision',
  'analysis.movement': 'movement',
  'analysis.awareness': 'awareness',
  'analysis.teamplay': 'teamplay',
};

export function CompareClient({ demos, userStats, enabledAnalyzers }: CompareClientProps) {
  // Filtrer les catégories affichées selon les features activées
  const enabledCategories = enabledAnalyzers
    .map(featureId => FEATURE_TO_CATEGORY[featureId])
    .filter((cat): cat is AnalysisCategory => cat !== undefined);

  // Filtrer CATEGORY_ORDER pour n'afficher que les catégories activées
  const visibleCategories = CATEGORY_ORDER.filter(cat => enabledCategories.includes(cat));
  const [compareMode, setCompareMode] = useState<CompareMode>('demos');
  const [selectedDemo1, setSelectedDemo1] = useState<string | null>(null);
  const [selectedDemo2, setSelectedDemo2] = useState<string | null>(null);
  const [period1, setPeriod1] = useState<'7d' | '30d' | '90d'>('7d');
  const [period2, setPeriod2] = useState<'7d' | '30d' | '90d'>('30d');

  const demo1 = demos.find(d => d.id === selectedDemo1);
  const demo2 = demos.find(d => d.id === selectedDemo2);

  // Calculate period stats (simplified - would need API call for real data)
  const periodStats = useMemo(() => {
    const now = new Date();
    const getPeriodDemos = (days: number) => {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return demos.filter(d => new Date(d.matchDate) >= cutoff);
    };

    const calcAvg = (demos: DemoData[], field: keyof NonNullable<DemoData['analysis']>) => {
      const valid = demos.filter(d => d.analysis?.[field] != null);
      if (valid.length === 0) return 0;
      return valid.reduce((sum, d) => sum + (d.analysis?.[field] as number || 0), 0) / valid.length;
    };

    const calcPlayerAvg = (demos: DemoData[], field: keyof NonNullable<DemoData['playerStats']>) => {
      const valid = demos.filter(d => d.playerStats?.[field] != null);
      if (valid.length === 0) return 0;
      return valid.reduce((sum, d) => sum + (d.playerStats?.[field] as number || 0), 0) / valid.length;
    };

    const periods = {
      '7d': getPeriodDemos(7),
      '30d': getPeriodDemos(30),
      '90d': getPeriodDemos(90),
    };

    return Object.entries(periods).reduce((acc, [key, periodDemos]) => {
      acc[key as '7d' | '30d' | '90d'] = {
        demoCount: periodDemos.length,
        overallScore: calcAvg(periodDemos, 'overallScore'),
        aimScore: calcAvg(periodDemos, 'aimScore'),
        positioningScore: calcAvg(periodDemos, 'positioningScore'),
        utilityScore: calcAvg(periodDemos, 'utilityScore'),
        economyScore: calcAvg(periodDemos, 'economyScore'),
        timingScore: calcAvg(periodDemos, 'timingScore'),
        decisionScore: calcAvg(periodDemos, 'decisionScore'),
        movementScore: calcAvg(periodDemos, 'movementScore'),
        awarenessScore: calcAvg(periodDemos, 'awarenessScore'),
        teamplayScore: calcAvg(periodDemos, 'teamplayScore'),
        rating: calcPlayerAvg(periodDemos, 'rating'),
        adr: calcPlayerAvg(periodDemos, 'adr'),
        kast: calcPlayerAvg(periodDemos, 'kast'),
        hsPercent: calcPlayerAvg(periodDemos, 'headshotPercentage'),
      };
      return acc;
    }, {} as Record<'7d' | '30d' | '90d', any>);
  }, [demos]);

  const renderDiff = (value1: number, value2: number, format: 'score' | 'stat' = 'score') => {
    const diff = value1 - value2;
    const formatted = format === 'score' ? diff.toFixed(0) : diff.toFixed(2);

    if (Math.abs(diff) < 0.5) {
      return <span className="text-gray-400 flex items-center gap-1"><Minus className="w-3 h-3" /> 0</span>;
    }

    return diff > 0 ? (
      <span className="text-green-400 flex items-center gap-1">
        <ArrowUp className="w-3 h-3" /> +{formatted}
      </span>
    ) : (
      <span className="text-red-400 flex items-center gap-1">
        <ArrowDown className="w-3 h-3" /> {formatted}
      </span>
    );
  };

  const renderDemoSelector = (
    selectedId: string | null,
    onChange: (id: string) => void,
    excludeId?: string | null,
    label: string = 'Sélectionner une démo'
  ) => (
    <Select
      value={selectedId || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    >
      <option value="">{label}</option>
      {demos
        .filter(d => d.id !== excludeId)
        .map(demo => (
          <option key={demo.id} value={demo.id}>
            {demo.mapName} - {new Date(demo.matchDate).toLocaleDateString('fr-FR')} ({demo.scoreTeam1}-{demo.scoreTeam2})
          </option>
        ))}
    </Select>
  );

  const renderDemoCard = (demo: DemoData | undefined, label: string) => {
    if (!demo) {
      return (
        <Card className="p-8 text-center border-dashed border-gray-600">
          <Map className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">{label}</p>
        </Card>
      );
    }

    const resultColor = demo.matchResult === 'WIN' ? 'text-green-400' : demo.matchResult === 'LOSS' ? 'text-red-400' : 'text-gray-400';
    const ResultIcon = demo.matchResult === 'WIN' ? Trophy : Skull;

    return (
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
            <Map className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold capitalize">{demo.mapName.replace('de_', '')}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={resultColor}>{demo.scoreTeam1} - {demo.scoreTeam2}</span>
              <ResultIcon className={cn('w-4 h-4', resultColor)} />
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <Calendar className="w-4 h-4 inline mr-1" />
            {new Date(demo.matchDate).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {demo.analysis && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-800/50 rounded">
              <div className="text-lg font-bold" style={{ color: getScoreColor(demo.analysis.overallScore) }}>
                {demo.analysis.overallScore.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">Score Global</div>
            </div>
            <div className="p-2 bg-gray-800/50 rounded">
              <div className="text-lg font-bold text-white">
                {demo.playerStats?.rating.toFixed(2) || '-'}
              </div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
            <div className="p-2 bg-gray-800/50 rounded">
              <div className="text-lg font-bold text-white">
                {demo.playerStats?.adr.toFixed(0) || '-'}
              </div>
              <div className="text-xs text-gray-500">ADR</div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderCategoryComparison = () => {
    const getScores = (source: 'demo1' | 'demo2' | 'period1' | 'period2') => {
      if (compareMode === 'demos') {
        const demo = source === 'demo1' ? demo1 : demo2;
        if (!demo?.analysis) return null;
        return {
          aim: demo.analysis.aimScore,
          positioning: demo.analysis.positioningScore,
          utility: demo.analysis.utilityScore,
          economy: demo.analysis.economyScore,
          timing: demo.analysis.timingScore,
          decision: demo.analysis.decisionScore,
          movement: demo.analysis.movementScore || 0,
          awareness: demo.analysis.awarenessScore || 0,
          teamplay: demo.analysis.teamplayScore || 0,
        };
      } else {
        const stats = source === 'period1' ? periodStats[period1] : periodStats[period2];
        return {
          aim: stats.aimScore,
          positioning: stats.positioningScore,
          utility: stats.utilityScore,
          economy: stats.economyScore,
          timing: stats.timingScore,
          decision: stats.decisionScore,
          movement: stats.movementScore,
          awareness: stats.awarenessScore,
          teamplay: stats.teamplayScore,
        };
      }
    };

    const scores1 = getScores(compareMode === 'demos' ? 'demo1' : 'period1');
    const scores2 = getScores(compareMode === 'demos' ? 'demo2' : 'period2');

    if (!scores1 || !scores2) return null;

    return (
      <div className="space-y-4">
        {/* Radar Chart Overlay */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-white">Comparaison Radar</CardTitle>
          </CardHeader>
          <div className="flex justify-center">
            <CategoryRadarChart
              scores={scores1}
              comparisonScores={scores2}
              size={320}
              showLabels
              showValues
              showLegend
            />
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-400">
                {compareMode === 'demos' ? 'Démo 1' : `${period1 === '7d' ? '7 jours' : period1 === '30d' ? '30 jours' : '90 jours'}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-400">
                {compareMode === 'demos' ? 'Démo 2' : `${period2 === '7d' ? '7 jours' : period2 === '30d' ? '30 jours' : '90 jours'}`}
              </span>
            </div>
          </div>
        </Card>

        {/* Category by Category (filtrées par features activées) */}
        <Card className="p-4">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Détail par catégorie</CardTitle>
              <span className="text-xs text-gray-500">{visibleCategories.length} catégories actives</span>
            </div>
          </CardHeader>
          {visibleCategories.length > 0 ? (
            <div className="space-y-2">
              {visibleCategories.map((category) => {
                const style = getCategoryStyle(category);
                const score1 = scores1[category as keyof typeof scores1];
                const score2 = scores2[category as keyof typeof scores2];

                return (
                  <div key={category} className="flex items-center gap-4 p-2 bg-gray-800/30 rounded">
                    <div className="w-24 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: style.color }}
                      />
                      <span className="text-sm text-gray-300">{style.label}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-16 text-right">
                        <span className="font-bold" style={{ color: getScoreColor(score1) }}>
                          {score1.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex-1 relative h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 h-full bg-blue-500/50"
                          style={{ width: `${score1}%` }}
                        />
                        <div
                          className="absolute left-0 h-full bg-purple-500/50"
                          style={{ width: `${score2}%` }}
                        />
                      </div>
                      <div className="w-16">
                        <span className="font-bold" style={{ color: getScoreColor(score2) }}>
                          {score2.toFixed(0)}
                        </span>
                      </div>
                      <div className="w-20 text-sm">
                        {renderDiff(score1, score2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>Aucune catégorie d&apos;analyse activée.</p>
              <a href="/dashboard/settings" className="text-cs2-accent hover:underline text-sm mt-2 inline-block">
                Configurer les analyseurs →
              </a>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comparaison</h1>
          <p className="text-gray-400 mt-1">Compare tes performances entre démos ou périodes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Mode selector */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={compareMode === 'demos' ? 'primary' : 'secondary'}
            onClick={() => setCompareMode('demos')}
            className="flex-1"
          >
            Comparer 2 démos
          </Button>
          <Button
            variant={compareMode === 'periods' ? 'primary' : 'secondary'}
            onClick={() => setCompareMode('periods')}
            className="flex-1"
          >
            Comparer périodes
          </Button>
        </div>
      </Card>

      {/* Selection */}
      {compareMode === 'demos' ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Démo 1</label>
            {renderDemoSelector(selectedDemo1, setSelectedDemo1, selectedDemo2, 'Sélectionner la première démo')}
            {renderDemoCard(demo1, 'Sélectionne une démo')}
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Démo 2</label>
            {renderDemoSelector(selectedDemo2, setSelectedDemo2, selectedDemo1, 'Sélectionner la deuxième démo')}
            {renderDemoCard(demo2, 'Sélectionne une démo')}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <label className="text-sm text-gray-400 block mb-2">Période 1</label>
            <Select
              value={period1}
              onChange={(e) => setPeriod1(e.target.value as any)}
              className="w-full"
            >
              <option value="7d">7 derniers jours ({periodStats['7d']?.demoCount || 0} démos)</option>
              <option value="30d">30 derniers jours ({periodStats['30d']?.demoCount || 0} démos)</option>
              <option value="90d">90 derniers jours ({periodStats['90d']?.demoCount || 0} démos)</option>
            </Select>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-gray-800/50 rounded">
                <div className="text-lg font-bold text-white">{periodStats[period1]?.rating.toFixed(2) || '-'}</div>
                <div className="text-xs text-gray-500">Rating moy.</div>
              </div>
              <div className="p-2 bg-gray-800/50 rounded">
                <div className="text-lg font-bold text-white">{periodStats[period1]?.adr.toFixed(0) || '-'}</div>
                <div className="text-xs text-gray-500">ADR moy.</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <label className="text-sm text-gray-400 block mb-2">Période 2</label>
            <Select
              value={period2}
              onChange={(e) => setPeriod2(e.target.value as any)}
              className="w-full"
            >
              <option value="7d">7 derniers jours ({periodStats['7d']?.demoCount || 0} démos)</option>
              <option value="30d">30 derniers jours ({periodStats['30d']?.demoCount || 0} démos)</option>
              <option value="90d">90 derniers jours ({periodStats['90d']?.demoCount || 0} démos)</option>
            </Select>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-gray-800/50 rounded">
                <div className="text-lg font-bold text-white">{periodStats[period2]?.rating.toFixed(2) || '-'}</div>
                <div className="text-xs text-gray-500">Rating moy.</div>
              </div>
              <div className="p-2 bg-gray-800/50 rounded">
                <div className="text-lg font-bold text-white">{periodStats[period2]?.adr.toFixed(0) || '-'}</div>
                <div className="text-xs text-gray-500">ADR moy.</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Comparison Results */}
      {((compareMode === 'demos' && demo1 && demo2) || compareMode === 'periods') && (
        renderCategoryComparison()
      )}

      {/* Empty state */}
      {compareMode === 'demos' && (!demo1 || !demo2) && (
        <Card className="p-12 text-center">
          <ArrowRight className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">
            Sélectionne deux démos pour les comparer
          </p>
        </Card>
      )}
    </div>
  );
}
