/**
 * Guard pour vérifier les permissions admin
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';
import { SystemRole } from '@prisma/client';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  systemRole: SystemRole;
  avatarUrl: string | null;
}

/**
 * Vérifie si l'utilisateur actuel est admin (côté serveur)
 * Redirige vers /dashboard si non admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      systemRole: true,
      avatarUrl: true,
    },
  });

  if (!user || user.systemRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  return user;
}

/**
 * Vérifie si l'utilisateur est admin (pour les API routes)
 * Retourne null si non admin
 */
export async function requireAdminAPI(): Promise<AdminUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      systemRole: true,
      avatarUrl: true,
    },
  });

  if (!user || user.systemRole !== 'ADMIN') {
    return null;
  }

  return user;
}

/**
 * Vérifie si l'utilisateur actuel est admin (côté client)
 * Retourne un boolean
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { systemRole: true },
  });

  return user?.systemRole === 'ADMIN';
}