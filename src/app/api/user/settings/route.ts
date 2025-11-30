import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/utils';
import prisma from '@/lib/db/prisma';
import { PlayerRole, CS2Rank } from '@prisma/client';
import { getTierConfig, getEffectiveTier, type UserWithSubscription } from '@/lib/subscription';

// Regex pour valider un SteamID64
const STEAM_ID_REGEX = /^7656119\d{10}$/;

// Valeurs valides pour les enums
const VALID_ROLES: PlayerRole[] = ['ENTRY', 'AWPER', 'LURKER', 'SUPPORT', 'IGL', 'RIFLER'];
const VALID_RANKS: CS2Rank[] = [
  'SILVER',
  'GOLD_NOVA',
  'MASTER_GUARDIAN',
  'LEGENDARY_EAGLE',
  'SUPREME',
  'GLOBAL',
  'PREMIER_0_5000',
  'PREMIER_5000_10000',
  'PREMIER_10000_15000',
  'PREMIER_15000_20000',
  'PREMIER_20000_PLUS',
];

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
        steamUsername: true,
        matchHistoryAuthCode: true,
        lastMatchSync: true,
        role: true,
        rank: true,
        targetRank: true,
        preferredMaps: true,
        storageUsedMb: true,
        // Subscription info
        systemRole: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        demosThisMonth: true,
        demosResetAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    console.log('[Settings GET] User:', user.id);
    console.log('[Settings GET] Data:', userData);

    // Calculer le tier effectif et les limites
    const userForTier: UserWithSubscription = {
      id: user.id,
      systemRole: userData.systemRole,
      subscriptionTier: userData.subscriptionTier,
      subscriptionExpiresAt: userData.subscriptionExpiresAt,
      storageUsedMb: userData.storageUsedMb,
      demosThisMonth: userData.demosThisMonth,
      demosResetAt: userData.demosResetAt,
    };
    const effectiveTier = getEffectiveTier(userForTier);
    const tierConfig = getTierConfig(effectiveTier);

    return NextResponse.json({
      ...userData,
      // Tier info
      effectiveTier,
      tierName: tierConfig.name,
      tierLimits: tierConfig.limits,
      tierFeatures: tierConfig.features,
      maxStorageMb: tierConfig.limits.storageMaxMb,
      // Ajouter les options disponibles pour le frontend
      availableRoles: VALID_ROLES.map((r) => ({
        value: r,
        label: getRoleLabel(r),
      })),
      availableRanks: VALID_RANKS.map((r) => ({
        value: r,
        label: getRankLabel(r),
      })),
    });
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
    const { username, steamId, role, rank, targetRank, preferredMaps } = body;

    console.log('[Settings PATCH] User:', user.id);
    console.log('[Settings PATCH] Body:', { username, steamId, role, rank, targetRank, preferredMaps });

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

    // Validation du rôle
    if (role !== undefined && role !== null && role !== '') {
      if (!VALID_ROLES.includes(role as PlayerRole)) {
        return NextResponse.json(
          { error: `Rôle invalide. Valeurs acceptées: ${VALID_ROLES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validation du rank
    if (rank !== undefined && rank !== null && rank !== '') {
      if (!VALID_RANKS.includes(rank as CS2Rank)) {
        return NextResponse.json(
          { error: `Rang invalide. Valeurs acceptées: ${VALID_RANKS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validation du targetRank
    if (targetRank !== undefined && targetRank !== null && targetRank !== '') {
      if (!VALID_RANKS.includes(targetRank as CS2Rank)) {
        return NextResponse.json(
          { error: `Rang cible invalide. Valeurs acceptées: ${VALID_RANKS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Mise à jour des données
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username !== undefined && { username }),
        ...(steamId !== undefined && { steamId: steamId || null }),
        ...(role !== undefined && { role: role || null }),
        ...(rank !== undefined && { rank: rank || null }),
        ...(targetRank !== undefined && { targetRank: targetRank || null }),
        ...(preferredMaps !== undefined && { preferredMaps }),
      },
      select: {
        username: true,
        steamId: true,
        role: true,
        rank: true,
        targetRank: true,
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

// Labels lisibles pour les rôles
function getRoleLabel(role: PlayerRole): string {
  const labels: Record<PlayerRole, string> = {
    ENTRY: 'Entry Fragger',
    AWPER: 'AWPer',
    LURKER: 'Lurker',
    SUPPORT: 'Support',
    IGL: 'In-Game Leader',
    RIFLER: 'Rifler',
  };
  return labels[role] || role;
}

// Labels lisibles pour les rangs
function getRankLabel(rank: CS2Rank): string {
  const labels: Record<CS2Rank, string> = {
    SILVER: 'Silver',
    GOLD_NOVA: 'Gold Nova',
    MASTER_GUARDIAN: 'Master Guardian',
    LEGENDARY_EAGLE: 'Legendary Eagle',
    SUPREME: 'Supreme',
    GLOBAL: 'Global Elite',
    PREMIER_0_5000: 'Premier (0-5000)',
    PREMIER_5000_10000: 'Premier (5000-10000)',
    PREMIER_10000_15000: 'Premier (10000-15000)',
    PREMIER_15000_20000: 'Premier (15000-20000)',
    PREMIER_20000_PLUS: 'Premier (20000+)',
  };
  return labels[rank] || rank;
}
