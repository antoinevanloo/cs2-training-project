/**
 * Constantes centralisées pour les tiers d'abonnement
 *
 * Source de vérité unique pour tout ce qui concerne les tiers.
 * L'enum Prisma `SubscriptionTier` est LA source de vérité pour le type.
 */

import { SubscriptionTier } from '@prisma/client';

// Re-export le type Prisma pour faciliter les imports
export type { SubscriptionTier };

// ============================================
// ORDRE ET COMPARAISON DES TIERS
// ============================================

/**
 * Liste ordonnée des tiers (du moins au plus élevé)
 */
export const TIER_ORDER: SubscriptionTier[] = [
  'FREE',
  'STARTER',
  'PRO',
  'TEAM',
  'ENTERPRISE',
];

/**
 * Niveau numérique pour comparaisons rapides
 */
export const TIER_LEVEL: Record<SubscriptionTier, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  TEAM: 3,
  ENTERPRISE: 4,
};

/**
 * Vérifie si un tier est supérieur ou égal à un autre
 */
export function isTierAtLeast(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}

/**
 * Vérifie si un tier est strictement supérieur à un autre
 */
export function isTierHigherThan(
  tier: SubscriptionTier,
  compareTo: SubscriptionTier
): boolean {
  return TIER_LEVEL[tier] > TIER_LEVEL[compareTo];
}

// ============================================
// AFFICHAGE UI
// ============================================

/**
 * Labels d'affichage des tiers
 */
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  FREE: 'Gratuit',
  STARTER: 'Starter',
  PRO: 'Pro',
  TEAM: 'Team',
  ENTERPRISE: 'Enterprise',
};

/**
 * Couleurs des badges (classes Tailwind)
 * Note: on utilise Record<string, ...> pour permettre l'accès avec des clés dynamiques
 */
export const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  FREE: { bg: 'bg-gray-600', text: 'text-gray-200' },
  STARTER: { bg: 'bg-blue-600', text: 'text-white' },
  PRO: { bg: 'bg-purple-600', text: 'text-white' },
  TEAM: { bg: 'bg-green-600', text: 'text-white' },
  ENTERPRISE: { bg: 'bg-yellow-600', text: 'text-black' },
};

/**
 * Couleurs simplifiées (juste le background)
 * Note: on utilise Record<string, string> pour permettre l'accès avec des clés dynamiques
 */
export const TIER_BG_COLORS: Record<string, string> = {
  FREE: 'bg-gray-600',
  STARTER: 'bg-blue-600',
  PRO: 'bg-purple-600',
  TEAM: 'bg-green-600',
  ENTERPRISE: 'bg-yellow-600',
};

// ============================================
// OPTIONS POUR FORMULAIRES
// ============================================

/**
 * Options pour les selects
 */
export const TIER_SELECT_OPTIONS: { value: SubscriptionTier; label: string }[] =
  TIER_ORDER.map((tier) => ({
    value: tier,
    label: TIER_LABELS[tier],
  }));

/**
 * Options pour les filtres (avec option "Tous")
 */
export const TIER_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les tiers' },
  ...TIER_SELECT_OPTIONS,
];

/**
 * Tiers disponibles à l'achat (exclut ENTERPRISE qui est sur devis)
 */
export const PURCHASABLE_TIERS: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'TEAM'];
