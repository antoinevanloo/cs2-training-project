'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ThresholdConfig {
  value: number;
  priority: 1 | 2 | 3 | 4;
  comparison: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
  description: string;
}

interface ThresholdCategory {
  category: string;
  rules: { id: string; config: ThresholdConfig }[];
}

interface CoachingConfig {
  thresholds: ThresholdCategory[];
}

// Type pour les modifications locales
interface LocalThreshold {
  category: string;
  ruleId: string;
  value: number;
  priority: 1 | 2 | 3 | 4;
  comparison: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
}

const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
  aim: { name: 'Aim', icon: '🎯', color: 'red' },
  positioning: { name: 'Positionnement', icon: '📍', color: 'blue' },
  utility: { name: 'Utilité', icon: '💨', color: 'green' },
  economy: { name: 'Économie', icon: '💰', color: 'yellow' },
  timing: { name: 'Timing', icon: '⏱️', color: 'purple' },
  decision: { name: 'Décision', icon: '🧠', color: 'orange' },
};

const comparisonLabels: Record<string, string> = {
  lt: '< (inférieur à)',
  lte: '≤ (inférieur ou égal)',
  gt: '> (supérieur à)',
  gte: '≥ (supérieur ou égal)',
  eq: '= (égal à)',
};

const priorityOptions = [
  { value: 1, label: 'P1 - Critique', color: 'text-red-400' },
  { value: 2, label: 'P2 - Haute', color: 'text-orange-400' },
  { value: 3, label: 'P3 - Moyenne', color: 'text-yellow-400' },
  { value: 4, label: 'P4 - Basse', color: 'text-blue-400' },
];

