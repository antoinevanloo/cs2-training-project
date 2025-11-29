import { requireAuth } from '@/lib/auth/utils';
import { getDemosByUserId } from '@/lib/db/queries/demos';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default async function DemosPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await requireAuth();
  const page = parseInt(searchParams.page || '1', 10);

  const { demos, total, totalPages } = await getDemosByUserId(user.id, {
    page,
    limit: 10,
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Demos</h1>
          <p className="text-gray-400 mt-1">{total} demos analysées</p>
        </div>
        <Link href="/dashboard/demos/upload">
          <Button>Uploader une demo</Button>
        </Link>
      </div>

      {/* Demos List */}
      {demos.length === 0 ? (
        <Card className="p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
          <h2 className="text-xl font-semibold text-white mb-2">
            Aucune demo uploadée
          </h2>
          <p className="text-gray-400 mb-6">
            Uploadez votre première demo pour commencer l&apos;analyse
          </p>
          <Link href="/dashboard/demos/upload">
            <Button>Uploader une demo</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {demos.map((demo) => {
            const stats = demo.playerStats[0];
            const resultColor =
              demo.matchResult === 'WIN'
                ? 'text-cs2-win'
                : demo.matchResult === 'LOSS'
                ? 'text-cs2-loss'
                : 'text-cs2-tie';

            const statusColors: Record<string, string> = {
              PENDING: 'status-pending',
              QUEUED: 'status-pending',
              PROCESSING: 'status-processing',
              ANALYZING: 'status-processing',
              COMPLETED: 'status-completed',
              FAILED: 'status-failed',
            };

            return (
              <Link key={demo.id} href={`/dashboard/demos/${demo.id}`}>
                <Card variant="hover" className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Map Info */}
                    <div className="w-20 h-12 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-300 capitalize">
                        {demo.mapName.replace('de_', '')}
                      </span>
                    </div>

                    {/* Match Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${resultColor}`}>
                          {demo.scoreTeam1} - {demo.scoreTeam2}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[demo.status]}`}
                        >
                          {demo.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {stats.kills}/{stats.deaths}
                        </div>
                        <div className="text-xs text-gray-400">K/D</div>
                      </div>
                    )}

                    {stats && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {stats.rating?.toFixed(2) || '-'}
                        </div>
                        <div className="text-xs text-gray-400">Rating</div>
                      </div>
                    )}

                    {stats && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {Math.round(stats.adr || 0)}
                        </div>
                        <div className="text-xs text-gray-400">ADR</div>
                      </div>
                    )}

                    {/* Score */}
                    {demo.analysis && (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
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
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/dashboard/demos?page=${page - 1}`}
            className={`btn-secondary ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Précédent
          </Link>
          <span className="text-gray-400">
            Page {page} sur {totalPages}
          </span>
          <Link
            href={`/dashboard/demos?page=${page + 1}`}
            className={`btn-secondary ${page >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Suivant
          </Link>
        </div>
      )}
    </div>
  );
}
