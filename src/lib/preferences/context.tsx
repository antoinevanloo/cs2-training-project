'use client';

import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import type { UserPreferences, UserGoal } from '@prisma/client';
import type {
  PreferencesContextValue,
  PreferencesState,
  PreferencesActions,
  GoalsActions,
  Theme,
  Language,
  AnimationLevel,
  ChartStyle,
  ColorScheme,
  NotificationChannel,
  QuickFilterPeriod,
  QuickFilterMode,
  CategoryWeights,
  MetricThresholds,
  DashboardWidget,
  SavedFilter,
  AnalysisCategory,
  GoalPriority,
  GoalSource,
} from './types';

// État initial
const initialState: PreferencesState = {
  preferences: null,
  goals: [],
  isLoading: true,
  error: null,
};

// Actions du reducer
type PreferencesAction =
  | { type: 'LOADING' }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_GOALS'; payload: UserGoal[] }
  | { type: 'ADD_GOAL'; payload: UserGoal }
  | { type: 'UPDATE_GOAL'; payload: UserGoal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };

// Reducer
function preferencesReducer(state: PreferencesState, action: PreferencesAction): PreferencesState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload, isLoading: false };
    case 'SET_GOALS':
      return { ...state, goals: action.payload, isLoading: false };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.payload.id ? action.payload : g)),
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };
    case 'ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Contexte
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Provider props
interface PreferencesProviderProps {
  children: React.ReactNode;
  initialPreferences?: UserPreferences;
  initialGoals?: UserGoal[];
}

