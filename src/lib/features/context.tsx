'use client';

import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import {
  FeatureContext,
  FeatureAccess,
  SubscriptionTier,
  UserFeaturePreferences,
  UserFeatureOverride,
  FeatureDefinition,
  FeatureCategory,
} from './types';
import { FEATURE_DEFINITIONS, getFeaturesByCategory } from './config';
import {
  checkFeatureAccess,
  getEnabledFeatures,
  getEnabledAnalysisFeatures,
  hasFeature,
  createDefaultContext,
} from './access';

// ============================================
// TYPES DU CONTEXTE REACT
// ============================================

interface FeatureProviderValue {
  /** Contexte complet des features */
  context: FeatureContext;

  /** Vérifie l'accès à une feature */
  checkAccess: (featureId: string) => FeatureAccess;

  /** Vérifie rapidement si une feature est accessible */
  hasFeature: (featureId: string) => boolean;

  /** Récupère toutes les features activées */
  getEnabledFeatures: () => FeatureDefinition[];

  /** Récupère les IDs des analyseurs activés */
  getEnabledAnalysisFeatures: () => string[];

  /** Active une feature */
  enableFeature: (featureId: string) => Promise<void>;

  /** Désactive une feature */
  disableFeature: (featureId: string) => Promise<void>;

  /** Toggle une feature */
  toggleFeature: (featureId: string) => Promise<void>;

  /** Met à jour la configuration d'une feature */
  updateFeatureConfig: (featureId: string, config: Record<string, unknown>) => Promise<void>;

  /** État de chargement */
  isLoading: boolean;

  /** Erreur éventuelle */
  error: string | null;
}

const FeatureProviderContext = createContext<FeatureProviderValue | null>(null);

// ============================================
// PROPS DU PROVIDER
// ============================================

interface FeatureProviderProps {
  children: React.ReactNode;

  /** Tier de l'utilisateur */
  tier: SubscriptionTier;

  /** L'utilisateur est-il beta tester ? */
  isBetaTester?: boolean;

  /** L'utilisateur est-il alpha tester ? */
  isAlphaTester?: boolean;

  /** Préférences utilisateur initiales */
  initialPreferences?: UserFeaturePreferences;

  /** Overrides administrateur */
  overrides?: UserFeatureOverride[];

  /** Utilisation actuelle par feature */
  usage?: Record<string, number>;

