import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema de validation pour la mise à jour des préférences
const UpdatePreferencesSchema = z.object({
  // Display
  theme: z.enum(['dark', 'light', 'system', 'gaming']).optional(),
  language: z.enum(['fr', 'en']).optional(),
  compactMode: z.boolean().optional(),
  animationLevel: z.enum(['full', 'reduced', 'none']).optional(),
  chartStyle: z.enum(['filled', 'line', 'both']).optional(),
  colorScheme: z.enum(['default', 'colorblind', 'highContrast']).optional(),

  // Dashboard
  dashboardLayout: z.array(z.any()).optional(),
  hiddenWidgets: z.array(z.string()).optional(),
  pinnedMetrics: z.array(z.string()).optional(),

  // Analysis
  categoryWeights: z.record(z.number()).nullable().optional(),
  metricThresholds: z.record(z.any()).nullable().optional(),
  priorityCategories: z.array(z.string()).optional(),

  // Notifications
  alertOnRegression: z.boolean().optional(),
  alertOnGoalReached: z.boolean().optional(),
  alertOnPersonalBest: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  notificationChannel: z.enum(['inapp', 'email', 'discord']).optional(),

  // Filters
  savedFilters: z.array(z.any()).optional(),
  defaultFilters: z.any().nullable().optional(),
  quickFilterMap: z.string().nullable().optional(),
  quickFilterPeriod: z.enum(['7d', '30d', '90d', 'all']).optional(),
  quickFilterMode: z.enum(['ranked', 'casual', 'all']).optional(),
});

// Valeurs par défaut pour création Prisma
function getDefaultPreferencesData(userId: string): Prisma.UserPreferencesCreateInput {
  return {
    user: { connect: { id: userId } },
    theme: 'dark',
    language: 'fr',
    compactMode: false,
    animationLevel: 'full',
    chartStyle: 'filled',
    colorScheme: 'default',
    dashboardLayout: [],
    hiddenWidgets: [],
    pinnedMetrics: [],
    priorityCategories: [],
    alertOnRegression: true,
    alertOnGoalReached: true,
    alertOnPersonalBest: true,
    weeklyReport: true,
    notificationChannel: 'inapp',
    savedFilters: [],
    quickFilterPeriod: '30d',
    quickFilterMode: 'all',
  };
}

// GET /api/user/preferences - Récupérer les préférences de l'utilisateur
export async function GET() {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer ou créer les préférences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    // Si pas de préférences, créer avec valeurs par défaut
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: getDefaultPreferencesData(user.id),
      });
    }

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('API Error - GET /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/preferences - Mettre à jour les préférences
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

    // Convertir les données validées en format Prisma-compatible
    const updateData: Prisma.UserPreferencesUpdateInput = {};

    // Copier les champs simples
    if (validated.data.theme !== undefined) updateData.theme = validated.data.theme;
    if (validated.data.language !== undefined) updateData.language = validated.data.language;
    if (validated.data.compactMode !== undefined) updateData.compactMode = validated.data.compactMode;
    if (validated.data.animationLevel !== undefined) updateData.animationLevel = validated.data.animationLevel;
    if (validated.data.chartStyle !== undefined) updateData.chartStyle = validated.data.chartStyle;
    if (validated.data.colorScheme !== undefined) updateData.colorScheme = validated.data.colorScheme;
    if (validated.data.hiddenWidgets !== undefined) updateData.hiddenWidgets = validated.data.hiddenWidgets;
    if (validated.data.pinnedMetrics !== undefined) updateData.pinnedMetrics = validated.data.pinnedMetrics;
    if (validated.data.priorityCategories !== undefined) updateData.priorityCategories = validated.data.priorityCategories;
    if (validated.data.alertOnRegression !== undefined) updateData.alertOnRegression = validated.data.alertOnRegression;
    if (validated.data.alertOnGoalReached !== undefined) updateData.alertOnGoalReached = validated.data.alertOnGoalReached;
    if (validated.data.alertOnPersonalBest !== undefined) updateData.alertOnPersonalBest = validated.data.alertOnPersonalBest;
    if (validated.data.weeklyReport !== undefined) updateData.weeklyReport = validated.data.weeklyReport;
    if (validated.data.notificationChannel !== undefined) updateData.notificationChannel = validated.data.notificationChannel;
    if (validated.data.quickFilterMap !== undefined) updateData.quickFilterMap = validated.data.quickFilterMap;
    if (validated.data.quickFilterPeriod !== undefined) updateData.quickFilterPeriod = validated.data.quickFilterPeriod;
    if (validated.data.quickFilterMode !== undefined) updateData.quickFilterMode = validated.data.quickFilterMode;

    // Champs JSON - utiliser Prisma.JsonNull pour les valeurs null explicites
    if (validated.data.dashboardLayout !== undefined) {
      updateData.dashboardLayout = validated.data.dashboardLayout;
    }
    if (validated.data.categoryWeights !== undefined) {
      updateData.categoryWeights = validated.data.categoryWeights === null
        ? Prisma.JsonNull
        : validated.data.categoryWeights;
    }
    if (validated.data.metricThresholds !== undefined) {
      updateData.metricThresholds = validated.data.metricThresholds === null
        ? Prisma.JsonNull
        : validated.data.metricThresholds;
    }
    if (validated.data.savedFilters !== undefined) {
      updateData.savedFilters = validated.data.savedFilters;
    }
    if (validated.data.defaultFilters !== undefined) {
      updateData.defaultFilters = validated.data.defaultFilters === null
        ? Prisma.JsonNull
        : validated.data.defaultFilters;
    }

    // Upsert des préférences (créer si n'existe pas, sinon mettre à jour)
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: getDefaultPreferencesData(user.id),
      update: updateData,
    });

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('API Error - PATCH /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/preferences - Réinitialiser les préférences
export async function DELETE() {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Supprimer les préférences existantes
    await prisma.userPreferences.deleteMany({
      where: { userId: user.id },
    });

    // Recréer avec valeurs par défaut
    const preferences = await prisma.userPreferences.create({
      data: getDefaultPreferencesData(user.id),
    });

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('API Error - DELETE /api/user/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
