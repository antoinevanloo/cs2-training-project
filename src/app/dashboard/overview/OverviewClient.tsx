'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { GranularityBadge } from '@/components/ui/GranularityBadge';
import { MetricDisplay, MetricCard } from '@/components/ui/MetricDisplay';
import {
  Target,
  Crosshair,
  MapPin,
  Bomb,
  DollarSign,
  Clock,
  Brain,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Upload,
  Map,
  FileText,
} from 'lucide-react';

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
  } | null;
  recurringWeaknesses: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  userName: string;
}

const CATEGORY_CONFIG = [
  { key: 'aim', label: 'Aim', icon: Crosshair, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { key: 'positioning', label: 'Position', icon: MapPin, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'utility', label: 'Utility', icon: Bomb, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { key: 'economy', label: 'Economy', icon: DollarSign, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { key: 'timing', label: 'Timing', icon: Clock, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { key: 'decision', label: 'Decision', icon: Brain, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
];

export function OverviewClient({
  stats,
  recentDemos,
  ratingHistory,
  analysisStats,
  recurringWeaknesses,
  userName,
}: OverviewClientProps) {
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
        {/* 6 Catégories d'analyse */}
        <Card className="lg:col-span-2 border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Scores d&apos;analyse</CardTitle>
              <GranularityBadge level="global" showLabel />
            </div>
            <span className="text-xs text-gray-500">
              Basé sur {analysisStats?.count || 0} analyses
            </span>
          </CardHeader>
          <CardContent>
            {analysisStats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CATEGORY_CONFIG.map((cat) => {
                  const Icon = cat.icon;
                  const score = analysisStats[`avg${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}` as keyof typeof analysisStats] as number;
                  const metricId = `${cat.key}Score`;
                  return (
                    <div
                      key={cat.key}
                      className="p-4 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 rounded ${cat.bgColor}`}>
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                      </div>
                      <MetricDisplay
                        metricId={metricId}
                        value={score}
                        granularity="global"
                        showGranularity={false}
                        size="md"
                      />
                      <Progress
                        value={score}
                        color="score"
                        size="sm"
                        className="mt-2"
                      />
                    </div>
                  );
                })}
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