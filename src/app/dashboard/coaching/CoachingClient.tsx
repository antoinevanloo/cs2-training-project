'use client';

import { useState } from 'react';
import { TabNavigation, Tab } from '@/components/ui/TabNavigation';
import { TrendingUp, Map, Dumbbell, Trophy, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { WORKSHOP_MAPS, COMMUNITY_SERVERS, THEORY_EXERCISES } from '@/lib/coaching/actionable/exercises-library';

// Type simplifié pour l'affichage des exercices
interface ExerciseDisplay {
  name: string;
  description: string;
  duration: number;
  type: 'workshop' | 'community_server' | 'theory';
  category: string;
  steamId?: string;
}

// Combine all exercises into a simplified format for display
const exercises: ExerciseDisplay[] = [
  ...WORKSHOP_MAPS.map((m) => ({
    name: m.name,
    description: m.description,
    duration: m.estimatedDuration,
    type: 'workshop' as const,
    category: m.category[0],
    steamId: m.steamId,
  })),
  ...COMMUNITY_SERVERS.map((s) => ({
    name: s.name,
    description: s.description,
    duration: s.suggestedDuration,
    type: 'community_server' as const,
    category: s.category[0],
  })),
  ...THEORY_EXERCISES.map((t) => ({
    name: t.name,
    description: t.description,
    duration: t.estimatedDuration,
    type: 'theory' as const,
    category: t.category[0],
  })),
];

interface Demo {
  id: string;
  mapName: string;
  matchDate: string;
  matchResult: 'WIN' | 'LOSS' | 'TIE';
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
    strengths: string[];
    weaknesses: string[];
  } | null;
  playerStats: {
    kills: number;
    deaths: number;
    rating: number;
    adr: number;
  } | null;
}

interface MapStat {
  map: string;
  gamesPlayed: number;
  winRate: number;
  avgScore: number;
  wins: number;
  losses: number;
  ties: number;
  topStrengths: string[];
  topWeaknesses: string[];
}

interface Weakness {
  name: string;
  count: number;
  percentage: number;
}

interface Trend {
  category: string;
  current: number;
  previous: number | null;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface CoachingClientProps {
  demos: Demo[];
  mapStats: MapStat[];
  recurringWeaknesses: Weakness[];
  trends: Trend[] | null;
}

type TabId = 'progression' | 'maps' | 'exercises';

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  overall: { label: 'Global', icon: '📊' },
  aim: { label: 'Aim', icon: '🎯' },
  positioning: { label: 'Position', icon: '📍' },
  utility: { label: 'Utility', icon: '💣' },
  economy: { label: 'Économie', icon: '💰' },
  timing: { label: 'Timing', icon: '⏱️' },
  decision: { label: 'Décisions', icon: '🧠' },
};

