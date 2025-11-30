import { Exercise } from '../types';
import {
  WORKSHOP_MAPS_CONFIG,
  getWorkshopMapById,
  getWorkshopUrl,
  hasValidSteamLink,
  type WorkshopMapConfig,
} from '../config/workshop-maps';

// Re-export pour compatibilité
export {
  WORKSHOP_MAPS_CONFIG,
  getWorkshopMapById,
  getWorkshopUrl,
  getWorkshopWebUrl,
  getWorkshopMapsByCategory,
  getVerifiedWorkshopMaps,
  getUnverifiedWorkshopMaps,
  hasValidSteamLink,
  getWorkshopMapsStats,
  type WorkshopMapConfig,
} from '../config/workshop-maps';

/**
 * Type de catégorie pour les exercices
 */
export type ExerciseCategory = 'aim' | 'positioning' | 'utility' | 'economy' | 'timing' | 'decision' | 'warmup' | 'general';

/**
 * Exercice enrichi avec métadonnées complètes
 */
export interface EnrichedExercise extends Exercise {
  id: string;
  category: ExerciseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Référence à la config Workshop Map (si applicable) */
  workshopMapId?: string;
  tags: string[];
}

/**
 * Récupère l'URL Workshop d'un exercice (si disponible et vérifié)
 */
export function getExerciseWorkshopUrl(exercise: EnrichedExercise): string | null {
  if (!exercise.workshopMapId) return null;

  const map = getWorkshopMapById(exercise.workshopMapId);
  if (!map || !hasValidSteamLink(map)) return null;

  return getWorkshopUrl(map.steamId!);
}

/**
 * Récupère les infos Workshop d'un exercice
 */
export function getExerciseWorkshopInfo(exercise: EnrichedExercise): {
  available: boolean;
  url: string | null;
  mapName: string | null;
  status: WorkshopMapConfig['status'] | null;
  needsVerification: boolean;
} {
  if (!exercise.workshopMapId) {
    return {
      available: false,
      url: null,
      mapName: null,
      status: null,
      needsVerification: false,
    };
  }

  const map = getWorkshopMapById(exercise.workshopMapId);
  if (!map) {
    return {
      available: false,
      url: null,
      mapName: null,
      status: null,
      needsVerification: true,
    };
  }

  const hasValid = hasValidSteamLink(map);

  return {
    available: hasValid,
    url: hasValid ? getWorkshopUrl(map.steamId!) : null,
    mapName: map.name,
    status: map.status,
    needsVerification: map.status === 'unverified' || map.status === 'broken',
  };
}

/**
 * Base de données complète des exercices
 */
