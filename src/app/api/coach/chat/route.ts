import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { coachEngine } from '@/lib/coaching/chat';
import type { CoachContext, CoachingMode } from '@/lib/coaching/chat';
import type { AnalysisCategory } from '@/lib/preferences/types';
import prisma from '@/lib/db/prisma';

// ============================================
// VALIDATION SCHEMA
// ============================================

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  mode: z.enum(['general', 'demo_review', 'skill_focus', 'warmup', 'mental', 'tactical']).optional(),
  demoId: z.string().optional(),
  focusCategory: z.enum(['aim', 'positioning', 'utility', 'economy', 'timing', 'decision']).optional(),
  context: z.object({
    userId: z.string().optional(),
    playerName: z.string().optional(),
  }).optional(),
});

// ============================================
// API HANDLER
// ============================================

/**
 * POST /api/coach/chat
 *
 * Envoie un message au coach IA et reçoit une réponse.
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valider le body
    const body = await request.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Requête invalide', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId, mode, demoId, focusCategory } = validation.data;

    // Construire le contexte du coach
    const context = await buildCoachContext(
      session.user.id,
      session.user.name || 'Joueur',
      mode,
      demoId
    );

    // Traiter le message
    const response = await coachEngine.processMessage(
      {
        message,
        sessionId,
        mode: mode as CoachingMode | undefined,
        demoId,
        focusCategory: focusCategory as AnalysisCategory | undefined,
      },
      context
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur coach chat:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/coach/chat
 *
 * Récupère l'historique des sessions de chat.
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Récupérer une session spécifique
      const chatSession = coachEngine.getSession(sessionId);

      if (!chatSession) {
        return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
      }

      // Vérifier que la session appartient à l'utilisateur
      if (chatSession.userId !== session.user.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        session: {
          id: chatSession.id,
          startedAt: chatSession.startedAt,
          lastMessageAt: chatSession.lastMessageAt,
          messages: chatSession.messages.filter((m) => m.role !== 'system'),
          topic: chatSession.topic,
          isActive: chatSession.isActive,
        },
      });
    }

    // Récupérer toutes les sessions de l'utilisateur
    const sessions = coachEngine.getUserSessions(session.user.id);

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        startedAt: s.startedAt,
        lastMessageAt: s.lastMessageAt,
        messageCount: s.messages.filter((m) => m.role !== 'system').length,
        topic: s.topic,
        preview: s.messages.find((m) => m.role === 'user')?.content.slice(0, 100) || '',
        isActive: s.isActive,
      })),
    });
  } catch (error) {
    console.error('Erreur récupération sessions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Construit le contexte du coach à partir des données utilisateur
 */
async function buildCoachContext(
  userId: string,
  playerName: string,
  mode?: string,
  demoId?: string
): Promise<CoachContext> {
  const context: CoachContext = {
    userId,
    playerName,
    coachingMode: (mode as CoachingMode) || 'general',
  };

  try {
    // Récupérer les stats utilisateur
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (userStats) {
      // Calculer les scores par catégorie
      const categoryScores: Record<AnalysisCategory, number> = {
        aim: (userStats.avgHeadshotPercentage || 0) * 2, // Simplified scoring
        positioning: 50, // Would need more data
        utility: 50,
        economy: 50,
        timing: 50,
        decision: 50,
        movement: 50,
        awareness: 50,
        teamplay: 50,
      };

      const bestCategory = Object.entries(categoryScores).reduce((a, b) =>
        categoryScores[a[0] as AnalysisCategory] > categoryScores[b[0] as AnalysisCategory] ? a : b
      )[0] as AnalysisCategory;

      const worstCategory = Object.entries(categoryScores).reduce((a, b) =>
        categoryScores[a[0] as AnalysisCategory] < categoryScores[b[0] as AnalysisCategory] ? a : b
      )[0] as AnalysisCategory;

      context.playerStats = {
        totalMatches: userStats.totalMatches,
        winRate: userStats.winRate,
        avgRating: userStats.avgRating,
        avgKD: userStats.avgKills / Math.max(1, userStats.avgDeaths),
        avgADR: userStats.avgADR,
        bestCategory,
        worstCategory,
        recentTrend: 'stable', // Would need to calculate from recent matches
        categoryScores: categoryScores as Record<AnalysisCategory, number>,
      };
    }

    // Récupérer les préférences utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        targetRank: true,
        currentRank: true,
        steamId: true,
      },
    });

    if (user) {
      context.currentRank = user.currentRank || undefined;
      context.targetRank = user.targetRank || undefined;
      context.steamId = user.steamId || undefined;
    }

    // Récupérer les analyses récentes si mode demo_review
    if (mode === 'demo_review' || demoId) {
      const recentDemos = await prisma.demo.findMany({
        where: {
          userId,
          ...(demoId ? { id: demoId } : {}),
        },
        include: {
          analysis: true,
        },
        orderBy: { matchDate: 'desc' },
        take: 3,
      });

      context.recentAnalyses = recentDemos.map((demo) => ({
        demoId: demo.id,
        map: demo.map,
        matchDate: demo.matchDate,
        result: demo.result as 'win' | 'loss',
        score: { team: demo.teamScore, opponent: demo.opponentScore },
        rating: demo.analysis?.rating || 0,
        keyInsights: demo.analysis?.keyInsights
          ? (demo.analysis.keyInsights as string[])
          : [],
        recommendations: demo.analysis?.recommendations
          ? (demo.analysis.recommendations as string[])
          : [],
      }));
    }
  } catch (error) {
    console.error('Erreur construction contexte coach:', error);
    // Continue with minimal context
  }

  return context;
}
