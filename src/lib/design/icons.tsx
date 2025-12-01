'use client';

// Utilitaire côté client pour résoudre les icônes Lucide
// Ce fichier est séparé de tokens.ts pour éviter les problèmes de SSR

import type { LucideIcon } from 'lucide-react';
import {
  Crosshair,
  MapPin,
  Flame,
  Coins,
  Clock,
  Brain,
  Footprints,
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
} from 'lucide-react';
import type { AnalysisCategory } from '@/lib/preferences/types';

// Mapping des noms d'icônes vers les composants
const ICON_MAP: Record<string, LucideIcon> = {
  Crosshair,
  MapPin,
  Flame,
  Coins,
  Clock,
  Brain,
  Footprints,
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
};

// Icônes par catégorie
const CATEGORY_ICONS: Record<AnalysisCategory, LucideIcon> = {
  aim: Crosshair,
  positioning: MapPin,
  utility: Flame,
  economy: Coins,
  timing: Clock,
  decision: Brain,
  movement: Footprints,
  awareness: Eye,
  teamplay: Users,
};

/**
 * Résout un nom d'icône en composant Lucide
 */
export function getIconByName(name: string): LucideIcon {
  return ICON_MAP[name] || HelpCircle;
}

/**
 * Obtient l'icône d'une catégorie d'analyse
 */
export function getCategoryIcon(category: AnalysisCategory): LucideIcon {
  return CATEGORY_ICONS[category];
}

/**
 * Composant helper pour afficher une icône de catégorie
 */
export function CategoryIcon({
  category,
  className,
  size = 20,
}: {
  category: AnalysisCategory;
  className?: string;
  size?: number;
}) {
  const Icon = getCategoryIcon(category);
  return <Icon className={className} size={size} />;
}

/**
 * Icônes de tendance
 */
export const TrendIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  stable: Minus,
};

export function getTrendIcon(trend: 'positive' | 'negative' | 'stable'): LucideIcon {
  return TrendIcons[trend];
}
