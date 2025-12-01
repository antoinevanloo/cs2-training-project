/**
 * Exercices prédéfinis pour le système de training
 *
 * Bibliothèque d'exercices organisés par catégorie et difficulté
 */

import type { Exercise, ExerciseType, ExerciseDifficulty } from './types';
import type { AnalysisCategory } from '@/lib/preferences/types';

// ============================================
// AIM EXERCISES
// ============================================

export const AIM_EXERCISES: Exercise[] = [
  {
    id: 'aim-gridshot',
    name: 'Gridshot',
    description: 'Exercice de réactivité et de tracking sur Aim Lab/Kovaaks',
    type: 'aim_training',
    category: 'aim',
    difficulty: 'beginner',
    duration: 10,
    instructions: [
      'Ouvre Aim Lab ou Kovaaks',
      'Sélectionne Gridshot',
      'Joue 3-5 runs',
      'Focus sur la précision, pas la vitesse',
    ],
    tips: [
      'Garde ta main détendue',
      'Utilise ton bras, pas seulement le poignet',
      'Vise la constance plutôt que le high score',
    ],
    metrics: [
      { id: 'score', name: 'Score', unit: 'points' },
      { id: 'accuracy', name: 'Précision', unit: '%', targetValue: 95 },
    ],
    goals: [
      { id: 'g1', description: 'Atteindre 90% de précision', targetValue: 90, unit: '%', timeframe: 'session' },
    ],
    tags: ['warmup', 'aim', 'reflexes', 'aim-lab'],
  },
  {
    id: 'aim-headshot-only-dm',
    name: 'Headshot Only DM',
    description: 'Deathmatch sur serveurs headshot only pour entraîner la précision',
    type: 'deathmatch',
    category: 'aim',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Rejoins un serveur HS only (Brutalcs, etc.)',
      'Joue avec AK-47 ou M4',
      'Vise uniquement la tête',
      'Focus sur le crosshair placement',
    ],
    tips: [
      'Ne spam pas - tire quand tu es sûr',
      'Travaille le counter-strafe',
      'Garde ta crosshair au niveau de la tête',
    ],
    metrics: [
      { id: 'kills', name: 'Kills', unit: 'kills' },
      { id: 'hs_rate', name: 'HS Rate', unit: '%', targetValue: 60 },
    ],
    tags: ['aim', 'headshots', 'dm', 'community'],
  },
  {
    id: 'aim-spray-master',
    name: 'Spray Control Practice',
    description: 'Maîtrise les patterns de spray AK-47 et M4',
    type: 'spray_control',
    category: 'aim',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Charge la map "Recoil Master"',
      'Commence avec l\'AK-47',
      'Fais 50 sprays complets',
      'Passe au M4A4, puis M4A1-S',
    ],
    tips: [
      'Apprends le pattern par groupes de 10 balles',
      'Utilise le ghost pour corriger',
      'Varie la distance progressivement',
    ],
    workshopMap: {
      id: 'recoil-master',
      name: 'Recoil Master',
      steamUrl: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=419404847',
    },
    metrics: [
      { id: 'accuracy', name: 'Précision spray', unit: '%', targetValue: 80 },
    ],
    tags: ['aim', 'spray', 'workshop', 'recoil'],
    prerequisites: ['aim-gridshot'],
  },
  {
    id: 'aim-aim-botz',
    name: 'Aim Botz - 500 Kills',
    description: 'Entraînement classique de flicks et tracking sur bots',
    type: 'aim_training',
    category: 'aim',
    difficulty: 'beginner',
    duration: 20,
    instructions: [
      'Charge la map Aim Botz',
      'Active 100 bots',
      'Fais 500 kills avec AK-47',
      'Varie: one-taps, bursts, sprays',
    ],
    tips: [
      'Commence doucement, augmente la vitesse',
      'Focus 60% one-taps, 30% bursts, 10% sprays',
      'Bouge entre les kills pour simuler un match',
    ],
    workshopMap: {
      id: 'aim-botz',
      name: 'Aim Botz',
      steamUrl: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=243702660',
    },
    metrics: [
      { id: 'time', name: 'Temps pour 500 kills', unit: 'min', targetValue: 10 },
      { id: 'hs_rate', name: 'HS Rate', unit: '%', targetValue: 70 },
    ],
    tags: ['aim', 'warmup', 'workshop', 'bots'],
  },
];

