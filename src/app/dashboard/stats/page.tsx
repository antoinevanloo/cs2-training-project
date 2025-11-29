import { requireAuth } from '@/lib/auth/utils';
import { getUserStats, getMapPerformance, getRatingProgression } from '@/lib/db/queries/stats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { ProgressChart } from '@/components/dashboard/ProgressChart';

export default async function StatsPage() {
  const user = await requireAuth();

  const [stats, mapPerformance, ratingHistory] = await Promise.all([
    getUserStats(user.id),
    getMapPerformance(user.id),
    getRatingProgression(user.id),
  ]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistiques</h1>
        <p className="text-gray-400 mt-1">
          Vue d&apos;ensemble de vos performances
        </p>
      </div>

      {!stats || stats.totalDemos === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">
            Uploadez des demos pour voir vos statistiques
          </p>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="text-xs text-gray-400 uppercase">Demos</div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.totalDemos}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-400 uppercase">Win Rate</div>
              <div className="text-2xl font-bold text-cs2-win mt-1">
                {Math.round(stats.winRate * 100)}%
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-400 uppercase">Rating</div>
              <div className="text-2xl font-bold text-cs2-accent mt-1">
                {stats.avgRating.toFixed(2)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-400 uppercase">ADR</div>
              <div className="text-2xl font-bold text-white mt-1">
                {Math.round(stats.avgAdr)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-400 uppercase">K/D</div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats.totalDeaths > 0
                  ? (stats.totalKills / stats.totalDeaths).toFixed(2)
                  : stats.totalKills}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-400 uppercase">HS%</div>
              <div className="text-2xl font-bold text-white mt-1">
                {Math.round(stats.avgHsPercent)}%
              </div>
            </Card>
          </div>

          {/* Rating Progression */}
          <ProgressChart data={ratingHistory} />

          {/* Map Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance par map</CardTitle>
            </CardHeader>
            <CardContent>
              {mapPerformance.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  Pas assez de données
                </p>
              ) : (
                <div className="space-y-4">
                  {mapPerformance.map((map) => (
                    <div key={map.mapName} className="flex items-center gap-4">
                      <div className="w-24 text-white font-medium capitalize">
                        {map.mapName.replace('de_', '')}
                      </div>
                      <div className="flex-1">
                        <Progress
                          value={map.winRate * 100}
                          color="score"
                          size="md"
                        />
                      </div>
                      <div className="w-16 text-right text-gray-400">
                        {Math.round(map.winRate * 100)}%
                      </div>
                      <div className="w-16 text-right text-cs2-accent">
                        {map.avgRating.toFixed(2)}
                      </div>
                      <div className="w-16 text-right text-gray-500">
                        {map.played} games
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Scores d&apos;analyse moyens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Aim</div>
                  <Progress
                    value={stats.avgAimScore}
                    color="score"
                    showLabel
                  />
                </div>
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Positionnement</div>
                  <Progress
                    value={stats.avgPositioningScore}
                    color="score"
                    showLabel
                  />
                </div>
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Utilités</div>
                  <Progress
                    value={stats.avgUtilityScore}
                    color="score"
                    showLabel
                  />
                </div>
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Économie</div>
                  <Progress
                    value={stats.avgEconomyScore}
                    color="score"
                    showLabel
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
