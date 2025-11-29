import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

/**
 * GET /api/coaching/goals
 *
 * Récupère les objectifs du joueur.
 *
 * Query params:
 * - status: Filtrer par status (ACTIVE, COMPLETED, FAILED, PAUSED)
 * - category: Filtrer par catégorie
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: {
      userId: string;
      status?: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';
      category?: string;
    } = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status as 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';
    }
    if (category) {
      where.category = category;
    }

    const goals = await prisma.playerGoal.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Calculer les stats
    const stats = {
      total: goals.length,
      active: goals.filter((g) => g.status === 'ACTIVE').length,
      completed: goals.filter((g) => g.status === 'COMPLETED').length,
      failed: goals.filter((g) => g.status === 'FAILED').length,
    };

    return NextResponse.json({
      success: true,
      goals: goals.map((goal) => ({
        ...goal,
        progressHistory: goal.snapshots.map((s) => ({
          date: s.createdAt,
          value: (s.metrics as Record<string, Record<string, number>>)?.[goal.category]?.[goal.metric] || goal.currentValue,
        })),
      })),
      stats,
    });
  } catch (error) {
    console.error('Erreur récupération objectifs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des objectifs' },
      { status: 500 }
    );
  }
}

// Schema de validation pour créer un objectif
const createGoalSchema = z.object({
  category: z.string(),
  metric: z.string(),
  description: z.string(),
  startValue: z.number(),
  targetValue: z.number(),
  deadline: z.string().datetime().optional(),
  insightId: z.string().optional(),
});

/**
 * POST /api/coaching/goals
 *
 * Crée un nouvel objectif de progression.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createGoalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, metric, description, startValue, targetValue, deadline, insightId } = validation.data;

    // Créer l'objectif
    const goal = await prisma.playerGoal.create({
      data: {
        userId: session.user.id,
        category,
        metric,
        description,
        startValue,
        currentValue: startValue,
        targetValue,
        deadline: deadline ? new Date(deadline) : null,
        insightId,
        status: 'ACTIVE',
        progress: 0,
      },
    });

    return NextResponse.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error('Erreur création objectif:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'objectif' },
      { status: 500 }
    );
  }
}

// Schema de validation pour mettre à jour un objectif
const updateGoalSchema = z.object({
  goalId: z.string(),
  currentValue: z.number().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'PAUSED']).optional(),
});

/**
 * PATCH /api/coaching/goals
 *
 * Met à jour un objectif existant.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateGoalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { goalId, currentValue, status } = validation.data;

    // Vérifier que l'objectif appartient à l'utilisateur
    const existingGoal = await prisma.playerGoal.findFirst({
      where: {
        id: goalId,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Objectif non trouvé' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: {
      currentValue?: number;
      progress?: number;
      status?: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';
      completedAt?: Date | null;
    } = {};

    if (currentValue !== undefined) {
      updateData.currentValue = currentValue;

      // Calculer le progrès
      const totalChange = existingGoal.targetValue - existingGoal.startValue;
      const currentChange = currentValue - existingGoal.startValue;
      updateData.progress = totalChange !== 0
        ? Math.min(100, Math.max(0, (currentChange / totalChange) * 100))
        : 0;

      // Auto-compléter si objectif atteint
      if (updateData.progress >= 100 && existingGoal.status === 'ACTIVE') {
        updateData.status = 'COMPLETED';
        updateData.completedAt = new Date();
      }
    }

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const goal = await prisma.playerGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error('Erreur mise à jour objectif:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'objectif' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coaching/goals
 *
 * Supprime un objectif.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'objectif appartient à l'utilisateur
    const existingGoal = await prisma.playerGoal.findFirst({
      where: {
        id: goalId,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Objectif non trouvé' },
        { status: 404 }
      );
    }

    await prisma.playerGoal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({
      success: true,
      message: 'Objectif supprimé',
    });
  } catch (error) {
    console.error('Erreur suppression objectif:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'objectif' },
      { status: 500 }
    );
  }
}