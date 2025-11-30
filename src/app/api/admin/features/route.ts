import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/guard';
import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { FEATURE_DEFINITIONS } from '@/lib/features/config';
import { invalidateGlobalConfigCache } from '@/lib/features/server';

// Key for storing feature config in SystemConfig
const FEATURE_CONFIG_KEY = 'global_feature_config';

// Validation schema for feature overrides
const FeatureOverrideSchema = z.object({
  status: z.enum(['enabled', 'disabled', 'beta', 'alpha', 'deprecated', 'coming_soon']).optional(),
  minTier: z.enum(['FREE', 'STARTER', 'PRO', 'TEAM', 'ENTERPRISE']).optional(),
});

const UpdateRequestSchema = z.object({
  overrides: z.record(z.string(), FeatureOverrideSchema),
});

/**
 * GET /api/admin/features
 *
 * Récupère la configuration actuelle des features
 */
export async function GET(_request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Get global config from database
    const config = await prisma.systemConfig.findUnique({
      where: { key: FEATURE_CONFIG_KEY },
    });

    // Get usage stats for features
    const featureUsageStats = await prisma.featureUsage.groupBy({
      by: ['featureId'],
      _sum: {
        count: true,
      },
    });

    const usageByFeature = featureUsageStats.reduce((acc, stat) => {
      acc[stat.featureId] = stat._sum.count || 0;
      return acc;
    }, {} as Record<string, number>);

    // Count users with overrides per feature
    const userOverrides = await prisma.userFeatureOverride.groupBy({
      by: ['featureId'],
      _count: true,
    });

    const overrideCountByFeature = userOverrides.reduce((acc, override) => {
      acc[override.featureId] = override._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      config: config?.value || {},
      features: FEATURE_DEFINITIONS,
      stats: {
        totalFeatures: Object.keys(FEATURE_DEFINITIONS).length,
        usageByFeature,
        overrideCountByFeature,
      },
    });
  } catch (error) {
    console.error('Error fetching features config:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la configuration' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/features
 *
 * Met à jour la configuration globale des features
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = UpdateRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { overrides } = validated.data;

    // Validate that all feature IDs exist
    const invalidFeatureIds = Object.keys(overrides).filter(
      (id) => !FEATURE_DEFINITIONS[id]
    );

    if (invalidFeatureIds.length > 0) {
      return NextResponse.json(
        { error: 'Features invalides', invalidFeatureIds },
        { status: 400 }
      );
    }

    // Get existing config
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key: FEATURE_CONFIG_KEY },
    });

    // Merge with existing config
    const existingOverrides = (existingConfig?.value as Record<string, unknown>) || {};
    const mergedOverrides = {
      ...existingOverrides,
      ...overrides,
    };

    // Clean up overrides that don't actually override anything
    Object.keys(mergedOverrides).forEach((key) => {
      const override = mergedOverrides[key] as Record<string, unknown>;
      if (!override) {
        delete mergedOverrides[key];
        return;
      }

      // Get default values from feature definition
      const featureDefault = FEATURE_DEFINITIONS[key];
      if (!featureDefault) {
        delete mergedOverrides[key];
        return;
      }

      // Remove override if status matches default (enabled) and minTier matches default
      const statusMatchesDefault = override.status === undefined || override.status === featureDefault.status;
      const tierMatchesDefault = override.minTier === undefined || override.minTier === featureDefault.minTier;

      if (statusMatchesDefault && tierMatchesDefault) {
        delete mergedOverrides[key];
      }
    });

    // Upsert config
    const updatedConfig = await prisma.systemConfig.upsert({
      where: { key: FEATURE_CONFIG_KEY },
      create: {
        key: FEATURE_CONFIG_KEY,
        value: mergedOverrides as unknown as Prisma.InputJsonValue,
      },
      update: {
        value: mergedOverrides as unknown as Prisma.InputJsonValue,
      },
    });

    // Invalidate the server-side cache to ensure new config is used immediately
    invalidateGlobalConfigCache();

    return NextResponse.json({
      message: 'Configuration mise à jour',
      config: updatedConfig.value,
      updatedAt: updatedConfig.updatedAt,
    });
  } catch (error) {
    console.error('Error updating features config:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/features/override
 *
 * Ajoute un override pour un utilisateur spécifique
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, featureId, enabled, reason, expiresAt } = body;

    if (!userId || !featureId || enabled === undefined) {
      return NextResponse.json(
        { error: 'userId, featureId et enabled sont requis' },
        { status: 400 }
      );
    }

    // Validate feature exists
    if (!FEATURE_DEFINITIONS[featureId]) {
      return NextResponse.json(
        { error: 'Feature invalide' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Upsert the override
    const override = await prisma.userFeatureOverride.upsert({
      where: {
        userId_featureId: {
          userId,
          featureId,
        },
      },
      create: {
        userId,
        featureId,
        enabled,
        reason: reason || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: admin.id,
      },
      update: {
        enabled,
        reason: reason || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: admin.id,
      },
    });

    return NextResponse.json({
      message: 'Override créé/mis à jour',
      override,
    });
  } catch (error) {
    console.error('Error creating user override:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'override' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/features/override
 *
 * Supprime un override utilisateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle cache invalidation
    if (action === 'invalidate-cache') {
      invalidateGlobalConfigCache();
      return NextResponse.json({
        message: 'Cache invalidé avec succès',
      });
    }

    // Handle reset all config
    if (action === 'reset-all') {
      await prisma.systemConfig.delete({
        where: { key: FEATURE_CONFIG_KEY },
      }).catch(() => {
        // Config might not exist, that's fine
      });
      invalidateGlobalConfigCache();
      return NextResponse.json({
        message: 'Configuration réinitialisée',
      });
    }

    // Handle user override deletion
    const userId = searchParams.get('userId');
    const featureId = searchParams.get('featureId');

    if (!userId || !featureId) {
      return NextResponse.json(
        { error: 'userId et featureId requis' },
        { status: 400 }
      );
    }

    await prisma.userFeatureOverride.delete({
      where: {
        userId_featureId: {
          userId,
          featureId,
        },
      },
    });

    return NextResponse.json({
      message: 'Override supprimé',
    });
  } catch (error) {
    console.error('Error deleting user override:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'override' },
      { status: 500 }
    );
  }
}
