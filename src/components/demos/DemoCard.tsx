import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { DeleteDemoButton } from './DeleteDemoButton';

interface DemoCardProps {
  demo: {
    id: string;
    mapName: string;
    matchResult: 'WIN' | 'LOSS' | 'TIE';
    scoreTeam1: number;
    scoreTeam2: number;
    matchDate: Date;
    status: string;
    statusMessage?: string | null;
    playerStats: Array<{
      kills: number;
      deaths: number;
      rating: number;
      adr: number;
    }>;
    analysis?: {
      overallScore: number;
    } | null;
  };
}

const resultColors = {
  WIN: 'text-cs2-win',
  LOSS: 'text-cs2-loss',
  TIE: 'text-cs2-tie',
} as const;

const statusColors: Record<string, string> = {
  PENDING: 'status-pending',
  QUEUED: 'status-pending',
  PROCESSING: 'status-processing',
  ANALYZING: 'status-processing',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
};

export function DemoCard({ demo }: DemoCardProps) {
  const stats = demo.playerStats[0];
  const resultColor = resultColors[demo.matchResult];

  return (
    <Card variant="hover" className="p-4">
      <div className="flex items-center gap-4">
        {/* Map Info - Clickable */}
        <Link href={`/dashboard/demos/${demo.id}`} className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-20 h-12 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-300 capitalize">
              {demo.mapName.replace('de_', '')}
            </span>
          </div>

          {/* Match Details */}
          <div className="flex-1 min-w-0">
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
            <div className="text-center hidden sm:block">
              <div className="text-lg font-bold text-white">
                {stats.kills}/{stats.deaths}
              </div>
              <div className="text-xs text-gray-400">K/D</div>
            </div>
          )}

          {stats && (
            <div className="text-center hidden sm:block">
              <div className="text-lg font-bold text-white">
                {stats.rating?.toFixed(2) || '-'}
              </div>
              <div className="text-xs text-gray-400">Rating</div>
            </div>
          )}

          {stats && (
            <div className="text-center hidden md:block">
              <div className="text-lg font-bold text-white">
                {Math.round(stats.adr || 0)}
              </div>
              <div className="text-xs text-gray-400">ADR</div>
            </div>
          )}

          {/* Score */}
          {demo.analysis && (
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
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

        {/* Delete Button */}
        <div className="flex-shrink-0">
          <DeleteDemoButton
            demoId={demo.id}
            demoName={`${demo.mapName} - ${demo.scoreTeam1}:${demo.scoreTeam2}`}
            variant="icon"
          />
        </div>
      </div>
    </Card>
  );
}