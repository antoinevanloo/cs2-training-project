import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { FEATURE_DEFINITIONS, getFeature } from '@/lib/features/config';
import { checkFeatureAccess, createDefaultContext } from '@/lib/features/access';
import { FeatureContext, UserFeaturePreferences } from '@/lib/features/types';

// ============================================
// GET /api/features
// Récupère toutes les features avec leur état pour l'utilisateur
// ============================================

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer l'utilisateur complet avec ses préférences
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        featurePreferences: true,
        featureOverrides: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Construire le contexte
    const context: FeatureContext = {
      tier: fullUser.subscriptionTier,
      isBetaTester: fullUser.isBetaTester,
      isAlphaTester: fullUser.isAlphaTester,
      preferences: fullUser.featurePreferences
        ? {
            disabledFeatures: fullUser.featurePreferences.disabledFeatures,
            enabledFeatures: fullUser.featurePreferences.enabledFeatures,
            featureConfigs: fullUser.featurePreferences.featureConfigs as Record<
              string,
              Record<string, unknown>
            >,
          }
        : {
            disabledFeatures: [],
            enabledFeatures: [],
            featureConfigs: {},
          },
      overrides: fullUser.featureOverrides.map((o) => ({
        featureId: o.featureId,
        enabled: o.enabled,
        reason: o.reason || undefined,
        expiresAt: o.expiresAt || undefined,
        createdBy: o.createdBy || undefined,
      })),
      usage: {},
    };

    // Générer l'état de chaque feature
    const featuresWithAccess = Object.values(FEATURE_DEFINITIONS).map((feature) => {
      const access = checkFeatureAccess(feature.id, context);
      return {
        ...feature,
        access: {
          hasAccess: access.hasAccess,
          isEnabled: access.isEnabled,
          source: access.source,
          message: access.message,
          canToggle: access.canToggle,
          requiredTier: access.requiredTier,
          currentUsage: access.currentUsage,
          maxUsage: access.maxUsage,
        },
      };
    });

    return NextResponse.json({
      features: featuresWithAccess,
      tier: fullUser.subscriptionTier,
      isBetaTester: fullUser.isBetaTester,
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/features
// Met à jour les préférences de features de l'utilisateur
// ============================================

const UpdatePreferencesSchema = z.object({
  featureId: z.string(),
  enabled: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = UpdatePreferencesSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { featureId, enabled } = validated.data;

    // Vérifier que la feature existe
    const feature = getFeature(featureId);
    if (!feature) {
      return NextResponse.json(
        { error: `Feature "${featureId}" not found` },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut toggle cette feature
    if (!feature.userToggleable) {
      return NextResponse.json(
        { error: 'This feature cannot be toggled' },
        { status: 403 }
      );
    }

    // Récupérer l'utilisateur pour vérifier l'accès
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        featurePreferences: true,
        featureOverrides: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Construire le contexte pour vérifier l'accès
    const context: FeatureContext = createDefaultContext(fullUser.subscriptionTier);
    context.isBetaTester = fullUser.isBetaTester;
    context.isAlphaTester = fullUser.isAlphaTester;

    const access = checkFeatureAccess(featureId, context);

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message || 'Access denied' },
        { status: 403 }
      );
    }

    // Mettre à jour ou créer les préférences
    const currentPrefs = fullUser.featurePreferences;

    let newDisabledFeatures: string[];
    let newEnabledFeatures: string[];

    if (currentPrefs) {
      newDisabledFeatures = [...currentPrefs.disabledFeatures];
      newEnabledFeatures = [...currentPrefs.enabledFeatures];
    } else {
      newDisabledFeatures = [];
      newEnabledFeatures = [];
    }

    if (enabled) {
      // Activer la feature
      newDisabledFeatures = newDisabledFeatures.filter((id) => id !== featureId);
      if (!newEnabledFeatures.includes(featureId)) {
        newEnabledFeatures.push(featureId);
      }
    } else {
      // Désactiver la feature
      newEnabledFeatures = newEnabledFeatures.filter((id) => id !== featureId);
      if (!newDisabledFeatures.includes(featureId)) {
        newDisabledFeatures.push(featureId);
      }
    }

    // Sauvegarder
    await prisma.userFeaturePreferences.upsert({
      where: { userId: user.id },
      update: {
        disabledFeatures: newDisabledFeatures,
        enabledFeatures: newEnabledFeatures,
      },
      create: {
        userId: user.id,
        disabledFeatures: newDisabledFeatures,
        enabledFeatures: newEnabledFeatures,
        featureConfigs: {},
      },
    });

    return NextResponse.json({
      success: true,
      featureId,
      enabled,
    });
  } catch (error) {
    console.error('Error updating feature preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
