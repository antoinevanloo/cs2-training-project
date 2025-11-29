'use client';

import { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Types matching the actual API response
interface ThresholdConfig {
  value: number;
  priority: 1 | 2 | 3 | 4;
  comparison: string;
  description: string;
}

interface ThresholdCategory {
  category: string;
  rules: { id: string; config: ThresholdConfig }[];
}

interface RoleProfile {
  id: string;
  name: string;
  description: string;
  expectedBehavior: string[];
  thresholdModifiers: Record<string, number | null>;
}

interface MapConfig {
  id: string;
  name: string;
  thresholdModifiers: Record<string, number>;
}

interface GlobalFeature {
  feature: string;
  enabled: boolean;
  description: string;
}

interface RuleFeature {
  ruleId: string;
  enabled: boolean;
  description: string;
}

interface CategoryFeature {
  category: string;
  enabled: boolean;
  rules: RuleFeature[];
}

interface FeaturesConfig {
  global: GlobalFeature[];
  categories: CategoryFeature[];
  display: {
    maxPriorityIssues: number;
    maxRecommendations: number;
    showThresholds: boolean;
    showModifiers: boolean;
    language: string;
  };
}

interface CoachingConfig {
  thresholds: ThresholdCategory[];
  roles: RoleProfile[];
  maps: MapConfig[];
  features: FeaturesConfig;
}

const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
  aim: { name: 'Aim', icon: '🎯', color: 'red' },
  positioning: { name: 'Positionnement', icon: '📍', color: 'blue' },
  utility: { name: 'Utilité', icon: '💨', color: 'green' },
  economy: { name: 'Économie', icon: '💰', color: 'yellow' },
  timing: { name: 'Timing', icon: '⏱️', color: 'purple' },
  decision: { name: 'Décision', icon: '🧠', color: 'orange' },
};

export default function AdminCoachingPage() {
  const [config, setConfig] = useState<CoachingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/coaching/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du chargement' });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryFeature = (categoryName: string): CategoryFeature | undefined => {
    return config?.features.categories.find((c) => c.category === categoryName);
  };

  const getAutoRoleDetection = (): GlobalFeature | undefined => {
    return config?.features.global.find((g) => g.feature === 'autoRoleDetectionEnabled');
  };

  const handleToggleCategory = async (category: string, currentState: boolean) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/coaching/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentState ? 'disableCategory' : 'enableCategory',
          payload: { category },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => prev ? { ...prev, features: data.features } : prev);
        setMessage({ type: 'success', text: data.message });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (category: string, ruleId: string, currentState: boolean) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/coaching/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentState ? 'disableRule' : 'enableRule',
          payload: { category, ruleId },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => prev ? { ...prev, features: data.features } : prev);
        setMessage({ type: 'success', text: data.message });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Réinitialiser toute la configuration du coaching ?')) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/coaching/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => prev ? { ...prev, features: data.features } : prev);
        setMessage({ type: 'success', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du reset' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAutoDetection = async () => {
    const autoDetection = getAutoRoleDetection();
    if (!autoDetection) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/coaching/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateFeatures',
          payload: {
            global: {
              autoRoleDetectionEnabled: {
                enabled: !autoDetection.enabled,
                description: autoDetection.description,
              },
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => prev ? { ...prev, features: data.features } : prev);
        setMessage({ type: 'success', text: 'Configuration mise à jour' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        Erreur lors du chargement de la configuration
      </div>
    );
  }

  const autoRoleDetection = getAutoRoleDetection();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuration Coaching</h1>
          <p className="text-gray-400 mt-1">Gérez les règles et seuils du système de coaching</p>
        </div>
        <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Auto Detection Toggle */}
      {autoRoleDetection && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Détection automatique du rôle</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {autoRoleDetection.description}
                </p>
              </div>
              <button
                onClick={handleToggleAutoDetection}
                disabled={isSaving}
                className="text-gray-400 hover:text-white"
              >
                {autoRoleDetection.enabled ? (
                  <ToggleRight className="w-10 h-10 text-red-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profils de rôle configurés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {config.roles.map((role) => (
              <div
                key={role.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <h4 className="text-white font-medium">{role.name}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {Object.keys(role.thresholdModifiers).length} modifieurs
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories & Rules */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Catégories et règles</h2>

        {config.thresholds.map((thresholdCategory) => {
          const categoryInfo = categoryLabels[thresholdCategory.category] || {
            name: thresholdCategory.category,
            icon: '⚙️',
            color: 'gray',
          };
          const categoryFeature = getCategoryFeature(thresholdCategory.category);
          const isExpanded = expandedCategories.includes(thresholdCategory.category);
          const isCategoryEnabled = categoryFeature?.enabled !== false;

          return (
            <Card key={thresholdCategory.category} className={!isCategoryEnabled ? 'opacity-50' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => toggleCategory(thresholdCategory.category)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryInfo.icon}</span>
                    <div>
                      <CardTitle>{categoryInfo.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {thresholdCategory.rules.length} règles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCategory(thresholdCategory.category, isCategoryEnabled);
                      }}
                      disabled={isSaving}
                      className="text-gray-400 hover:text-white"
                    >
                      {isCategoryEnabled ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="space-y-2">
                    {thresholdCategory.rules.map((rule) => {
                      const ruleFeature = categoryFeature?.rules.find((r) => r.ruleId === rule.id);
                      const isRuleEnabled = ruleFeature?.enabled !== false;

                      return (
                        <div
                          key={rule.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isRuleEnabled ? 'bg-gray-800/50' : 'bg-gray-800/20'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm text-red-400">{rule.id}</code>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  rule.config.priority === 1
                                    ? 'bg-red-500/20 text-red-400'
                                    : rule.config.priority === 2
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}
                              >
                                P{rule.config.priority}
                              </span>
                            </div>
                            {rule.config.description && (
                              <p className="text-xs text-gray-500 mt-1">{rule.config.description}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              Seuil: {rule.config.value} ({rule.config.comparison})
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleRule(thresholdCategory.category, rule.id, isRuleEnabled)}
                            disabled={isSaving || !isCategoryEnabled}
                            className="text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            {isRuleEnabled ? (
                              <ToggleRight className="w-6 h-6 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Maps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Configurations par map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.maps.map((mapConfig) => (
              <div
                key={mapConfig.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <h4 className="text-white font-medium">{mapConfig.name}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {Object.keys(mapConfig.thresholdModifiers).length} ajustements
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