export const exercises: EnrichedExercise[] = [
  // ============================================
  // AIM EXERCISES
  // ============================================
  {
    id: 'aim_botz_500',
    name: 'Aim Botz - 500 Kills Warmup',
    duration: 15,
    type: 'workshop',
    description: 'Tue 500 bots en te concentrant sur le placement de viseur à hauteur de tête',
    category: 'aim',
    difficulty: 'beginner',
    workshopMapId: 'aim_botz',
    tags: ['warmup', 'crosshair_placement', 'flick'],
  },
  {
    id: 'dm_hs_only',
    name: 'DM Headshot Only',
    duration: 20,
    type: 'community_server',
    description: 'Joue en DM sur serveur HS only pour forcer le placement de viseur',
    category: 'aim',
    difficulty: 'intermediate',
    tags: ['headshot', 'crosshair_placement', 'discipline'],
  },
  {
    id: 'recoil_master_ak',
    name: 'Recoil Master - AK-47 Focus',
    duration: 15,
    type: 'workshop',
    description: 'Maîtrise le pattern de recul de l\'AK-47, l\'arme la plus importante',
    category: 'aim',
    difficulty: 'beginner',
    workshopMapId: 'recoil_master',
    tags: ['spray', 'recoil', 'ak47'],
  },
  {
    id: 'recoil_master_m4',
    name: 'Recoil Master - M4 Focus',
    duration: 10,
    type: 'workshop',
    description: 'Maîtrise les patterns de recul des M4A4 et M4A1-S',
    category: 'aim',
    difficulty: 'beginner',
    workshopMapId: 'recoil_master',
    tags: ['spray', 'recoil', 'm4'],
  },
  {
    id: 'fast_aim_training',
    name: 'Fast Aim / Reflex Training',
    duration: 10,
    type: 'workshop',
    description: 'Entraînement de réflexes avec cibles rapides',
    category: 'aim',
    difficulty: 'intermediate',
    workshopMapId: 'fast_aim_reflex',
    tags: ['reflex', 'reaction_time', 'flick'],
  },
  {
    id: 'yprac_aim_comprehensive',
    name: 'YPrac Aim Trainer - Session Complète',
    duration: 20,
    type: 'workshop',
    description: 'Entraînement complet: tracking, flick et micro-ajustements',
    category: 'aim',
    difficulty: 'intermediate',
    workshopMapId: 'yprac_aim_trainer',
    tags: ['tracking', 'flick', 'micro_adjust', 'comprehensive'],
  },
  {
    id: 'dm_ffa_warmup',
    name: 'DM FFA Warmup',
    duration: 15,
    type: 'community_server',
    description: 'Session de warmup en Deathmatch Free For All',
    category: 'warmup',
    difficulty: 'beginner',
    tags: ['warmup', 'dm', 'aim'],
  },
  {
    id: 'pistol_dm',
    name: 'Pistol DM Session',
    duration: 15,
    type: 'community_server',
    description: 'Maîtrise les pistolets pour les eco rounds',
    category: 'aim',
    difficulty: 'intermediate',
    tags: ['pistol', 'eco', 'movement'],
  },
  {
    id: 'awp_dm',
    name: 'AWP DM Practice',
    duration: 15,
    type: 'community_server',
    description: 'Améliore ton jeu à l\'AWP',
    category: 'aim',
    difficulty: 'intermediate',
    tags: ['awp', 'sniper', 'flick'],
  },

  // ============================================
  // POSITIONING EXERCISES
  // ============================================
  {
    id: 'prefire_dust2',
    name: 'Prefire Practice - Dust 2',
    duration: 15,
    type: 'workshop',
    description: 'Apprends tous les angles et prefires de Dust 2',
    category: 'positioning',
    difficulty: 'intermediate',
    workshopMapId: 'prefire_dust2',
    tags: ['prefire', 'angles', 'dust2'],
  },
  {
    id: 'prefire_mirage',
    name: 'Prefire Practice - Mirage',
    duration: 15,
    type: 'workshop',
    description: 'Apprends tous les angles et prefires de Mirage',
    category: 'positioning',
    difficulty: 'intermediate',
    workshopMapId: 'prefire_mirage',
    tags: ['prefire', 'angles', 'mirage'],
  },
  {
    id: 'prefire_inferno',
    name: 'Prefire Practice - Inferno',
    duration: 15,
    type: 'workshop',
    description: 'Apprends tous les angles et prefires d\'Inferno',
    category: 'positioning',
    difficulty: 'intermediate',
    workshopMapId: 'prefire_inferno',
    tags: ['prefire', 'angles', 'inferno'],
  },
  {
    id: 'prefire_anubis',
    name: 'Prefire Practice - Anubis',
    duration: 15,
    type: 'workshop',
    description: 'Apprends tous les angles et prefires d\'Anubis',
    category: 'positioning',
    difficulty: 'intermediate',
    workshopMapId: 'prefire_anubis',
    tags: ['prefire', 'angles', 'anubis'],
  },
  {
    id: 'prefire_ancient',
    name: 'Prefire Practice - Ancient',
    duration: 15,
    type: 'workshop',
    description: 'Apprends tous les angles et prefires d\'Ancient',
    category: 'positioning',
    difficulty: 'advanced',
    workshopMapId: 'prefire_ancient',
    tags: ['prefire', 'angles', 'ancient'],
  },
  {
    id: 'prefire_nuke',
    name: 'Prefire Practice - Nuke',
    duration: 15,
    type: 'workshop',
    description: 'Apprends tous les angles et prefires de Nuke',
    category: 'positioning',
    difficulty: 'advanced',
    workshopMapId: 'prefire_nuke',
    tags: ['prefire', 'angles', 'nuke'],
  },
  {
    id: 'demo_review_self',
    name: 'Review de Démo Personnelle',
    duration: 30,
    type: 'theory',
    description: 'Analyse tes propres démos pour identifier les erreurs de positionnement',
    category: 'positioning',
    difficulty: 'intermediate',
    tags: ['demo_review', 'self_analysis', 'positioning'],
  },
  {
    id: 'pro_pov_analysis',
    name: 'Analyse POV Pro',
    duration: 20,
    type: 'theory',
    description: 'Regarde les POV de joueurs pros pour apprendre leurs positions',
    category: 'positioning',
    difficulty: 'intermediate',
    tags: ['pro_analysis', 'learning', 'positions'],
  },
  {
    id: 'retakes_server',
    name: 'Retakes Server Practice',
    duration: 25,
    type: 'community_server',
    description: 'Pratique les positions de retake et la lecture de situation',
    category: 'positioning',
    difficulty: 'intermediate',
    tags: ['retakes', 'teamplay', 'positioning'],
  },

  // ============================================
  // UTILITY EXERCISES
  // ============================================
  {
    id: 'utility_mirage',
    name: 'Utility Practice - Mirage',
    duration: 25,
    type: 'workshop',
    description: 'Apprends les smokes, flashes et molotovs essentiels de Mirage',
    category: 'utility',
    difficulty: 'beginner',
    workshopMapId: 'utility_mirage',
    tags: ['smoke', 'flash', 'molotov', 'mirage', 'lineup'],
  },
  {
    id: 'utility_dust2',
    name: 'Utility Practice - Dust 2',
    duration: 20,
    type: 'workshop',
    description: 'Apprends les smokes, flashes et molotovs essentiels de Dust 2',
    category: 'utility',
    difficulty: 'beginner',
    workshopMapId: 'utility_dust2',
    tags: ['smoke', 'flash', 'molotov', 'dust2', 'lineup'],
  },
  {
    id: 'utility_inferno',
    name: 'Utility Practice - Inferno',
    duration: 30,
    type: 'workshop',
    description: 'Apprends les smokes, flashes et molotovs essentiels d\'Inferno',
    category: 'utility',
    difficulty: 'intermediate',
    workshopMapId: 'utility_inferno',
    tags: ['smoke', 'flash', 'molotov', 'inferno', 'lineup'],
  },
  {
    id: 'utility_anubis',
    name: 'Utility Practice - Anubis',
    duration: 25,
    type: 'workshop',
    description: 'Apprends les smokes, flashes et molotovs essentiels d\'Anubis',
    category: 'utility',
    difficulty: 'intermediate',
    workshopMapId: 'utility_anubis',
    tags: ['smoke', 'flash', 'molotov', 'anubis', 'lineup'],
  },
  {
    id: 'execute_practice',
    name: 'Execute Practice Server',
    duration: 20,
    type: 'community_server',
    description: 'Pratique les exécutes complètes avec toutes les utilités',
    category: 'utility',
    difficulty: 'intermediate',
    tags: ['execute', 'teamplay', 'coordination'],
  },
  {
    id: 'flash_practice',
    name: 'Pop Flash Training',
    duration: 15,
    type: 'workshop',
    description: 'Pratique les pop flashes et self-flashes',
    category: 'utility',
    difficulty: 'intermediate',
    tags: ['flash', 'pop_flash', 'self_flash'],
  },

  // ============================================
  // TIMING EXERCISES
  // ============================================
  {
    id: '1v1_arena',
    name: '1v1 Arena Practice',
    duration: 20,
    type: 'community_server',
    description: 'Améliore ton timing de peek en duels 1v1',
    category: 'timing',
    difficulty: 'intermediate',
    tags: ['1v1', 'duel', 'timing', 'peek'],
  },
  {
    id: 'prefire_timing',
    name: 'Prefire Timing Practice',
    duration: 15,
    type: 'workshop',
    description: 'Apprends les timings standards de prefire',
    category: 'timing',
    difficulty: 'intermediate',
    workshopMapId: 'prefire_mirage',
    tags: ['prefire', 'timing', 'angles'],
  },
  {
    id: 'trade_practice',
    name: 'Trade Kill Practice',
    duration: 20,
    type: 'community_server',
    description: 'Pratique les trades rapides en retakes',
    category: 'timing',
    difficulty: 'intermediate',
    tags: ['trade', 'teamplay', 'timing'],
  },

  // ============================================
  // DECISION EXERCISES
  // ============================================
  {
    id: 'clutch_practice',
    name: 'Clutch Scenarios Practice',
    duration: 20,
    type: 'community_server',
    description: 'Pratique les situations de clutch en serveurs dédiés',
    category: 'decision',
    difficulty: 'advanced',
    tags: ['clutch', 'decision', 'pressure'],
  },
  {
    id: 'clutch_analysis',
    name: 'Pro Clutch Analysis',
    duration: 15,
    type: 'theory',
    description: 'Analyse les clutchs des pros pour comprendre leurs décisions',
    category: 'decision',
    difficulty: 'intermediate',
    tags: ['clutch', 'pro_analysis', 'learning'],
  },
  {
    id: 'economy_study',
    name: 'Economy Guide Study',
    duration: 15,
    type: 'theory',
    description: 'Étudie les règles d\'économie CS2 en détail',
    category: 'economy',
    difficulty: 'beginner',
    tags: ['economy', 'theory', 'buy_decisions'],
  },
  {
    id: 'decision_review',
    name: 'Decision Making Review',
    duration: 25,
    type: 'theory',
    description: 'Analyse tes décisions dans tes démos récentes',
    category: 'decision',
    difficulty: 'intermediate',
    tags: ['decision', 'demo_review', 'self_analysis'],
  },

  // ============================================
  // MOVEMENT EXERCISES
  // ============================================
  {
    id: 'kz_beginner',
    name: 'KZ Maps - Beginner',
    duration: 30,
    type: 'workshop',
    description: 'Améliore ton movement avec les maps KZ tier 1-2',
    category: 'positioning',
    difficulty: 'advanced',
    workshopMapId: 'kz_beginner',
    tags: ['movement', 'kz', 'strafe', 'bunnyhop'],
  },
  {
    id: 'surf_beginner',
    name: 'Surf Maps - Introduction',
    duration: 20,
    type: 'workshop',
    description: 'Apprends les bases du surf pour améliorer ta compréhension du movement',
    category: 'positioning',
    difficulty: 'intermediate',
    workshopMapId: 'surf_beginner',
    tags: ['movement', 'surf', 'strafe'],
  },
];

