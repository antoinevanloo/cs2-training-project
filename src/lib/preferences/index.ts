// Preferences module - Export tout pour un import simplifié

// Types
export type {
  UserPreferences,
  UserGoal,
  Theme,
  Language,
  AnimationLevel,
  ChartStyle,
  ColorScheme,
  NotificationChannel,
  QuickFilterPeriod,
  QuickFilterMode,
  GoalPriority,
  GoalSource,
  AnalysisCategory,
  CategoryWeights,
  MetricThreshold,
  MetricThresholds,
  DashboardWidget,
  SavedFilter,
  GoalProgressSnapshot,
  PreferencesActions,
  GoalsActions,
  PreferencesState,
  PreferencesContextValue,
} from './types';

// Constants
export {
  ANALYSIS_CATEGORIES,
  DEFAULT_PREFERENCES,
  DEFAULT_CATEGORY_WEIGHTS,
} from './types';

// Context
export { PreferencesProvider, usePreferencesContext } from './context';

// Hooks
export {
  usePreferences,
  useGoals,
  useActiveGoals,
  useGoalsByCategory,
  useTheme,
  useLanguage,
  useDisplayPreferences,
  useDashboardPreferences,
  useAnalysisPreferences,
  useNotificationPreferences,
  useFilters,
  useWeightedScore,
  useMetricThreshold,
  useAnimations,
  useCompactMode,
} from './hooks';
