import { requireAuth } from '@/lib/auth/utils';
import { getDemosByUserId } from '@/lib/db/queries/demos';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoCard } from '@/components/demos/DemoCard';

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
          {demos.map((demo) => (
            <DemoCard key={demo.id} demo={demo} />
          ))}
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
