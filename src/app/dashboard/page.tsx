import { requireAuth } from '@/lib/auth/utils';
import { getUserStats, getRatingProgression } from '@/lib/db/queries/stats';
import { getRecentDemos } from '@/lib/db/queries/demos';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { RecentDemos } from '@/components/dashboard/RecentDemos';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default async function DashboardPage() {
  const user = await requireAuth();

  const [stats, recentDemos, ratingHistory] = await Promise.all([
    getUserStats(user.id),
    getRecentDemos(user.id, 5),
    getRatingProgression(user.id),
  ]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bienvenue, {user.name}
        </h1>
        <p className="text-gray-400 mt-1">
          Voici un aperçu de vos performances récentes
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Demos - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentDemos
            demos={recentDemos.map((d) => ({
              ...d,
              matchDate: d.matchDate.toISOString(),
            }))}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Progress Chart */}
      <ProgressChart data={ratingHistory} />
    </div>
  );
}