import { Card } from '@/components/ui/Card';

export default function StatsLoading() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-pulse">
      <div className="h-8 w-32 bg-gray-700 rounded" />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-700 rounded" />
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="h-6 w-40 bg-gray-700 rounded mb-4" />
        <div className="h-72 bg-gray-800 rounded" />
      </Card>
    </div>
  );
}