'use client';

import { useMemo } from 'react';
import { usePreferencesContext } from './context';
import type {
  AnalysisCategory,
  CategoryWeights,
  MetricThresholds,
  SavedFilter,
  DashboardWidget,
  DEFAULT_CATEGORY_WEIGHTS,
} from './types';
import { ANALYSIS_CATEGORIES } from './types';

// Hook principal pour les préférences
export function usePreferences() {
  const { preferences, isLoading, error, actions } = usePreferencesContext();
  return { preferences, isLoading, error, actions };
}

// Hook pour les objectifs
export function useGoals() {
  const { goals, isLoading, error, goalsActions } = usePreferencesContext();
  return { goals, isLoading, error, actions: goalsActions };
}

// Hook pour les objectifs actifs uniquement
export function useActiveGoals() {
  const { goals, goalsActions } = usePreferencesContext();
  const activeGoals = useMemo(
    () => goals.filter((g) => !g.achieved),
    [goals]
  );
  return { goals: activeGoals, actions: goalsActions };
}

// Hook pour les objectifs par catégorie
export function useGoalsByCategory(category: AnalysisCategory) {
  const { goals, goalsActions } = usePreferencesContext();
  const categoryGoals = useMemo(
    () => goals.filter((g) => g.category === category),
    [goals, category]
  );
  return { goals: categoryGoals, actions: goalsActions };
}

// Hook pour le thème
export function useTheme() {
  const { preferences, actions } = usePreferencesContext();
  return {
    theme: preferences?.theme || 'dark',
    setTheme: actions.setTheme,
  };
}

// Hook pour la langue
export function useLanguage() {
  const { preferences, actions } = usePreferencesContext();
  return {
    language: preferences?.language || 'fr',
    setLanguage: actions.setLanguage,
  };
}

// Hook pour les préférences d'affichage
export function useDisplayPreferences() {
  const { preferences, actions } = usePreferencesContext();

  return {
    theme: preferences?.theme || 'dark',
    language: preferences?.language || 'fr',
    compactMode: preferences?.compactMode || false,
    animationLevel: preferences?.animationLevel || 'full',
    chartStyle: preferences?.chartStyle || 'filled',
    colorScheme: preferences?.colorScheme || 'default',
    setTheme: actions.setTheme,
    setLanguage: actions.setLanguage,
    setCompactMode: actions.setCompactMode,
    setAnimationLevel: actions.setAnimationLevel,
    setChartStyle: actions.setChartStyle,
    setColorScheme: actions.setColorScheme,
  };
}

// Hook pour les préférences de dashboard
export function useDashboardPreferences() {
  const { preferences, actions } = usePreferencesContext();

  const dashboardLayout = useMemo(
    () => {
      const raw = preferences?.dashboardLayout;
      return (Array.isArray(raw) ? raw : []) as unknown as DashboardWidget[];
    },
    [preferences?.dashboardLayout]
  );

  const hiddenWidgets = useMemo(
    () => new Set(preferences?.hiddenWidgets || []),
    [preferences?.hiddenWidgets]
  );

  const pinnedMetrics = useMemo(
    () => preferences?.pinnedMetrics || [],
    [preferences?.pinnedMetrics]
  );

  return {
    dashboardLayout,
    hiddenWidgets,
    pinnedMetrics,
    isWidgetHidden: (widgetId: string) => hiddenWidgets.has(widgetId),
    isMetricPinned: (metricId: string) => pinnedMetrics.includes(metricId),
    setDashboardLayout: actions.setDashboardLayout,
    toggleWidget: actions.toggleWidget,
    pinMetric: actions.pinMetric,
    unpinMetric: actions.unpinMetric,
  };
}

// Hook pour les préférences d'analyse
export function useAnalysisPreferences() {
  const { preferences, actions } = usePreferencesContext();

  // Poids des catégories avec fallback aux valeurs par défaut
  const categoryWeights = useMemo((): CategoryWeights => {
    const weights = preferences?.categoryWeights as CategoryWeights | null;
    if (weights) return weights;

    // Weights par défaut (égaux)
    return {
      aim: 11.11,
      positioning: 11.11,
      utility: 11.11,
      economy: 11.11,
      timing: 11.11,
      decision: 11.11,
      movement: 11.11,
      awareness: 11.11,
      teamplay: 11.11,
    };
  }, [preferences?.categoryWeights]);

  // Seuils personnalisés
  const metricThresholds = useMemo(
    () => (preferences?.metricThresholds || null) as MetricThresholds | null,
    [preferences?.metricThresholds]
  );

  // Catégories prioritaires
  const priorityCategories = useMemo(
    () => (preferences?.priorityCategories || []) as AnalysisCategory[],
    [preferences?.priorityCategories]
  );

  // Catégories ordonnées (prioritaires en premier, puis les autres)
  const orderedCategories = useMemo((): AnalysisCategory[] => {
    if (priorityCategories.length === 0) return ANALYSIS_CATEGORIES;

    const prioritySet = new Set(priorityCategories);
    const remaining = ANALYSIS_CATEGORIES.filter((c) => !prioritySet.has(c));
    return [...priorityCategories, ...remaining];
  }, [priorityCategories]);

  return {
    categoryWeights,
    metricThresholds,
    priorityCategories,
    orderedCategories,
    setCategoryWeights: actions.setCategoryWeights,
    setMetricThresholds: actions.setMetricThresholds,
    setPriorityCategories: actions.setPriorityCategories,
  };
}

