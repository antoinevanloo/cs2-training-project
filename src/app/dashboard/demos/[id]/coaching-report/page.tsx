import { requireAuth } from '@/lib/auth/utils';
import { getDemoById } from '@/lib/db/queries/demos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { CoachingReportClient } from './CoachingReportClient';

export default async function CoachingReportPage({
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
            Le rapport de coaching sera disponible une fois l&apos;analyse de la démo terminée.
          </p>
          <p className="text-sm text-gray-500">
            Statut actuel: {demo.status}
            {demo.statusMessage && ` - ${demo.statusMessage}`}
          </p>
        </div>
      </div>
    );
  }

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
              Rapport de Coaching
            </h1>
            <p className="text-gray-400 mt-1">
              {demo.mapName.replace('de_', '').charAt(0).toUpperCase() + demo.mapName.replace('de_', '').slice(1)} •{' '}
              {new Date(demo.matchDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/demos/${demo.id}/analysis`}>
          <Button variant="secondary" className="gap-2">
            Voir l&apos;analyse détaillée
          </Button>
        </Link>
      </div>

      {/* Client Component with the actual report */}
      <CoachingReportClient demoId={demo.id} />
    </div>
  );
}
