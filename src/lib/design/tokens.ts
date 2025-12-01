// Design System Tokens - CS2 Coach v2
// Style gaming/esport avec 9 catégories d'analyse

import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// COULEURS DES CATÉGORIES
// ============================================

export interface CategoryStyle {
  color: string;           // Couleur principale (hex)
  colorRgb: string;        // RGB pour opacity
  colorHsl: string;        // HSL pour variations
  iconName: string;        // Nom de l'icône Lucide (pour résolution côté client)
  gradient: string;        // Tailwind gradient
  gradientHover: string;   // Gradient au hover
  bgLight: string;         // Background light mode
  bgDark: string;          // Background dark mode
  label: string;           // Label français
  labelEn: string;         // Label anglais
  description: string;     // Description courte
}

export const CATEGORY_STYLES: Record<AnalysisCategory, CategoryStyle> = {
  aim: {
    color: '#ef4444',
    colorRgb: '239, 68, 68',
    colorHsl: '0, 84%, 60%',
    iconName: 'Crosshair',
    gradient: 'from-red-500 to-orange-500',
    gradientHover: 'from-red-400 to-orange-400',
    bgLight: 'bg-red-50',
    bgDark: 'bg-red-950/30',
    label: 'Aim',
    labelEn: 'Aim',
    description: 'Précision, headshots, spray control',
  },
  positioning: {
    color: '#3b82f6',
    colorRgb: '59, 130, 246',
    colorHsl: '217, 91%, 60%',
    iconName: 'MapPin',
    gradient: 'from-blue-500 to-cyan-500',
    gradientHover: 'from-blue-400 to-cyan-400',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-950/30',
    label: 'Positionnement',
    labelEn: 'Positioning',
    description: 'Contrôle de map, angles, rotations',
  },
  utility: {
    color: '#22c55e',
    colorRgb: '34, 197, 94',
    colorHsl: '142, 71%, 45%',
    iconName: 'Flame',
    gradient: 'from-green-500 to-emerald-500',
    gradientHover: 'from-green-400 to-emerald-400',
    bgLight: 'bg-green-50',
    bgDark: 'bg-green-950/30',
    label: 'Utilitaires',
    labelEn: 'Utility',
    description: 'Flashs, smokes, molotovs, HE',
  },
  economy: {
    color: '#eab308',
    colorRgb: '234, 179, 8',
    colorHsl: '45, 93%, 47%',
    iconName: 'Coins',
    gradient: 'from-yellow-500 to-amber-500',
    gradientHover: 'from-yellow-400 to-amber-400',
    bgLight: 'bg-yellow-50',
    bgDark: 'bg-yellow-950/30',
    label: 'Économie',
    labelEn: 'Economy',
    description: 'Gestion argent, buy decisions',
  },
  timing: {
    color: '#a855f7',
    colorRgb: '168, 85, 247',
    colorHsl: '271, 91%, 65%',
    iconName: 'Clock',
    gradient: 'from-purple-500 to-violet-500',
    gradientHover: 'from-purple-400 to-violet-400',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-950/30',
    label: 'Timing',
    labelEn: 'Timing',
    description: 'Peeks, trades, rotations',
  },
  decision: {
    color: '#ec4899',
    colorRgb: '236, 72, 153',
    colorHsl: '330, 81%, 60%',
    iconName: 'Brain',
    gradient: 'from-pink-500 to-rose-500',
    gradientHover: 'from-pink-400 to-rose-400',
    bgLight: 'bg-pink-50',
    bgDark: 'bg-pink-950/30',
    label: 'Décisions',
    labelEn: 'Decision',
    description: 'Clutchs, retakes, agressivité',
  },
  movement: {
    color: '#06b6d4',
    colorRgb: '6, 182, 212',
    colorHsl: '189, 94%, 43%',
    iconName: 'Footprints',
    gradient: 'from-cyan-500 to-teal-500',
    gradientHover: 'from-cyan-400 to-teal-400',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-950/30',
    label: 'Mouvement',
    labelEn: 'Movement',
    description: 'Counter-strafe, crouch, scope',
  },
  awareness: {
    color: '#f97316',
    colorRgb: '249, 115, 22',
    colorHsl: '25, 95%, 53%',
    iconName: 'Eye',
    gradient: 'from-orange-500 to-red-500',
    gradientHover: 'from-orange-400 to-red-400',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-950/30',
    label: 'Conscience',
    labelEn: 'Awareness',
    description: 'Bombe, flashs, info gathering',
  },
  teamplay: {
    color: '#8b5cf6',
    colorRgb: '139, 92, 246',
    colorHsl: '258, 90%, 66%',
    iconName: 'Users',
    gradient: 'from-violet-500 to-purple-500',
    gradientHover: 'from-violet-400 to-purple-400',
    bgLight: 'bg-violet-50',
    bgDark: 'bg-violet-950/30',
    label: 'Jeu d\'équipe',
    labelEn: 'Teamplay',
    description: 'Trades, support, coordination',
  },
};

// Ordre d'affichage par défaut des catégories
export const CATEGORY_ORDER: AnalysisCategory[] = [
  'aim',
  'positioning',
  'movement',
  'utility',
  'economy',
  'timing',
  'decision',
  'awareness',
  'teamplay',
];

// ============================================
// COULEURS DES SCORES
// ============================================

export interface ScoreLevelStyle {
  level: 'poor' | 'average' | 'good' | 'excellent';
  color: string;
  colorRgb: string;
  bgLight: string;
  bgDark: string;
  label: string;
  labelEn: string;
  minScore: number;
  maxScore: number;
}