// Hook pour les préférences de notification
export function useNotificationPreferences() {
  const { preferences, actions } = usePreferencesContext();

  return {
    alertOnRegression: preferences?.alertOnRegression ?? true,
    alertOnGoalReached: preferences?.alertOnGoalReached ?? true,
    alertOnPersonalBest: preferences?.alertOnPersonalBest ?? true,
    weeklyReport: preferences?.weeklyReport ?? true,
    notificationChannel: preferences?.notificationChannel || 'inapp',
    setNotificationPreferences: actions.setNotificationPreferences,
  };
}

// Hook pour les filtres
export function useFilters() {
  const { preferences, actions } = usePreferencesContext();

  const savedFilters = useMemo(
    () => {
      const raw = preferences?.savedFilters;
      return (Array.isArray(raw) ? raw : []) as unknown as SavedFilter[];
    },
    [preferences?.savedFilters]
  );

  const defaultFilters = useMemo(
    () => {
      const raw = preferences?.defaultFilters;
      if (!raw || typeof raw !== 'object') return null;
      return raw as unknown as SavedFilter | null;
    },
    [preferences?.defaultFilters]
  );

  const quickFilters = useMemo(
    () => ({
      map: preferences?.quickFilterMap || null,
      period: preferences?.quickFilterPeriod || '30d',
      mode: preferences?.quickFilterMode || 'all',
    }),
    [preferences?.quickFilterMap, preferences?.quickFilterPeriod, preferences?.quickFilterMode]
  );

  return {
    savedFilters,
    defaultFilters,
    quickFilters,
    saveFilter: actions.saveFilter,
    deleteFilter: actions.deleteFilter,
    setDefaultFilters: actions.setDefaultFilters,
    setQuickFilters: actions.setQuickFilters,
  };
}

// Hook pour calculer le score pondéré
export function useWeightedScore() {
  const { categoryWeights } = useAnalysisPreferences();

  const calculateWeightedScore = useMemo(() => {
    return (scores: Partial<Record<AnalysisCategory, number>>): number => {
      let totalWeight = 0;
      let weightedSum = 0;

      for (const [category, score] of Object.entries(scores)) {
        if (score !== undefined && score !== null) {
          const weight = categoryWeights[category as AnalysisCategory] || 0;
          weightedSum += score * weight;
          totalWeight += weight;
        }
      }

      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };
  }, [categoryWeights]);

  return { calculateWeightedScore, categoryWeights };
}

// Hook pour obtenir le seuil d'une métrique
export function useMetricThreshold(metricKey: string) {
  const { metricThresholds } = useAnalysisPreferences();

  const threshold = useMemo(() => {
    if (!metricThresholds) return null;
    return metricThresholds[metricKey] || null;
  }, [metricThresholds, metricKey]);

  const getScoreLevel = useMemo(() => {
    if (!threshold) {
      return (value: number): 'poor' | 'average' | 'good' | 'excellent' => {
        // Valeurs par défaut si pas de seuil personnalisé
        if (value < 40) return 'poor';
        if (value < 60) return 'average';
        if (value < 80) return 'good';
        return 'excellent';
      };
    }

    return (value: number): 'poor' | 'average' | 'good' | 'excellent' => {
      if (value < threshold.poor) return 'poor';
      if (value < threshold.average) return 'average';
      if (value < threshold.good) return 'good';
      return 'excellent';
    };
  }, [threshold]);

  return { threshold, getScoreLevel };
}

// Hook pour vérifier si les animations sont activées
export function useAnimations() {
  const { preferences } = usePreferencesContext();

  const animationLevel = preferences?.animationLevel || 'full';

  return {
    animationLevel,
    isEnabled: animationLevel !== 'none',
    isReduced: animationLevel === 'reduced',
    isFull: animationLevel === 'full',
  };
}

// Hook pour le mode compact
export function useCompactMode() {
  const { preferences, actions } = usePreferencesContext();

  return {
    isCompact: preferences?.compactMode || false,
    setCompactMode: actions.setCompactMode,
  };
}

// Export groupé pour import simplifié
export { usePreferencesContext } from './context';
