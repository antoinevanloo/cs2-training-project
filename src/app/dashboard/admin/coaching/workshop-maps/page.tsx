'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Save,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface WorkshopMapConfig {
  id: string;
  name: string;
  steamId: string | null;
  author: string;
  categories: string[];
  forMap?: string;
  status: 'verified' | 'unverified' | 'broken' | 'not_found';
  lastVerified?: string;
  notes?: string;
}

interface WorkshopMapsStats {
  total: number;
  verified: number;
  unverified: number;
  broken: number;
  byCategory: Record<string, number>;
}

interface WorkshopMapsData {
  maps: WorkshopMapConfig[];
  stats: WorkshopMapsStats;
}

const statusConfig = {
  verified: {
    label: 'Vérifié',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  unverified: {
    label: 'À vérifier',
    icon: HelpCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  broken: {
    label: 'Cassé',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  not_found: {
    label: 'Non trouvé',
    icon: AlertTriangle,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
  },
};

const categoryLabels: Record<string, string> = {
  aim: 'Aim',
  positioning: 'Positionnement',
  utility: 'Utilité',
  movement: 'Movement',
  prefire: 'Prefire',
};

export default function AdminWorkshopMapsPage() {
  const [data, setData] = useState<WorkshopMapsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [editingMap, setEditingMap] = useState<string | null>(null);
  const [editSteamId, setEditSteamId] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/coaching/workshop-maps');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement' });
      }
    } catch (error) {
      console.error('Error fetching workshop maps:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartEdit = (map: WorkshopMapConfig) => {
    setEditingMap(map.id);
    setEditSteamId(map.steamId || '');
  };

  const handleCancelEdit = () => {
    setEditingMap(null);
    setEditSteamId('');
  };

  const handleSaveEdit = async (mapId: string) => {
    // Ajouter aux changements en attente
    setPendingChanges((prev) => {
      const newChanges = new Map(prev);
      newChanges.set(mapId, editSteamId);
      return newChanges;
    });

    // Mise à jour locale pour l'UI
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        maps: prev.maps.map((m) =>
          m.id === mapId
            ? {
                ...m,
                steamId: editSteamId || null,
                status: editSteamId ? 'verified' : 'unverified',
              }
            : m
        ),
      };
    });

    setEditingMap(null);
    setEditSteamId('');
    setMessage({ type: 'warning', text: 'Modification en attente. Cliquez sur "Sauvegarder" pour appliquer.' });
  };

  const handleSaveAllChanges = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const maps = Array.from(pendingChanges.entries()).map(([id, steamId]) => ({
        id,
        steamId: steamId || null,
      }));

      const response = await fetch('/api/admin/coaching/workshop-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          maps,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPendingChanges(new Map());
        setMessage({
          type: 'success',
          text: `${result.updated.length} map(s) mise(s) à jour. ${result.warning || ''}`,
        });
        fetchData(); // Rafraîchir les données
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkStatus = async (mapId: string, status: 'broken' | 'unverified') => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/coaching/workshop-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: status === 'broken' ? 'mark_broken' : 'mark_unverified',
          maps: [{ id: mapId }],
        }),
      });

      if (response.ok) {
        fetchData();
        setMessage({ type: 'success', text: 'Statut mis à jour' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copié dans le presse-papier' });
    setTimeout(() => setMessage(null), 2000);
  };

  const filteredMaps = data?.maps.filter((map) => {
    const matchesSearch =
      map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      map.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      map.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || map.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' || map.categories.includes(categoryFilter);

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        Erreur lors du chargement de la configuration
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/dashboard/admin/coaching" className="hover:text-white">
              Coaching
            </Link>
            <span>/</span>
            <span className="text-white">Workshop Maps</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Workshop Maps Steam</h1>
          <p className="text-gray-400 mt-1">
            Gérez les liens Steam Workshop pour les exercices
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} disabled={isSaving}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Rafraîchir
          </Button>
          {pendingChanges.size > 0 && (
            <Button onClick={handleSaveAllChanges} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder ({pendingChanges.size})
            </Button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : message.type === 'warning'
              ? 'bg-yellow-500/10 border border-yellow-500/50 text-yellow-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : message.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{data.stats.total}</p>
              <p className="text-sm text-gray-400">Total Maps</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{data.stats.verified}</p>
              <p className="text-sm text-gray-400">Vérifiées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{data.stats.unverified}</p>
              <p className="text-sm text-gray-400">À vérifier</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{data.stats.broken}</p>
              <p className="text-sm text-gray-400">Cassées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Comment trouver un ID Steam Workshop :</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-400">
                <li>
                  Allez sur{' '}
                  <a
                    href="https://steamcommunity.com/workshop/browse/?appid=730"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                  >
                    Steam Workshop CS2
                  </a>
                </li>
                <li>Cherchez la map (ex: &quot;Aim Botz CS2&quot;)</li>
                <li>L&apos;ID est dans l&apos;URL : steamcommunity.com/sharedfiles/filedetails/?id=<strong>XXXXXX</strong></li>
                <li>Collez l&apos;ID ici et testez le lien</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une map..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="verified">Vérifiées</option>
              <option value="unverified">À vérifier</option>
              <option value="broken">Cassées</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">Toutes catégories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Maps List */}
      <div className="space-y-3">
        {filteredMaps?.map((map) => {
          const status = statusConfig[map.status];
          const StatusIcon = status.icon;
          const isEditing = editingMap === map.id;
          const hasPendingChange = pendingChanges.has(map.id);

          return (
            <Card
              key={map.id}
              className={`${hasPendingChange ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white truncate">{map.name}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {map.forMap && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                          {map.forMap}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-gray-400 mb-3">
                      <span>Par {map.author}</span>
                      <span>•</span>
                      <span>
                        {map.categories.map((c) => categoryLabels[c] || c).join(', ')}
                      </span>
                      {map.lastVerified && (
                        <>
                          <span>•</span>
                          <span>
                            Vérifié le {new Date(map.lastVerified).toLocaleDateString('fr-FR')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Steam ID Edit */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Steam ID:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="text"
                            value={editSteamId}
                            onChange={(e) => setEditSteamId(e.target.value)}
                            placeholder="Ex: 3200944557"
                            className="flex-1 max-w-xs h-8 text-sm"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSaveEdit(map.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code
                            className={`text-sm px-2 py-1 rounded cursor-pointer ${
                              map.steamId
                                ? 'bg-gray-800 text-green-400 hover:bg-gray-700'
                                : 'bg-gray-800/50 text-gray-500 italic'
                            }`}
                            onClick={() => handleStartEdit(map)}
                          >
                            {map.steamId || 'Non défini - cliquer pour ajouter'}
                          </code>
                          {map.steamId && (
                            <button
                              onClick={() => copyToClipboard(map.steamId!)}
                              className="text-gray-400 hover:text-white"
                              title="Copier l'ID"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {map.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">{map.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {map.steamId && (
                      <a
                        href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${map.steamId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Tester
                      </a>
                    )}
                    {map.status === 'verified' && (
                      <button
                        onClick={() => handleMarkStatus(map.id, 'broken')}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Marquer cassé
                      </button>
                    )}
                    {map.status === 'broken' && (
                      <button
                        onClick={() => handleMarkStatus(map.id, 'unverified')}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 text-sm"
                      >
                        <HelpCircle className="w-4 h-4" />
                        À revérifier
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredMaps?.length === 0 && (
          <Card className="bg-gray-800/30">
            <CardContent className="py-8 text-center text-gray-400">
              Aucune map trouvée avec ces filtres
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
