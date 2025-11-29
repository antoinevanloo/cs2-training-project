import { Card } from '@/components/ui/Card';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-700 rounded" />
        <div className="h-4 w-64 bg-gray-800 rounded mt-2" />
      </div>

      {/* Stats Overview Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-4 w-16 bg-gray-700 rounded mb-2" />
            <div className="h-8 w-20 bg-gray-700 rounded" />
          </Card>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="h-6 w-32 bg-gray-700 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-10 bg-gray-700 rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-700 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="p-4 h-48" />
      </div>

      {/* Chart Skeleton */}
      <Card className="p-4">
        <div className="h-6 w-40 bg-gray-700 rounded mb-4" />
        <div className="h-64 bg-gray-800 rounded" />
      </Card>
    </div>
  );
}