  /** Callback pour sauvegarder les préférences */
  onSavePreferences?: (preferences: UserFeaturePreferences) => Promise<void>;
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export function FeatureProvider({
  children,
  tier,
  isBetaTester = false,
  isAlphaTester = false,
  initialPreferences,
  overrides = [],
  usage = {},
  onSavePreferences,
}: FeatureProviderProps) {
  const [preferences, setPreferences] = useState<UserFeaturePreferences>(
    initialPreferences || {
      disabledFeatures: [],
      enabledFeatures: [],
      featureConfigs: {},
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contexte complet des features
  const context = useMemo<FeatureContext>(
    () => ({
      tier,
      isBetaTester,
      isAlphaTester,
      preferences,
      overrides,
      usage,
    }),
    [tier, isBetaTester, isAlphaTester, preferences, overrides, usage]
  );

  // Sauvegarde des préférences
  const savePreferences = useCallback(
    async (newPrefs: UserFeaturePreferences) => {
      if (onSavePreferences) {
        setIsLoading(true);
        setError(null);
        try {
          await onSavePreferences(newPrefs);
          setPreferences(newPrefs);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
          throw err;
        } finally {
          setIsLoading(false);
        }
      } else {
        setPreferences(newPrefs);
      }
    },
    [onSavePreferences]
  );

  // Active une feature
  const enableFeature = useCallback(
    async (featureId: string) => {
      const access = checkFeatureAccess(featureId, context);

      if (!access.canToggle) {
        throw new Error('Cette fonctionnalité ne peut pas être modifiée');
      }

      if (!access.hasAccess) {
        throw new Error(access.message || 'Accès non autorisé');
      }

      const newPrefs: UserFeaturePreferences = {
        ...preferences,
        disabledFeatures: preferences.disabledFeatures.filter((id) => id !== featureId),
        enabledFeatures: preferences.enabledFeatures.includes(featureId)
          ? preferences.enabledFeatures
          : [...preferences.enabledFeatures, featureId],
      };

      await savePreferences(newPrefs);
    },
    [context, preferences, savePreferences]
  );

  // Désactive une feature
  const disableFeature = useCallback(
    async (featureId: string) => {
      const access = checkFeatureAccess(featureId, context);

      if (!access.canToggle) {
        throw new Error('Cette fonctionnalité ne peut pas être modifiée');
      }

      const newPrefs: UserFeaturePreferences = {
        ...preferences,
        enabledFeatures: preferences.enabledFeatures.filter((id) => id !== featureId),
        disabledFeatures: preferences.disabledFeatures.includes(featureId)
          ? preferences.disabledFeatures
          : [...preferences.disabledFeatures, featureId],
      };

      await savePreferences(newPrefs);
    },
    [context, preferences, savePreferences]
  );

  // Toggle une feature
  const toggleFeature = useCallback(
    async (featureId: string) => {
      const access = checkFeatureAccess(featureId, context);

      if (access.isEnabled) {
        await disableFeature(featureId);
      } else {
        await enableFeature(featureId);
      }
    },
    [context, enableFeature, disableFeature]
  );

  // Met à jour la configuration d'une feature
  const updateFeatureConfig = useCallback(
    async (featureId: string, config: Record<string, unknown>) => {
      const newPrefs: UserFeaturePreferences = {
        ...preferences,
        featureConfigs: {
          ...preferences.featureConfigs,
          [featureId]: {
            ...preferences.featureConfigs[featureId],
            ...config,
          },
        },
      };

      await savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Valeur du contexte
  const value = useMemo<FeatureProviderValue>(
    () => ({
      context,
      checkAccess: (featureId: string) => checkFeatureAccess(featureId, context),
      hasFeature: (featureId: string) => hasFeature(featureId, context),
      getEnabledFeatures: () => getEnabledFeatures(context),
      getEnabledAnalysisFeatures: () => getEnabledAnalysisFeatures(context),
      enableFeature,
      disableFeature,
      toggleFeature,
      updateFeatureConfig,
      isLoading,
      error,
    }),
    [context, enableFeature, disableFeature, toggleFeature, updateFeatureConfig, isLoading, error]
  );

  return (
    <FeatureProviderContext.Provider value={value}>
      {children}
    </FeatureProviderContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook principal pour accéder au système de features
 */
export function useFeatures(): FeatureProviderValue {
  const context = useContext(FeatureProviderContext);

  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }

  return context;
}

/**
 * Hook pour vérifier l'accès à une feature spécifique
 */
export function useFeature(featureId: string): FeatureAccess & {
  toggle: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
} {
  const { checkAccess, toggleFeature, enableFeature, disableFeature } = useFeatures();

  const access = checkAccess(featureId);

  return {
    ...access,
    toggle: () => toggleFeature(featureId),
    enable: () => enableFeature(featureId),
    disable: () => disableFeature(featureId),
  };
}

/**
 * Hook pour vérifier rapidement si une feature est active
 */
export function useHasFeature(featureId: string): boolean {
  const { hasFeature } = useFeatures();
  return hasFeature(featureId);
}

/**
 * Hook pour récupérer les features d'une catégorie avec leur état
 */
export function useFeaturesInCategory(category: FeatureCategory): Array<{
  feature: FeatureDefinition;
  access: FeatureAccess;
}> {
  const { checkAccess } = useFeatures();
  const features = getFeaturesByCategory(category);

  return features.map((feature) => ({
    feature,
    access: checkAccess(feature.id),
  }));
}

/**
 * Hook pour récupérer les analyseurs activés
 */
export function useEnabledAnalyzers(): string[] {
  const { getEnabledAnalysisFeatures } = useFeatures();
  return getEnabledAnalysisFeatures();
}

/**
 * Hook pour vérifier le tier de l'utilisateur
 */
export function useTier(): SubscriptionTier {
  const { context } = useFeatures();
  return context.tier;
}

// ============================================
// COMPOSANTS UTILITAIRES
// ============================================

interface FeatureGateProps {
  /** ID de la feature requise */
  featureId: string;

  /** Contenu à afficher si la feature est active */
  children: React.ReactNode;

  /** Contenu alternatif si la feature n'est pas active */
  fallback?: React.ReactNode;

  /** Afficher un message d'upgrade si bloqué par tier */
  showUpgradePrompt?: boolean;
}

/**
 * Composant pour conditionner l'affichage à une feature
 */
export function FeatureGate({
  featureId,
  children,
  fallback = null,
  showUpgradePrompt = false,
}: FeatureGateProps) {
  const access = useFeature(featureId);

  if (access.hasAccess && access.isEnabled) {
    return <>{children}</>;
  }

  if (showUpgradePrompt && access.source === 'tier' && access.requiredTier) {
    return (
      <div className="p-4 border border-dashed border-gray-600 rounded-lg bg-gray-800/30">
        <p className="text-sm text-gray-400">
          Cette fonctionnalité nécessite l&apos;abonnement{' '}
          <span className="text-cs2-accent font-medium capitalize">{access.requiredTier}</span>
        </p>
        <a
          href="/dashboard/settings/subscription"
          className="mt-2 inline-block text-sm text-cs2-accent hover:underline"
        >
          Mettre à niveau →
        </a>
      </div>
    );
  }

  return <>{fallback}</>;
}

/**
 * HOC pour wraper un composant avec une vérification de feature
 */
export function withFeature<P extends object>(
  Component: React.ComponentType<P>,
  featureId: string,
  Fallback?: React.ComponentType
): React.FC<P> {
  return function FeatureWrappedComponent(props: P) {
    const hasAccess = useHasFeature(featureId);

    if (!hasAccess) {
      return Fallback ? <Fallback /> : null;
    }

    return <Component {...props} />;
  };
}