'use client';

import { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

interface GlobalFeature {
  feature: string;
  enabled: boolean;
  description: string;
}

interface CoachingConfig {
  thresholds: ThresholdCategory[];
  features: {
    global: GlobalFeature[];
    categories: CategoryFeature[];
  };
}

const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
  aim: { name: 'Aim', icon: '🎯', color: 'red' },
  positioning: { name: 'Positionnement', icon: '📍', color: 'blue' },
  utility: { name: 'Utilité', icon: '💨', color: 'green' },
  economy: { name: 'Économie', icon: '💰', color: 'yellow' },
  timing: { name: 'Timing', icon: '⏱️', color: 'purple' },
  decision: { name: 'Décision', icon: '🧠', color: 'orange' },
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Critique', color: 'bg-red-500/20 text-red-400' },
  2: { label: 'Haute', color: 'bg-orange-500/20 text-orange-400' },
  3: { label: 'Moyenne', color: 'bg-yellow-500/20 text-yellow-400' },
  4: { label: 'Basse', color: 'bg-blue-500/20 text-blue-400' },
};

export default function AdminCoachingRulesPage() {
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

  const getThresholdCategory = (categoryName: string): ThresholdCategory | undefined => {
    return config?.thresholds.find((t) => t.category === categoryName);
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
    if (!confirm('Réinitialiser toutes les règles aux valeurs par défaut ?')) return;

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

  // Calculer les stats
  const getStats = () => {
    if (!config) return { total: 0, enabled: 0, disabled: 0 };

    let total = 0;
    let enabled = 0;

    config.features.categories.forEach((cat) => {
      cat.rules.forEach((rule) => {
        total++;
        if (rule.enabled && cat.enabled) enabled++;
      });
    });

    return { total, enabled, disabled: total - enabled };
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

  const stats = getStats();

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
            <span className="text-white">Règles</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Gestion des Règles</h1>
          <p className="text-gray-400 mt-1">Activez ou désactivez les règles d&apos;analyse du coaching</p>
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
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">Règles totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{stats.enabled}</p>
              <p className="text-sm text-gray-400">Règles actives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/10 border-gray-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-400">{stats.disabled}</p>
              <p className="text-sm text-gray-400">Règles désactivées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories & Rules */}
      <div className="space-y-4">
        {config.thresholds.map((thresholdCategory) => {
          const categoryInfo = categoryLabels[thresholdCategory.category] || {
            name: thresholdCategory.category,
            icon: '⚙️',
            color: 'gray',
          };
          const categoryFeature = getCategoryFeature(thresholdCategory.category);
          const isExpanded = expandedCategories.includes(thresholdCategory.category);
          const isCategoryEnabled = categoryFeature?.enabled !== false;

          // Compter les règles actives dans cette catégorie
          const activeRulesCount = categoryFeature?.rules.filter((r) => r.enabled).length || 0;
          const totalRulesCount = thresholdCategory.rules.length;

          return (
            <Card key={thresholdCategory.category} className={!isCategoryEnabled ? 'opacity-50' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => toggleCategory(thresholdCategory.category)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryInfo.icon}</span>
                    <div>
                      <CardTitle>{categoryInfo.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {activeRulesCount}/{totalRulesCount} règles actives
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
                        <ToggleRight className="w-10 h-10 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10" />
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
                      const priority = priorityLabels[rule.config.priority] || priorityLabels[3];

                      return (
                        <div
                          key={rule.id}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            isRuleEnabled ? 'bg-gray-800/50' : 'bg-gray-800/20'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <code className="text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                {rule.id}
                              </code>
                              <span className={`px-2 py-0.5 rounded text-xs ${priority.color}`}>
                                P{rule.config.priority} - {priority.label}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                              {rule.config.description || ruleFeature?.description || 'Aucune description'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleRule(thresholdCategory.category, rule.id, isRuleEnabled)}
                            disabled={isSaving || !isCategoryEnabled}
                            className="text-gray-400 hover:text-white disabled:opacity-50 ml-4"
                          >
                            {isRuleEnabled ? (
                              <ToggleRight className="w-8 h-8 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8" />
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
    </div>
  );
}