/**
 * Liste des workshop maps disponibles (pour backward compatibility)
 */
export const workshopMaps: string[] = WORKSHOP_MAPS_CONFIG.map((m) => m.name);

/**
 * Récupère les exercices par catégorie
 */
export function getExercisesByCategory(category: ExerciseCategory): EnrichedExercise[] {
  return exercises.filter((e) => e.category === category);
}

/**
 * Récupère les exercices par difficulté
 */
export function getExercisesByDifficulty(
  difficulty: EnrichedExercise['difficulty']
): EnrichedExercise[] {
  return exercises.filter((e) => e.difficulty === difficulty);
}

/**
 * Récupère les exercices avec Workshop Maps
 */
export function getWorkshopExercises(): EnrichedExercise[] {
  return exercises.filter((e) => e.type === 'workshop' && e.workshopMapId);
}

/**
 * Récupère les exercices avec Workshop Maps VÉRIFIÉ
 */
export function getVerifiedWorkshopExercises(): EnrichedExercise[] {
  return exercises.filter((e) => {
    if (e.type !== 'workshop' || !e.workshopMapId) return false;
    const map = getWorkshopMapById(e.workshopMapId);
    return map && hasValidSteamLink(map);
  });
}

/**
 * Récupère un exercice par ID
 */
export function getExerciseById(id: string): EnrichedExercise | undefined {
  return exercises.find((e) => e.id === id);
}

/**
 * Statistiques sur les exercices
 */
export const exerciseStats = {
  total: exercises.length,
  byCategory: {
    aim: getExercisesByCategory('aim').length,
    positioning: getExercisesByCategory('positioning').length,
    utility: getExercisesByCategory('utility').length,
    economy: getExercisesByCategory('economy').length,
    timing: getExercisesByCategory('timing').length,
    decision: getExercisesByCategory('decision').length,
    warmup: getExercisesByCategory('warmup').length,
  },
  byType: {
    workshop: exercises.filter((e) => e.type === 'workshop').length,
    community_server: exercises.filter((e) => e.type === 'community_server').length,
    theory: exercises.filter((e) => e.type === 'theory').length,
  },
  workshopMapsTotal: WORKSHOP_MAPS_CONFIG.length,
  workshopMapsVerified: WORKSHOP_MAPS_CONFIG.filter((m) => m.status === 'verified').length,
};