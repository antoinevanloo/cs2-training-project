'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  FileVideo,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface AdminStats {
  users: {
    total: number;
    byTier: Record<string, number>;
    new30Days: number;
    new7Days: number;
    paidUsers: number;
    freeUsers: number;
    conversionRate: string;
  };
  demos: {
    total: number;
    byStatus: Record<string, number>;
    new30Days: number;
    processingNow: number;
  };
  revenue: {
    mrr: number;
    arr: number;
  };
  storage: {
    totalUsedMb: number;
    avgPerUserMb: number;
  };
  recent: {
    demos: Array<{
      id: string;
      originalName: string;
      status: string;
      createdAt: string;
      user: { username: string };
    }>;
    users: Array<{
      id: string;
      username: string;
      email: string;
      subscriptionTier: string;
      createdAt: string;
    }>;
  };
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  PROCESSING: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  ANALYZING: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
  QUEUED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
  PENDING: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <Clock className="w-4 h-4" /> },
  FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> },
};

const tierColors: Record<string, string> = {
  FREE: 'bg-gray-600',
  PRO: 'bg-blue-600',
  PRO_PLUS: 'bg-purple-600',
  TEAM: 'bg-green-600',
  ENTERPRISE: 'bg-yellow-600',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        {error || 'Erreur lors du chargement'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-gray-400 mt-1">Vue d&apos;ensemble de la plateforme CS2 Coach</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Utilisateurs</p>
                <p className="text-3xl font-bold text-white">{stats.users.total}</p>
                <p className="text-xs text-blue-400 mt-1">
                  +{stats.users.new7Days} cette semaine
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Demos analysées</p>
                <p className="text-3xl font-bold text-white">{stats.demos.total}</p>
                <p className="text-xs text-green-400 mt-1">
                  {stats.demos.processingNow} en cours
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileVideo className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Abonnés payants</p>
                <p className="text-3xl font-bold text-white">{stats.users.paidUsers}</p>
                <p className="text-xs text-purple-400 mt-1">
                  {stats.users.conversionRate}% conversion
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">MRR</p>
                <p className="text-3xl font-bold text-white">{stats.revenue.mrr}€</p>
                <p className="text-xs text-yellow-400 mt-1">
                  ARR: {stats.revenue.arr}€
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.users.byTier).map(([tier, count]) => {
                const percentage = stats.users.total > 0
                  ? (count / stats.users.total) * 100
                  : 0;
                return (
                  <div key={tier}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{tier}</span>
                      <span className="text-white">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${tierColors[tier] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Demos by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status des demos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.demos.byStatus).map(([status, count]) => {
                const style = statusColors[status] || statusColors.PENDING;
                return (
                  <div
                    key={status}
                    className={`p-3 rounded-lg ${style.bg} flex items-center gap-3`}
                  >
                    <span className={style.text}>{style.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${style.text}`}>{status}</p>
                      <p className="text-xl font-bold text-white">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Derniers inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-300">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColors[user.subscriptionTier]} text-white`}>
                      {user.subscriptionTier}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Demos */}
        <Card>
          <CardHeader>
            <CardTitle>Dernières demos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.demos.map((demo) => {
                const style = statusColors[demo.status] || statusColors.PENDING;
                return (
                  <div
                    key={demo.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${style.bg}`}>
                        {style.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {demo.originalName}
                        </p>
                        <p className="text-xs text-gray-500">par {demo.user.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium ${style.text}`}>
                        {demo.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(demo.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Stockage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {(stats.storage.totalUsedMb / 1024).toFixed(2)} GB
              </p>
              <p className="text-sm text-gray-400">Espace total utilisé</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {stats.storage.avgPerUserMb.toFixed(1)} MB
              </p>
              <p className="text-sm text-gray-400">Moyenne par utilisateur</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {stats.demos.total > 0
                  ? (stats.storage.totalUsedMb / stats.demos.total).toFixed(1)
                  : 0} MB
              </p>
              <p className="text-sm text-gray-400">Moyenne par demo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
