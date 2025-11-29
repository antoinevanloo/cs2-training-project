import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import prisma from '@/lib/db/prisma';

// Regex pour valider un SteamID64
const STEAM_ID_REGEX = /^7656119\d{10}$/;

export async function GET() {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
        steamId: true,
        preferredRole: true,
        preferredMaps: true,
        storageUsedMb: true,
        maxStorageMb: true,
      },
    });

     console.log('[Settings GET] User:', user.id);
    console.log('[Settings GET] Data:', userData);

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthAPI();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, steamId, preferredRole, preferredMaps } = body;

    console.log('[Settings PATCH] User:', user.id);
    console.log('[Settings PATCH] Body:', { username, steamId, preferredRole, preferredMaps });

    // Validation du Steam ID
    if (steamId !== undefined && steamId !== null && steamId !== '') {
      if (!STEAM_ID_REGEX.test(steamId)) {
        return NextResponse.json(
          { error: 'Steam ID invalide. Format attendu: 7656119XXXXXXXXXX (17 chiffres)' },
          { status: 400 }
        );
      }

      // Vérifier que le Steam ID n'est pas déjà utilisé par un autre compte
      const existingUser = await prisma.user.findFirst({
        where: {
          steamId,
          id: { not: user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ce Steam ID est déjà associé à un autre compte' },
          { status: 409 }
        );
      }
    }

    // Mise à jour des données
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username !== undefined && { username }),
        ...(steamId !== undefined && { steamId: steamId || null }),
        ...(preferredRole !== undefined && { preferredRole: preferredRole || null }),
        ...(preferredMaps !== undefined && { preferredMaps }),
      },
      select: {
        username: true,
        steamId: true,
        preferredRole: true,
        preferredMaps: true,
      },
    });

    return NextResponse.json({
      message: 'Paramètres sauvegardés',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des paramètres' },
      { status: 500 }
    );
  }
}