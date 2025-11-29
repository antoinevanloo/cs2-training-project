import { requireAuth } from '@/lib/auth/utils';
import { getDemoById } from '@/lib/db/queries/demos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { ReportClient } from './ReportClient';

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const demo = await getDemoById(id);

  if (!demo || demo.userId !== user.id) {
    notFound();
  }

  // Vérifier que l'analyse existe
  if (!demo.analysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/demos/${demo.id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à la démo
            </Button>
          </Link>
        </div>

        <div className="p-8 text-center bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Analyse en attente
          </h2>
          <p className="text-gray-400 mb-4">
            Le rapport sera disponible une fois l&apos;analyse de la démo terminée.
          </p>
          <p className="text-sm text-gray-500">
            Statut actuel: {demo.status}
            {demo.statusMessage && ` - ${demo.statusMessage}`}
          </p>
        </div>
      </div>
    );
  }

  // Préparer les données pour le client
  const reportData = {
    demo: {
      id: demo.id,
      mapName: demo.mapName,
      matchDate: demo.matchDate.toISOString(),
      matchResult: demo.matchResult,
      scoreTeam1: demo.scoreTeam1,
      scoreTeam2: demo.scoreTeam2,
    },
    analysis: {
      overallScore: demo.analysis.overallScore,
      aimScore: demo.analysis.aimScore,
      positioningScore: demo.analysis.positioningScore,
      utilityScore: demo.analysis.utilityScore,
      economyScore: demo.analysis.economyScore,
      timingScore: demo.analysis.timingScore,
      decisionScore: demo.analysis.decisionScore,
      strengths: demo.analysis.strengths || [],
      weaknesses: demo.analysis.weaknesses || [],
      aimAnalysis: demo.analysis.aimAnalysis,
      positioningAnalysis: demo.analysis.positioningAnalysis,
      utilityAnalysis: demo.analysis.utilityAnalysis,
      economyAnalysis: demo.analysis.economyAnalysis,
      timingAnalysis: demo.analysis.timingAnalysis,
      decisionAnalysis: demo.analysis.decisionAnalysis,
    },
    playerStats: demo.playerStats.find((p) => p.isMainPlayer) || null,
  };

  // Formater le nom de la map
  const mapDisplayName = demo.mapName
    .replace('de_', '')
    .charAt(0)
    .toUpperCase() + demo.mapName.replace('de_', '').slice(1);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/demos/${demo.id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Rapport - {mapDisplayName}
            </h1>
            <p className="text-gray-400 mt-1">
              {demo.scoreTeam1} - {demo.scoreTeam2} •{' '}
              {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Client Component with tabs */}
      <ReportClient data={reportData} />
    </div>
  );
}