// Provider
export function PreferencesProvider({
  children,
  initialPreferences,
  initialGoals,
}: PreferencesProviderProps) {
  const [state, dispatch] = useReducer(preferencesReducer, {
    ...initialState,
    preferences: initialPreferences || null,
    goals: initialGoals || [],
    isLoading: !initialPreferences,
  });

  // Fetch preferences on mount if not provided
  useEffect(() => {
    if (!initialPreferences) {
      fetchPreferences();
    }
    if (!initialGoals) {
      fetchGoals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API helpers
  const fetchPreferences = useCallback(async () => {
    try {
      dispatch({ type: 'LOADING' });
      const res = await fetch('/api/user/preferences');
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      dispatch({ type: 'SET_PREFERENCES', payload: data.data });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/user/goals');
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json();
      dispatch({ type: 'SET_GOALS', payload: data.data });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      const data = await res.json();
      dispatch({ type: 'SET_PREFERENCES', payload: data.data });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    }
  }, []);

  // Actions des préférences
  const actions: PreferencesActions = {
    // Display
    setTheme: async (theme: Theme) => {
      await updatePreferences({ theme });
    },
    setLanguage: async (language: Language) => {
      await updatePreferences({ language });
    },
    setCompactMode: async (compactMode: boolean) => {
      await updatePreferences({ compactMode });
    },
    setAnimationLevel: async (animationLevel: AnimationLevel) => {
      await updatePreferences({ animationLevel });
    },
    setChartStyle: async (chartStyle: ChartStyle) => {
      await updatePreferences({ chartStyle });
    },
    setColorScheme: async (colorScheme: ColorScheme) => {
      await updatePreferences({ colorScheme });
    },

    // Dashboard
    setDashboardLayout: async (layout: DashboardWidget[]) => {
      await updatePreferences({ dashboardLayout: layout as unknown as UserPreferences['dashboardLayout'] });
    },
    toggleWidget: async (widgetId: string) => {
      const currentHidden = state.preferences?.hiddenWidgets || [];
      const isHidden = currentHidden.includes(widgetId);
      const hiddenWidgets = isHidden
        ? currentHidden.filter((id) => id !== widgetId)
        : [...currentHidden, widgetId];
      await updatePreferences({ hiddenWidgets });
    },
    pinMetric: async (metricId: string) => {
      const currentPinned = state.preferences?.pinnedMetrics || [];
      if (!currentPinned.includes(metricId)) {
        await updatePreferences({ pinnedMetrics: [...currentPinned, metricId] });
      }
    },
    unpinMetric: async (metricId: string) => {
      const currentPinned = state.preferences?.pinnedMetrics || [];
      await updatePreferences({
        pinnedMetrics: currentPinned.filter((id) => id !== metricId),
      });
    },

    // Analysis
    setCategoryWeights: async (weights: CategoryWeights) => {
      await updatePreferences({ categoryWeights: weights as unknown as UserPreferences['categoryWeights'] });
    },
    setMetricThresholds: async (thresholds: MetricThresholds) => {
      await updatePreferences({ metricThresholds: thresholds as unknown as UserPreferences['metricThresholds'] });
    },
    setPriorityCategories: async (categories: AnalysisCategory[]) => {
      await updatePreferences({ priorityCategories: categories });
    },

    // Notifications
    setNotificationPreferences: async (prefs) => {
      await updatePreferences(prefs);
    },

    // Filters
    saveFilter: async (filter: Omit<SavedFilter, 'id'>) => {
      const rawFilters = state.preferences?.savedFilters;
      const currentFilters = (Array.isArray(rawFilters) ? rawFilters : []) as unknown as SavedFilter[];
      const newFilter: SavedFilter = {
        ...filter,
        id: `filter_${Date.now()}`,
      };
      await updatePreferences({
        savedFilters: [...currentFilters, newFilter] as unknown as UserPreferences['savedFilters'],
      });
    },
    deleteFilter: async (filterId: string) => {
      const rawFilters = state.preferences?.savedFilters;
      const currentFilters = (Array.isArray(rawFilters) ? rawFilters : []) as unknown as SavedFilter[];
      await updatePreferences({
        savedFilters: currentFilters.filter((f) => f.id !== filterId) as unknown as UserPreferences['savedFilters'],
      });
    },
    setDefaultFilters: async (filters: SavedFilter | null) => {
      await updatePreferences({
        defaultFilters: filters as unknown as UserPreferences['defaultFilters'],
      });
    },
    setQuickFilters: async (filters) => {
      await updatePreferences({
        ...(filters.map !== undefined && { quickFilterMap: filters.map }),
        ...(filters.period && { quickFilterPeriod: filters.period }),
        ...(filters.mode && { quickFilterMode: filters.mode }),
      });
    },

    // Bulk
    updatePreferences,
    resetPreferences: async () => {
      try {
        const res = await fetch('/api/user/preferences', { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to reset preferences');
        const data = await res.json();
        dispatch({ type: 'SET_PREFERENCES', payload: data.data });
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error as Error });
        throw error;
      }
    },
  };

  // Actions des objectifs
  const goalsActions: GoalsActions = {
    createGoal: async (goal: {
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
    }) => {
      try {
        const res = await fetch('/api/user/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...goal,
            deadline: goal.deadline?.toISOString(),
          }),
        });
        if (!res.ok) throw new Error('Failed to create goal');
        const data = await res.json();
        dispatch({ type: 'ADD_GOAL', payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error as Error });
        throw error;
      }
    },

    updateGoal: async (goalId: string, updates) => {
      try {
        const res = await fetch(`/api/user/goals?id=${goalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updates,
            deadline: updates.deadline?.toISOString() ?? updates.deadline,
          }),
        });
        if (!res.ok) throw new Error('Failed to update goal');
        const data = await res.json();
        dispatch({ type: 'UPDATE_GOAL', payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error as Error });
        throw error;
      }
    },

    deleteGoal: async (goalId: string) => {
      try {
        const res = await fetch(`/api/user/goals?id=${goalId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete goal');
        dispatch({ type: 'DELETE_GOAL', payload: goalId });
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error as Error });
        throw error;
      }
    },

    markGoalAchieved: async (goalId: string) => {
      try {
        const res = await fetch(`/api/user/goals?id=${goalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ achieved: true, progress: 100 }),
        });
        if (!res.ok) throw new Error('Failed to mark goal as achieved');
        const data = await res.json();
        dispatch({ type: 'UPDATE_GOAL', payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error as Error });
        throw error;
      }
    },

    updateGoalProgress: async (goalId: string, currentValue: number, _demoId?: string) => {
      try {
        const res = await fetch(`/api/user/goals?id=${goalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentValue }),
        });
        if (!res.ok) throw new Error('Failed to update goal progress');
        const data = await res.json();
        dispatch({ type: 'UPDATE_GOAL', payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error as Error });
        throw error;
      }
    },

    refreshGoals: fetchGoals,
  };

  const value: PreferencesContextValue = {
    ...state,
    actions,
    goalsActions,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

// Hook pour accéder au contexte
export function usePreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within a PreferencesProvider');
  }
  return context;
}
