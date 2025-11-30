/**
 * Configuration centralisée des Workshop Maps CS2
 *
 * IMPORTANT: Les IDs Steam Workshop doivent être vérifiés manuellement
 * car ils changent fréquemment (nouvelles versions CS2, maps supprimées, etc.)
 *
 * Pour trouver un ID valide:
 * 1. Aller sur https://steamcommunity.com/workshop/browse/?appid=730
 * 2. Chercher la map (ex: "Aim Botz CS2")
 * 3. L'ID est dans l'URL: steamcommunity.com/sharedfiles/filedetails/?id=XXXXXX
 *
 * Pour tester un lien:
 * steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXX
 */

export interface WorkshopMapConfig {
  /** ID unique interne */
  id: string;
  /** Nom affiché */
  name: string;
  /** ID Steam Workshop (peut être null si pas encore trouvé) */
  steamId: string | null;
  /** Auteur de la map */
  author: string;
  /** Catégories de la map */
  categories: ('aim' | 'positioning' | 'utility' | 'movement' | 'prefire')[];
  /** Map spécifique (pour les maps utility/prefire) */
  forMap?: string;
  /** Status de vérification */
  status: 'verified' | 'unverified' | 'broken' | 'not_found';
  /** Date de dernière vérification (ISO string) */
  lastVerified?: string;
  /** Notes/commentaires */
  notes?: string;
}

/**
 * Base de données des Workshop Maps
 *
 * INSTRUCTIONS POUR MISE À JOUR:
 * 1. Trouver le bon ID sur le Steam Workshop CS2
 * 2. Mettre à jour steamId
 * 3. Changer status en 'verified'
 * 4. Ajouter lastVerified avec la date actuelle
 */
export const WORKSHOP_MAPS_CONFIG: WorkshopMapConfig[] = [
  // ============================================
  // AIM TRAINING
  // ============================================
  {
    id: 'aim_botz',
    name: 'Aim Botz',
    steamId: null, // TODO: Trouver l'ID CS2 valide
    author: 'uLLetical',
    categories: ['aim'],
    status: 'unverified',
    notes: 'Chercher "Aim Botz" ou "ulletical" sur le Workshop CS2',
  },
  {
    id: 'fast_aim_reflex',
    name: 'Fast Aim / Reflex Training',
    steamId: null,
    author: 'yolokas',
    categories: ['aim'],
    status: 'unverified',
    notes: 'Chercher "Fast Aim" ou "Reflex" sur le Workshop CS2',
  },
  {
    id: 'recoil_master',
    name: 'Recoil Master',
    steamId: null,
    author: 'uLLetical',
    categories: ['aim'],
    status: 'unverified',
    notes: 'Chercher "Recoil Master CS2" sur le Workshop',
  },
  {
    id: 'yprac_aim_trainer',
    name: 'YPrac Aim Trainer',
    steamId: null,
    author: 'Yesber',
    categories: ['aim'],
    status: 'unverified',
    notes: 'Chercher "YPrac" ou "Yesber" sur le Workshop CS2',
  },
  {
    id: 'crashz_crosshair',
    name: 'crashz\' Crosshair Generator',
    steamId: null,
    author: 'crashz',
    categories: ['aim'],
    status: 'unverified',
    notes: 'Chercher "crashz crosshair" sur le Workshop CS2',
  },

  // ============================================
  // PREFIRE MAPS (YPrac)
  // ============================================
  {
    id: 'prefire_dust2',
    name: 'Prefire Practice - Dust 2',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'dust2',
    status: 'unverified',
    notes: 'Chercher "YPrac Dust2" ou "Prefire Dust2" sur le Workshop CS2',
  },
  {
    id: 'prefire_mirage',
    name: 'Prefire Practice - Mirage',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'mirage',
    status: 'unverified',
  },
  {
    id: 'prefire_inferno',
    name: 'Prefire Practice - Inferno',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'inferno',
    status: 'unverified',
  },
  {
    id: 'prefire_anubis',
    name: 'Prefire Practice - Anubis',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'anubis',
    status: 'unverified',
  },
  {
    id: 'prefire_ancient',
    name: 'Prefire Practice - Ancient',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'ancient',
    status: 'unverified',
  },
  {
    id: 'prefire_nuke',
    name: 'Prefire Practice - Nuke',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'nuke',
    status: 'unverified',
  },
  {
    id: 'prefire_vertigo',
    name: 'Prefire Practice - Vertigo',
    steamId: null,
    author: 'Yesber',
    categories: ['prefire', 'positioning'],
    forMap: 'vertigo',
    status: 'unverified',
  },

  // ============================================
  // UTILITY MAPS (YPrac)
  // ============================================
  {
    id: 'utility_mirage',
    name: 'Utility Practice - Mirage',
    steamId: null,
    author: 'Yesber',
    categories: ['utility'],
    forMap: 'mirage',
    status: 'unverified',
    notes: 'Chercher "YPrac Mirage Utility" ou "Smoke Practice Mirage"',
  },
  {
    id: 'utility_dust2',
    name: 'Utility Practice - Dust 2',
    steamId: null,
    author: 'Yesber',
    categories: ['utility'],
    forMap: 'dust2',
    status: 'unverified',
  },
  {
    id: 'utility_inferno',
    name: 'Utility Practice - Inferno',
    steamId: null,
    author: 'Yesber',
    categories: ['utility'],
    forMap: 'inferno',
    status: 'unverified',
  },
  {
    id: 'utility_anubis',
    name: 'Utility Practice - Anubis',
    steamId: null,
    author: 'Yesber',
    categories: ['utility'],
    forMap: 'anubis',
    status: 'unverified',
  },
  {
    id: 'utility_ancient',
    name: 'Utility Practice - Ancient',
    steamId: null,
    author: 'Yesber',
    categories: ['utility'],
    forMap: 'ancient',
    status: 'unverified',
  },
  {
    id: 'utility_nuke',
    name: 'Utility Practice - Nuke',
    steamId: null,
    author: 'Yesber',
    categories: ['utility'],
    forMap: 'nuke',
    status: 'unverified',
  },

  // ============================================
  // MOVEMENT
  // ============================================
  {
    id: 'kz_beginner',
    name: 'KZ Beginner Maps',
    steamId: null,
    author: 'Various',
    categories: ['movement'],
    status: 'unverified',
    notes: 'Chercher "KZ CS2" ou "Climb" sur le Workshop',
  },
  {
    id: 'surf_beginner',
    name: 'Surf Beginner',
    steamId: null,
    author: 'Various',
    categories: ['movement'],
    status: 'unverified',
    notes: 'Chercher "Surf CS2 beginner" sur le Workshop',
  },
];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère l'URL Steam Workshop
 */
