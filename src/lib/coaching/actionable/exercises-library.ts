/**
 * Bibliothèque d'exercices enrichie pour CS2
 *
 * Chaque exercice est lié à:
 * - Des workshop maps réels avec Steam IDs
 * - Des faiblesses spécifiques
 * - Des niveaux de difficulté
 * - Des objectifs mesurables
 */

import { ExerciseType, RecommendedExercise, ExerciseGoal } from './types';
import { InsightCategory } from './types';

// ============================================
// WORKSHOP MAPS DATABASE
// ============================================

export interface WorkshopMap {
  id: string;
  steamId: string;
  name: string;
  author: string;
  description: string;
  category: InsightCategory[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  /** URL directe Steam */
  url: string;
  /** Tags pour matching */
  tags: string[];
  /** Instructions spécifiques */
  instructions: string[];
  /** Objectifs suggérés */
  suggestedGoals: ExerciseGoal[];
}

/**
 * Base de données des workshop maps CS2 populaires et efficaces
 */
export const WORKSHOP_MAPS: WorkshopMap[] = [
  // ============================================
  // AIM TRAINING
  // ============================================
  {
    id: 'aim_botz',
    steamId: '3200944557',
    name: 'Aim Botz - Ultimate',
    author: 'uLLetical',
    description: 'La map d\'entraînement aim la plus populaire. Bots statiques et mobiles pour pratiquer le flick et le tracking.',
    category: ['aim'],
    difficulty: 'beginner',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3200944557',
    tags: ['aim', 'flick', 'tracking', 'warmup', 'crosshair_placement'],
    instructions: [
      'Commence par 100 kills en mode statique pour le warmup',
      'Active le mouvement des bots pour le tracking',
      'Focus sur le placement de viseur à hauteur de tête',
      'Varie les armes: AK-47, M4A4, Deagle',
    ],
    suggestedGoals: [
      { metric: 'Kills en 5 minutes', target: 150, unit: 'kills' },
      { metric: 'Headshot rate', target: 70, unit: '%' },
    ],
  },
  {
    id: 'fast_aim_reflex',
    steamId: '3164847659',
    name: 'Fast Aim / Reflex Training',
    author: 'yolokas',
    description: 'Entraînement de réflexes avec des cibles qui apparaissent rapidement. Excellent pour améliorer le temps de réaction.',
    category: ['aim'],
    difficulty: 'intermediate',
    estimatedDuration: 10,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3164847659',
    tags: ['aim', 'reflex', 'reaction_time', 'flick'],
    instructions: [
      'Commence en mode "Normal" pour le warmup',
      'Passe en mode "Fast" quand tu es chaud',
      'Essaie de battre ton meilleur score',
      'Focus sur la précision plutôt que la vitesse au début',
    ],
    suggestedGoals: [
      { metric: 'Score mode Fast', target: 25, unit: 'score' },
      { metric: 'Temps de réaction moyen', target: 250, unit: 'ms' },
    ],
  },
  {
    id: 'recoil_master',
    steamId: '3201431560',
    name: 'Recoil Master - Spray Control',
    author: 'uLLetical',
    description: 'Apprends et maîtrise les patterns de recul de toutes les armes CS2.',
    category: ['aim'],
    difficulty: 'beginner',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3201431560',
    tags: ['aim', 'spray', 'recoil', 'spray_control'],
    instructions: [
      'Commence par l\'AK-47 - l\'arme la plus importante',
      'Utilise le guide visuel pour apprendre le pattern',
      'Désactive le guide une fois le pattern mémorisé',
      'Pratique le spray transfer entre cibles',
    ],
    suggestedGoals: [
      { metric: 'Précision spray AK-47', target: 80, unit: '%' },
      { metric: 'Précision spray M4A4', target: 85, unit: '%' },
    ],
  },
  {
    id: 'yprac_aim_trainer',
    steamId: '3152123968',
    name: 'YPrac - Aim Trainer',
    author: 'Yesber',
    description: 'Trainer complet avec plusieurs modes: tracking, flick, micro-adjustments.',
    category: ['aim'],
    difficulty: 'intermediate',
    estimatedDuration: 20,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3152123968',
    tags: ['aim', 'tracking', 'flick', 'micro_adjust', 'comprehensive'],
    instructions: [
      'Mode Tracking pour améliorer le suivi de cible',
      'Mode Flick pour les réflexes',
      'Mode Micro pour les ajustements fins',
      'Alterne entre les modes pour un entraînement complet',
    ],
    suggestedGoals: [
      { metric: 'Score Tracking', target: 80, unit: 'score' },
      { metric: 'Score Flick', target: 75, unit: 'score' },
    ],
  },

  // ============================================
  // PREFIRE / ANGLES
  // ============================================
  {
    id: 'prefire_dust2',
    steamId: '3154138555',
    name: 'YPrac - Dust 2 Prefire',
    author: 'Yesber',
    description: 'Pratique les prefires sur tous les angles de Dust 2.',
    category: ['aim', 'positioning'],
    difficulty: 'intermediate',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154138555',
    tags: ['prefire', 'angles', 'dust2', 'positioning', 'crosshair_placement'],
    instructions: [
      'Commence côté T puis CT',
      'Apprends les timings de peek standards',
      'Focus sur le placement de crosshair avant le peek',
      'Pratique les angles les plus communs en priorité',
    ],
    suggestedGoals: [
      { metric: 'Completion rate', target: 90, unit: '%' },
      { metric: 'Headshot rate', target: 60, unit: '%' },
    ],
  },
  {
    id: 'prefire_mirage',
    steamId: '3154139071',
    name: 'YPrac - Mirage Prefire',
    author: 'Yesber',
    description: 'Pratique les prefires sur tous les angles de Mirage.',
    category: ['aim', 'positioning'],
    difficulty: 'intermediate',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154139071',
    tags: ['prefire', 'angles', 'mirage', 'positioning', 'crosshair_placement'],
    instructions: [
      'Focus sur A site et mid en priorité',
      'Apprends les angles de Tetris/Jungle',
      'Pratique les peeks sur B Apartments',
      'Travaille les angles de Window/Connector',
    ],
    suggestedGoals: [
      { metric: 'Completion rate', target: 90, unit: '%' },
      { metric: 'Headshot rate', target: 60, unit: '%' },
    ],
  },
  {
    id: 'prefire_inferno',
    steamId: '3154139604',
    name: 'YPrac - Inferno Prefire',
    author: 'Yesber',
    description: 'Pratique les prefires sur tous les angles d\'Inferno.',
    category: ['aim', 'positioning'],
    difficulty: 'intermediate',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154139604',
    tags: ['prefire', 'angles', 'inferno', 'positioning', 'crosshair_placement'],
    instructions: [
      'Apprends les angles de Banana',
      'Pratique les peeks sur A site (pit, graveyard)',
      'Travaille les angles de Apartments',
      'Focus sur les positions de post-plant',
    ],
    suggestedGoals: [
      { metric: 'Completion rate', target: 90, unit: '%' },
      { metric: 'Headshot rate', target: 60, unit: '%' },
    ],
  },
  {
    id: 'prefire_anubis',
    steamId: '3154140069',
    name: 'YPrac - Anubis Prefire',
    author: 'Yesber',
    description: 'Pratique les prefires sur tous les angles d\'Anubis.',
    category: ['aim', 'positioning'],
    difficulty: 'intermediate',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154140069',
    tags: ['prefire', 'angles', 'anubis', 'positioning', 'crosshair_placement'],
    instructions: [
      'Apprends les angles uniques d\'Anubis',
      'Focus sur mid control',
      'Pratique les peeks sur les sites',
      'Travaille les angles de Canal',
    ],
    suggestedGoals: [
      { metric: 'Completion rate', target: 85, unit: '%' },
      { metric: 'Headshot rate', target: 55, unit: '%' },
    ],
  },
  {
    id: 'prefire_ancient',
    steamId: '3154140502',
    name: 'YPrac - Ancient Prefire',
    author: 'Yesber',
    description: 'Pratique les prefires sur tous les angles d\'Ancient.',
    category: ['aim', 'positioning'],
    difficulty: 'advanced',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154140502',
    tags: ['prefire', 'angles', 'ancient', 'positioning', 'crosshair_placement'],
    instructions: [
      'Map complexe - prends ton temps',
      'Focus sur les angles de mid',
      'Apprends les positions de A site',
      'Travaille les rotations B',
    ],
    suggestedGoals: [
      { metric: 'Completion rate', target: 85, unit: '%' },
      { metric: 'Headshot rate', target: 55, unit: '%' },
    ],
  },
  {
    id: 'prefire_nuke',
    steamId: '3154140908',
    name: 'YPrac - Nuke Prefire',
    author: 'Yesber',
    description: 'Pratique les prefires sur tous les angles de Nuke.',
    category: ['aim', 'positioning'],
    difficulty: 'advanced',
    estimatedDuration: 15,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154140908',
    tags: ['prefire', 'angles', 'nuke', 'positioning', 'crosshair_placement'],
    instructions: [
      'Nuke est vertical - adapte ta visée',
      'Focus sur les angles de Ramp et Outside',
      'Apprends les positions de Heaven/Hell',
      'Pratique le contrôle de Secret',
    ],
    suggestedGoals: [
      { metric: 'Completion rate', target: 80, unit: '%' },
      { metric: 'Headshot rate', target: 50, unit: '%' },
    ],
  },

  // ============================================
  // UTILITY TRAINING
  // ============================================
  {
    id: 'yprac_mirage_utility',
    steamId: '3154974703',
    name: 'YPrac - Mirage Utility',
    author: 'Yesber',
    description: 'Apprends toutes les smokes, flashes et molotovs de Mirage.',
    category: ['utility'],
    difficulty: 'beginner',
    estimatedDuration: 25,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154974703',
    tags: ['utility', 'smoke', 'flash', 'molotov', 'mirage', 'lineup'],
    instructions: [
      'Commence par les 5 smokes essentielles',
      'Apprends les pop flashes de A et B',
      'Pratique les molotovs de clear',
      'Mémorise les lineups faciles d\'abord',
    ],
    suggestedGoals: [
      { metric: 'Smokes maîtrisées', target: 10, unit: 'lineups' },
      { metric: 'Flashes maîtrisées', target: 5, unit: 'lineups' },
    ],
  },
  {
    id: 'yprac_dust2_utility',
    steamId: '3154974184',
    name: 'YPrac - Dust 2 Utility',
    author: 'Yesber',
    description: 'Apprends toutes les smokes, flashes et molotovs de Dust 2.',
    category: ['utility'],
    difficulty: 'beginner',
    estimatedDuration: 20,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154974184',
    tags: ['utility', 'smoke', 'flash', 'molotov', 'dust2', 'lineup'],
    instructions: [
      'Apprends les smokes de cross mid',
      'Pratique les smokes de Long/Short',
      'Maîtrise les pop flashes de B',
      'Travaille les molotovs de car/site',
    ],
    suggestedGoals: [
      { metric: 'Smokes maîtrisées', target: 8, unit: 'lineups' },
      { metric: 'Flashes maîtrisées', target: 4, unit: 'lineups' },
    ],
  },
  {
    id: 'yprac_inferno_utility',
    steamId: '3154975193',
    name: 'YPrac - Inferno Utility',
    author: 'Yesber',
    description: 'Apprends toutes les smokes, flashes et molotovs d\'Inferno.',
    category: ['utility'],
    difficulty: 'intermediate',
    estimatedDuration: 30,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154975193',
    tags: ['utility', 'smoke', 'flash', 'molotov', 'inferno', 'lineup'],
    instructions: [
      'Inferno requiert beaucoup d\'utility',
      'Apprends les smokes de Banana en priorité',
      'Pratique les exécutes A complètes',
      'Maîtrise les one-way smokes',
    ],
    suggestedGoals: [
      { metric: 'Smokes maîtrisées', target: 12, unit: 'lineups' },
      { metric: 'Flashes maîtrisées', target: 6, unit: 'lineups' },
    ],
  },
  {
    id: 'yprac_anubis_utility',
    steamId: '3154975649',
    name: 'YPrac - Anubis Utility',
    author: 'Yesber',
    description: 'Apprends toutes les smokes, flashes et molotovs d\'Anubis.',
    category: ['utility'],
    difficulty: 'intermediate',
    estimatedDuration: 25,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3154975649',
    tags: ['utility', 'smoke', 'flash', 'molotov', 'anubis', 'lineup'],
    instructions: [
      'Anubis a des lineups uniques',
      'Focus sur le contrôle de mid',
      'Apprends les smokes de Canal',
      'Pratique les molotovs de site',
    ],
    suggestedGoals: [
      { metric: 'Smokes maîtrisées', target: 8, unit: 'lineups' },
      { metric: 'Flashes maîtrisées', target: 4, unit: 'lineups' },
    ],
  },
  {
    id: 'crashz_crosshair',
    steamId: '3251786722',
    name: 'crashz\' Crosshair Generator v4',
    author: 'crashz',
    description: 'Générateur de crosshair avec presets de pros. Trouve le crosshair parfait pour toi.',
    category: ['aim'],
    difficulty: 'beginner',
    estimatedDuration: 10,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3251786722',
    tags: ['crosshair', 'settings', 'customization'],
    instructions: [
      'Teste les crosshairs des pros',
      'Ajuste la taille selon ta résolution',
      'Essaie différentes couleurs pour la visibilité',
      'Exporte ton crosshair préféré',
    ],
    suggestedGoals: [
      { metric: 'Crosshairs testés', target: 10, unit: 'crosshairs' },
    ],
  },

  // ============================================
  // MOVEMENT
  // ============================================
  {
    id: 'kz_maps',
    steamId: '3074758439',
    name: 'KZ Climb Maps Collection',
    author: 'Various',
    description: 'Maps de climb pour améliorer le movement et le strafe jumping.',
    category: ['positioning', 'timing'],
    difficulty: 'advanced',
    estimatedDuration: 30,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3074758439',
    tags: ['movement', 'kz', 'strafe', 'bunnyhop', 'advanced'],
    instructions: [
      'Commence par les maps faciles (tier 1-2)',
      'Apprends le strafe jumping de base',
      'Progresse vers les maps plus difficiles',
      'Focus sur la fluidité plutôt que la vitesse',
    ],
    suggestedGoals: [
      { metric: 'Maps tier 1 complétées', target: 5, unit: 'maps' },
      { metric: 'Temps sur kz_beginnerblock', target: 180, unit: 's' },
    ],
  },
  {
    id: 'surf_beginner',
    steamId: '3120188122',
    name: 'Surf Beginner Maps',
    author: 'Various',
    description: 'Maps de surf pour débutants. Améliore ta compréhension du movement CS2.',
    category: ['positioning'],
    difficulty: 'intermediate',
    estimatedDuration: 20,
    url: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=3120188122',
    tags: ['movement', 'surf', 'strafe', 'beginner'],
    instructions: [
      'Apprends les bases du surf',
      'Ne touche pas W en surfant',
      'Utilise A/D pour diriger',
      'Pratique les transitions entre ramps',
    ],
    suggestedGoals: [
      { metric: 'surf_beginner complétée', target: 1, unit: 'completion' },
    ],
  },
];

// ============================================
// COMMUNITY SERVERS
// ============================================

export interface CommunityServerType {
  id: string;
  name: string;
  description: string;
  category: InsightCategory[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  howToFind: string;
  tags: string[];
  instructions: string[];
  suggestedDuration: number;
  suggestedGoals: ExerciseGoal[];
}

export const COMMUNITY_SERVERS: CommunityServerType[] = [
  {
    id: 'dm_ffa',
    name: 'DM FFA (Free For All)',
    description: 'Deathmatch contre tous. Excellent pour le warmup et l\'amélioration de l\'aim.',
    category: ['aim'],
    difficulty: 'beginner',
    howToFind: 'Cherche "FFA" ou "DM" dans le browser de serveurs communautaires',
    tags: ['dm', 'ffa', 'warmup', 'aim'],
    instructions: [
      'Joue 15-20 min en warmup',
      'Focus sur le headshot, pas le K/D',
      'Utilise principalement AK-47/M4',
      'Pratique les counter-strafes',
    ],
    suggestedDuration: 20,
    suggestedGoals: [
      { metric: 'Headshot %', target: 50, unit: '%' },
      { metric: 'K/D ratio', target: 1.5, unit: 'ratio' },
    ],
  },
  {
    id: 'dm_hs_only',
    name: 'DM Headshot Only',
    description: 'Deathmatch où seuls les headshots comptent. Force l\'amélioration du placement de viseur.',
    category: ['aim'],
    difficulty: 'intermediate',
    howToFind: 'Cherche "HS only" ou "Headshot" dans le browser de serveurs',
    tags: ['dm', 'headshot', 'aim', 'crosshair_placement'],
    instructions: [
      'Focus 100% sur les headshots',
      'Prends ton temps pour viser',
      'Travaille le placement de crosshair',
      'Évite de spray - tap ou burst',
    ],
    suggestedDuration: 15,
    suggestedGoals: [
      { metric: 'Kills par session', target: 50, unit: 'kills' },
    ],
  },
  {
    id: 'retakes',
    name: 'Retakes Servers',
    description: 'Pratique les situations de retake. Excellent pour le positionnement et les décisions.',
    category: ['positioning', 'decision', 'utility', 'timing'],
    difficulty: 'intermediate',
    howToFind: 'Cherche "Retakes" dans le browser de serveurs',
    tags: ['retakes', 'positioning', 'teamplay', 'clutch'],
    instructions: [
      'Apprends les positions de défense/attaque',
      'Communique avec ton équipe',
      'Utilise tes utilités intelligemment',
      'Pratique les clutchs',
    ],
    suggestedDuration: 30,
    suggestedGoals: [
      { metric: 'Win rate retakes', target: 40, unit: '%' },
      { metric: 'Utility utilisée', target: 80, unit: '%' },
    ],
  },
  {
    id: 'executes',
    name: 'Executes Servers',
    description: 'Pratique les exécutions de site en équipe. Parfait pour l\'utility et le timing.',
    category: ['utility', 'timing', 'positioning'],
    difficulty: 'intermediate',
    howToFind: 'Cherche "Executes" ou "Execute" dans le browser de serveurs',
    tags: ['executes', 'utility', 'teamplay', 'coordination'],
    instructions: [
      'Apprends les rôles dans les exécutes',
      'Lance tes utilités au bon timing',
      'Coordonne avec l\'équipe',
      'Adapte-toi aux situations',
    ],
    suggestedDuration: 25,
    suggestedGoals: [
      { metric: 'Utility utilisée à temps', target: 90, unit: '%' },
      { metric: 'Entry success', target: 50, unit: '%' },
    ],
  },
  {
    id: '1v1_arena',
    name: '1v1 Arena',
    description: 'Duels en 1v1 pour pratiquer les duels purs et le timing.',
    category: ['aim', 'timing', 'decision'],
    difficulty: 'intermediate',
    howToFind: 'Cherche "1v1" ou "Arena" dans le browser de serveurs',
    tags: ['1v1', 'duel', 'aim', 'timing'],
    instructions: [
      'Focus sur gagner le premier duel',
      'Travaille tes prefires',
      'Analyse tes erreurs entre les rounds',
      'Varie tes approches',
    ],
    suggestedDuration: 20,
    suggestedGoals: [
      { metric: 'Win rate', target: 55, unit: '%' },
      { metric: 'First duel win', target: 60, unit: '%' },
    ],
  },
  {
    id: 'awp_dm',
    name: 'AWP Deathmatch',
    description: 'DM AWP only pour pratiquer le sniping.',
    category: ['aim'],
    difficulty: 'intermediate',
    howToFind: 'Cherche "AWP" ou "AWP DM" dans le browser de serveurs',
    tags: ['awp', 'sniper', 'aim', 'positioning'],
    instructions: [
      'Travaille le quickscope',
      'Pratique le positioning d\'AWPer',
      'Améliore tes flicks',
      'Apprends à tenir les angles',
    ],
    suggestedDuration: 15,
    suggestedGoals: [
      { metric: 'Hit rate', target: 45, unit: '%' },
      { metric: 'K/D ratio', target: 1.2, unit: 'ratio' },
    ],
  },
  {
    id: 'pistol_dm',
    name: 'Pistol Deathmatch',
    description: 'DM pistol only pour maîtriser les pistolets.',
    category: ['aim', 'economy'],
    difficulty: 'beginner',
    howToFind: 'Cherche "Pistol" dans le browser de serveurs',
    tags: ['pistol', 'aim', 'movement', 'eco_rounds'],
    instructions: [
      'Pratique le USP-S/Glock',
      'Maîtrise le Deagle',
      'Travaille l\'ADAD spam',
      'Focus sur les headshots',
    ],
    suggestedDuration: 15,
    suggestedGoals: [
      { metric: 'Headshot %', target: 60, unit: '%' },
      { metric: 'Deagle accuracy', target: 40, unit: '%' },
    ],
  },
];

// ============================================
// THEORY / DEMO REVIEW
// ============================================

export interface TheoryExercise {
  id: string;
  name: string;
  description: string;
  category: InsightCategory[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'video' | 'article' | 'demo_review' | 'vod_review';
  estimatedDuration: number;
  instructions: string[];
  resources?: string[];
  suggestedGoals: ExerciseGoal[];
}

export const THEORY_EXERCISES: TheoryExercise[] = [
  {
    id: 'self_demo_review',
    name: 'Revue de ta propre démo',
    description: 'Analyse tes propres parties pour identifier tes erreurs récurrentes.',
    category: ['positioning', 'decision', 'timing'],
    difficulty: 'intermediate',
    type: 'demo_review',
    estimatedDuration: 30,
    instructions: [
      'Regarde chaque mort et analyse pourquoi',
      'Note les positions où tu meurs souvent',
      'Identifie les patterns dans tes erreurs',
      'Compare tes décisions à ce que tu aurais dû faire',
      'Focus sur 2-3 points à améliorer',
    ],
    suggestedGoals: [
      { metric: 'Erreurs identifiées', target: 5, unit: 'erreurs' },
      { metric: 'Actions correctives notées', target: 3, unit: 'actions' },
    ],
  },
  {
    id: 'pro_pov_analysis',
    name: 'Analyse POV Pro',
    description: 'Regarde des POV de joueurs pros pour apprendre leurs techniques.',
    category: ['positioning', 'utility', 'decision', 'timing'],
    difficulty: 'intermediate',
    type: 'vod_review',
    estimatedDuration: 25,
    instructions: [
      'Choisis un pro qui joue ton rôle',
      'Observe son placement de crosshair',
      'Note ses positions et rotations',
      'Analyse son utilisation des utilités',
      'Compare à ce que tu fais dans les mêmes situations',
    ],
    resources: [
      'HLTV.org pour les VODs',
      'Twitch clips de pros',
      'YouTube analyses',
    ],
    suggestedGoals: [
      { metric: 'Techniques notées', target: 5, unit: 'techniques' },
      { metric: 'Positions apprises', target: 3, unit: 'positions' },
    ],
  },
  {
    id: 'economy_study',
    name: 'Étude de l\'économie CS2',
    description: 'Comprends les règles d\'économie pour optimiser tes achats.',
    category: ['economy'],
    difficulty: 'beginner',
    type: 'article',
    estimatedDuration: 20,
    instructions: [
      'Apprends les loss bonus',
      'Comprends quand force buy vs save',
      'Mémorise les prix des armes clés',
      'Apprends à calculer l\'économie ennemie',
    ],
    suggestedGoals: [
      { metric: 'Quiz économie', target: 80, unit: '%' },
    ],
  },
  {
    id: 'map_callouts',
    name: 'Apprentissage des callouts',
    description: 'Mémorise tous les callouts des maps que tu joues.',
    category: ['positioning'],
    difficulty: 'beginner',
    type: 'article',
    estimatedDuration: 15,
    instructions: [
      'Apprends les callouts de ta map principale',
      'Utilise des images de référence',
      'Pratique en jeu pour mémoriser',
      'Communique les callouts en match',
    ],
    suggestedGoals: [
      { metric: 'Callouts mémorisés', target: 30, unit: 'callouts' },
    ],
  },
  {
    id: 'clutch_analysis',
    name: 'Analyse de situations de clutch',
    description: 'Étudie les meilleures décisions en situation de clutch.',
    category: ['decision', 'timing'],
    difficulty: 'advanced',
    type: 'demo_review',
    estimatedDuration: 25,
    instructions: [
      'Regarde des clutchs de pros',
      'Analyse la gestion du temps',
      'Note les fakes et mind games',
      'Comprends quand fight vs save',
      'Applique en situation similaire',
    ],
    suggestedGoals: [
      { metric: 'Clutchs analysés', target: 10, unit: 'clutchs' },
      { metric: 'Techniques apprises', target: 5, unit: 'techniques' },
    ],
  },
];

// ============================================
// EXERCISE MATCHING
// ============================================

export interface ExerciseMatch {
  exercise: RecommendedExercise;
  relevanceScore: number;
  matchReason: string;
}

/**
 * Trouve les meilleurs exercices pour une faiblesse donnée
 */
export function findExercisesForWeakness(
  weakness: string,
  category: InsightCategory,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  limit: number = 5
): ExerciseMatch[] {
  const matches: ExerciseMatch[] = [];
  const weaknessLower = weakness.toLowerCase();

  // Search workshop maps
  for (const map of WORKSHOP_MAPS) {
    if (!map.category.includes(category)) continue;

    let relevance = 0;
    let reason = '';

    // Check tags match
    for (const tag of map.tags) {
      if (weaknessLower.includes(tag) || tag.includes(weaknessLower)) {
        relevance += 30;
        reason = `Tag match: ${tag}`;
      }
    }

    // Check description
    if (map.description.toLowerCase().includes(weaknessLower)) {
      relevance += 20;
      reason = reason || 'Description match';
    }

    // Difficulty bonus
    if (map.difficulty === difficulty) {
      relevance += 15;
    } else if (
      (difficulty === 'intermediate' && map.difficulty === 'beginner') ||
      (difficulty === 'intermediate' && map.difficulty === 'advanced')
    ) {
      relevance += 5;
    }

    // Category match bonus
    if (map.category.includes(category)) {
      relevance += 25;
    }

    if (relevance > 0) {
      matches.push({
        exercise: workshopMapToExercise(map, relevance),
        relevanceScore: relevance,
        matchReason: reason,
      });
    }
  }

  // Search community servers
  for (const server of COMMUNITY_SERVERS) {
    if (!server.category.includes(category)) continue;

    let relevance = 0;
    let reason = '';

    for (const tag of server.tags) {
      if (weaknessLower.includes(tag) || tag.includes(weaknessLower)) {
        relevance += 25;
        reason = `Tag match: ${tag}`;
      }
    }

    if (server.description.toLowerCase().includes(weaknessLower)) {
      relevance += 15;
    }

    if (server.difficulty === difficulty) {
      relevance += 10;
    }

    if (server.category.includes(category)) {
      relevance += 20;
    }

    if (relevance > 0) {
      matches.push({
        exercise: communityServerToExercise(server, relevance),
        relevanceScore: relevance,
        matchReason: reason,
      });
    }
  }

  // Search theory exercises
  for (const theory of THEORY_EXERCISES) {
    if (!theory.category.includes(category)) continue;

    let relevance = 0;
    let reason = '';

    if (theory.description.toLowerCase().includes(weaknessLower)) {
      relevance += 20;
      reason = 'Description match';
    }

    if (theory.difficulty === difficulty) {
      relevance += 10;
    }

    if (theory.category.includes(category)) {
      relevance += 15;
    }

    if (relevance > 0) {
      matches.push({
        exercise: theoryToExercise(theory, relevance),
        relevanceScore: relevance,
        matchReason: reason,
      });
    }
  }

  // Sort by relevance and limit
  return matches.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit);
}

/**
 * Get exercises by category
 */
export function getExercisesByCategory(
  category: InsightCategory,
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): RecommendedExercise[] {
  const exercises: RecommendedExercise[] = [];

  for (const map of WORKSHOP_MAPS) {
    if (!map.category.includes(category)) continue;
    if (difficulty && map.difficulty !== difficulty) continue;
    exercises.push(workshopMapToExercise(map, 80));
  }

  for (const server of COMMUNITY_SERVERS) {
    if (!server.category.includes(category)) continue;
    if (difficulty && server.difficulty !== difficulty) continue;
    exercises.push(communityServerToExercise(server, 70));
  }

  for (const theory of THEORY_EXERCISES) {
    if (!theory.category.includes(category)) continue;
    if (difficulty && theory.difficulty !== difficulty) continue;
    exercises.push(theoryToExercise(theory, 60));
  }

  return exercises;
}

// ============================================
// CONVERTERS
// ============================================

function workshopMapToExercise(map: WorkshopMap, relevance: number): RecommendedExercise {
  return {
    id: map.id,
    name: map.name,
    description: map.description,
    type: 'workshop_map',
    duration: map.estimatedDuration,
    difficulty: map.difficulty,
    relevanceScore: relevance,
    workshopId: map.steamId,
    workshopUrl: map.url,
    instructions: map.instructions,
    goals: map.suggestedGoals,
  };
}

function communityServerToExercise(server: CommunityServerType, relevance: number): RecommendedExercise {
  return {
    id: server.id,
    name: server.name,
    description: server.description,
    type: 'community_server',
    duration: server.suggestedDuration,
    difficulty: server.difficulty,
    relevanceScore: relevance,
    serverType: server.howToFind,
    instructions: server.instructions,
    goals: server.suggestedGoals,
  };
}

function theoryToExercise(theory: TheoryExercise, relevance: number): RecommendedExercise {
  return {
    id: theory.id,
    name: theory.name,
    description: theory.description,
    type: theory.type === 'demo_review' ? 'demo_review' : 'theory',
    duration: theory.estimatedDuration,
    difficulty: theory.difficulty,
    relevanceScore: relevance,
    instructions: theory.instructions,
    goals: theory.suggestedGoals,
  };
}

// ============================================
// DAILY ROUTINE GENERATOR
// ============================================

export interface DailyRoutineConfig {
  totalTime: number; // minutes disponibles
  focusCategory: InsightCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  includeWarmup: boolean;
}

export function generateDailyRoutine(config: DailyRoutineConfig): {
  warmup: RecommendedExercise[];
  main: RecommendedExercise[];
  cooldown: RecommendedExercise[];
  totalDuration: number;
} {
  const { totalTime, focusCategory, difficulty, includeWarmup } = config;

  const warmup: RecommendedExercise[] = [];
  const main: RecommendedExercise[] = [];
  const cooldown: RecommendedExercise[] = [];

  let remainingTime = totalTime;

  // Warmup (if enabled, ~20% of total time)
  if (includeWarmup && remainingTime >= 20) {
    const warmupTime = Math.min(15, Math.floor(remainingTime * 0.2));
    remainingTime -= warmupTime;

    // Add Aim Botz for warmup
    const aimBotz = WORKSHOP_MAPS.find((m) => m.id === 'aim_botz');
    if (aimBotz) {
      warmup.push({
        ...workshopMapToExercise(aimBotz, 100),
        duration: warmupTime,
        instructions: ['Warmup rapide: 100-200 kills', 'Focus sur le mouvement et le crosshair placement'],
      });
    }
  }

  // Main training (~70% of remaining time)
  const mainTime = Math.floor(remainingTime * 0.7);
  remainingTime -= mainTime;

  // Get exercises for focus category
  const focusExercises = getExercisesByCategory(focusCategory, difficulty);
  let usedTime = 0;

  for (const exercise of focusExercises) {
    if (usedTime + exercise.duration <= mainTime) {
      main.push(exercise);
      usedTime += exercise.duration;
    }
    if (usedTime >= mainTime) break;
  }

  // Cooldown (~10% of total time or remaining)
  if (remainingTime >= 10) {
    // Light DM or theory
    const dmServer = COMMUNITY_SERVERS.find((s) => s.id === 'dm_ffa');
    if (dmServer) {
      cooldown.push({
        ...communityServerToExercise(dmServer, 80),
        duration: Math.min(10, remainingTime),
        instructions: ['Session légère pour finir', 'Pas de pression sur le K/D'],
      });
    }
  }

  return {
    warmup,
    main,
    cooldown,
    totalDuration: warmup.reduce((a, e) => a + e.duration, 0) +
      main.reduce((a, e) => a + e.duration, 0) +
      cooldown.reduce((a, e) => a + e.duration, 0),
  };
}
