import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema pour créer un objectif
const CreateGoalSchema = z.object({
  metric: z.string().min(1),
  category: z.enum([
    'aim',
    'positioning',
    'utility',
    'economy',
    'timing',
    'decision',
    'movement',
    'awareness',
    'teamplay',
  ]),
  name: z.string().optional(),
  description: z.string().optional(),
  startValue: z.number(),
  targetValue: z.number(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  deadline: z.string().datetime().optional(),
  suggestedFrom: z.enum(['analysis', 'coaching', 'manual']).optional(),
  sourceId: z.string().optional(),
});

// Schema pour mettre à jour un objectif
const UpdateGoalSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  deadline: z.string().datetime().nullable().optional(),
  achieved: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
});

// GET /api/user/goals - Récupérer tous les objectifs
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const achieved = searchParams.get('achieved');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const goals = await prisma.userGoal.findMany({
      where: {
        userId: user.id,
        ...(category && { category }),
        ...(achieved !== null && { achieved: achieved === 'true' }),
      },
      orderBy: [
        { achieved: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json({ success: true, data: goals });
  } catch (error) {
    console.error('API Error - GET /api/user/goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/goals - Créer un nouvel objectif
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateGoalSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { deadline, ...rest } = validated.data;

    // Calculer le progrès initial
    const progress = calculateProgress(rest.startValue, rest.startValue, rest.targetValue);

    const goal = await prisma.userGoal.create({
      data: {
        userId: user.id,
        ...rest,
        currentValue: rest.startValue,
        deadline: deadline ? new Date(deadline) : null,
        progress,
        progressHistory: [
          {
            date: new Date().toISOString(),
            value: rest.startValue,
          },
        ],
      },
    });

    return NextResponse.json({ success: true, data: goal }, { status: 201 });
  } catch (error) {
    console.error('API Error - POST /api/user/goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/goals - Mettre à jour un objectif (via query param ?id=...)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    // Vérifier que l'objectif appartient à l'utilisateur
    const existingGoal = await prisma.userGoal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const body = await req.json();
    const validated = UpdateGoalSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { deadline, currentValue, achieved, ...rest } = validated.data;

    // Calculer le nouveau progrès si currentValue change
    let progress = existingGoal.progress;
    let progressHistory = existingGoal.progressHistory as Array<{ date: string; value: number; demoId?: string }>;

    if (currentValue !== undefined) {
      progress = calculateProgress(existingGoal.startValue, currentValue, existingGoal.targetValue);
      progressHistory = [
        ...progressHistory,
        {
          date: new Date().toISOString(),
          value: currentValue,
        },
      ];
    }

    const goal = await prisma.userGoal.update({
      where: { id: goalId },
      data: {
        ...rest,
        ...(currentValue !== undefined && { currentValue }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(achieved !== undefined && {
          achieved,
          achievedAt: achieved ? new Date() : null,
        }),
        progress,
        progressHistory,
      },
    });

    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    console.error('API Error - PUT /api/user/goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/goals - Supprimer un objectif
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuthAPI();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    // Vérifier que l'objectif appartient à l'utilisateur
    const existingGoal = await prisma.userGoal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.userGoal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error - DELETE /api/user/goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fonction helper pour calculer le progrès
function calculateProgress(startValue: number, currentValue: number, targetValue: number): number {
  const totalDelta = targetValue - startValue;
  if (totalDelta === 0) return 100;

  const currentDelta = currentValue - startValue;
  const progress = (currentDelta / totalDelta) * 100;

  // Clamp entre 0 et 100
  return Math.max(0, Math.min(100, progress));
}