export function getWorkshopUrl(steamId: string): string {
  return `steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=${steamId}`;
}

/**
 * Génère l'URL web du Workshop (pour afficher dans le navigateur)
 */
export function getWorkshopWebUrl(steamId: string): string {
  return `https://steamcommunity.com/sharedfiles/filedetails/?id=${steamId}`;
}

/**
 * Récupère une map par son ID interne
 */
export function getWorkshopMapById(id: string): WorkshopMapConfig | undefined {
  return WORKSHOP_MAPS_CONFIG.find((m) => m.id === id);
}

/**
 * Récupère les maps par catégorie
 */
export function getWorkshopMapsByCategory(
  category: WorkshopMapConfig['categories'][number]
): WorkshopMapConfig[] {
  return WORKSHOP_MAPS_CONFIG.filter((m) => m.categories.includes(category));
}

/**
 * Récupère uniquement les maps vérifiées et fonctionnelles
 */
export function getVerifiedWorkshopMaps(): WorkshopMapConfig[] {
  return WORKSHOP_MAPS_CONFIG.filter(
    (m) => m.status === 'verified' && m.steamId !== null
  );
}

/**
 * Récupère les maps qui nécessitent une vérification
 */
export function getUnverifiedWorkshopMaps(): WorkshopMapConfig[] {
  return WORKSHOP_MAPS_CONFIG.filter(
    (m) => m.status === 'unverified' || m.status === 'broken'
  );
}

/**
 * Vérifie si une map a un lien Steam valide
 */
export function hasValidSteamLink(map: WorkshopMapConfig): boolean {
  return map.steamId !== null && map.status === 'verified';
}

/**
 * Met à jour l'ID Steam d'une map (pour usage programmatique)
 * Note: Cette fonction ne persiste pas les changements
 */
export function updateWorkshopMapSteamId(
  id: string,
  steamId: string | null,
  status: WorkshopMapConfig['status'] = 'verified'
): boolean {
  const map = WORKSHOP_MAPS_CONFIG.find((m) => m.id === id);
  if (!map) return false;

  map.steamId = steamId;
  map.status = status;
  map.lastVerified = new Date().toISOString();
  return true;
}

/**
 * Export pour compatibilité avec l'ancien format
 * Ne retourne que les IDs des maps vérifiées
 */
export const WORKSHOP_MAP_IDS: Record<string, string> = Object.fromEntries(
  WORKSHOP_MAPS_CONFIG
    .filter((m) => m.steamId !== null)
    .map((m) => [m.id, m.steamId as string])
);

/**
 * Statistiques sur les maps
 */
export function getWorkshopMapsStats(): {
  total: number;
  verified: number;
  unverified: number;
  broken: number;
  byCategory: Record<string, number>;
} {
  const stats = {
    total: WORKSHOP_MAPS_CONFIG.length,
    verified: WORKSHOP_MAPS_CONFIG.filter((m) => m.status === 'verified').length,
    unverified: WORKSHOP_MAPS_CONFIG.filter((m) => m.status === 'unverified').length,
    broken: WORKSHOP_MAPS_CONFIG.filter((m) => m.status === 'broken').length,
    byCategory: {} as Record<string, number>,
  };

  const categories = ['aim', 'positioning', 'utility', 'movement', 'prefire'];
  for (const cat of categories) {
    stats.byCategory[cat] = WORKSHOP_MAPS_CONFIG.filter((m) =>
      m.categories.includes(cat as WorkshopMapConfig['categories'][number])
    ).length;
  }

  return stats;
}