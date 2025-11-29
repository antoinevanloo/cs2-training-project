/**
 * Service de persistance pour la configuration du coaching
 *
 * Stocke et récupère la configuration des features depuis la base de données
 */

import prisma from '@/lib/db/prisma';
import { CoachingFeatures, DEFAULT_FEATURES } from './features';
import { CoachingThresholds, DEFAULT_THRESHOLDS, ThresholdConfig } from './thresholds';

const COACHING_FEATURES_KEY = 'coaching_features';
const COACHING_THRESHOLDS_KEY = 'coaching_thresholds';

/**
 * Charge la configuration des features depuis la base de données
 * Retourne la configuration par défaut si non trouvée
 */
export async function loadFeaturesFromDB(): Promise<CoachingFeatures> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: COACHING_FEATURES_KEY },
    });

    if (config && config.value) {
      // Fusionner avec les défauts pour s'assurer que les nouvelles features sont incluses
      return deepMerge(DEFAULT_FEATURES, config.value as Partial<CoachingFeatures>);
    }

    return DEFAULT_FEATURES;
  } catch (error) {
    console.error('Error loading coaching features from DB:', error);
    return DEFAULT_FEATURES;
  }
}

/**
 * Sauvegarde la configuration des features dans la base de données
 */
export async function saveFeaturesToDB(features: CoachingFeatures): Promise<void> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: COACHING_FEATURES_KEY },
      update: {
        value: JSON.parse(JSON.stringify(features)),
        updatedAt: new Date(),
      },
      create: {
        key: COACHING_FEATURES_KEY,
        value: JSON.parse(JSON.stringify(features)),
      },
    });
  } catch (error) {
    console.error('Error saving coaching features to DB:', error);
    throw error;
  }
}

/**
 * Réinitialise la configuration aux valeurs par défaut dans la base de données
 */
export async function resetFeaturesToDB(): Promise<CoachingFeatures> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: COACHING_FEATURES_KEY },
      update: {
        value: JSON.parse(JSON.stringify(DEFAULT_FEATURES)),
        updatedAt: new Date(),
      },
      create: {
        key: COACHING_FEATURES_KEY,
        value: JSON.parse(JSON.stringify(DEFAULT_FEATURES)),
      },
    });

    return DEFAULT_FEATURES;
  } catch (error) {
    console.error('Error resetting coaching features in DB:', error);
    throw error;
  }
}

/**
 * Helper pour deep merge
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          target[key] as object,
          source[key] as object
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

// ============================================================
// Persistance des seuils (thresholds)
// ============================================================

/**
 * Charge les seuils depuis la base de données
 * Retourne les seuils par défaut si non trouvés
 */
export async function loadThresholdsFromDB(): Promise<CoachingThresholds> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: COACHING_THRESHOLDS_KEY },
    });

    if (config && config.value) {
      // Fusionner avec les défauts pour s'assurer que les nouveaux seuils sont inclus
      return deepMerge(DEFAULT_THRESHOLDS, config.value as Partial<CoachingThresholds>);
    }

    return DEFAULT_THRESHOLDS;
  } catch (error) {
    console.error('Error loading coaching thresholds from DB:', error);
    return DEFAULT_THRESHOLDS;
  }
}

/**
 * Sauvegarde les seuils dans la base de données
 */
export async function saveThresholdsToDB(thresholds: CoachingThresholds): Promise<void> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: COACHING_THRESHOLDS_KEY },
      update: {
        value: JSON.parse(JSON.stringify(thresholds)),
        updatedAt: new Date(),
      },
      create: {
        key: COACHING_THRESHOLDS_KEY,
        value: JSON.parse(JSON.stringify(thresholds)),
      },
    });
  } catch (error) {
    console.error('Error saving coaching thresholds to DB:', error);
    throw error;
  }
}

/**
 * Réinitialise les seuils aux valeurs par défaut dans la base de données
 */
export async function resetThresholdsToDB(): Promise<CoachingThresholds> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: COACHING_THRESHOLDS_KEY },
      update: {
        value: JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
        updatedAt: new Date(),
      },
      create: {
        key: COACHING_THRESHOLDS_KEY,
        value: JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
      },
    });

    return DEFAULT_THRESHOLDS;
  } catch (error) {
    console.error('Error resetting coaching thresholds in DB:', error);
    throw error;
  }
}

/**
 * Met à jour un seuil spécifique
 */
export async function updateThresholdInDB(
  category: keyof CoachingThresholds,
  ruleId: string,
  updates: Partial<ThresholdConfig>
): Promise<CoachingThresholds> {
  const current = await loadThresholdsFromDB();

  if (current[category] && current[category][ruleId]) {
    current[category][ruleId] = {
      ...current[category][ruleId],
      ...updates,
    };
    await saveThresholdsToDB(current);
  }

  return current;
}

/**
 * Met à jour plusieurs seuils en une fois
 */
export async function updateMultipleThresholdsInDB(
  updates: Array<{
    category: string;
    ruleId: string;
    value?: number;
    priority?: 1 | 2 | 3 | 4;
    comparison?: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
  }>
): Promise<CoachingThresholds> {
  const current = await loadThresholdsFromDB();

  for (const update of updates) {
    const category = update.category as keyof CoachingThresholds;
    if (current[category] && current[category][update.ruleId]) {
      if (update.value !== undefined) {
        current[category][update.ruleId].value = update.value;
      }
      if (update.priority !== undefined) {
        current[category][update.ruleId].priority = update.priority;
      }
      if (update.comparison !== undefined) {
        current[category][update.ruleId].comparison = update.comparison;
      }
    }
  }

  await saveThresholdsToDB(current);
  return current;
}