// ============================================
// UTILITY EXERCISES
// ============================================

export const UTILITY_EXERCISES: Exercise[] = [
  {
    id: 'util-yprac-mirage',
    name: 'Yprac Mirage - Smokes & Flashes',
    description: 'Apprends les smokes et flashes essentiels sur Mirage',
    type: 'utility_practice',
    category: 'utility',
    difficulty: 'beginner',
    duration: 20,
    instructions: [
      'Charge la map yprac Mirage',
      'Mode Utility Practice',
      'Apprends 5 smokes essentiels',
      'Apprends 3 pop-flashes pour A et B',
    ],
    tips: [
      'Répète chaque lineup 10 fois',
      'Note les repères visuels',
      'Teste en match privé ensuite',
    ],
    workshopMap: {
      id: 'yprac-mirage',
      name: 'Yprac Mirage',
      steamUrl: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=2612857804',
    },
    goals: [
      { id: 'g1', description: 'Maîtriser 5 smokes', targetValue: 5, unit: 'smokes', timeframe: 'session' },
    ],
    tags: ['utility', 'smokes', 'flashes', 'mirage', 'yprac'],
  },
  {
    id: 'util-flash-practice',
    name: 'Pop-Flash Training',
    description: 'Maîtrise les pop-flashes pour les entrées',
    type: 'utility_practice',
    category: 'utility',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Utilise une map yprac de ta main map',
      'Pratique les pop-flashes pour chaque entrée',
      'Teste le timing avec un ami',
      'Vérifie que la flash arrive au bon moment',
    ],
    tips: [
      'Une bonne pop-flash éclate dès qu\'elle entre dans le champ de vision',
      'Varie entre right-click et left-click throws',
      'Combine avec un peek immédiat',
    ],
    metrics: [
      { id: 'lineups_learned', name: 'Lineups appris', unit: 'count', targetValue: 5 },
    ],
    tags: ['utility', 'flashes', 'entry', 'coordination'],
    prerequisites: ['util-yprac-mirage'],
  },
  {
    id: 'util-smoke-executes',
    name: 'Execute Smokes - Full Site',
    description: 'Apprends les smokes pour un execute complet',
    type: 'utility_practice',
    category: 'utility',
    difficulty: 'advanced',
    duration: 25,
    instructions: [
      'Choisis un site (ex: Mirage A)',
      'Apprends les 4-5 smokes nécessaires',
      'Pratique la séquence complète',
      'Chronomètre l\'execution',
    ],
    tips: [
      'Commence par les smokes les plus importants',
      'Coordonne avec ton équipe pour les timings',
      'Ajoute les molotovs et flashes ensuite',
    ],
    tags: ['utility', 'smokes', 'execute', 'team'],
    prerequisites: ['util-yprac-mirage'],
  },
];

// ============================================
// POSITIONING EXERCISES
// ============================================

export const POSITIONING_EXERCISES: Exercise[] = [
  {
    id: 'pos-prefire-practice',
    name: 'Prefire Practice',
    description: 'Entraîne-toi aux prefires sur les positions communes',
    type: 'movement',
    category: 'positioning',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Charge une map yprac avec prefire mode',
      'Pratique le prefire de chaque position',
      'Focus sur le timing du tir',
      'Combine mouvement et tir',
    ],
    tips: [
      'Le prefire doit être automatique',
      'Mémorise les positions map par map',
      'Counter-strafe avant de tirer',
    ],
    workshopMap: {
      id: 'yprac-prefire',
      name: 'Yprac Prefire',
      steamUrl: 'steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=2612857804',
    },
    tags: ['positioning', 'prefire', 'movement', 'yprac'],
  },
  {
    id: 'pos-angles-practice',
    name: 'Off-Angles Practice',
    description: 'Découvre et maîtrise des angles inhabituels',
    type: 'theory',
    category: 'positioning',
    difficulty: 'advanced',
    duration: 20,
    instructions: [
      'Charge ta main map en local',
      'Explore chaque site pour trouver des off-angles',
      'Note les positions intéressantes',
      'Teste-les contre des amis',
    ],
    tips: [
      'Un bon off-angle surprend l\'adversaire',
      'Change de position après chaque kill',
      'Combine avec des smokes pour plus d\'efficacité',
    ],
    tags: ['positioning', 'angles', 'creative', 'advanced'],
  },
  {
    id: 'pos-retake-practice',
    name: 'Retake Practice',
    description: 'Pratique les retakes en serveur communautaire',
    type: 'retake',
    category: 'positioning',
    difficulty: 'intermediate',
    duration: 20,
    instructions: [
      'Rejoins un serveur retake',
      'Joue 15-20 rounds',
      'Focus sur le timing et les trades',
      'Communique avec tes coéquipiers',
    ],
    tips: [
      'Ne rush pas - coordonne',
      'Utilise tes utilitaires',
      'Trade immédiatement tes coéquipiers',
    ],
    tags: ['positioning', 'retake', 'community', 'team'],
  },
];