export default function AdminCoachingThresholdsPage() {
  const [config, setConfig] = useState<CoachingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localChanges, setLocalChanges] = useState<Map<string, LocalThreshold>>(new Map());

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

  // Gérer les changements locaux
  const handleLocalChange = (
    category: string,
    ruleId: string,
    field: 'value' | 'priority' | 'comparison',
    newValue: number | string
  ) => {
    const key = `${category}:${ruleId}`;
    const existing = localChanges.get(key);
    const original = config?.thresholds
      .find((t) => t.category === category)
      ?.rules.find((r) => r.id === ruleId)?.config;

    if (!original) return;

    const updated: LocalThreshold = existing || {
      category,
      ruleId,
      value: original.value,
      priority: original.priority,
      comparison: original.comparison,
    };

    if (field === 'value') {
      updated.value = Number(newValue);
    } else if (field === 'priority') {
      updated.priority = Number(newValue) as 1 | 2 | 3 | 4;
    } else if (field === 'comparison') {
      updated.comparison = newValue as 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
    }

    const newChanges = new Map(localChanges);
    newChanges.set(key, updated);
    setLocalChanges(newChanges);
  };

  // Obtenir la valeur actuelle (locale ou originale)
  const getCurrentValue = (
    category: string,
    ruleId: string,
    field: 'value' | 'priority' | 'comparison'
  ): number | string => {
    const key = `${category}:${ruleId}`;
    const local = localChanges.get(key);

    if (local) {
      return local[field];
    }

    const original = config?.thresholds
      .find((t) => t.category === category)
      ?.rules.find((r) => r.id === ruleId)?.config;

    return original ? original[field] : '';
  };

  // Vérifier si un seuil a été modifié
  const hasChanges = (category: string, ruleId: string): boolean => {
    return localChanges.has(`${category}:${ruleId}`);
  };

  // Sauvegarder tous les changements
  const handleSaveAll = async () => {
    if (localChanges.size === 0) {
      setMessage({ type: 'error', text: 'Aucune modification à sauvegarder' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const changes = Array.from(localChanges.values());

      const response = await fetch('/api/admin/coaching/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateThresholds',
          payload: { thresholds: changes },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || `${changes.length} seuil(s) mis à jour` });
        setLocalChanges(new Map());
        // Recharger la config pour avoir les nouvelles valeurs
        await fetchConfig();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser aux valeurs par défaut
  const handleReset = async () => {
    if (!confirm('Réinitialiser tous les seuils aux valeurs par défaut ?')) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/coaching/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetThresholds' }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Seuils réinitialisés' });
        setLocalChanges(new Map());
        await fetchConfig();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Erreur lors du reset' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du reset' });
    } finally {
      setIsSaving(false);
    }
  };

  // Annuler les changements locaux
  const handleDiscardChanges = () => {
    setLocalChanges(new Map());
    setMessage({ type: 'success', text: 'Modifications annulées' });
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

  const hasAnyChanges = localChanges.size > 0;

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
            <span className="text-white">Seuils</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Configuration des Seuils</h1>
          <p className="text-gray-400 mt-1">Ajustez les seuils de détection pour le coaching</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
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

      {/* Barre d'actions si modifications */}
      {hasAnyChanges && (
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur p-4 rounded-lg border border-yellow-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <span>{localChanges.size} modification(s) non sauvegardée(s)</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleDiscardChanges} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder tout
            </Button>
          </div>
        </div>
      )}

      {/* Légende */}
      <Card className="bg-gray-800/30">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-500">Comparaisons:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(comparisonLabels).map(([key, label]) => (
                  <span key={key} className="text-gray-400 bg-gray-700/50 px-2 py-1 rounded text-xs">
                    {key}: {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories & Thresholds */}
      <div className="space-y-4">
        {config.thresholds.map((thresholdCategory) => {
          const categoryInfo = categoryLabels[thresholdCategory.category] || {
            name: thresholdCategory.category,
            icon: '⚙️',
            color: 'gray',
          };
          const isExpanded = expandedCategories.includes(thresholdCategory.category);
          const categoryHasChanges = thresholdCategory.rules.some((r) =>
            hasChanges(thresholdCategory.category, r.id)
          );

          return (
            <Card key={thresholdCategory.category} className={categoryHasChanges ? 'border-yellow-500/50' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => toggleCategory(thresholdCategory.category)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryInfo.icon}</span>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {categoryInfo.name}
                        {categoryHasChanges && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Modifié
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {thresholdCategory.rules.length} seuils
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
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
                  <div className="space-y-4">
                    {thresholdCategory.rules.map((rule) => {
                      const isModified = hasChanges(thresholdCategory.category, rule.id);

                      return (
                        <div
                          key={rule.id}
                          className={`p-4 rounded-lg ${
                            isModified ? 'bg-yellow-500/5 border border-yellow-500/30' : 'bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <code className="text-sm text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                {rule.id}
                              </code>
                              <p className="text-gray-400 text-sm mt-2">
                                {rule.config.description}
                              </p>
                            </div>
                            {isModified && (
                              <span className="text-xs text-yellow-400">Modifié</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Valeur */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Valeur seuil</label>
                              <Input
                                type="number"
                                step="any"
                                value={getCurrentValue(thresholdCategory.category, rule.id, 'value')}
                                onChange={(e) =>
                                  handleLocalChange(
                                    thresholdCategory.category,
                                    rule.id,
                                    'value',
                                    e.target.value
                                  )
                                }
                                className="bg-gray-900 border-gray-700"
                              />
                            </div>

                            {/* Comparaison */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Comparaison</label>
                              <select
                                value={getCurrentValue(thresholdCategory.category, rule.id, 'comparison')}
                                onChange={(e) =>
                                  handleLocalChange(
                                    thresholdCategory.category,
                                    rule.id,
                                    'comparison',
                                    e.target.value
                                  )
                                }
                                className="w-full h-10 px-3 rounded-md bg-gray-900 border border-gray-700 text-white text-sm"
                              >
                                {Object.entries(comparisonLabels).map(([key, label]) => (
                                  <option key={key} value={key}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Priorité */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
                              <select
                                value={getCurrentValue(thresholdCategory.category, rule.id, 'priority')}
                                onChange={(e) =>
                                  handleLocalChange(
                                    thresholdCategory.category,
                                    rule.id,
                                    'priority',
                                    e.target.value
                                  )
                                }
                                className="w-full h-10 px-3 rounded-md bg-gray-900 border border-gray-700 text-white text-sm"
                              >
                                {priorityOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
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
