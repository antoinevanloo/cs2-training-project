/**
 * Configuration du panel admin - Extensible et modulaire
 *
 * Pour ajouter un nouveau module admin :
 * 1. Ajouter l'entrée dans ADMIN_MODULES
 * 2. Créer la page dans /dashboard/admin/[module]/page.tsx
 * 3. Créer l'API si nécessaire dans /api/admin/[module]/route.ts
 */

import { SystemRole } from '@prisma/client';

// Types pour les modules admin
export interface AdminModule {
  id: string;
  name: string;
  description: string;
  icon: string; // Nom de l'icône (lucide-react)
  href: string;
  // Permissions requises
  requiredRole: SystemRole;
  // Badge optionnel (ex: nombre de notifications)
  badge?: {
    type: 'count' | 'status';
    endpoint?: string; // API endpoint pour récupérer la valeur
  };
  // Sous-modules
  children?: AdminModule[];
  // Module actif ?
  enabled: boolean;
  // Ordre d'affichage
  order: number;
}

// Définition des modules admin
export const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Vue d\'ensemble de la plateforme',
    icon: 'LayoutDashboard',
    href: '/dashboard/admin',
    requiredRole: 'ADMIN',
    enabled: true,
    order: 0,
  },
  {
    id: 'users',
    name: 'Utilisateurs',
    description: 'Gestion des utilisateurs et abonnements',
    icon: 'Users',
    href: '/dashboard/admin/users',
    requiredRole: 'ADMIN',
    badge: {
      type: 'count',
      endpoint: '/api/admin/users/count',
    },
    enabled: true,
    order: 1,
  },
  {
    id: 'coaching',
    name: 'Coaching',
    description: 'Configuration du système de coaching',
    icon: 'Target',
    href: '/dashboard/admin/coaching',
    requiredRole: 'ADMIN',
    enabled: true,
    order: 2,
    children: [
      {
        id: 'coaching-rules',
        name: 'Règles',
        description: 'Activer/désactiver les règles d\'analyse',
        icon: 'Settings',
        href: '/dashboard/admin/coaching/rules',
        requiredRole: 'ADMIN',
        enabled: true,
        order: 0,
      },
      {
        id: 'coaching-thresholds',
        name: 'Seuils',
        description: 'Configurer les seuils de détection',
        icon: 'SlidersHorizontal',
        href: '/dashboard/admin/coaching/thresholds',
        requiredRole: 'ADMIN',
        enabled: true,
        order: 1,
      },
    ],
  },
  {
    id: 'demos',
    name: 'Demos',
    description: 'Gestion des demos et traitements',
    icon: 'FileVideo',
    href: '/dashboard/admin/demos',
    requiredRole: 'ADMIN',
    enabled: true,
    order: 3,
  },
  {
    id: 'stats',
    name: 'Statistiques',
    description: 'Métriques et analytics de la plateforme',
    icon: 'BarChart3',
    href: '/dashboard/admin/stats',
    requiredRole: 'ADMIN',
    enabled: true,
    order: 4,
  },
  {
    id: 'teams',
    name: 'Équipes',
    description: 'Gestion des équipes',
    icon: 'UsersRound',
    href: '/dashboard/admin/teams',
    requiredRole: 'ADMIN',
    enabled: false, // Désactivé pour l'instant
    order: 5,
  },
  {
    id: 'billing',
    name: 'Facturation',
    description: 'Abonnements et paiements',
    icon: 'CreditCard',
    href: '/dashboard/admin/billing',
    requiredRole: 'ADMIN',
    enabled: false, // Désactivé pour l'instant
    order: 6,
  },
  {
    id: 'settings',
    name: 'Paramètres',
    description: 'Configuration globale de la plateforme',
    icon: 'Settings',
    href: '/dashboard/admin/settings',
    requiredRole: 'ADMIN',
    enabled: true,
    order: 99,
  },
];

/**
 * Récupère les modules actifs triés par ordre
 */
export function getActiveModules(): AdminModule[] {
  return ADMIN_MODULES
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Récupère un module par son ID
 */
export function getModuleById(id: string): AdminModule | undefined {
  return ADMIN_MODULES.find((m) => m.id === id);
}

/**
 * Vérifie si un utilisateur a accès à un module
 */
export function canAccessModule(
  userRole: SystemRole,
  moduleId: string
): boolean {
  const module = getModuleById(moduleId);
  if (!module || !module.enabled) return false;

  // Pour l'instant, seul ADMIN a accès
  return userRole === 'ADMIN';
}

// Stats cards configuration pour le dashboard
export interface StatCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  endpoint: string;
  format: 'number' | 'currency' | 'percentage';
}

export const DASHBOARD_STAT_CARDS: StatCard[] = [
  {
    id: 'total-users',
    title: 'Utilisateurs',
    icon: 'Users',
    color: 'blue',
    endpoint: '/api/admin/stats/users',
    format: 'number',
  },
  {
    id: 'total-demos',
    title: 'Demos analysées',
    icon: 'FileVideo',
    color: 'green',
    endpoint: '/api/admin/stats/demos',
    format: 'number',
  },
  {
    id: 'active-subscriptions',
    title: 'Abonnés payants',
    icon: 'CreditCard',
    color: 'purple',
    endpoint: '/api/admin/stats/subscriptions',
    format: 'number',
  },
  {
    id: 'mrr',
    title: 'MRR',
    icon: 'TrendingUp',
    color: 'yellow',
    endpoint: '/api/admin/stats/mrr',
    format: 'currency',
  },
];