// ============================================
// ECONOMY EXERCISES
// ============================================

export const ECONOMY_EXERCISES: Exercise[] = [
  {
    id: 'eco-theory',
    name: 'Théorie Économique CS2',
    description: 'Comprends le système économique de CS2',
    type: 'theory',
    category: 'economy',
    difficulty: 'beginner',
    duration: 15,
    instructions: [
      'Lis le guide économique',
      'Mémorise les règles de base',
      'Comprends quand force/eco/buy',
      'Apprends les loss bonuses',
    ],
    tips: [
      'Règle de base: 2000$ après buy = good',
      'Force seulement si l\'équipe peut',
      'Le plant = 300$ par joueur T',
    ],
    tags: ['economy', 'theory', 'fundamentals'],
  },
  {
    id: 'eco-scenarios',
    name: 'Scénarios Économiques',
    description: 'Pratique les décisions économiques dans différents scénarios',
    type: 'theory',
    category: 'economy',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Révise les scénarios classiques',
      'Score 0-2: que faire?',
      'Après pistol win: que faire?',
      'Score 10-12: comment gérer?',
    ],
    tips: [
      'Communique toujours ton argent',
      'Considère l\'économie de l\'équipe, pas juste la tienne',
      'Un AWP drop peut changer le round',
    ],
    tags: ['economy', 'theory', 'scenarios', 'decision'],
    prerequisites: ['eco-theory'],
  },
];

// ============================================
// TIMING EXERCISES
// ============================================

export const TIMING_EXERCISES: Exercise[] = [
  {
    id: 'timing-dm-counterstafe',
    name: 'Counter-Strafe DM',
    description: 'Maîtrise le counter-strafe en deathmatch',
    type: 'deathmatch',
    category: 'timing',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Rejoins un DM FFA',
      'Focus uniquement sur le counter-strafe',
      'Arrête-toi complètement avant chaque tir',
      'Utilise A-D ou D-A systématiquement',
    ],
    tips: [
      'Le but n\'est pas de faire des kills',
      'Chaque tir doit être en étant immobile',
      'Augmente progressivement ta vitesse',
    ],
    tags: ['timing', 'movement', 'dm', 'fundamentals'],
  },
  {
    id: 'timing-jiggle-peek',
    name: 'Jiggle Peek Practice',
    description: 'Maîtrise le jiggle peek pour l\'info',
    type: 'movement',
    category: 'timing',
    difficulty: 'intermediate',
    duration: 10,
    instructions: [
      'Charge une map offline',
      'Pratique le A-D rapide devant chaque angle',
      'L\'objectif: voir sans te faire toucher',
      'Augmente progressivement la vitesse',
    ],
    tips: [
      'Ne tire pas pendant le jiggle',
      'L\'info est plus importante que le kill',
      'Utilise-le contre les AWP',
    ],
    tags: ['timing', 'movement', 'peek', 'info'],
  },
];

// ============================================
// DECISION EXERCISES
// ============================================

