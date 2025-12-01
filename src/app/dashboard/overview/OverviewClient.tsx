'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { GranularityBadge } from '@/components/ui/GranularityBadge';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { CategoryScoreCard } from '@/components/ui/CategoryScoreCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { getAdjustedWeights, convertUserWeightsToFeatureWeights } from '@/lib/features/score-calculator';
import {
  Target,
  Crosshair,
  MapPin,
  Bomb,
  DollarSign,
  Clock,
  Brain,
  AlertTriangle,
  ChevronRight,
  Upload,
  Map,
  FileText,
  Move,
  Eye,
  Users,
  Settings,
  Lock,
  Star,
} from 'lucide-react';
import type { CategoryWeights } from '@/lib/preferences';
import type { AnalysisCategory } from '@/lib/preferences/types';

interface OverviewClientProps {
  stats: {
    avgRating: number;
    avgAdr: number;
    avgKast: number;
    avgHsPercent: number;
    totalMatches: number;
    totalDemos: number;
    winRate: number;
    wins: number;
    losses: number;
    ties: number;
  } | null;
  recentDemos: Array<{
    id: string;
    mapName: string;
    matchDate: string;
    matchResult: string;
    scoreTeam1: number;
    scoreTeam2: number;
  }>;
  ratingHistory: Array<{ date: string; rating: number }>;
  analysisStats: {
    count: number;
    avgOverall: number;
    avgAim: number;
    avgPositioning: number;
    avgUtility: number;
    avgEconomy: number;
    avgTiming: number;
    avgDecision: number;
    avgMovement: number;
    avgAwareness: number;
    avgTeamplay: number;
  } | null;
  recurringWeaknesses: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  userName: string;
  /** IDs des analyseurs activés (ex: ['analysis.aim', 'analysis.positioning']) */
  enabledAnalyzers: string[];
  /** Poids personnalisés des catégories */
  categoryWeights: CategoryWeights;
  /** Catégories prioritaires (affichées en premier avec étoile) */
  priorityCategories: string[];
}

