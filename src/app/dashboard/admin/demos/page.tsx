'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileVideo,
  User,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';

interface Demo {
  id: string;
  filename: string;
  originalName: string;
  fileSizeMb: number;
  mapName: string | null;
  status: string;
  statusMessage: string | null;
  createdAt: string;
  processingCompletedAt: string | null;
  user: {
    id: string;
    username: string;
    email: string;
  };
  _count: {
    playerStats: number;
  };
  analysis: { id: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DemoStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalSizeMb: number;
}

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'PROCESSING', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'FAILED', label: 'Échoué' },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-yellow-400 bg-yellow-500/10',
    label: 'En attente',
  },
  PROCESSING: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-blue-400 bg-blue-500/10',
    label: 'En cours',
  },
  COMPLETED: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-400 bg-green-500/10',
    label: 'Terminé',
  },
  FAILED: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-400 bg-red-500/10',
    label: 'Échoué',
  },
};

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDemos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/demos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDemos(data.demos);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching demos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchDemos();
  }, [fetchDemos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchDemos();
  };

  const handleReprocess = async (demoId: string) => {
    if (!confirm('Relancer le traitement de cette demo ?')) return;

    try {
      const response = await fetch('/api/admin/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reprocess', demoId }),
      });

      if (response.ok) {
        fetchDemos();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors du retraitement');
      }
    } catch (error) {
      console.error('Error reprocessing demo:', error);
      alert('Erreur lors du retraitement');
    }
  };

  const handleDelete = async (demoId: string, filename: string) => {
    if (!confirm(`Supprimer la demo "${filename}" ? Cette action est irréversible.`)) return;

    try {
      const response = await fetch(`/api/admin/demos?demoId=${demoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDemos();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting demo:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Gestion des Demos</h1>
        <p className="text-gray-400 mt-1">
          {pagination.total} demo{pagination.total > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <FileVideo className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
                  <p className="text-xs text-gray-500">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                  <p className="text-xs text-gray-500">Terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
                  <p className="text-xs text-gray-500">Échoués</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-purple-400">{formatSize(stats.totalSizeMb)}</p>
                  <p className="text-xs text-gray-500">Stockage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de fichier, map ou utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              options={statusOptions}
            />
            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Demos Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Demo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Utilisateur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Map</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Statut</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Taille</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demos.map((demo) => {
                      const status = statusConfig[demo.status] || statusConfig.PENDING;
                      return (
                        <tr key={demo.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-white truncate max-w-[200px]">
                                {demo.originalName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {demo._count.playerStats} joueurs{demo.analysis ? ', analysé' : ''}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-white">{demo.user.username}</p>
                                <p className="text-xs text-gray-500">{demo.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-300">
                              {demo.mapName || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                            {demo.statusMessage && (
                              <p className="text-xs text-red-400 mt-1 truncate max-w-[150px]" title={demo.statusMessage}>
                                {demo.statusMessage}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-300">
                              {formatSize(demo.fileSizeMb)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">
                                {new Date(demo.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/dashboard/demos/${demo.id}`}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {demo.status === 'FAILED' && (
                                <button
                                  onClick={() => handleReprocess(demo.id)}
                                  className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded"
                                  title="Relancer"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(demo.id, demo.originalName)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {demos.length === 0 && (
                <div className="text-center py-12">
                  <FileVideo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Aucune demo trouvée</p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