export function CoachingClient({
  demos,
  mapStats,
  recurringWeaknesses,
  trends,
}: CoachingClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('progression');
  const [selectedMap, setSelectedMap] = useState<string | null>(
    mapStats.length > 0 ? mapStats[0].map : null
  );

  const tabs: Tab[] = [
    { id: 'progression', label: 'Progression', icon: TrendingUp },
    { id: 'maps', label: 'Par Map', icon: Map },
    { id: 'exercises', label: 'Exercices', icon: Dumbbell },
  ];

  // Stats globales
  const totalGames = demos.length;
  const wins = demos.filter((d) => d.matchResult === 'WIN').length;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const avgScore = demos.length > 0
    ? demos.reduce((sum, d) => sum + (d.analysis?.overallScore || 0), 0) / demos.length
    : 0;

  if (demos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-400 mb-4">
          Uploadez et analysez des demos pour accéder à votre coaching personnalisé
        </p>
        <Link href="/dashboard/demos/upload">
          <Button>Uploader une démo</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Matchs analysés" value={totalGames} icon="🎮" />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(0)}%`}
          icon="🏆"
          color={winRate >= 50 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard label="Score moyen" value={avgScore.toFixed(0)} icon="📊" />
        <StatCard label="Maps jouées" value={mapStats.length} icon="🗺️" />
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        variant="pills"
        size="md"
      />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'progression' && (
          <ProgressionTab
            demos={demos}
            trends={trends}
            recurringWeaknesses={recurringWeaknesses}
          />
        )}

        {activeTab === 'maps' && (
          <MapsTab
            mapStats={mapStats}
            selectedMap={selectedMap}
            onSelectMap={setSelectedMap}
          />
        )}

        {activeTab === 'exercises' && (
          <ExercisesTab recurringWeaknesses={recurringWeaknesses} />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = 'text-white',
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Onglet Progression
function ProgressionTab({
  demos,
  trends,
  recurringWeaknesses,
}: {
  demos: Demo[];
  trends: Trend[] | null;
  recurringWeaknesses: Weakness[];
}) {
  const recentDemos = demos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Tendances */}
      {trends && trends.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Tendances (10 derniers matchs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {trends.map((trend) => {
                const cat = CATEGORY_LABELS[trend.category];
                const TrendIcon = trend.trend === 'up' ? TrendingUp : trend.trend === 'down' ? TrendingDown : Minus;
                const trendColor = trend.trend === 'up' ? 'text-green-400' : trend.trend === 'down' ? 'text-red-400' : 'text-gray-400';

                return (
                  <div key={trend.category} className="p-3 bg-gray-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{cat?.icon} {cat?.label}</span>
                      <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    </div>
                    <div className="text-xl font-bold text-white">{trend.current.toFixed(0)}</div>
                    {trend.previous !== null && (
                      <div className={`text-xs ${trendColor}`}>
                        {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faiblesses récurrentes */}
      {recurringWeaknesses.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Faiblesses récurrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recurringWeaknesses.slice(0, 5).map((weakness) => (
                <div key={weakness.name} className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-white text-sm">{weakness.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.min(100, weakness.percentage)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {weakness.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Derniers matchs */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Derniers matchs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentDemos.map((demo) => {
              const mapName = demo.mapName.replace('de_', '');
              const resultColor = demo.matchResult === 'WIN' ? 'text-green-400' : demo.matchResult === 'LOSS' ? 'text-red-400' : 'text-yellow-400';

              return (
                <Link
                  key={demo.id}
                  href={`/dashboard/demos/${demo.id}/report`}
                  className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${resultColor}`}>
                      {demo.matchResult === 'WIN' ? 'V' : demo.matchResult === 'LOSS' ? 'D' : 'N'}
                    </span>
                    <span className="text-white capitalize">{mapName}</span>
                    <span className="text-gray-400 text-sm">
                      {demo.scoreTeam1}-{demo.scoreTeam2}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-cs2-accent font-medium">
                      {demo.analysis?.overallScore.toFixed(0) || '-'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Onglet Maps
function MapsTab({
  mapStats,
  selectedMap,
  onSelectMap,
}: {
  mapStats: MapStat[];
  selectedMap: string | null;
  onSelectMap: (map: string) => void;
}) {
  const selected = mapStats.find((m) => m.map === selectedMap);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Liste des maps */}
      <div className="space-y-2">
        <h3 className="text-white font-medium mb-3">Sélectionner une map</h3>
        {mapStats.map((stat) => (
          <button
            key={stat.map}
            onClick={() => onSelectMap(stat.map)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              selectedMap === stat.map
                ? 'bg-cs2-accent/20 border border-cs2-accent/50'
                : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-white capitalize font-medium">{stat.map}</span>
              <span className="text-xs text-gray-400">({stat.gamesPlayed})</span>
            </div>
            <span className={`text-sm ${stat.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {stat.winRate.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>

      {/* Détails de la map sélectionnée */}
      <div className="lg:col-span-2">
        {selected ? (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white capitalize">{selected.map}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-900/30 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white">{selected.gamesPlayed}</div>
                  <div className="text-xs text-gray-400">Matchs</div>
                </div>
                <div className="p-3 bg-gray-900/30 rounded-lg text-center">
                  <div className={`text-2xl font-bold ${selected.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {selected.winRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
                <div className="p-3 bg-gray-900/30 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cs2-accent">{selected.avgScore.toFixed(0)}</div>
                  <div className="text-xs text-gray-400">Score moyen</div>
                </div>
                <div className="p-3 bg-gray-900/30 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white">
                    {selected.wins}/{selected.losses}
                  </div>
                  <div className="text-xs text-gray-400">V/D</div>
                </div>
              </div>

              {/* Forces sur cette map */}
              {selected.topStrengths.length > 0 && (
                <div>
                  <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Points forts sur {selected.map}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.topStrengths.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Faiblesses sur cette map */}
              {selected.topWeaknesses.length > 0 && (
                <div>
                  <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    À améliorer sur {selected.map}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.topWeaknesses.map((w, i) => (
                      <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm border border-red-500/30">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sélectionnez une map pour voir les détails
          </div>
        )}
      </div>
    </div>
  );
}

// Onglet Exercices
function ExercisesTab({ recurringWeaknesses }: { recurringWeaknesses: Weakness[] }) {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Catégories des faiblesses pour recommander des exercices pertinents
  const categories = ['all', 'aim', 'utility', 'positioning', 'decision'];

  // Filtrer les exercices
  const filteredExercises = exercises.filter((ex) => {
    if (filterCategory === 'all') return true;
    return ex.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Recommandations basées sur les faiblesses */}
      {recurringWeaknesses.length > 0 && (
        <Card className="bg-gradient-to-r from-cs2-accent/10 to-orange-500/5 border-cs2-accent/30">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400 mb-2">Basé sur tes faiblesses récurrentes:</p>
            <div className="flex flex-wrap gap-2">
              {recurringWeaknesses.slice(0, 3).map((w) => (
                <span key={w.name} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">
                  {w.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtre par catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-cs2-accent text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat]?.label || cat}
          </button>
        ))}
      </div>

      {/* Liste des exercices */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredExercises.slice(0, 8).map((ex, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700/50 hover:border-cs2-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-white">{ex.name}</h3>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {ex.duration}min
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{ex.description}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    ex.type === 'workshop'
                      ? 'bg-blue-500/20 text-blue-400'
                      : ex.type === 'community_server'
                      ? 'bg-green-500/20 text-green-400'
                      : ex.type === 'theory'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {ex.type.replace('_', ' ')}
                </span>
                {ex.steamId && (
                  <a
                    href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${ex.steamId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cs2-accent hover:underline"
                  >
                    Ouvrir sur Steam →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
