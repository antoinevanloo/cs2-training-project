/**
 * API Steam Matches
 *
 * GET /api/steam/matches - Récupère les matchs récents depuis Steam
 * POST /api/steam/matches - Synchronise les nouveaux matchs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { getAllRecentMatches } from '@/lib/steam/match-history';
import { z } from 'zod';

// Schema de validation pour la mise à jour du code d'auth
const UpdateAuthCodeSchema = z.object({
  matchHistoryAuthCode: z.string().min(1).max(50),
});

/**
 * GET /api/steam/matches
 *
 * Récupère les matchs récents de l'utilisateur depuis Steam
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur avec ses infos Steam
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        steamId: true,
        matchHistoryAuthCode: true,
        lastKnownMatchCode: true,
        lastMatchSync: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!user.steamId) {
      return NextResponse.json(
        {
          error: 'Steam ID non configuré',
          code: 'STEAM_ID_REQUIRED',
          message: 'Connectez-vous avec Steam ou configurez votre Steam ID dans les paramètres.',
        },
        { status: 400 }
      );
    }

    if (!user.matchHistoryAuthCode) {
      return NextResponse.json(
        {
          error: 'Code d\'authentification non configuré',
          code: 'AUTH_CODE_REQUIRED',
          message: 'Configurez votre Match History Authentication Code dans les paramètres.',
        },
        { status: 400 }
      );
    }

    // Récupérer les matchs depuis Steam
    const result = await getAllRecentMatches(
      user.steamId,
      user.matchHistoryAuthCode,
      user.lastKnownMatchCode || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Erreur lors de la récupération des matchs',
          code: 'STEAM_API_ERROR',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      matches: result.matches,
      lastSync: user.lastMatchSync,
      hasMoreMatches: result.nextCode !== null,
    });
  } catch (error) {
    console.error('Error fetching Steam matches:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/steam/matches
 *
 * Met à jour le code d'authentification et/ou synchronise les matchs
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Si on met à jour le code d'auth
    if (body.matchHistoryAuthCode !== undefined) {
      const validated = UpdateAuthCodeSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          {
            error: 'Code d\'authentification invalide',
            details: validated.error.flatten(),
          },
          { status: 400 }
        );
      }

      // Mettre à jour le code d'auth
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          matchHistoryAuthCode: validated.data.matchHistoryAuthCode,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Code d\'authentification mis à jour',
      });
    }

    // Sinon, synchroniser les matchs
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        steamId: true,
        matchHistoryAuthCode: true,
        lastKnownMatchCode: true,
      },
    });

    if (!user?.steamId || !user?.matchHistoryAuthCode) {
      return NextResponse.json(
        {
          error: 'Configuration Steam incomplète',
          code: 'STEAM_CONFIG_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Synchroniser les matchs
    const result = await getAllRecentMatches(
      user.steamId,
      user.matchHistoryAuthCode,
      user.lastKnownMatchCode || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    // Mettre à jour le dernier code connu et la date de sync
    if (result.nextCode) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          lastKnownMatchCode: result.nextCode,
          lastMatchSync: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      matches: result.matches,
      newMatchesCount: result.matches.length,
      lastKnownCode: result.nextCode,
    });
  } catch (error) {
    console.error('Error syncing Steam matches:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}