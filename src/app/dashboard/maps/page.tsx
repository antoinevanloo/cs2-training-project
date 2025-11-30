import { requireAuth } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GranularityBadge } from '@/components/ui/GranularityBadge';
import { Map, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const metadata = {
  title: 'Vue par Map | CS2 Coach',
};

// Map images/backgrounds (on peut les remplacer par des vraies images plus tard)
const MAP_COLORS: Record<string, string> = {
  dust2: 'from-yellow-900/40 to-orange-900/20',
  mirage: 'from-blue-900/40 to-cyan-900/20',
  inferno: 'from-red-900/40 to-orange-900/20',
  nuke: 'from-green-900/40 to-teal-900/20',
  overpass: 'from-emerald-900/40 to-green-900/20',
  ancient: 'from-stone-900/40 to-amber-900/20',
  anubis: 'from-amber-900/40 to-yellow-900/20',
  vertigo: 'from-sky-900/40 to-blue-900/20',
};

export default async function MapsPage() {
  const user = await requireAuth();

  // Récupérer toutes les stats par map
  const mapStats = await getDetailedMapStats(user.id);

  // Calculer les tendances globales
  const totalDemos = mapStats.reduce((sum, m) => sum + m.gamesPlayed, 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Vue par Map</h1>
            <GranularityBadge level="map" showLabel />
          </div>
          <p className="text-gray-400 mt-1">
            Analysez vos performances sur chaque map
          </p>
        </div>
        <Link
          href="/dashboard/overview"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Retour à la vue globale
        </Link>
      </div>

      {mapStats.length === 0 ? (
        <Card className="p-12 text-center border-gray-800/50">
          <Map className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Aucune donnée par map disponible</p>
          <p className="text-sm text-gray-500 mt-2">
            Uploadez des démos pour voir vos statistiques par map
          </p>
        </Card>
      ) : (
        <>
          {/* Grille des maps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mapStats.map((map) => (
              <Link
                key={map.mapName}
                href={`/dashboard/maps/${map.mapName.replace('de_', '')}`}
                className="group"
              >
                <Card className={`
                  relative overflow-hidden border-gray-800/50
                  hover:border-cs2-accent/50 transition-all duration-300
                  bg-gradient-to-br ${MAP_COLORS[map.mapName.replace('de_', '')] || 'from-gray-900/50 to-gray-800/30'}
                `}>
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-cs2-accent/0 group-hover:bg-cs2-accent/5 transition-colors" />

                  <CardContent className="p-5 relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white capitalize group-hover:text-cs2-accent transition-colors">
                        {map.mapName.replace('de_', '')}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cs2-accent transition-colors" />
                    </div>

                    {/* Stats principales */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-400 uppercase">Parties</div>
                        <div className="text-xl font-bold text-white">{map.gamesPlayed}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 uppercase">Win Rate</div>
                        <div className={`text-xl font-bold ${
                          map.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {Math.round(map.winRate)}%
                        </div>
                      </div>
                    </div>

                    {/* Stats secondaires */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/30">
                      <div>
                        <div className="text-xs text-gray-500">Rating moy.</div>
                        <div className="text-sm font-medium text-cs2-accent">
                          {map.avgRating.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Score moy.</div>
                        <div className="text-sm font-medium text-white">
                          {Math.round(map.avgScore)}/100
                        </div>
                      </div>
                    </div>

                    {/* Tendance */}
                    <div className="mt-4 flex items-center gap-2">
                      {map.trend === 'up' && (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">En progression</span>
                        </>
                      )}
                      {map.trend === 'down' && (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-400">En baisse</span>
                        </>
                      )}
                      {map.trend === 'stable' && (
                        <>
                          <Minus className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Stable</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Résumé global */}
          <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
            <CardHeader>
              <CardTitle>Comparaison des maps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mapStats.map((map) => (
                  <div key={map.mapName} className="flex items-center gap-4">
                    <div className="w-24 text-white font-medium capitalize">
                      {map.mapName.replace('de_', '')}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            map.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${map.winRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className={map.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                        {Math.round(map.winRate)}%
                      </span>
                    </div>
                    <div className="w-20 text-right text-gray-400">
                      {map.gamesPlayed} parties
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conseils */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Map la plus forte */}
            {mapStats.length > 0 && (
              <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-gray-900/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Votre meilleure map</span>
                  </div>
                  <div className="text-2xl font-bold text-white capitalize mb-1">
                    {mapStats.sort((a, b) => b.winRate - a.winRate)[0].mapName.replace('de_', '')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {Math.round(mapStats.sort((a, b) => b.winRate - a.winRate)[0].winRate)}% de victoires
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map à améliorer */}
            {mapStats.length > 1 && (
              <Card className="border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-gray-900/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-medium">Map à améliorer</span>
                  </div>
                  <div className="text-2xl font-bold text-white capitalize mb-1">
                    {mapStats.sort((a, b) => a.winRate - b.winRate)[0].mapName.replace('de_', '')}
                  </div>
                  <div className="text-sm text-gray-400">
                    {Math.round(mapStats.sort((a, b) => a.winRate - b.winRate)[0].winRate)}% de victoires
                  </div>
                  <Link
                    href={`/dashboard/maps/${mapStats.sort((a, b) => a.winRate - b.winRate)[0].mapName.replace('de_', '')}`}
                    className="inline-flex items-center gap-1 mt-3 text-sm text-orange-400 hover:text-orange-300"
                  >
                    Voir le coaching spécifique
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper: Récupérer les stats détaillées par map
async function getDetailedMapStats(userId: string) {
  const demos = await prisma.demo.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    include: {
      analysis: {
        select: {
          overallScore: true,
          aimScore: true,
          positioningScore: true,
          utilityScore: true,
          economyScore: true,
          timingScore: true,
          decisionScore: true,
        },
      },
      playerStats: {
        where: { isMainPlayer: true },
        select: {
          rating: true,
          adr: true,
        },
      },
    },
    orderBy: { matchDate: 'desc' },
  });

  const mapData: Record<string, {
    gamesPlayed: number;
    wins: number;
    totalRating: number;
    totalScore: number;
    recentScores: number[];
    demos: Array<{ matchDate: Date; score: number }>;
  }> = {};

  demos.forEach((demo) => {
    const mapName = demo.mapName;
    if (!mapData[mapName]) {
      mapData[mapName] = {
        gamesPlayed: 0,
        wins: 0,
        totalRating: 0,
        totalScore: 0,
        recentScores: [],
        demos: [],
      };
    }

    mapData[mapName].gamesPlayed++;
    if (demo.matchResult === 'WIN') mapData[mapName].wins++;

    const rating = demo.playerStats[0]?.rating || 0;
    mapData[mapName].totalRating += rating;

    if (demo.analysis) {
      mapData[mapName].totalScore += demo.analysis.overallScore;
      mapData[mapName].demos.push({
        matchDate: demo.matchDate,
        score: demo.analysis.overallScore,
      });
    }
  });

  return Object.entries(mapData)
    .map(([mapName, data]) => {
      // Calculer la tendance
      const sortedDemos = data.demos.sort((a, b) =>
        new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      );
      const recent = sortedDemos.slice(0, 5);
      const older = sortedDemos.slice(5, 10);

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recent.length >= 3 && older.length >= 3) {
        const recentAvg = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, d) => sum + d.score, 0) / older.length;
        if (recentAvg > olderAvg + 3) trend = 'up';
        else if (recentAvg < olderAvg - 3) trend = 'down';
      }

      return {
        mapName,
        gamesPlayed: data.gamesPlayed,
        winRate: data.gamesPlayed > 0 ? (data.wins / data.gamesPlayed) * 100 : 0,
        avgRating: data.gamesPlayed > 0 ? data.totalRating / data.gamesPlayed : 0,
        avgScore: data.demos.length > 0 ? data.totalScore / data.demos.length : 0,
        trend,
      };
    })
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}