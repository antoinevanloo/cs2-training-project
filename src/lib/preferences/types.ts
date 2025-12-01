// Types pour le système de préférences utilisateur

import type { UserPreferences, UserGoal } from '@prisma/client';

// Re-export des types Prisma
export type { UserPreferences, UserGoal };

// Types pour les valeurs des enums/options
export type Theme = 'dark' | 'light' | 'system' | 'gaming';
export type Language = 'fr' | 'en';
export type AnimationLevel = 'full' | 'reduced' | 'none';
export type ChartStyle = 'filled' | 'line' | 'both';
export type ColorScheme = 'default' | 'colorblind' | 'highContrast';
export type NotificationChannel = 'inapp' | 'email' | 'discord';
export type QuickFilterPeriod = '7d' | '30d' | '90d' | 'all';
export type QuickFilterMode = 'ranked' | 'casual' | 'all';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalSource = 'analysis' | 'coaching' | 'manual';

// Catégories d'analyse (9 catégories v2)
export type AnalysisCategory =
  | 'aim'
  | 'positioning'
  | 'utility'
  | 'economy'
  | 'timing'
  | 'decision'
  | 'movement'
  | 'awareness'
  | 'teamplay';

export const ANALYSIS_CATEGORIES: AnalysisCategory[] = [
  'aim',
  'positioning',
  'utility',
  'economy',
  'timing',
  'decision',
  'movement',
  'awareness',
  'teamplay',
];

// Poids des catégories pour le calcul du score global
export interface CategoryWeights {
  aim: number;
  positioning: number;
  utility: number;
  economy: number;
  timing: number;
  decision: number;
  movement: number;
  awareness: number;
  teamplay: number;
}

// Seuils personnalisés pour une métrique
export interface MetricThreshold {
  poor: number;
  average: number;
  good: number;
  excellent: number;
}

// Configuration des seuils par métrique
export type MetricThresholds = Record<string, MetricThreshold>;

// Widget du dashboard
export interface DashboardWidget {
  id: string;
  type: 'scoreCard' | 'radar' | 'timeline' | 'quickInsights' | 'recentDemos' | 'goals';
  position: number;
  config?: Record<string, unknown>;
}

// Filtre sauvegardé
export interface SavedFilter {
  id: string;
  name: string;
  maps?: string[];
  period?: QuickFilterPeriod;
  mode?: QuickFilterMode;
  categories?: AnalysisCategory[];
  dateFrom?: string;
  dateTo?: string;
}

// Snapshot de progression d'un objectif
export interface GoalProgressSnapshot {
  date: string;
  value: number;
  demoId?: string;
}

// Préférences par défaut (pour création uniquement, pas pour Prisma direct)
export const DEFAULT_PREFERENCES_VALUES = {
  theme: 'dark' as const,
  language: 'fr' as const,
  compactMode: false,
  animationLevel: 'full' as const,
  chartStyle: 'filled' as const,
  colorScheme: 'default' as const,
  dashboardLayout: [] as DashboardWidget[],
  hiddenWidgets: [] as string[],
  pinnedMetrics: [] as string[],
  categoryWeights: undefined,
  metricThresholds: undefined,
  priorityCategories: [] as string[],
  alertOnRegression: true,
  alertOnGoalReached: true,
  alertOnPersonalBest: true,
  weeklyReport: true,
  notificationChannel: 'inapp' as const,
  savedFilters: [] as SavedFilter[],
  defaultFilters: undefined,
  quickFilterMap: undefined,
  quickFilterPeriod: '30d' as const,
  quickFilterMode: 'all' as const,
};

// Pour compatibilité
export const DEFAULT_PREFERENCES = DEFAULT_PREFERENCES_VALUES;

// Poids par défaut des catégories (égaux)
export const DEFAULT_CATEGORY_WEIGHTS: CategoryWeights = {
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

// Actions disponibles sur les préférences
export interface PreferencesActions {
  // Display
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setCompactMode: (compact: boolean) => Promise<void>;
  setAnimationLevel: (level: AnimationLevel) => Promise<void>;
  setChartStyle: (style: ChartStyle) => Promise<void>;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;

  // Dashboard
  setDashboardLayout: (layout: DashboardWidget[]) => Promise<void>;
  toggleWidget: (widgetId: string) => Promise<void>;
  pinMetric: (metricId: string) => Promise<void>;
  unpinMetric: (metricId: string) => Promise<void>;

  // Analysis
  setCategoryWeights: (weights: CategoryWeights) => Promise<void>;
  setMetricThresholds: (thresholds: MetricThresholds) => Promise<void>;
  setPriorityCategories: (categories: AnalysisCategory[]) => Promise<void>;

  // Notifications
  setNotificationPreferences: (prefs: {
    alertOnRegression?: boolean;
    alertOnGoalReached?: boolean;
    alertOnPersonalBest?: boolean;
    weeklyReport?: boolean;
    notificationChannel?: NotificationChannel;
  }) => Promise<void>;

  // Filters
  saveFilter: (filter: Omit<SavedFilter, 'id'>) => Promise<void>;
  deleteFilter: (filterId: string) => Promise<void>;
  setDefaultFilters: (filters: SavedFilter | null) => Promise<void>;
  setQuickFilters: (filters: {
    map?: string | null;
    period?: QuickFilterPeriod;
    mode?: QuickFilterMode;
  }) => Promise<void>;

  // Bulk update
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

// Actions sur les objectifs
export interface GoalsActions {
  createGoal: (goal: {
    metric: string;
    category: AnalysisCategory;
    name?: string;
    description?: string;
    startValue: number;
    targetValue: number;
    priority?: GoalPriority;
    deadline?: Date;
    suggestedFrom?: GoalSource;
    sourceId?: string;
  }) => Promise<UserGoal>;

  updateGoal: (goalId: string, updates: {
    name?: string;
    description?: string;
    targetValue?: number;
    priority?: GoalPriority;
    deadline?: Date | null;
  }) => Promise<UserGoal>;

  deleteGoal: (goalId: string) => Promise<void>;

  markGoalAchieved: (goalId: string) => Promise<UserGoal>;

  updateGoalProgress: (goalId: string, currentValue: number, demoId?: string) => Promise<UserGoal>;

  refreshGoals: () => Promise<void>;
}

// État du contexte des préférences
export interface PreferencesState {
  preferences: UserPreferences | null;
  goals: UserGoal[];
  isLoading: boolean;
  error: Error | null;
}

// Contexte complet
export interface PreferencesContextValue extends PreferencesState {
  actions: PreferencesActions;
  goalsActions: GoalsActions;
}
