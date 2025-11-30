/**
 * Point d'entrée simplifié pour les exercices de coaching
 *
 * @example
 * import { exercises, getExercisesByCategory, WORKSHOP_MAPS_CONFIG } from '@/lib/coaching/exercises';
 */

export {
  // Base de données des exercices
  exercises,
  workshopMaps,

  // Fonctions pour les exercices
  getExercisesByCategory,
  getExercisesByDifficulty,
  getWorkshopExercises,
  getVerifiedWorkshopExercises,
  getExerciseById,
  getExerciseWorkshopUrl,
  getExerciseWorkshopInfo,

  // Statistiques
  exerciseStats,

  // Types
  type ExerciseCategory,
  type EnrichedExercise,

  // Workshop Maps (re-export depuis config)
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
} from './exercises/index';

// Réexport du type de base
export type { Exercise } from './types';