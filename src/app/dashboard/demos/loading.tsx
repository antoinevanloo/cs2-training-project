import { Card } from '@/components/ui/Card';

export default function DemosLoading() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-800 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-gray-700 rounded" />
      </div>

      {/* Demo Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-12 bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-5 w-24 bg-gray-700 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-800 rounded" />
              </div>
              <div className="hidden sm:flex gap-8">
                <div className="text-center">
                  <div className="h-6 w-12 bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-8 bg-gray-800 rounded" />
                </div>
                <div className="text-center">
                  <div className="h-6 w-12 bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-8 bg-gray-800 rounded" />
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}