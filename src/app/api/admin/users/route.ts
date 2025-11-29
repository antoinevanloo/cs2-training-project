import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin/guard';
import prisma from '@/lib/db/prisma';
import { SystemRole, SubscriptionTier } from '@prisma/client';

/**
 * GET /api/admin/users
 *
 * Liste tous les utilisateurs avec pagination et filtres
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAPI();

    if (!admin) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { steamId: { contains: search } },
      ];
    }

    if (tier) {
      where.subscriptionTier = tier;
    }

    if (role) {
      where.systemRole = role;
    }

    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          username: true,
          steamId: true,
          avatarUrl: true,
          systemRole: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          storageUsedMb: true,
          demosThisMonth: true,
          role: true,
          rank: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              demos: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 *
 * Modifie un utilisateur (tier, role, etc.)
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
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Validate updates
    const allowedUpdates: Record<string, unknown> = {};

    if (updates.systemRole !== undefined) {
      if (!['USER', 'ADMIN'].includes(updates.systemRole)) {
        return NextResponse.json(
          { error: 'systemRole invalide' },
          { status: 400 }
        );
      }
      allowedUpdates.systemRole = updates.systemRole as SystemRole;
    }

    if (updates.subscriptionTier !== undefined) {
      if (!['FREE', 'PRO', 'PRO_PLUS', 'TEAM', 'ENTERPRISE'].includes(updates.subscriptionTier)) {
        return NextResponse.json(
          { error: 'subscriptionTier invalide' },
          { status: 400 }
        );
      }
      allowedUpdates.subscriptionTier = updates.subscriptionTier as SubscriptionTier;
    }

    if (updates.subscriptionExpiresAt !== undefined) {
      allowedUpdates.subscriptionExpiresAt = updates.subscriptionExpiresAt
        ? new Date(updates.subscriptionExpiresAt)
        : null;
    }

    if (updates.maxStorageMb !== undefined) {
      allowedUpdates.maxStorageMb = parseInt(updates.maxStorageMb);
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune modification valide' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
      select: {
        id: true,
        email: true,
        username: true,
        systemRole: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        maxStorageMb: true,
      },
    });

    return NextResponse.json({
      message: 'Utilisateur mis à jour',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 *
 * Supprime un utilisateur
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Ne pas supprimer son propre compte
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: 'Utilisateur supprimé',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}