import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Demo {
  id: string;
  mapName: string;
  matchDate: string;
  matchResult: 'WIN' | 'LOSS' | 'TIE';
  scoreTeam1: number;
  scoreTeam2: number;
  analysis?: {
    overallScore: number;
  } | null;
  playerStats: Array<{
    kills: number;
    deaths: number;
    rating: number;
  }>;
}

interface RecentDemosProps {
  demos: Demo[];
}

const mapImages: Record<string, string> = {
  de_dust2: '/maps/de_dust2.png',
  de_mirage: '/maps/de_mirage.png',
  de_inferno: '/maps/de_inferno.png',
  de_anubis: '/maps/de_anubis.png',
  de_ancient: '/maps/de_ancient.png',
  de_nuke: '/maps/de_nuke.png',
  de_vertigo: '/maps/de_vertigo.png',
};

export function RecentDemos({ demos }: RecentDemosProps) {
  if (demos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demos récentes</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <p className="text-gray-400 mb-4">Aucune demo uploadée</p>
          <Link href="/dashboard/demos/upload">
            <Button>Uploader une demo</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Demos récentes</CardTitle>
        <Link href="/dashboard/demos">
          <Button variant="ghost" size="sm">
            Voir tout
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-700/50">
          {demos.map((demo) => {
            const stats = demo.playerStats[0];
            const resultColor =
              demo.matchResult === 'WIN'
                ? 'text-cs2-win'
                : demo.matchResult === 'LOSS'
                ? 'text-cs2-loss'
                : 'text-cs2-tie';

            return (
              <Link
                key={demo.id}
                href={`/dashboard/demos/${demo.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition-colors"
              >
                {/* Map thumbnail */}
                <div className="relative w-16 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {mapImages[demo.mapName] && (
                    <Image
                      src={mapImages[demo.mapName]}
                      alt={demo.mapName}
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white capitalize">
                      {demo.mapName.replace('de_', '')}
                    </span>
                    <span className={`text-sm font-medium ${resultColor}`}>
                      {demo.scoreTeam1} - {demo.scoreTeam2}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {stats.kills}/{stats.deaths}
                    </div>
                    <div className="text-xs text-gray-400">
                      Rating: {stats.rating.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Score badge */}
                {demo.analysis && (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      demo.analysis.overallScore >= 80
                        ? 'bg-score-excellent/20 text-score-excellent'
                        : demo.analysis.overallScore >= 60
                        ? 'bg-score-good/20 text-score-good'
                        : demo.analysis.overallScore >= 40
                        ? 'bg-score-average/20 text-score-average'
                        : 'bg-score-poor/20 text-score-poor'
                    }`}
                  >
                    {Math.round(demo.analysis.overallScore)}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
