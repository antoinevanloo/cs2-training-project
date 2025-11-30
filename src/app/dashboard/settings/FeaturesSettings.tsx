'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  FEATURE_DEFINITIONS,
  TIER_DEFINITIONS,
  getFeaturesByCategory,
} from '@/lib/features/config';
import {
  FeatureCategory,
  CATEGORY_LABELS,
  STATUS_LABELS,
  SubscriptionTier,
} from '@/lib/features/types';

interface FeatureWithAccess {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: FeatureCategory;
  icon?: string;
  status: string;
  minTier: SubscriptionTier;
  userToggleable: boolean;
  enabledByDefault: boolean;
  requires?: string[];
  tags?: string[];
  access: {
    hasAccess: boolean;
    isEnabled: boolean;
    source: string;
    message?: string;
    canToggle: boolean;
    requiredTier?: SubscriptionTier;
  };
}

interface FeaturesData {
  features: FeatureWithAccess[];
  tier: SubscriptionTier;
  isBetaTester: boolean;
}

const CATEGORY_ORDER: FeatureCategory[] = [
  'analysis',
  'coaching',
  'display',
  'export',
  'integration',
  'advanced',
];

const CATEGORY_ICONS: Record<FeatureCategory, string> = {
  analysis: '🎯',
  coaching: '💡',
  display: '📊',
  export: '📤',
  integration: '🔗',
  advanced: '⚡',
};

export function FeaturesSettings() {
  const [featuresData, setFeaturesData] = useState<FeaturesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<FeatureCategory | null>('analysis');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger les features
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/features');
        if (response.ok) {
          const data: FeaturesData = await response.json();
          setFeaturesData(data);
        }
      } catch (error) {
        console.error('Failed to fetch features:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  // Toggle une feature
  const handleToggleFeature = async (featureId: string, currentEnabled: boolean) => {
    if (togglingFeature) return;

    setTogglingFeature(featureId);
    setMessage(null);

    try {
      const response = await fetch('/api/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId,
          enabled: !currentEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour localement
      setFeaturesData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          features: prev.features.map((f) =>
            f.id === featureId
              ? { ...f, access: { ...f.access, isEnabled: !currentEnabled } }
              : f
          ),
        };
      });

      setMessage({
        type: 'success',
        text: `${FEATURE_DEFINITIONS[featureId]?.name || featureId} ${!currentEnabled ? 'activé' : 'désactivé'}`,
      });

      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
      });
    } finally {
      setTogglingFeature(null);
    }
  };

  // Grouper les features par catégorie
  const featuresByCategory = (category: FeatureCategory): FeatureWithAccess[] => {
    if (!featuresData) return [];
    return featuresData.features.filter((f) => f.category === category);
  };

  // Calculer les stats d'une catégorie
  const getCategoryStats = (category: FeatureCategory) => {
    const features = featuresByCategory(category);
    const total = features.length;
    const accessible = features.filter((f) => f.access.hasAccess).length;
    const enabled = features.filter((f) => f.access.hasAccess && f.access.isEnabled).length;
    return { total, accessible, enabled };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cs2-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!featuresData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            Impossible de charger les fonctionnalités
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentTier = TIER_DEFINITIONS[featuresData.tier];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fonctionnalités</CardTitle>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: `var(--tier-${currentTier.color}, #374151)`, color: 'white' }}
            >
              {currentTier.name}
            </span>
            {featuresData.isBetaTester && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-600 text-white">
                Beta Tester
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Personnalisez les fonctionnalités actives pour vos analyses
        </p>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {CATEGORY_ORDER.map((category) => {
            const stats = getCategoryStats(category);
            const features = featuresByCategory(category);
            const isExpanded = expandedCategory === category;

            if (features.length === 0) return null;

            return (
              <div key={category} className="border border-gray-700 rounded-lg overflow-hidden">
                {/* En-tête de catégorie */}
                <button
                  className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                    <span className="font-medium text-white">{CATEGORY_LABELS[category]}</span>
                    <span className="text-xs text-gray-500">
                      ({stats.enabled}/{stats.accessible} actif)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.accessible < stats.total && (
                      <span className="text-xs text-amber-400">
                        {stats.total - stats.accessible} verrouillé
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Liste des features */}
                {isExpanded && (
                  <div className="divide-y divide-gray-700">
                    {features.map((feature) => (
                      <FeatureRow
                        key={feature.id}
                        feature={feature}
                        currentTier={featuresData.tier}
                        isToggling={togglingFeature === feature.id}
                        onToggle={() => handleToggleFeature(feature.id, feature.access.isEnabled)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Note informative */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            <strong>Note :</strong> Désactiver une fonctionnalité d&apos;analyse recalculera vos scores
            en excluant cette catégorie. Les fonctionnalités verrouillées nécessitent un abonnement
            supérieur.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour une ligne de feature
function FeatureRow({
  feature,
  currentTier,
  isToggling,
  onToggle,
}: {
  feature: FeatureWithAccess;
  currentTier: SubscriptionTier;
  isToggling: boolean;
  onToggle: () => void;
}) {
  const { access } = feature;
  const isLocked = !access.hasAccess;
  const canToggle = access.canToggle && !isLocked;

  // Statuts spéciaux
  const statusBadge = () => {
    if (feature.status === 'beta') {
      return <span className="px-1.5 py-0.5 text-xs bg-purple-600/50 text-purple-200 rounded">Beta</span>;
    }
    if (feature.status === 'alpha') {
      return <span className="px-1.5 py-0.5 text-xs bg-red-600/50 text-red-200 rounded">Alpha</span>;
    }
    if (feature.status === 'coming_soon') {
      return <span className="px-1.5 py-0.5 text-xs bg-amber-600/50 text-amber-200 rounded">Bientôt</span>;
    }
    if (feature.status === 'deprecated') {
      return <span className="px-1.5 py-0.5 text-xs bg-gray-600/50 text-gray-300 rounded">Obsolète</span>;
    }
    return null;
  };

  // Tier requis
  const tierBadge = () => {
    if (isLocked && access.requiredTier) {
      const requiredTierDef = TIER_DEFINITIONS[access.requiredTier];
      return (
        <span
          className="px-1.5 py-0.5 text-xs rounded"
          style={{ backgroundColor: `var(--tier-${requiredTierDef.color}, #374151)30`, color: `var(--tier-${requiredTierDef.color}, #9ca3af)` }}
        >
          {requiredTierDef.name}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-3 flex items-center justify-between ${isLocked ? 'opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isLocked ? 'text-gray-400' : 'text-white'}`}>
            {feature.name}
          </span>
          {statusBadge()}
          {tierBadge()}
          {!feature.userToggleable && access.hasAccess && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
              Auto
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {feature.description}
        </p>
        {isLocked && access.message && (
          <p className="text-xs text-amber-400 mt-1">
            {access.message}
          </p>
        )}
        {feature.requires && feature.requires.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            Requiert : {feature.requires.map(r => FEATURE_DEFINITIONS[r]?.name || r).join(', ')}
          </p>
        )}
      </div>

      {/* Toggle switch */}
      <div className="flex-shrink-0">
        {canToggle ? (
          <button
            onClick={onToggle}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cs2-accent focus:ring-offset-2 focus:ring-offset-gray-900 ${
              access.isEnabled ? 'bg-cs2-accent' : 'bg-gray-600'
            } ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                access.isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        ) : isLocked ? (
          <div className="flex items-center gap-1 text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        ) : (
          <div className="h-6 w-11 flex items-center justify-center">
            <span className={`inline-block h-3 w-3 rounded-full ${access.isEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        )}
      </div>
    </div>
  );
}
