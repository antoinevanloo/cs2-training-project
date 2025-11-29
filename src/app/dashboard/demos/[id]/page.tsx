import { requireAuth } from '@/lib/auth/utils';
import { getDemoById } from '@/lib/db/queries/demos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CircularProgress } from '@/components/ui/Progress';
import { DeleteDemoButton } from '@/components/demos/DeleteDemoButton';
import { StrengthWeaknessCard } from '@/components/coaching';
import { FileText } from 'lucide-react';

export default async function DemoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const demo = await getDemoById(params.id);

  if (!demo || demo.userId !== user.id) {
    notFound();
  }

  const mainPlayerStats = demo.playerStats.find((p) => p.isMainPlayer);
  const resultColor =
    demo.matchResult === 'WIN'
      ? 'text-cs2-win'
      : demo.matchResult === 'LOSS'
      ? 'text-cs2-loss'
      : 'text-cs2-tie';

  const isProcessing = ['PENDING', 'QUEUED', 'PROCESSING', 'ANALYZING'].includes(
    demo.status
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white capitalize">
              {demo.mapName.replace('de_', '')}
            </h1>
            <span className={`text-xl font-bold ${resultColor}`}>
              {demo.scoreTeam1} - {demo.scoreTeam2}
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {demo.analysis && (
            <Link href={`/dashboard/demos/${demo.id}/report`}>
              <Button className="gap-2">
                <FileText className="w-4 h-4" />
                Voir le rapport
              </Button>
            </Link>
          )}
          <DeleteDemoButton
            demoId={demo.id}
            demoName={`${demo.mapName} - ${demo.scoreTeam1}:${demo.scoreTeam2}`}
          />
        </div>
      </div>

      {/* Status Banner */}
      {isProcessing && (
        <Card className="p-4 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <div>
              <p className="font-medium text-white">Traitement en cours</p>
              <p className="text-sm text-gray-400">
                Statut: {demo.status}
                {demo.statusMessage && ` - ${demo.statusMessage}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {demo.status === 'FAILED' && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="font-medium text-red-400">Erreur de traitement</p>
          <p className="text-sm text-gray-400">{demo.statusMessage}</p>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Statistiques du match</CardTitle>
          </CardHeader>
          <CardContent>
            {mainPlayerStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {mainPlayerStats.kills}
                  </div>
                  <div className="text-sm text-gray-400">Kills</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {mainPlayerStats.deaths}
                  </div>
                  <div className="text-sm text-gray-400">Deaths</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {mainPlayerStats.assists}
                  </div>
                  <div className="text-sm text-gray-400">Assists</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-cs2-accent">
                    {mainPlayerStats.rating.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(mainPlayerStats.adr)}
                  </div>
                  <div className="text-sm text-gray-400">ADR</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(mainPlayerStats.headshotPercentage)}%
                  </div>
                  <div className="text-sm text-gray-400">HS%</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {mainPlayerStats.entryKills}
                  </div>
                  <div className="text-sm text-gray-400">Entry Kills</div>
                </div>
                <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(mainPlayerStats.kast)}%
                  </div>
                  <div className="text-sm text-gray-400">KAST</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-2">
                  Statistiques non disponibles
                </p>
                {isProcessing && (
                  <p className="text-sm text-gray-500">
                    Les statistiques seront disponibles une fois le traitement terminé.
                  </p>
                )}
                {demo.status === 'FAILED' && (
                  <p className="text-sm text-red-400">
                    Le traitement a échoué. Vérifiez que votre Steam ID est correctement configuré dans les paramètres.
                  </p>
                )}
                {demo.status === 'COMPLETED' && demo.playerStats.length === 0 && (
                  <div className="text-sm text-yellow-400">
                    <p>Aucune donnée de joueur trouvée.</p>
                    <Link href="/dashboard/settings" className="underline hover:text-yellow-300">
                      Vérifiez votre Steam ID dans les paramètres
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Score */}
        {demo.analysis && (
          <Card>
            <CardHeader>
              <CardTitle>Score d&apos;analyse</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <CircularProgress
                value={demo.analysis.overallScore}
                size={120}
                strokeWidth={10}
                color="score"
              />
              <p className="text-gray-400 mt-4 text-center">
                Score global basé sur 6 catégories d&apos;analyse
              </p>
              <Link href={`/dashboard/demos/${demo.id}/report`} className="mt-4 w-full">
                <Button size="sm" className="gap-2 w-full">
                  <FileText className="w-4 h-4" />
                  Voir le rapport complet
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Strengths & Weaknesses */}
      {demo.analysis && (demo.analysis.strengths.length > 0 || demo.analysis.weaknesses.length > 0) && (
        <StrengthWeaknessCard
          strengths={demo.analysis.strengths || []}
          weaknesses={demo.analysis.weaknesses || []}
          compact={true}
          maxItems={2}
        />
      )}

      {/* All Players */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les joueurs</CardTitle>
        </CardHeader>
        <CardContent>
          {demo.playerStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Joueur</th>
                    <th className="pb-3 font-medium text-center">K</th>
                    <th className="pb-3 font-medium text-center">D</th>
                    <th className="pb-3 font-medium text-center">A</th>
                    <th className="pb-3 font-medium text-center">ADR</th>
                    <th className="pb-3 font-medium text-center">HS%</th>
                    <th className="pb-3 font-medium text-center">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {demo.playerStats
                    .sort((a, b) => b.rating - a.rating)
                    .map((player) => (
                      <tr
                        key={player.id}
                        className={`border-b border-gray-800 ${
                          player.isMainPlayer ? 'bg-cs2-accent/10' : ''
                        }`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{player.playerName}</span>
                            {player.isMainPlayer && (
                              <span className="text-xs bg-cs2-accent/20 text-cs2-accent px-2 py-0.5 rounded">
                                Vous
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center text-white">
                          {player.kills}
                        </td>
                        <td className="py-3 text-center text-white">
                          {player.deaths}
                        </td>
                        <td className="py-3 text-center text-white">
                          {player.assists}
                        </td>
                        <td className="py-3 text-center text-white">
                          {Math.round(player.adr)}
                        </td>
                        <td className="py-3 text-center text-white">
                          {Math.round(player.headshotPercentage)}%
                        </td>
                        <td className="py-3 text-center font-medium text-cs2-accent">
                          {player.rating.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">Aucune donnée de joueur</p>
              {isProcessing && (
                <p className="text-sm text-gray-500">
                  Les données des joueurs seront disponibles une fois le traitement terminé.
                </p>
              )}
              {demo.status === 'FAILED' && (
                <p className="text-sm text-red-400">
                  Le traitement de la démo a échoué.
                </p>
              )}
              {demo.status === 'COMPLETED' && (
                <div className="text-sm text-yellow-400">
                  <p>Les données n&apos;ont pas pu être extraites de cette démo.</p>
                  <p className="text-gray-500 mt-1">
                    Assurez-vous que le fichier .dem est valide et que votre Steam ID est configuré.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
