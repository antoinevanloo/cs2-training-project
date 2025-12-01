/**
 * Calculateur de scores avec support des Feature Flags
 *
 * Ce module recalcule les scores en tenant compte
 * des analyseurs activés/désactivés par l'utilisateur.
 */

import { ANALYSIS_WEIGHTS, ANALYSIS_FEATURE_IDS } from './config';

// ============================================
// TYPES
// ============================================

interface AnalysisScores {
  aimScore?: number;
  positioningScore?: number;
  utilityScore?: number;
  economyScore?: number;
  timingScore?: number;
  decisionScore?: number;
  movementScore?: number;
  awarenessScore?: number;
  teamplayScore?: number;
  overallScore?: number;
}

interface ScoreCalculatorOptions {
  /** Liste des IDs de features d'analyse activées */
  enabledAnalyzers: string[];
  /** Poids personnalisés de l'utilisateur (optionnel) */
  customWeights?: Record<string, number>;
}

// Type pour les poids de catégorie utilisateur
export type CategoryWeights = {
  aim: number;
  positioning: number;
  utility: number;
  economy: number;
  timing: number;
  decision: number;
  movement: number;
  awareness: number;
  teamplay: number;
};

// Mapping de category vers featureId
const CATEGORY_TO_FEATURE: Record<keyof CategoryWeights, string> = {
  aim: 'analysis.aim',
  positioning: 'analysis.positioning',
  utility: 'analysis.utility',
  economy: 'analysis.economy',
  timing: 'analysis.timing',
  decision: 'analysis.decision',
  movement: 'analysis.movement',
  awareness: 'analysis.awareness',
  teamplay: 'analysis.teamplay',
};

/**
 * Convertit les poids utilisateur (par catégorie) en poids par featureId
 */
export function convertUserWeightsToFeatureWeights(
  categoryWeights: CategoryWeights
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [category, featureId] of Object.entries(CATEGORY_TO_FEATURE)) {
    result[featureId] = categoryWeights[category as keyof CategoryWeights] / 100;
  }
  return result;
}

// ============================================
// MAPPING FEATURE -> SCORE
// ============================================

const FEATURE_TO_SCORE_KEY: Record<string, keyof AnalysisScores> = {
  'analysis.aim': 'aimScore',
  'analysis.positioning': 'positioningScore',
  'analysis.utility': 'utilityScore',
  'analysis.economy': 'economyScore',
  'analysis.timing': 'timingScore',
  'analysis.decision': 'decisionScore',
  'analysis.movement': 'movementScore',
  'analysis.awareness': 'awarenessScore',
  'analysis.teamplay': 'teamplayScore',
};

// ============================================
// CALCUL DES POIDS AJUSTÉS
// ============================================

/**
 * Calcule les poids ajustés en fonction des analyseurs activés
 * Les poids des analyseurs désactivés sont redistribués aux autres
 * Supporte les poids personnalisés de l'utilisateur
 */
export function getAdjustedWeights(
  enabledAnalyzers: string[],
  customWeights?: Record<string, number>
): Record<string, number> {
  if (enabledAnalyzers.length === 0) {
    return {};
  }

  // Utiliser les poids personnalisés si fournis, sinon les poids par défaut
  const baseWeights = customWeights || ANALYSIS_WEIGHTS;

  // Calcul du poids total des analyseurs désactivés
  let disabledWeight = 0;
  let enabledTotalWeight = 0;

  for (const [featureId, weight] of Object.entries(baseWeights)) {
    if (!enabledAnalyzers.includes(featureId)) {
      disabledWeight += weight;
    } else {
      enabledTotalWeight += weight;
    }
  }

  // Redistribution proportionnelle
  const adjustedWeights: Record<string, number> = {};

  if (enabledTotalWeight > 0) {
    // Redistribuer le poids des désactivés proportionnellement aux poids des activés
    for (const featureId of enabledAnalyzers) {
      const originalWeight = baseWeights[featureId];
      if (originalWeight !== undefined) {
        // Redistribution proportionnelle au poids original
        const proportion = originalWeight / enabledTotalWeight;
        const additionalWeight = disabledWeight * proportion;
        adjustedWeights[featureId] = originalWeight + additionalWeight;
      }
    }
  }

  return adjustedWeights;
}

