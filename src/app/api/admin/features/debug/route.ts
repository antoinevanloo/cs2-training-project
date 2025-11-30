import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/guard';
import prisma from '@/lib/db/prisma';
import { FEATURE_DEFINITIONS } from '@/lib/features/config';
import { getGlobalFeatureConfig, applyGlobalOverrides, buildUserFeatureContext } from '@/lib/features/server';

const FEATURE_CONFIG_KEY = 'global_feature_config';

/**
 * GET /api/admin/features/debug
 *
 * Debug endpoint pour voir l'état actuel des features
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // 1. Raw database config
    const rawDbConfig = await prisma.systemConfig.findUnique({
      where: { key: FEATURE_CONFIG_KEY },
    });

    // 2. Cached config (from server module)
    const cachedConfig = await getGlobalFeatureConfig();

    // 3. User context
    const userContext = await buildUserFeatureContext(admin.id);

    // 4. Analysis features with overrides applied
    const analysisFeatures = Object.values(FEATURE_DEFINITIONS)
      .filter((f) => f.category === 'analysis')
      .map((f) => {
        const withOverrides = applyGlobalOverrides(f, cachedConfig);
        return {
          id: f.id,
          name: f.name,
          defaultStatus: f.status,
          defaultMinTier: f.minTier,
          currentStatus: withOverrides.status,
          currentMinTier: withOverrides.minTier,
          hasOverride: cachedConfig[f.id] !== undefined,
          override: cachedConfig[f.id] || null,
        };
      });

    // 5. Calculate which analyzers would be enabled for this user
    const tierOrder = ['FREE', 'STARTER', 'PRO', 'TEAM', 'ENTERPRISE'];
    const userTierIndex = userContext ? tierOrder.indexOf(userContext.tier) : 0;

    const enabledAnalyzers = analysisFeatures.filter((f) => {
      // Status check
      if (f.currentStatus !== 'enabled') {
        if (f.currentStatus === 'beta' && !userContext?.isBetaTester && !userContext?.isAlphaTester) return false;
        if (f.currentStatus === 'alpha' && !userContext?.isAlphaTester) return false;
        if (['disabled', 'deprecated', 'coming_soon'].includes(f.currentStatus)) return false;
      }
      // Tier check
      const requiredTierIndex = tierOrder.indexOf(f.currentMinTier);
      if (userTierIndex < requiredTierIndex) return false;
      // Preference check
      if (userContext?.preferences.disabledFeatures.includes(f.id)) return false;
      return true;
    }).map((f) => f.id);

    // 6. Check a sample analysis from database
    const sampleAnalysis = await prisma.analysis.findFirst({
      where: { demo: { userId: admin.id } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        overallScore: true,
        aimScore: true,
        positioningScore: true,
        utilityScore: true,
        economyScore: true,
        timingScore: true,
        decisionScore: true,
      },
    });

    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        rawDbConfig: rawDbConfig?.value || 'NO CONFIG IN DB',
        cachedConfig,
        userContext: userContext ? {
          tier: userContext.tier,
          isBetaTester: userContext.isBetaTester,
          isAlphaTester: userContext.isAlphaTester,
          disabledFeatures: userContext.preferences.disabledFeatures,
          enabledFeatures: userContext.preferences.enabledFeatures,
          overridesCount: userContext.overrides.length,
        } : 'NO USER CONTEXT',
        analysisFeatures,
        enabledAnalyzers,
        sampleAnalysis: sampleAnalysis || 'NO ANALYSIS FOUND',
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
