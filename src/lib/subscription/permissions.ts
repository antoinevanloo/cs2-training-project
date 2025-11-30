import { SystemRole, SubscriptionTier, User, TeamMember, TeamRole } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import {
  Feature,
  hasFeature,
  getTierLimits,
  isDemoLimitReached,
  isStorageLimitReached,
} from './tiers';

/**
 * Informations utilisateur nécessaires pour les vérifications
 */
export type UserWithSubscription = Pick<
  User,
  | 'id'
  | 'systemRole'
  | 'subscriptionTier'
  | 'subscriptionExpiresAt'
  | 'storageUsedMb'
  | 'demosThisMonth'
  | 'demosResetAt'
>;

/**
 * Résultat d'une vérification de permission
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;  // Tier minimum requis
}

/**
 * Vérifie si l'abonnement est expiré
 */
export function isSubscriptionExpired(user: UserWithSubscription): boolean {
  if (!user.subscriptionExpiresAt) return false; // FREE ou lifetime
  return new Date() > user.subscriptionExpiresAt;
}

/**
 * Obtient le tier effectif (FREE si expiré)
 */
export function getEffectiveTier(user: UserWithSubscription): SubscriptionTier {
  if (isSubscriptionExpired(user)) {
    return 'FREE';
  }
  return user.subscriptionTier;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin(user: UserWithSubscription): boolean {
  return user.systemRole === 'ADMIN';
}

/**
 * Vérifie si l'utilisateur peut accéder à une fonctionnalité
 */
export function canAccessFeature(
  user: UserWithSubscription,
  feature: Feature
): PermissionResult {
  // Les admins ont accès à tout
  if (isAdmin(user)) {
    return { allowed: true };
  }

  const effectiveTier = getEffectiveTier(user);

  if (hasFeature(effectiveTier, feature)) {
    return { allowed: true };
  }

  // Trouver le tier minimum requis
  const tiers: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'TEAM', 'ENTERPRISE'];
  const requiredTier = tiers.find((t) => hasFeature(t, feature));

  return {
    allowed: false,
    reason: `Cette fonctionnalité nécessite un abonnement ${requiredTier || 'supérieur'}`,
    upgradeRequired: requiredTier,
  };
}

/**
 * Vérifie si l'utilisateur peut uploader une demo
 */
export async function canUploadDemo(
  user: UserWithSubscription,
  fileSizeMb: number
): Promise<PermissionResult> {
  // Les admins peuvent tout faire
  if (isAdmin(user)) {
    return { allowed: true };
  }

  const effectiveTier = getEffectiveTier(user);
  const limits = getTierLimits(effectiveTier);

  // Vérifier le reset mensuel des demos
  const now = new Date();
  const resetDate = user.demosResetAt;
  let demosThisMonth = user.demosThisMonth;

  // Si on est dans un nouveau mois, le compteur est à 0
  if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
    demosThisMonth = 0;
  }

  // Vérifier la limite de demos
  if (isDemoLimitReached(effectiveTier, demosThisMonth)) {
    return {
      allowed: false,
      reason: `Limite de ${limits.demosPerMonth} demos/mois atteinte. Passez à PRO pour des uploads illimités.`,
      upgradeRequired: 'PRO',
    };
  }

  // Vérifier la limite de stockage
  if (isStorageLimitReached(effectiveTier, user.storageUsedMb, fileSizeMb)) {
    return {
      allowed: false,
      reason: `Limite de stockage de ${limits.storageMaxMb} MB atteinte. Supprimez des demos ou passez à un plan supérieur.`,
      upgradeRequired: 'PRO',
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si l'utilisateur peut voir l'historique complet
 */
export function canViewFullHistory(user: UserWithSubscription): PermissionResult {
  return canAccessFeature(user, 'progress_tracking');
}

/**
 * Vérifie si l'utilisateur peut exporter en PDF
 */
export function canExportPdf(user: UserWithSubscription): PermissionResult {
  return canAccessFeature(user, 'export_pdf');
}

/**
 * Vérifie si l'utilisateur peut accéder au coaching IA
 */
export function canAccessAiCoaching(user: UserWithSubscription): PermissionResult {
  return canAccessFeature(user, 'ai_coaching');
}

/**
 * Incrémente le compteur de demos uploadées ce mois
 */
export async function incrementDemoCount(userId: string): Promise<void> {
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      demosThisMonth: { increment: 1 },
      demosResetAt: now,
    },
  });
}

/**
 * Reset le compteur de demos si nouveau mois
 */
export async function resetDemoCountIfNeeded(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { demosResetAt: true },
  });

  if (!user) return;

  const now = new Date();
  const resetDate = user.demosResetAt;

  // Si on est dans un nouveau mois, reset le compteur
  if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        demosThisMonth: 0,
        demosResetAt: now,
      },
    });
  }
}

// ============================================
// PERMISSIONS ÉQUIPE (préparé pour le futur)
// ============================================

/**
 * Vérifie si l'utilisateur est membre d'une équipe
 */
export async function isTeamMember(
  userId: string,
  teamId: string
): Promise<TeamMember | null> {
  return prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique dans une équipe
 */
export async function hasTeamRole(
  userId: string,
  teamId: string,
  roles: TeamRole[]
): Promise<boolean> {
  const member = await isTeamMember(userId, teamId);
  if (!member) return false;
  return roles.includes(member.teamRole);
}

/**
 * Vérifie si l'utilisateur peut voir les demos d'un autre membre
 */
export async function canViewTeamMemberDemos(
  userId: string,
  teamId: string
): Promise<boolean> {
  const member = await isTeamMember(userId, teamId);
  if (!member) return false;

  // COACH, ANALYST, MANAGER et OWNER peuvent voir tous les demos
  if (['COACH', 'ANALYST', 'MANAGER', 'OWNER'].includes(member.teamRole)) {
    return true;
  }

  // Permission spécifique
  return member.canViewAllDemos;
}

/**
 * Vérifie si l'utilisateur peut gérer les membres d'une équipe
 */
export async function canManageTeamMembers(
  userId: string,
  teamId: string
): Promise<boolean> {
  const member = await isTeamMember(userId, teamId);
  if (!member) return false;

  // MANAGER et OWNER peuvent gérer les membres
  if (['MANAGER', 'OWNER'].includes(member.teamRole)) {
    return true;
  }

  return member.canManageMembers;
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Récupère les infos de subscription d'un utilisateur
 */
export async function getUserSubscription(
  userId: string
): Promise<UserWithSubscription | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      systemRole: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      storageUsedMb: true,
      demosThisMonth: true,
      demosResetAt: true,
    },
  });
}

/**
 * Vérifie et retourne le résultat d'une permission
 * Utile dans les API routes
 */
export async function checkPermission(
  userId: string,
  feature: Feature
): Promise<PermissionResult> {
  const user = await getUserSubscription(userId);

  if (!user) {
    return {
      allowed: false,
      reason: 'Utilisateur non trouvé',
    };
  }

  return canAccessFeature(user, feature);
}