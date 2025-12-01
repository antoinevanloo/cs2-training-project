// Design System - Export tout
// NOTE: Les icônes sont dans un fichier séparé (icons.tsx) marqué 'use client'
// Importez-les directement avec: import { getCategoryIcon } from '@/lib/design/icons';

export {
  // Types
  type CategoryStyle,
  type ScoreLevelStyle,

  // Category styles
  CATEGORY_STYLES,
  CATEGORY_ORDER,

  // Score levels
  SCORE_LEVELS,
  getScoreLevel,
  getScoreColor,

  // Trends
  TREND_COLORS,

  // Animation
  ANIMATION_TOKENS,

  // Spacing
  SPACING_TOKENS,

  // Charts
  CHART_COLORS,
  RADAR_CONFIG,

  // Helpers
  getCategoryStyle,
  getCategoryColor,
  getCategoryIconName,
  getCategoryLabel,
  getCategoryGlow,
  getCategoryPalette,
  getScoreBadgeStyle,
} from './tokens';
