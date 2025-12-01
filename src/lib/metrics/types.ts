/**
 * Types partagés pour le système de métriques
 */

// Niveaux de granularité des données
export type GranularityLevel = 'global' | 'map' | 'demo' | 'round';

// Catégories de métriques
export type MetricCategory =
  | 'performance'
  | 'aim'
  | 'positioning'
  | 'utility'
  | 'economy'
  | 'timing'
  | 'decision';

// Format d'affichage des métriques
export type MetricFormat = 'decimal' | 'percentage' | 'integer' | 'ratio' | 'time';

// Seuils d'interprétation
export interface InterpretationThreshold {
  max: number;
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  description: string;
}

// Définition complète d'une métrique
export interface MetricDefinition {
  id: string;
  name: string;
  shortName: string;
  category: MetricCategory;

  // Explication
  description: string;
  detailedDescription?: string;
  formula?: string;
  formulaExplanation?: string;

  // Comment interpréter les valeurs
  interpretation: InterpretationThreshold[];

  // À quelle échelle cette métrique peut être calculée
  availableGranularities: GranularityLevel[];
  defaultGranularity: GranularityLevel;

  // Comment cette métrique est agrégée
  aggregationMethod?: 'average' | 'sum' | 'weighted' | 'last';

  // Formatage
  format: MetricFormat;
  unit?: string;
  decimals?: number;

  // Liens vers d'autres ressources
  learnMoreUrl?: string;

  // Feature flag (si la métrique dépend d'une feature)
  featureFlag?: string;
}