// Configuration complète des 9 catégories v2
const CATEGORY_CONFIG = [
  { key: 'aim', featureId: 'analysis.aim', label: 'Aim', icon: Crosshair, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { key: 'positioning', featureId: 'analysis.positioning', label: 'Position', icon: MapPin, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'utility', featureId: 'analysis.utility', label: 'Utility', icon: Bomb, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { key: 'economy', featureId: 'analysis.economy', label: 'Economy', icon: DollarSign, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { key: 'timing', featureId: 'analysis.timing', label: 'Timing', icon: Clock, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { key: 'decision', featureId: 'analysis.decision', label: 'Decision', icon: Brain, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { key: 'movement', featureId: 'analysis.movement', label: 'Movement', icon: Move, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { key: 'awareness', featureId: 'analysis.awareness', label: 'Awareness', icon: Eye, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  { key: 'teamplay', featureId: 'analysis.teamplay', label: 'Teamplay', icon: Users, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
];

export function OverviewClient({
  stats,
  recentDemos,
  ratingHistory,
  analysisStats,
  recurringWeaknesses,
  userName,
  enabledAnalyzers,
  categoryWeights,
  priorityCategories,
}: OverviewClientProps) {
  // Calculer les poids ajustés en fonction des catégories activées
  const customWeights = useMemo(() => {
    return convertUserWeightsToFeatureWeights(categoryWeights);
  }, [categoryWeights]);

  const adjustedWeights = useMemo(() => {
    return getAdjustedWeights(enabledAnalyzers, customWeights);
  }, [enabledAnalyzers, customWeights]);

  // Nombre de catégories activées/désactivées
  const enabledCount = enabledAnalyzers.filter(id => id.startsWith('analysis.')).length;
  const disabledCount = CATEGORY_CONFIG.length - enabledCount;

  // Trier les catégories: prioritaires d'abord, puis les autres
  const orderedCategories = useMemo(() => {
    if (priorityCategories.length === 0) return CATEGORY_CONFIG;
    const prioritySet = new Set(priorityCategories);
    const priorityCats = CATEGORY_CONFIG.filter(c => prioritySet.has(c.key));
    const otherCats = CATEGORY_CONFIG.filter(c => !prioritySet.has(c.key));
    return [...priorityCats, ...otherCats];
  }, [priorityCategories]);

  // Préparer les catégories avec leur état d'activation
  const categoriesWithState = useMemo(() => {
    return orderedCategories.map(cat => ({
      ...cat,
      isEnabled: enabledAnalyzers.includes(cat.featureId),
      isPriority: priorityCategories.includes(cat.key),
      originalWeight: customWeights[cat.featureId] ?? 11.11,
      adjustedWeight: adjustedWeights[cat.featureId],
    }));
  }, [orderedCategories, enabledAnalyzers, priorityCategories, customWeights, adjustedWeights]);

  // Récupérer le score pour une catégorie
  const getScore = (key: string): number | undefined => {
    if (!analysisStats) return undefined;
    const scoreKey = `avg${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof analysisStats;
    return analysisStats[scoreKey] as number | undefined;
  };

  if (!stats || stats.totalDemos === 0) {
    return <EmptyState userName={userName} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats principales avec MetricDisplay */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="rating"
            value={stats.avgRating}
            granularity="global"
            size="md"
          />
        </Card>
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="adr"
            value={stats.avgAdr}
            granularity="global"
            size="md"
          />
        </Card>
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="kast"
            value={stats.avgKast}
            granularity="global"
            size="md"
          />
        </Card>
        <Card className="p-4 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <MetricDisplay
            metricId="winRate"
            value={stats.winRate * 100}
            granularity="global"
            size="md"
          />
          <div className="text-xs text-gray-500 mt-1">{stats.wins}V {stats.losses}D {stats.ties}N</div>
        </Card>
      </div>

      {/* Graphique de progression */}
      <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Progression</CardTitle>
            <GranularityBadge level="global" showLabel />
          </div>
          <Link
            href="/dashboard/stats"
            className="text-sm text-gray-400 hover:text-cs2-accent flex items-center gap-1 transition-colors"
          >
            Détails
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <ProgressChart data={ratingHistory} />
        </CardContent>
      </Card>

      {/* Grille principale */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Catégories d'analyse (toutes catégories, désactivées grisées) */}
        <Card className="lg:col-span-2 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Scores d&apos;analyse</CardTitle>
              <GranularityBadge level="global" showLabel />
              <InfoTooltip
                variant="help"
                size="sm"
                content={
                  <div className="space-y-2">
                    <div className="font-medium text-white">Système de poids</div>
                    <p className="text-xs text-gray-300">
                      Chaque catégorie a un poids qui détermine son importance dans le score global.
                      Par défaut, toutes les catégories ont le même poids (11.11%).
                    </p>
                    <p className="text-xs text-gray-400">
                      Quand vous désactivez une catégorie, son poids est redistribué proportionnellement
                      aux autres catégories actives.
                    </p>
                    <Link
                      href="/dashboard/settings"
                      className="text-cs2-accent text-xs hover:underline block mt-2"
                    >
                      Personnaliser les poids →
                    </Link>
                  </div>
                }
              />
            </div>
            <div className="flex items-center gap-3">
              {disabledCount > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {disabledCount} désactivée{disabledCount > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {analysisStats?.count || 0} analyses
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {analysisStats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoriesWithState.map((cat) => (
                  <div key={cat.key} className="relative">
                    {cat.isPriority && (
                      <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 fill-yellow-400 z-10" />
                    )}
                    <CategoryScoreCard
                      category={cat.key as AnalysisCategory}
                      label={cat.label}
                      score={cat.isEnabled ? getScore(cat.key) : undefined}
                      icon={cat.icon}
                      iconColor={cat.color}
                      iconBgColor={cat.bgColor}
                      isEnabled={cat.isEnabled}
                      disabledReason="disabled_by_user"
                      originalWeight={cat.originalWeight}
                      adjustedWeight={cat.adjustedWeight}
                      showWeightInfo={true}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            ) : enabledCount === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Lock className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                <p>Toutes les catégories sont désactivées.</p>
                <Link
                  href="/dashboard/settings"
                  className="text-cs2-accent hover:underline text-sm mt-2 inline-flex items-center gap-1"
                >
                  <Settings className="w-4 h-4" />
                  Configurer les analyseurs
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Analysez des démos pour voir vos scores
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faiblesses récurrentes */}
        <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Faiblesses récurrentes
              </CardTitle>
            </div>
            <GranularityBadge level="global" />
          </CardHeader>
          <CardContent>
            {recurringWeaknesses.length > 0 ? (
              <div className="space-y-3">
                {recurringWeaknesses.map((weakness, index) => (
                  <div
                    key={weakness.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800/30"
                  >
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-gray-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{weakness.name}</div>
                      <div className="text-xs text-gray-500">
                        Vu dans {weakness.count} parties ({weakness.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
                <Link
                  href="/dashboard/coaching"
                  className="flex items-center justify-center gap-2 mt-4 p-3 rounded-lg bg-cs2-accent/10 text-cs2-accent hover:bg-cs2-accent/20 transition-colors text-sm font-medium"
                >
                  Voir le coaching
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Pas assez de données
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernières parties */}
      <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières parties</CardTitle>
          <Link
            href="/dashboard/demos"
            className="text-sm text-gray-400 hover:text-cs2-accent flex items-center gap-1 transition-colors"
          >
            Voir tout
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentDemos.map((demo) => (
              <Link
                key={demo.id}
                href={`/dashboard/demos/${demo.id}`}
                className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/30 hover:border-cs2-accent/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white capitalize group-hover:text-cs2-accent transition-colors">
                    {demo.mapName.replace('de_', '')}
                  </span>
                  <span className={`
                    text-sm font-bold
                    ${demo.matchResult === 'WIN' ? 'text-green-400' : ''}
                    ${demo.matchResult === 'LOSS' ? 'text-red-400' : ''}
                    ${demo.matchResult === 'TIE' ? 'text-gray-400' : ''}
                  `}>
                    {demo.scoreTeam1}-{demo.scoreTeam2}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation rapide vers les autres vues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickNavCard
          href="/dashboard/maps"
          icon={<Map className="w-6 h-6" />}
          title="Vue par Map"
          description="Analysez vos performances sur chaque map"
          color="green"
        />
        <QuickNavCard
          href="/dashboard/demos"
          icon={<FileText className="w-6 h-6" />}
          title="Mes Parties"
          description="Historique détaillé de vos matchs"
          color="orange"
        />
        <QuickNavCard
          href="/dashboard/demos/upload"
          icon={<Upload className="w-6 h-6" />}
          title="Upload Demo"
          description="Ajoutez une nouvelle partie à analyser"
          color="blue"
        />
      </div>
    </div>
  );
}

// Composant QuickNavCard
interface QuickNavCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'green' | 'orange' | 'blue';
}

function QuickNavCard({ href, icon, title, description, color }: QuickNavCardProps) {
  const colorClasses = {
    green: 'text-green-400 bg-green-500/10 group-hover:bg-green-500/20',
    orange: 'text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20',
    blue: 'text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20',
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-lg bg-gray-900/30 border border-gray-800/30 hover:border-gray-700/50 transition-all group"
    >
      <div className={`p-3 rounded-lg ${colorClasses[color]} transition-colors`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium text-white group-hover:text-cs2-accent transition-colors">
          {title}
        </div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
    </Link>
  );
}

// État vide
function EmptyState({ userName }: { userName: string }) {
  return (
    <Card className="p-12 text-center border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cs2-accent/10 flex items-center justify-center">
        <Target className="w-8 h-8 text-cs2-accent" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        Bienvenue, {userName} !
      </h2>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Uploadez votre première démo pour commencer l&apos;analyse de vos performances CS2.
      </p>
      <Link
        href="/dashboard/demos/upload"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cs2-accent text-white font-medium hover:bg-cs2-accent/90 transition-colors"
      >
        <Upload className="w-5 h-5" />
        Upload une démo
      </Link>
    </Card>
  );
}