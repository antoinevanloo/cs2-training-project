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
  overallScore?: number;
}

interface ScoreCalculatorOptions {
  /** Liste des IDs de features d'analyse activées */
  enabledAnalyzers: string[];
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
};

// ============================================
// CALCUL DES POIDS AJUSTÉS
// ============================================

/**
 * Calcule les poids ajustés en fonction des analyseurs activés
 * Les poids des analyseurs désactivés sont redistribués aux autres
 */
export function getAdjustedWeights(
  enabledAnalyzers: string[]
): Record<string, number> {
  if (enabledAnalyzers.length === 0) {
    return {};
  }

  // Calcul du poids total des analyseurs désactivés
  let disabledWeight = 0;
  for (const [featureId, weight] of Object.entries(ANALYSIS_WEIGHTS)) {
    if (!enabledAnalyzers.includes(featureId)) {
      disabledWeight += weight;
    }
  }

  // Redistribution proportionnelle
  const adjustedWeights: Record<string, number> = {};
  const enabledCount = enabledAnalyzers.length;

  if (enabledCount > 0) {
    const redistribution = disabledWeight / enabledCount;

    for (const featureId of enabledAnalyzers) {
      if (ANALYSIS_WEIGHTS[featureId] !== undefined) {
        adjustedWeights[featureId] = ANALYSIS_WEIGHTS[featureId] + redistribution;
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
 */
export function calculateOverallScore(
  scores: AnalysisScores,
  options: ScoreCalculatorOptions
): number {
  const { enabledAnalyzers } = options;

  if (enabledAnalyzers.length === 0) {
    return 0;
  }

  const adjustedWeights = getAdjustedWeights(enabledAnalyzers);

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
 */
export function recalculateAnalysisScores(
  originalScores: AnalysisScores,
  enabledAnalyzers: string[]
): AnalysisScores {
  const result: AnalysisScores = {};

  // Copier uniquement les scores des analyseurs activés
  for (const featureId of enabledAnalyzers) {
    const scoreKey = FEATURE_TO_SCORE_KEY[featureId];
    if (scoreKey && originalScores[scoreKey] !== undefined) {
      result[scoreKey] = originalScores[scoreKey];
    }
  }

  // Recalculer le score global
  result.overallScore = calculateOverallScore(originalScores, { enabledAnalyzers });

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