// ============================================
// CALCUL DU SCORE GLOBAL
// ============================================

/**
 * Calcule le score global en tenant compte des analyseurs activés
 * et des poids personnalisés de l'utilisateur
 */
export function calculateOverallScore(
  scores: AnalysisScores,
  options: ScoreCalculatorOptions
): number {
  const { enabledAnalyzers, customWeights } = options;

  if (enabledAnalyzers.length === 0) {
    return 0;
  }

  const adjustedWeights = getAdjustedWeights(enabledAnalyzers, customWeights);

  let totalScore = 0;
  let totalWeight = 0;

  for (const [featureId, weight] of Object.entries(adjustedWeights)) {
    const scoreKey = FEATURE_TO_SCORE_KEY[featureId];
    if (scoreKey && scores[scoreKey] !== undefined) {
      totalScore += (scores[scoreKey] as number) * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(totalScore / totalWeight);
}

/**
 * Recalcule tous les scores d'une analyse en fonction des features
 * et des poids personnalisés de l'utilisateur
 */
export function recalculateAnalysisScores(
  originalScores: AnalysisScores,
  enabledAnalyzers: string[],
  customWeights?: Record<string, number>
): AnalysisScores {
  const result: AnalysisScores = {};

  // Copier uniquement les scores des analyseurs activés
  for (const featureId of enabledAnalyzers) {
    const scoreKey = FEATURE_TO_SCORE_KEY[featureId];
    if (scoreKey && originalScores[scoreKey] !== undefined) {
      result[scoreKey] = originalScores[scoreKey];
    }
  }

  // Recalculer le score global avec les poids personnalisés
  result.overallScore = calculateOverallScore(originalScores, {
    enabledAnalyzers,
    customWeights,
  });

  return result;
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Vérifie si un score spécifique doit être affiché
 */
export function shouldShowScore(
  scoreKey: keyof AnalysisScores,
  enabledAnalyzers: string[]
): boolean {
  if (scoreKey === 'overallScore') {
    return enabledAnalyzers.length > 0;
  }

  for (const [featureId, key] of Object.entries(FEATURE_TO_SCORE_KEY)) {
    if (key === scoreKey) {
      return enabledAnalyzers.includes(featureId);
    }
  }

  return false;
}

/**
 * Génère un résumé des poids utilisés
 */
export function getWeightsSummary(enabledAnalyzers: string[]): Array<{
  featureId: string;
  name: string;
  originalWeight: number;
  adjustedWeight: number;
  isEnabled: boolean;
}> {
  const adjustedWeights = getAdjustedWeights(enabledAnalyzers);

  const names: Record<string, string> = {
    'analysis.aim': 'Aim',
    'analysis.positioning': 'Positionnement',
    'analysis.utility': 'Utilitaires',
    'analysis.economy': 'Économie',
    'analysis.timing': 'Timing',
    'analysis.decision': 'Décisions',
    'analysis.movement': 'Mouvement',
    'analysis.awareness': 'Conscience',
    'analysis.teamplay': 'Jeu d\'équipe',
  };

  return ANALYSIS_FEATURE_IDS.map((featureId) => ({
    featureId,
    name: names[featureId] || featureId,
    originalWeight: ANALYSIS_WEIGHTS[featureId] || 0,
    adjustedWeight: adjustedWeights[featureId] || 0,
    isEnabled: enabledAnalyzers.includes(featureId),
  }));
}

/**
 * Calcule l'impact d'activer/désactiver un analyseur sur le score global
 */
export function calculateScoreImpact(
  scores: AnalysisScores,
  currentAnalyzers: string[],
  analyzerToToggle: string
): {
  currentScore: number;
  newScore: number;
  difference: number;
} {
  const currentScore = calculateOverallScore(scores, {
    enabledAnalyzers: currentAnalyzers,
  });

  const isCurrentlyEnabled = currentAnalyzers.includes(analyzerToToggle);
  const newAnalyzers = isCurrentlyEnabled
    ? currentAnalyzers.filter((a) => a !== analyzerToToggle)
    : [...currentAnalyzers, analyzerToToggle];

  const newScore = calculateOverallScore(scores, {
    enabledAnalyzers: newAnalyzers,
  });

  return {
    currentScore,
    newScore,
    difference: newScore - currentScore,
  };
}