export const SCORE_LEVELS: ScoreLevelStyle[] = [
  {
    level: 'poor',
    color: '#ef4444',
    colorRgb: '239, 68, 68',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-900/30',
    label: 'Faible',
    labelEn: 'Poor',
    minScore: 0,
    maxScore: 40,
  },
  {
    level: 'average',
    color: '#f59e0b',
    colorRgb: '245, 158, 11',
    bgLight: 'bg-amber-100',
    bgDark: 'bg-amber-900/30',
    label: 'Moyen',
    labelEn: 'Average',
    minScore: 40,
    maxScore: 60,
  },
  {
    level: 'good',
    color: '#22c55e',
    colorRgb: '34, 197, 94',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-900/30',
    label: 'Bon',
    labelEn: 'Good',
    minScore: 60,
    maxScore: 80,
  },
  {
    level: 'excellent',
    color: '#3b82f6',
    colorRgb: '59, 130, 246',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-900/30',
    label: 'Excellent',
    labelEn: 'Excellent',
    minScore: 80,
    maxScore: 100,
  },
];

// Fonction helper pour obtenir le niveau de score
export function getScoreLevel(score: number): ScoreLevelStyle {
  for (const level of SCORE_LEVELS) {
    if (score >= level.minScore && score < level.maxScore) {
      return level;
    }
  }
  return SCORE_LEVELS[SCORE_LEVELS.length - 1]; // Excellent par défaut si >= 100
}

// Fonction helper pour obtenir la couleur d'un score
export function getScoreColor(score: number): string {
  return getScoreLevel(score).color;
}

// ============================================
// COULEURS DES TENDANCES
// ============================================

export const TREND_COLORS = {
  positive: {
    color: '#22c55e',
    colorRgb: '34, 197, 94',
    iconName: 'TrendingUp',
    label: 'Amélioration',
    labelEn: 'Improving',
  },
  negative: {
    color: '#ef4444',
    colorRgb: '239, 68, 68',
    iconName: 'TrendingDown',
    label: 'Régression',
    labelEn: 'Declining',
  },
  stable: {
    color: '#6b7280',
    colorRgb: '107, 114, 128',
    iconName: 'Minus',
    label: 'Stable',
    labelEn: 'Stable',
  },
};

// ============================================
// TOKENS D'ANIMATION
// ============================================

export const ANIMATION_TOKENS = {
  // Durées
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    verySlow: '1000ms',
  },
  // Easings
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    gaming: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  // Keyframes pour glow effect
  glow: {
    pulse: '0 0 20px rgba(var(--glow-color), 0.5)',
    intense: '0 0 30px rgba(var(--glow-color), 0.7), 0 0 60px rgba(var(--glow-color), 0.3)',
  },
};

// ============================================
// TOKENS DE SPACING
// ============================================

export const SPACING_TOKENS = {
  // Cards
  card: {
    padding: 'p-4',
    paddingCompact: 'p-2',
    paddingLarge: 'p-6',
    gap: 'gap-4',
    gapCompact: 'gap-2',
  },
  // Grid
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-2',
    cols3: 'grid-cols-3',
    cols9: 'grid-cols-3 lg:grid-cols-9',
  },
};

// ============================================
// CHARTS CONFIG
// ============================================

export const CHART_COLORS = {
  // Couleurs pour recharts
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  tertiary: '#22c55e',
  quaternary: '#f59e0b',
  background: {
    light: '#f8fafc',
    dark: '#1e293b',
  },
  grid: {
    light: '#e2e8f0',
    dark: '#334155',
  },
  text: {
    light: '#64748b',
    dark: '#94a3b8',
  },
};

// Radar chart specific config
export const RADAR_CONFIG = {
  // Angles pour 9 catégories
  startAngle: 90,
  endAngle: -270,
  // Taille
  outerRadius: '80%',
  // Animation
  animationDuration: 1000,
  animationEasing: 'ease-out',
};

// ============================================
// HELPERS
// ============================================

// Obtenir le style d'une catégorie
export function getCategoryStyle(category: AnalysisCategory): CategoryStyle {
  return CATEGORY_STYLES[category];
}

// Obtenir la couleur d'une catégorie
export function getCategoryColor(category: AnalysisCategory): string {
  return CATEGORY_STYLES[category].color;
}

// Obtenir le nom de l'icône d'une catégorie (string)
export function getCategoryIconName(category: AnalysisCategory): string {
  return CATEGORY_STYLES[category].iconName;
}

// Obtenir le label d'une catégorie (avec support langue)
export function getCategoryLabel(category: AnalysisCategory, lang: 'fr' | 'en' = 'fr'): string {
  const style = CATEGORY_STYLES[category];
  return lang === 'en' ? style.labelEn : style.label;
}

// Générer le style CSS pour une catégorie
export function getCategoryGlow(category: AnalysisCategory): string {
  const { colorRgb } = CATEGORY_STYLES[category];
  return `0 0 20px rgba(${colorRgb}, 0.5)`;
}

// Créer une palette de couleurs pour les charts
export function getCategoryPalette(): string[] {
  return CATEGORY_ORDER.map((cat) => CATEGORY_STYLES[cat].color);
}

// Générer le style d'un score badge
export function getScoreBadgeStyle(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  const level = getScoreLevel(score);
  return {
    bg: `bg-[${level.color}]/10`,
    text: `text-[${level.color}]`,
    border: `border-[${level.color}]/30`,
  };
}
