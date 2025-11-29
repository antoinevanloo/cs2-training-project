import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema de validation
const completeExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  exerciseType: z.string(),
  category: z.string(),
  duration: z.number().min(1),
  completed: z.boolean().default(true),
  performance: z.object({
    score: z.number().optional(),
    kills: z.number().optional(),
    hsRate: z.number().optional(),
    notes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  goalId: z.string().optional(),
});

/**
 * POST /api/coaching/exercises/complete
 *
 * Enregistre la complétion d'un exercice.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validation = completeExerciseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      exerciseId,
      exerciseName,
      exerciseType,
      category,
      duration,
      completed,
      performance,
      notes,
      goalId,
    } = validation.data;

    // Enregistrer la complétion
    const completion = await prisma.exerciseCompletion.create({
      data: {
        userId: session.user.id,
        exerciseId,
        exerciseName,
        exerciseType,
        category,
        duration,
        completed,
        performance: performance ? (performance as Prisma.InputJsonValue) : Prisma.JsonNull,
        notes,
        goalId,
      },
    });

    // Si lié à un objectif, mettre à jour les stats de l'objectif
    if (goalId) {
      // On ne peut pas automatiquement mettre à jour la valeur de l'objectif
      // car cela nécessite une nouvelle analyse de démo
      // Mais on peut tracker que l'exercice a été fait
    }

    // Calculer les stats de l'utilisateur pour aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await prisma.exerciseCompletion.aggregate({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        duration: true,
      },
      _count: true,
    });

    // Stats de la semaine
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekStats = await prisma.exerciseCompletion.aggregate({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: weekAgo,
        },
      },
      _sum: {
        duration: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      completion,
      stats: {
        today: {
          exercisesCompleted: todayStats._count,
          totalMinutes: todayStats._sum.duration || 0,
        },
        thisWeek: {
          exercisesCompleted: weekStats._count,
          totalMinutes: weekStats._sum.duration || 0,
        },
      },
    });
  } catch (error) {
    console.error('Erreur enregistrement exercice:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement de l\'exercice' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/coaching/exercises/complete
 *
 * Récupère l'historique des exercices complétés.
 *
 * Query params:
 * - category: Filtrer par catégorie
 * - days: Nombre de jours à récupérer (défaut: 30)
 * - limit: Nombre max de résultats (défaut: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const days = parseInt(searchParams.get('days') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: {
      userId: string;
      createdAt: { gte: Date };
      category?: string;
    } = {
      userId: session.user.id,
      createdAt: {
        gte: since,
      },
    };

    if (category) {
      where.category = category;
    }

    const completions = await prisma.exerciseCompletion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculer les stats par catégorie
    const statsByCategory = await prisma.exerciseCompletion.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        createdAt: {
          gte: since,
        },
      },
      _sum: {
        duration: true,
      },
      _count: true,
    });

    // Calculer les stats par jour (7 derniers jours)
    const dailyStats: { date: string; minutes: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayCompletions = completions.filter((c) => {
        const cDate = new Date(c.createdAt);
        return cDate >= date && cDate < nextDate;
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        minutes: dayCompletions.reduce((sum, c) => sum + c.duration, 0),
        count: dayCompletions.length,
      });
    }

    return NextResponse.json({
      success: true,
      completions,
      stats: {
        byCategory: statsByCategory.map((s) => ({
          category: s.category,
          totalMinutes: s._sum.duration || 0,
          count: s._count,
        })),
        daily: dailyStats,
        total: {
          exercises: completions.length,
          minutes: completions.reduce((sum, c) => sum + c.duration, 0),
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération exercices:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des exercices' },
      { status: 500 }
    );
  }
}