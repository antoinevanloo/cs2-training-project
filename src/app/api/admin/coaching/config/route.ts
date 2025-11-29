import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/guard';
import {
  getThresholdsForAdmin,
  getRolesForAdmin,
  getMapsForAdmin,
  CoachingFeatures,
  setFeatures as setEngineFeatures,
  areFeaturesInitialized,
} from '@/lib/coaching/config';
import {
  loadFeaturesFromDB,
  saveFeaturesToDB,
  resetFeaturesToDB,
  loadThresholdsFromDB,
  updateMultipleThresholdsInDB,
  resetThresholdsToDB,
} from '@/lib/coaching/config/persistence';
import { CoachingThresholds } from '@/lib/coaching/config/thresholds';

// Cache pour les features (évite de recharger à chaque requête)
let featuresCache: CoachingFeatures | null = null;
let thresholdsCache: CoachingThresholds | null = null;

/**
 * Charge les features depuis le cache ou la DB
 * Synchronise aussi le cache du moteur de coaching
 */
async function getFeatures(): Promise<CoachingFeatures> {
  if (!featuresCache) {
    featuresCache = await loadFeaturesFromDB();
    // Synchroniser avec le moteur de coaching
    setEngineFeatures(featuresCache);
  }
  return featuresCache;
}

/**
 * Charge les thresholds depuis le cache ou la DB
 */
async function getThresholds(): Promise<CoachingThresholds> {
  if (!thresholdsCache) {
    thresholdsCache = await loadThresholdsFromDB();
  }
  return thresholdsCache;
}

/**
 * Convertit les thresholds en format admin (arrays)
 */
function formatThresholdsForAdmin(thresholds: CoachingThresholds) {
  return Object.entries(thresholds).map(([category, rules]) => ({
    category,
    rules: Object.entries(rules).map(([id, config]) => ({
      id,
      config,
    })),
  }));
}

/**
 * Convertit les features en format admin (arrays)
 */
function formatFeaturesForAdmin(features: CoachingFeatures) {
  return {
    global: Object.entries(features.global).map(([feature, config]) => ({
      feature,
      enabled: config.enabled,
      description: config.description,
    })),
    categories: Object.entries(features.categories).map(([category, config]) => ({
      category,
      enabled: config.enabled,
      rules: Object.entries(config.rules).map(([ruleId, ruleConfig]) => ({
        ruleId,
        enabled: ruleConfig.enabled,
        description: ruleConfig.description,
      })),
    })),
    display: features.display,
  };
}

/**
 * GET /api/admin/coaching/config
 *
 * Retourne la configuration complète du système de coaching pour l'admin
 */
export async function GET() {
  try {
    const admin = await requireAdminAPI();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const [features, thresholds] = await Promise.all([
      getFeatures(),
      getThresholds(),
    ]);

    const config = {
      thresholds: formatThresholdsForAdmin(thresholds),
      roles: getRolesForAdmin(),
      maps: getMapsForAdmin(),
      features: formatFeaturesForAdmin(features),
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching coaching config:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coaching/config
 *
 * Met à jour la configuration du système de coaching
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { action, payload } = body;

    // Charger les features actuelles
    let features = await getFeatures();

    switch (action) {
      case 'updateFeatures': {
        features = deepMerge(features, payload);
        break;
      }

      case 'disableRule': {
        const { category, ruleId, message } = payload;
        if (features.categories[category as keyof typeof features.categories]) {
          const cat = features.categories[category as keyof typeof features.categories];
          if (cat.rules[ruleId]) {
            cat.rules[ruleId].enabled = false;
            if (message) {
              cat.rules[ruleId].disabledMessage = message;
            }
          }
        }
        break;
      }

      case 'enableRule': {
        const { category, ruleId } = payload;
        if (features.categories[category as keyof typeof features.categories]) {
          const cat = features.categories[category as keyof typeof features.categories];
          if (cat.rules[ruleId]) {
            cat.rules[ruleId].enabled = true;
          }
        }
        break;
      }

      case 'disableCategory': {
        const { category } = payload;
        if (features.categories[category as keyof typeof features.categories]) {
          features.categories[category as keyof typeof features.categories].enabled = false;
        }
        break;
      }

      case 'enableCategory': {
        const { category } = payload;
        if (features.categories[category as keyof typeof features.categories]) {
          features.categories[category as keyof typeof features.categories].enabled = true;
        }
        break;
      }

      case 'reset': {
        features = await resetFeaturesToDB();
        featuresCache = features;
        setEngineFeatures(features);
        return NextResponse.json({
          success: true,
          message: 'Configuration réinitialisée',
          features: formatFeaturesForAdmin(features),
        });
      }

      // ============================================
      // Actions pour les seuils (thresholds)
      // ============================================

      case 'updateThresholds': {
        const { thresholds: thresholdUpdates } = payload;
        if (!thresholdUpdates || !Array.isArray(thresholdUpdates)) {
          return NextResponse.json(
            { error: 'Payload invalide: thresholds doit être un tableau' },
            { status: 400 }
          );
        }

        const updatedThresholds = await updateMultipleThresholdsInDB(thresholdUpdates);
        thresholdsCache = updatedThresholds;

        return NextResponse.json({
          success: true,
          message: `${thresholdUpdates.length} seuil(s) mis à jour`,
          thresholds: formatThresholdsForAdmin(updatedThresholds),
        });
      }

      case 'resetThresholds': {
        const resetThresholds = await resetThresholdsToDB();
        thresholdsCache = resetThresholds;

        return NextResponse.json({
          success: true,
          message: 'Seuils réinitialisés aux valeurs par défaut',
          thresholds: formatThresholdsForAdmin(resetThresholds),
        });
      }

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }

    // Sauvegarder en DB et synchroniser le moteur
    await saveFeaturesToDB(features);
    featuresCache = features;
    setEngineFeatures(features);

    const messages: Record<string, string> = {
      updateFeatures: 'Configuration mise à jour',
      disableRule: `Règle "${payload?.ruleId}" désactivée`,
      enableRule: `Règle "${payload?.ruleId}" activée`,
      disableCategory: `Catégorie "${payload?.category}" désactivée`,
      enableCategory: `Catégorie "${payload?.category}" activée`,
    };

    return NextResponse.json({
      success: true,
      message: messages[action] || 'Configuration mise à jour',
      features: formatFeaturesForAdmin(features),
    });
  } catch (error) {
    console.error('Error updating coaching config:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la configuration' },
      { status: 500 }
    );
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
