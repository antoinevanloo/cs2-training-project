import { Card } from '@/components/ui/Card';

interface StatsOverviewProps {
  stats: {
    avgRating: number;
    avgAdr: number;
    avgKast: number;
    avgHsPercent: number;
    totalMatches: number;
    winRate: number;
    wins: number;
    losses: number;
    ties: number;
  } | null;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-16 rounded mb-2" />
            <div className="skeleton h-8 w-20 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Rating moyen',
      value: stats.avgRating.toFixed(2),
      change: null,
      icon: (
        <svg className="w-5 h-5 text-cs2-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'ADR moyen',
      value: Math.round(stats.avgAdr).toString(),
      change: null,
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
    },
    {
      label: 'KAST',
      value: `${Math.round(stats.avgKast)}%`,
      change: null,
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Win Rate',
      value: `${Math.round(stats.winRate * 100)}%`,
      subtext: `${stats.wins}W ${stats.losses}L ${stats.ties}T`,
      icon: (
        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {item.label}
            </span>
            {item.icon}
          </div>
          <div className="text-2xl font-bold text-white mt-2">{item.value}</div>
          {item.subtext && (
            <div className="text-xs text-gray-500 mt-1">{item.subtext}</div>
          )}
        </Card>
      ))}
    </div>
  );
}