export const DECISION_EXERCISES: Exercise[] = [
  {
    id: 'decision-demo-review',
    name: 'Demo Review - Tes Rounds Perdus',
    description: 'Analyse tes rounds perdus pour identifier les erreurs',
    type: 'demo_review',
    category: 'decision',
    difficulty: 'beginner',
    duration: 20,
    instructions: [
      'Ouvre une de tes dernières démos',
      'Identifie 3 rounds perdus',
      'Note le moment décisif de chaque round',
      'Réfléchis à ce que tu aurais pu faire',
    ],
    tips: [
      'Sois honnête avec toi-même',
      'Cherche les patterns répétitifs',
      'Focus sur tes décisions, pas celles des autres',
    ],
    tags: ['decision', 'demo', 'analysis', 'learning'],
  },
  {
    id: 'decision-clutch-scenarios',
    name: 'Clutch Scenarios Analysis',
    description: 'Apprends à gérer les situations de clutch',
    type: 'theory',
    category: 'decision',
    difficulty: 'intermediate',
    duration: 15,
    instructions: [
      'Étudie 5 situations de clutch classiques',
      '1v1 bomb planted',
      '1v2 time advantage',
      '1v3 info gathering',
      'Note les principes clés',
    ],
    tips: [
      'Isole les duels',
      'Utilise le temps à ton avantage',
      'Ne peek pas inutilement',
    ],
    tags: ['decision', 'clutch', 'theory', 'scenarios'],
  },
  {
    id: 'decision-pro-vod',
    name: 'Pro VOD Review',
    description: 'Analyse les décisions de joueurs professionnels',
    type: 'demo_review',
    category: 'decision',
    difficulty: 'advanced',
    duration: 30,
    instructions: [
      'Choisis un pro à ton rôle',
      'Regarde un match complet de son POV',
      'Note ses décisions clés',
      'Compare avec ce que tu aurais fait',
    ],
    tips: [
      'Pause et réfléchis avant chaque action',
      'Note le positionnement et les timings',
      'Observe l\'usage des utilitaires',
    ],
    tags: ['decision', 'pro', 'vod', 'learning', 'advanced'],
  },
];

// ============================================
// MENTAL EXERCISES
// ============================================

export const MENTAL_EXERCISES: Exercise[] = [
  {
    id: 'mental-warmup-routine',
    name: 'Mental Warmup',
    description: 'Routine de préparation mentale avant les matchs',
    type: 'mental',
    category: 'decision', // Mental affects decision making
    difficulty: 'beginner',
    duration: 5,
    instructions: [
      'Respire profondément 10 fois',
      'Visualise un bon round passé',
      'Définis ton objectif de session',
      'Rappelle-toi que c\'est un jeu',
    ],
    tips: [
      'Fais-le avant chaque session',
      'Hydrate-toi bien',
      'Étire tes poignets et ton cou',
    ],
    tags: ['mental', 'warmup', 'focus', 'quick'],
  },
  {
    id: 'mental-tilt-management',
    name: 'Gestion du Tilt',
    description: 'Techniques pour gérer le tilt et la frustration',
    type: 'mental',
    category: 'decision',
    difficulty: 'intermediate',
    duration: 10,
    instructions: [
      'Identifie tes triggers de tilt',
      'Prépare des réponses',
      'Pratique le "next round mentality"',
      'Apprends à prendre des pauses',
    ],
    tips: [
      'Le tilt = mauvaises décisions',
      'Respire entre les rounds',
      'Mute les toxiques immédiatement',
    ],
    tags: ['mental', 'tilt', 'emotions', 'focus'],
  },
];

// ============================================
// AGGREGATE
// ============================================

export const ALL_EXERCISES: Exercise[] = [
  ...AIM_EXERCISES,
  ...UTILITY_EXERCISES,
  ...POSITIONING_EXERCISES,
  ...ECONOMY_EXERCISES,
  ...TIMING_EXERCISES,
  ...DECISION_EXERCISES,
  ...MENTAL_EXERCISES,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getExerciseById(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}

export function getExercisesByCategory(category: AnalysisCategory): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.category === category);
}

export function getExercisesByDifficulty(difficulty: ExerciseDifficulty): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.difficulty === difficulty);
}

export function getExercisesByType(type: ExerciseType): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.type === type);
}

export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return ALL_EXERCISES.filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery) ||
      e.tags.some((t) => t.includes(lowerQuery))
  );
}

export function getWarmupExercises(): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.tags.includes('warmup'));
}

export function getQuickExercises(maxDuration: number = 15): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.duration <= maxDuration);
}
