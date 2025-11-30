'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Users,
  Shield,
  Clock,
  AlertTriangle,
  Check,
  X,
  Info,
  RefreshCw,
  RotateCcw,
  UserX,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TIER_SELECT_OPTIONS, TIER_BG_COLORS, TIER_LABELS } from '@/lib/constants/tiers';
import {
  FEATURE_DEFINITIONS,
  getFeaturesByCategory,
  getFeatureDependents,
} from '@/lib/features/config';
import {
  FeatureCategory,
  FeatureStatus,
  FeatureDefinition,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/lib/features/types';

// Icons mapping for features
const iconComponents: Record<string, React.ReactNode> = {
  Crosshair: <span className="text-red-400">+</span>,
  MapPin: <span className="text-blue-400">P</span>,
  Bomb: <span className="text-orange-400">B</span>,
  DollarSign: <span className="text-green-400">$</span>,
  Clock: <Clock className="w-4 h-4 text-purple-400" />,
  Brain: <span className="text-pink-400">B</span>,
  Lightbulb: <span className="text-yellow-400">L</span>,
  Dumbbell: <span className="text-cyan-400">D</span>,
  Calendar: <span className="text-indigo-400">C</span>,
  TrendingUp: <span className="text-green-400">T</span>,
  BarChart2: <span className="text-blue-400">B</span>,
  Award: <span className="text-yellow-400">A</span>,
  Map: <span className="text-emerald-400">M</span>,
  Layers: <span className="text-violet-400">L</span>,
  LineChart: <span className="text-cyan-400">L</span>,
  Radar: <span className="text-rose-400">R</span>,
  FileText: <span className="text-gray-400">F</span>,
  Table: <span className="text-gray-400">T</span>,
  Code: <span className="text-gray-400">C</span>,
  MessageCircle: <span className="text-indigo-400">M</span>,
  RefreshCw: <span className="text-blue-400">R</span>,
  Users: <Users className="w-4 h-4 text-orange-400" />,
  LayoutDashboard: <span className="text-teal-400">D</span>,
  Sliders: <span className="text-gray-400">S</span>,
};

const statusOptions = [
  { value: 'enabled', label: 'Activé' },
  { value: 'disabled', label: 'Désactivé' },
  { value: 'beta', label: 'Bêta' },
  { value: 'alpha', label: 'Alpha' },
  { value: 'deprecated', label: 'Obsolète' },
  { value: 'coming_soon', label: 'Bientôt' },
];

const statusColors: Record<FeatureStatus, string> = {
  enabled: 'bg-green-600',
  disabled: 'bg-gray-600',
  beta: 'bg-blue-600',
  alpha: 'bg-purple-600',
  deprecated: 'bg-red-600',
  coming_soon: 'bg-yellow-600',
};

const statusIcons: Record<FeatureStatus, React.ReactNode> = {
  enabled: <Check className="w-3 h-3" />,
  disabled: <X className="w-3 h-3" />,
  beta: <Shield className="w-3 h-3" />,
  alpha: <Lock className="w-3 h-3" />,
  deprecated: <AlertTriangle className="w-3 h-3" />,
  coming_soon: <Clock className="w-3 h-3" />,
};

const categories: FeatureCategory[] = [
  'analysis',
  'coaching',
  'display',
  'export',
  'integration',
  'advanced',
];

interface FeatureOverrideState {
  [featureId: string]: {
    status?: FeatureStatus;
    minTier?: string;
  };
}

export default function AdminFeaturesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<FeatureCategory[]>(categories);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDefinition | null>(null);
  const [savedConfig, setSavedConfig] = useState<FeatureOverrideState>({});
  const [overrides, setOverrides] = useState<FeatureOverrideState>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load saved config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/admin/features');
        if (response.ok) {
          const data = await response.json();
          setSavedConfig(data.config || {});
          setOverrides(data.config || {});
        }
      } catch (error) {
        console.error('Error fetching feature config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Get all features grouped by category
  const featuresByCategory = categories.reduce((acc, category) => {
    acc[category] = getFeaturesByCategory(category);
    return acc;
  }, {} as Record<FeatureCategory, FeatureDefinition[]>);

  // Filter features based on search
  const filteredFeatures = Object.entries(featuresByCategory).reduce(
    (acc, [category, features]) => {
      const filtered = features.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()) ||
          f.id.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category as FeatureCategory] = filtered;
      }
      return acc;
    },
    {} as Record<FeatureCategory, FeatureDefinition[]>
  );

  // Toggle category expansion
  const toggleCategory = (category: FeatureCategory) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Get current status (with overrides)
  const getFeatureStatus = (feature: FeatureDefinition): FeatureStatus => {
    return overrides[feature.id]?.status || feature.status;
  };

  // Get current min tier (with overrides)
  const getFeatureMinTier = (feature: FeatureDefinition): string => {
    return overrides[feature.id]?.minTier || feature.minTier;
  };

  // Update feature status
  const handleStatusChange = (featureId: string, status: FeatureStatus) => {
    setOverrides((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        status,
      },
    }));
    setHasChanges(true);
  };

  // Update feature min tier
  const handleTierChange = (featureId: string, minTier: string) => {
    setOverrides((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        minTier,
      },
    }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      // Update saved config with the response
      setSavedConfig(data.config || overrides);
      setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès' });
      setHasChanges(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    setOverrides(savedConfig);
    setHasChanges(false);
    setMessage(null);
  };

  // Invalidate server cache
  const handleInvalidateCache = async () => {
    try {
      const response = await fetch('/api/admin/features?action=invalidate-cache', {
        method: 'DELETE',
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Cache serveur invalidé' });
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'invalidation du cache' });
    }
  };

  // Reset all config to defaults
  const handleResetAll = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser toute la configuration ? Toutes les features reviendront à leurs valeurs par défaut.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/features?action=reset-all', {
        method: 'DELETE',
      });
      if (response.ok) {
        setSavedConfig({});
        setOverrides({});
        setHasChanges(false);
        setMessage({ type: 'success', text: 'Configuration réinitialisée aux valeurs par défaut' });
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la réinitialisation' });
    }
  };

  // Debug - show current state
  const [debugData, setDebugData] = useState<Record<string, unknown> | null>(null);
  const handleDebug = async () => {
    try {
      const response = await fetch('/api/admin/features/debug');
      const data = await response.json();
      setDebugData(data.debug);
      console.log('Debug data:', data.debug);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Clear user preferences
  const handleClearMyPreferences = async () => {
    try {
      const response = await fetch('/api/admin/features?action=clear-my-preferences', {
        method: 'DELETE',
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Vos préférences ont été réinitialisées. Rafraîchissez la page de démo.' });
        // Refresh debug data
        handleDebug();
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression des préférences' });
    }
  };

  // Clear ALL users preferences
  const handleClearAllPreferences = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer les préférences de TOUS les utilisateurs ?')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/features?action=clear-all-preferences', {
        method: 'DELETE',
      });
      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression des préférences' });
    }
  };

  // Count features by status
  const statusCounts = Object.values(FEATURE_DEFINITIONS).reduce(
    (acc, f) => {
      const status = getFeatureStatus(f);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<FeatureStatus, number>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Features</h1>
          <p className="text-gray-400 mt-1">
            {Object.keys(FEATURE_DEFINITIONS).length} features configurables
            {Object.keys(savedConfig).length > 0 && (
              <span className="ml-2 text-yellow-400">
                ({Object.keys(savedConfig).length} override{Object.keys(savedConfig).length > 1 ? 's' : ''} actif{Object.keys(savedConfig).length > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleDebug} title="Afficher l'état de debug">
            <Info className="w-4 h-4 mr-2" />
            Debug
          </Button>
          <Button variant="secondary" onClick={handleInvalidateCache} title="Invalider le cache serveur">
            <RefreshCw className="w-4 h-4 mr-2" />
            Cache
          </Button>
          <Button variant="secondary" onClick={handleResetAll} title="Réinitialiser tout aux valeurs par défaut">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {hasChanges && (
            <Button variant="secondary" onClick={handleReset}>
              Annuler
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges} isLoading={isSaving}>
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Debug Panel */}
      {debugData && (
        <Card className="bg-gray-900 border-yellow-500/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-yellow-400">Debug Info</CardTitle>
            <button onClick={() => setDebugData(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm font-mono">
              {/* User Context */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-yellow-400 font-bold">User Context:</h4>
                  <Button
                    variant="secondary"
                    onClick={handleClearMyPreferences}
                    className="!py-1 !px-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  >
                    <UserX className="w-3 h-3 mr-1" />
                    Supprimer mes préférences
                  </Button>
                </div>
                <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-40 text-gray-300">
                  {JSON.stringify(debugData.userContext, null, 2)}
                </pre>
              </div>

              {/* Raw DB Config */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-2">Raw DB Config (SystemConfig):</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-40 text-gray-300">
                  {JSON.stringify(debugData.rawDbConfig, null, 2)}
                </pre>
              </div>

              {/* Enabled Analyzers */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-2">Enabled Analyzers (calculated):</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-40 text-gray-300">
                  {JSON.stringify(debugData.enabledAnalyzers, null, 2)}
                </pre>
              </div>

              {/* Analysis Features */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-2">Analysis Features Status:</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-60 text-gray-300">
                  {JSON.stringify(debugData.analysisFeatures, null, 2)}
                </pre>
              </div>

              {/* Sample Analysis */}
              <div>
                <h4 className="text-yellow-400 font-bold mb-2">Sample Analysis (DB scores):</h4>
                <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-40 text-gray-300">
                  {JSON.stringify(debugData.sampleAnalysis, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.entries(statusCounts) as [FeatureStatus, number][]).map(([status, count]) => (
          <Card key={status} className="!p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusColors[status]}`}>
                {statusIcons[status]}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-400">{STATUS_LABELS[status]}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher une feature..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setExpandedCategories(categories)}
              >
                Tout ouvrir
              </Button>
              <Button
                variant="secondary"
                onClick={() => setExpandedCategories([])}
              >
                Tout fermer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features by Category */}
      <div className="space-y-4">
        {Object.entries(filteredFeatures).map(([category, features]) => (
          <Card key={category}>
            <CardHeader
              className="cursor-pointer hover:bg-gray-800/50 transition-colors"
              onClick={() => toggleCategory(category as FeatureCategory)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedCategories.includes(category as FeatureCategory) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <CardTitle>{CATEGORY_LABELS[category as FeatureCategory]}</CardTitle>
                  <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                    {features.length} features
                  </span>
                </div>
              </div>
            </CardHeader>

            {expandedCategories.includes(category as FeatureCategory) && (
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                          Feature
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                          Statut
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                          Tier min
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                          Options
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                          Détails
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((feature) => {
                        const currentStatus = getFeatureStatus(feature);
                        const currentTier = getFeatureMinTier(feature);
                        const isModified =
                          overrides[feature.id]?.status !== undefined ||
                          overrides[feature.id]?.minTier !== undefined;
                        const dependents = getFeatureDependents(feature.id);

                        return (
                          <tr
                            key={feature.id}
                            className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                              isModified ? 'bg-yellow-500/5' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                                  {iconComponents[feature.icon || 'Settings'] || (
                                    <Settings className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white flex items-center gap-2">
                                    {feature.name}
                                    {isModified && (
                                      <span className="text-xs text-yellow-400">(modifié)</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500">{feature.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  handleStatusChange(feature.id, e.target.value as FeatureStatus)
                                }
                                className={`px-2 py-1 rounded text-xs font-medium text-white border-0 cursor-pointer ${statusColors[currentStatus]}`}
                              >
                                {statusOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={currentTier}
                                onChange={(e) => handleTierChange(feature.id, e.target.value)}
                                className={`px-2 py-1 rounded text-xs font-medium text-white border-0 cursor-pointer ${
                                  TIER_BG_COLORS[currentTier] || 'bg-gray-600'
                                }`}
                              >
                                {TIER_SELECT_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {feature.userToggleable ? (
                                  <span
                                    className="flex items-center gap-1 text-xs text-green-400"
                                    title="L'utilisateur peut désactiver"
                                  >
                                    <Unlock className="w-3 h-3" />
                                    Toggleable
                                  </span>
                                ) : (
                                  <span
                                    className="flex items-center gap-1 text-xs text-gray-500"
                                    title="Non modifiable par l'utilisateur"
                                  >
                                    <Lock className="w-3 h-3" />
                                    Fixe
                                  </span>
                                )}
                                {feature.requires && feature.requires.length > 0 && (
                                  <span
                                    className="flex items-center gap-1 text-xs text-blue-400"
                                    title={`Requiert: ${feature.requires.join(', ')}`}
                                  >
                                    <Info className="w-3 h-3" />
                                    {feature.requires.length} dep.
                                  </span>
                                )}
                                {dependents.length > 0 && (
                                  <span
                                    className="flex items-center gap-1 text-xs text-orange-400"
                                    title={`Utilisé par: ${dependents.map((d) => d.name).join(', ')}`}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    {dependents.length} dépendants
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedFeature(feature)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{selectedFeature.name}</h2>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ID */}
              <div>
                <p className="text-sm text-gray-400 mb-1">ID</p>
                <code className="text-sm text-white bg-gray-800 px-2 py-1 rounded">
                  {selectedFeature.id}
                </code>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-white">{selectedFeature.description}</p>
                {selectedFeature.longDescription && (
                  <p className="text-gray-400 text-sm mt-2">{selectedFeature.longDescription}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Catégorie</p>
                <span className="px-2 py-1 bg-gray-800 rounded text-sm text-white">
                  {CATEGORY_LABELS[selectedFeature.category]}
                </span>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Statut actuel</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium text-white ${
                    statusColors[getFeatureStatus(selectedFeature)]
                  }`}
                >
                  {STATUS_LABELS[getFeatureStatus(selectedFeature)]}
                </span>
              </div>

              {/* Min Tier */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Tier minimum</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium text-white ${
                    TIER_BG_COLORS[getFeatureMinTier(selectedFeature)] || 'bg-gray-600'
                  }`}
                >
                  {TIER_LABELS[getFeatureMinTier(selectedFeature) as keyof typeof TIER_LABELS] ||
                    getFeatureMinTier(selectedFeature)}
                </span>
              </div>

              {/* Dependencies */}
              {selectedFeature.requires && selectedFeature.requires.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Dépendances</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.requires.map((req) => (
                      <code key={req} className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {req}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependents */}
              {getFeatureDependents(selectedFeature.id).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Features dépendantes</p>
                  <div className="flex flex-wrap gap-2">
                    {getFeatureDependents(selectedFeature.id).map((dep) => (
                      <code key={dep.id} className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                        {dep.name}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-orange-400 mt-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Attention: désactiver cette feature impactera les features listées ci-dessus.
                  </p>
                </div>
              )}

              {/* Affects */}
              {selectedFeature.affectsMetrics && selectedFeature.affectsMetrics.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Métriques impactées</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.affectsMetrics.map((metric) => (
                      <code key={metric} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {metric}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeature.affectsScores && selectedFeature.affectsScores.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Scores impactés</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.affectsScores.map((score) => (
                      <code key={score} className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        {score}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedFeature.tags && selectedFeature.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Options</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Modifiable par l&apos;utilisateur</span>
                    {selectedFeature.userToggleable ? (
                      <span className="text-green-400 text-sm">Oui</span>
                    ) : (
                      <span className="text-gray-500 text-sm">Non</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Activé par défaut</span>
                    {selectedFeature.enabledByDefault ? (
                      <span className="text-green-400 text-sm">Oui</span>
                    ) : (
                      <span className="text-gray-500 text-sm">Non</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full" variant="secondary" onClick={() => setSelectedFeature(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
