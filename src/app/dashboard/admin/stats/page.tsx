'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  FileVideo,
  HardDrive,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PlatformStats {
  users: {
    total: number;
    byTier: Record<string, number>;
    newThisMonth: number;
    activeThisMonth: number;
  };
  demos: {
    total: number;
    processedThisMonth: number;
    pendingProcessing: number;
    failedProcessing: number;
    avgProcessingTime: number;
  };
  storage: {
    totalUsedMb: number;
    avgPerUser: number;
  };
  coaching: {
    totalTips: number;
    avgTipsPerDemo: number;
  };
}

interface TimeSeriesData {
  date: string;
  users: number;
  demos: number;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/stats?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setTimeSeries(data.timeSeries || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const formatBytes = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        Erreur lors du chargement des statistiques
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    FREE: 'bg-gray-600',
    PRO: 'bg-blue-600',
    PRO_PLUS: 'bg-purple-600',
    TEAM: 'bg-green-600',
    ENTERPRISE: 'bg-yellow-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Statistiques</h1>
          <p className="text-gray-400 mt-1">Vue d&apos;ensemble de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  timeRange === range
                    ? 'bg-red-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Utilisateurs</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatNumber(stats.users.total)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">
                    +{stats.users.newThisMonth} ce mois
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Demos totales</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatNumber(stats.demos.total)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">
                    +{stats.demos.processedThisMonth} ce mois
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Stockage utilisé</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatBytes(stats.storage.totalUsedMb)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ~{formatBytes(stats.storage.avgPerUser)} / utilisateur
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyses */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Analyses terminées</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatNumber(stats.coaching.totalTips)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {(stats.coaching.avgTipsPerDemo * 100).toFixed(0)}% des demos
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users by Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.users.byTier).map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-4">
                <div className="w-24">
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${tierColors[tier] || 'bg-gray-600'}`}>
                    {tier}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tierColors[tier] || 'bg-gray-600'}`}
                      style={{
                        width: `${Math.max((count / stats.users.total) * 100, 1)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="text-white font-medium">{formatNumber(count)}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({formatPercent(count, stats.users.total)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>État du traitement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">En attente</span>
                <span className="text-yellow-400 font-medium">
                  {stats.demos.pendingProcessing}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Échoués</span>
                <span className="text-red-400 font-medium">
                  {stats.demos.failedProcessing}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Temps moyen de traitement</span>
                <span className="text-white font-medium">
                  {stats.demos.avgProcessingTime > 0
                    ? `${stats.demos.avgProcessingTime.toFixed(1)}s`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Nouveaux ce mois</span>
                <span className="text-green-400 font-medium">
                  {stats.users.newThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Actifs ce mois</span>
                <span className="text-blue-400 font-medium">
                  {stats.users.activeThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-400">Taux d&apos;activité</span>
                <span className="text-white font-medium">
                  {formatPercent(stats.users.activeThisMonth, stats.users.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart Placeholder */}
      {timeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Graphique d&apos;évolution</p>
                <p className="text-sm text-gray-600">
                  {timeSeries.length} points de données disponibles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
