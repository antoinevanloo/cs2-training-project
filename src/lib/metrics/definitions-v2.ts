/**
 * Définitions complètes des métriques CS2 Coach v2.0
 *
 * Ce fichier contient toutes les définitions de métriques incluant:
 * - Les métriques de base (performance, aim, positioning, etc.)
 * - Les nouvelles métriques Movement (counter-strafing, crouch, scope)
 * - Les nouvelles métriques Awareness (bomb, flash, info)
 * - Les nouvelles métriques Teamplay (trades, support, coordination)
 * - Les métriques Utility et Economy améliorées
 */

import { GranularityLevel } from '@/components/ui/GranularityBadge';

// =============================================================================
// TYPES
// =============================================================================

export type MetricCategory =
  | 'performance'
  | 'aim'
  | 'positioning'
  | 'utility'
  | 'economy'
  | 'timing'
  | 'decision'
  | 'movement'
  | 'awareness'
  | 'teamplay';

export type MetricSubcategory =
  | 'general'
  | 'flash'
  | 'smoke'
  | 'molotov'
  | 'he'
  | 'counter-strafe'
  | 'crouch'
  | 'scope'
  | 'bomb'
  | 'info'
  | 'trading'
  | 'support'
  | 'coordination'
  | 'entry'
  | 'clutch'
  | 'economy-decision'
  | 'equipment';

export type MetricFormat = 'decimal' | 'percentage' | 'integer' | 'ratio' | 'time' | 'speed';

export interface InterpretationThreshold {
  max: number;
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  description: string;
}

export interface MetricDefinition {
  id: string;
  name: string;
  shortName: string;
  category: MetricCategory;
  subcategory?: MetricSubcategory;

  // Explication
  description: string;
  detailedDescription?: string;
  formula?: string;
  formulaExplanation?: string;

  // Comment interpréter les valeurs
  interpretation: InterpretationThreshold[];

  // À quelle échelle cette métrique peut être calculée
  availableGranularities: GranularityLevel[];
  defaultGranularity: GranularityLevel;

  // Comment cette métrique est agrégée
  aggregationMethod?: 'average' | 'sum' | 'weighted' | 'last';

  // Formatage
  format: MetricFormat;
  unit?: string;
  decimals?: number;

  // Si plus haut est meilleur (ou inversement)
  higherIsBetter?: boolean;

  // Liens vers d'autres ressources
  learnMoreUrl?: string;

  // Feature flag (si la métrique dépend d'une feature)
  featureFlag?: string;

  // Nouveau en v2
  isNew?: boolean;
  requiresV2Parser?: boolean;
}

// =============================================================================
// MÉTRIQUES DE PERFORMANCE (Niveau joueur)
// =============================================================================

export const PERFORMANCE_METRICS: Record<string, MetricDefinition> = {
  rating: {
    id: 'rating',
    name: 'Rating HLTV 2.0',
    shortName: 'Rating',
    category: 'performance',
    description:
      'Score global de performance basé sur la formule HLTV 2.0. Combine kills, morts, assists, dégâts et impact en un seul score.',
    detailedDescription: `Le Rating HLTV 2.0 est la métrique standard utilisée dans l'esport CS pour évaluer la performance globale d'un joueur.

Un rating de 1.00 représente une performance moyenne. Au-dessus de 1.00, vous performez mieux que la moyenne, en dessous vous sous-performez.

Les joueurs professionnels ont généralement un rating entre 1.00 et 1.30, les stars dépassant parfois 1.40.`,
    formula: '0.0073×KAST + 0.3591×KPR - 0.5329×DPR + 0.2372×Impact + 0.0032×ADR + 0.1587',
    interpretation: [
      { max: 0.70, label: 'Très faible', color: 'red', description: 'Performance bien en dessous de la moyenne' },
      { max: 0.85, label: 'Faible', color: 'orange', description: 'En dessous de la moyenne' },
      { max: 1.00, label: 'Moyen', color: 'yellow', description: 'Performance moyenne' },
      { max: 1.15, label: 'Bon', color: 'green', description: 'Au-dessus de la moyenne' },
      { max: 1.30, label: 'Très bon', color: 'green', description: 'Excellente performance' },
      { max: Infinity, label: 'Exceptionnel', color: 'blue', description: 'Performance de niveau pro' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    aggregationMethod: 'average',
    format: 'decimal',
    decimals: 2,
    higherIsBetter: true,
  },

  adr: {
    id: 'adr',
    name: 'Average Damage per Round',
    shortName: 'ADR',
    category: 'performance',
    description:
      'Moyenne des dégâts infligés par round. Indicateur direct de votre contribution aux rounds.',
    formula: 'Total des dégâts infligés ÷ Nombre de rounds joués',
    interpretation: [
      { max: 50, label: 'Très faible', color: 'red', description: 'Contribution minimale aux rounds' },
      { max: 65, label: 'Faible', color: 'orange', description: 'Impact limité' },
      { max: 80, label: 'Moyen', color: 'yellow', description: 'Contribution moyenne' },
      { max: 95, label: 'Bon', color: 'green', description: 'Bonne contribution' },
      { max: 110, label: 'Très bon', color: 'green', description: 'Impact majeur chaque round' },
      { max: Infinity, label: 'Dominant', color: 'blue', description: 'Performance dominante' },
    ],
    availableGranularities: ['global', 'map', 'demo', 'round'],
    defaultGranularity: 'demo',
    aggregationMethod: 'average',
    format: 'decimal',
    unit: 'dmg/round',
    decimals: 1,
    higherIsBetter: true,
  },

  kast: {
    id: 'kast',
    name: 'Kill/Assist/Survive/Trade',
    shortName: 'KAST',
    category: 'performance',
    description:
      'Pourcentage de rounds où vous avez eu un impact positif (Kill, Assist, Survie ou Trade).',
    formula: '(Rounds avec K ou A ou S ou T) ÷ Total rounds × 100',
    interpretation: [
      { max: 50, label: 'Très faible', color: 'red', description: 'Contribution inconstante' },
      { max: 60, label: 'Faible', color: 'orange', description: 'Trop de rounds sans impact' },
      { max: 70, label: 'Moyen', color: 'yellow', description: 'Contribution moyenne' },
      { max: 80, label: 'Bon', color: 'green', description: 'Contribution régulière' },
      { max: 90, label: 'Très bon', color: 'green', description: 'Très constant' },
      { max: Infinity, label: 'Exceptionnel', color: 'blue', description: 'Impact quasi chaque round' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    aggregationMethod: 'average',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    higherIsBetter: true,
  },

  kd: {
    id: 'kd',
    name: 'Kill/Death Ratio',
    shortName: 'K/D',
    category: 'performance',
    description: 'Ratio entre vos kills et vos morts.',
    formula: 'Kills ÷ Deaths',
    interpretation: [
      { max: 0.70, label: 'Très faible', color: 'red', description: 'Beaucoup plus de morts que de kills' },
      { max: 0.90, label: 'Faible', color: 'orange', description: 'Négatif' },
      { max: 1.10, label: 'Moyen', color: 'yellow', description: 'Équilibré' },
      { max: 1.30, label: 'Bon', color: 'green', description: 'Positif' },
      { max: 1.50, label: 'Très bon', color: 'green', description: 'Impact élevé' },
      { max: Infinity, label: 'Dominant', color: 'blue', description: 'Performance exceptionnelle' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    aggregationMethod: 'weighted',
    format: 'ratio',
    decimals: 2,
    higherIsBetter: true,
  },

  kpr: {
    id: 'kpr',
    name: 'Kills per Round',
    shortName: 'KPR',
    category: 'performance',
    description: 'Nombre moyen de kills par round.',
    formula: 'Kills ÷ Rounds joués',
    interpretation: [
      { max: 0.50, label: 'Faible', color: 'red', description: 'Peu de kills' },
      { max: 0.65, label: 'Moyen', color: 'yellow', description: 'Dans la moyenne' },
      { max: 0.80, label: 'Bon', color: 'green', description: 'Bon fragging' },
      { max: 1.00, label: 'Très bon', color: 'green', description: 'Excellent fragging' },
      { max: Infinity, label: 'Exceptionnel', color: 'blue', description: 'Star player' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    decimals: 2,
    higherIsBetter: true,
  },

  dpr: {
    id: 'dpr',
    name: 'Deaths per Round',
    shortName: 'DPR',
    category: 'performance',
    description: "Nombre moyen de morts par round. Plus c'est bas, mieux c'est.",
    formula: 'Deaths ÷ Rounds joués',
    interpretation: [
      { max: 0.55, label: 'Excellent', color: 'blue', description: 'Très peu de morts' },
      { max: 0.65, label: 'Bon', color: 'green', description: 'Bon survivability' },
      { max: 0.75, label: 'Moyen', color: 'yellow', description: 'Dans la moyenne' },
      { max: 0.85, label: 'Élevé', color: 'orange', description: 'Trop de morts' },
      { max: Infinity, label: 'Très élevé', color: 'red', description: 'Problème de positionnement' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    decimals: 2,
    higherIsBetter: false,
  },
};

// =============================================================================
// MÉTRIQUES D'ANALYSE (Scores sur 100)
// =============================================================================

export const ANALYSIS_METRICS: Record<string, MetricDefinition> = {
  overallScore: {
    id: 'overallScore',
    name: 'Score Global',
    shortName: 'Score',
    category: 'performance',
    description: "Score global combinant toutes les catégories d'analyse.",
    detailedDescription: `Le Score Global est une moyenne pondérée de 9 scores de catégorie:
• Aim (20%)
• Positionnement (15%)
• Utilitaires (12%)
• Économie (8%)
• Timing (10%)
• Décisions (10%)
• Movement (10%)
• Awareness (8%)
• Teamplay (7%)`,
    interpretation: [
      { max: 30, label: 'Débutant', color: 'red', description: 'Beaucoup à apprendre' },
      { max: 50, label: 'Novice', color: 'orange', description: 'Bases à consolider' },
      { max: 65, label: 'Intermédiaire', color: 'yellow', description: 'Progression en cours' },
      { max: 80, label: 'Avancé', color: 'green', description: 'Bonnes compétences' },
      { max: 90, label: 'Expert', color: 'green', description: 'Très bonnes compétences' },
      { max: Infinity, label: 'Maître', color: 'blue', description: 'Niveau très élevé' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    aggregationMethod: 'average',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    higherIsBetter: true,
  },

  aimScore: {
    id: 'aimScore',
    name: 'Score Aim',
    shortName: 'Aim',
    category: 'aim',
    description: 'Évalue votre précision, réflexes et contrôle du spray.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Aim à travailler' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Bases acquises' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Aim correct' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Bonne précision' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Aim solide' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Aim de niveau pro' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.aim',
    higherIsBetter: true,
  },

  positioningScore: {
    id: 'positioningScore',
    name: 'Score Positionnement',
    shortName: 'Position',
    category: 'positioning',
    description: 'Évalue votre positionnement, rotations et gestion des angles.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Positionnement risqué' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Améliorations possibles' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bon sens du jeu' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Positions solides' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Game sense avancé' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Positionnement optimal' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.positioning',
    higherIsBetter: true,
  },

  utilityScore: {
    id: 'utilityScore',
    name: 'Score Utilitaires',
    shortName: 'Utility',
    category: 'utility',
    description: 'Évalue votre utilisation des grenades et utilitaires.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Grenades sous-utilisées' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Usage basique' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bon usage' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Utilité efficace' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Maîtrise avancée' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Usage optimal' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.utility',
    higherIsBetter: true,
  },

  economyScore: {
    id: 'economyScore',
    name: 'Score Économie',
    shortName: 'Economy',
    category: 'economy',
    description: 'Évalue vos décisions économiques (achats, saves).',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Achats hasardeux' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Économie basique' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bonnes décisions' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Gestion efficace' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Économie optimisée' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'IGL level' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.economy',
    higherIsBetter: true,
  },

  timingScore: {
    id: 'timingScore',
    name: 'Score Timing',
    shortName: 'Timing',
    category: 'timing',
    description: 'Évalue vos timings de peeks, trades et rotations.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Timings à revoir' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Timing basique' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bon timing' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Timing solide' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Timing avancé' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Timing parfait' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.timing',
    higherIsBetter: true,
  },

  decisionScore: {
    id: 'decisionScore',
    name: 'Score Décisions',
    shortName: 'Decision',
    category: 'decision',
    description: 'Évalue vos décisions de jeu (clutchs, entries, agressivité).',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Décisions risquées' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Décisions basiques' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bonnes décisions' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Game sense solide' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Excellentes décisions' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Game sense pro' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.decision',
    higherIsBetter: true,
  },

  // ========== NOUVEAUX SCORES V2 ==========

  movementScore: {
    id: 'movementScore',
    name: 'Score Movement',
    shortName: 'Movement',
    category: 'movement',
    description: 'Évalue votre maîtrise du movement (counter-strafing, crouch, scope).',
    detailedDescription: `Le Score Movement analyse plusieurs aspects de votre movement:
• Counter-strafing (arrêt avant tir)
• Crouch timing (utilisation du crouch)
• Scope discipline (quick scope vs hard scope)
• Jump discipline (pas de jump shots non-nécessaires)
• Walk discipline (utilisation du walk pour le son)

Un score élevé indique une bonne mécanique de mouvement.`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Movement à travailler' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Bases acquises' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Movement correct' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Bon movement' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Movement solide' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Movement de niveau pro' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.movement',
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  awarenessScore: {
    id: 'awarenessScore',
    name: 'Score Awareness',
    shortName: 'Awareness',
    category: 'awareness',
    description: 'Évalue votre conscience du jeu (bombe, flashs, info).',
    detailedDescription: `Le Score Awareness analyse plusieurs aspects:
• Bomb awareness (rotations, défuses, fake défuses)
• Flash awareness (esquives, morts aveuglé)
• Info gathering (premiers contacts, survie après info)
• Map reading (anticipation des positions ennemies)

Un score élevé indique un bon game sense.`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Awareness à travailler' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Bases acquises' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Awareness correct' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Bon awareness' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Awareness solide' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Awareness de niveau pro' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.awareness',
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  teamplayScore: {
    id: 'teamplayScore',
    name: 'Score Teamplay',
    shortName: 'Teamplay',
    category: 'teamplay',
    description: 'Évalue votre jeu en équipe (trades, support, coordination).',
    detailedDescription: `Le Score Teamplay analyse plusieurs aspects:
• Trading (vitesse et efficacité des trades)
• Support (flash assists, smoke support)
• Coordination (peeks synchronisés, exécutes)
• Entrying (duels d'entrée)
• Anchoring (tenue de site)

Un score élevé indique un bon teamplay.`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Teamplay à travailler' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Bases acquises' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Teamplay correct' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Bon teamplay' },
      { max: 90, label: 'Excellent', color: 'green', description: 'Teamplay solide' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Teamplay de niveau pro' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.teamplay',
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },
};

// =============================================================================
// MÉTRIQUES MOVEMENT (Nouvelles v2)
// =============================================================================

export const MOVEMENT_METRICS: Record<string, MetricDefinition> = {
  counterStrafeRate: {
    id: 'counterStrafeRate',
    name: 'Taux Counter-Strafe',
    shortName: 'CS Rate',
    category: 'movement',
    subcategory: 'counter-strafe',
    description: 'Pourcentage de tirs effectués avec un counter-strafe correct (vitesse < 34 u/s).',
    detailedDescription: `Le counter-strafing est la technique d'appuyer sur la touche opposée à votre mouvement pour vous arrêter instantanément avant de tirer.

Un counter-strafe parfait signifie une vitesse de 0 u/s au moment du tir.
Un bon counter-strafe signifie une vitesse < 34 u/s (précision maximale maintenue).

Cette technique est essentielle pour avoir une précision maximale avec les rifles.`,
    formula: 'Tirs avec vitesse < 34 u/s ÷ Total tirs × 100',
    interpretation: [
      { max: 40, label: 'Faible', color: 'red', description: 'Tire en bougeant souvent' },
      { max: 55, label: 'Moyen', color: 'orange', description: 'Counter-strafe basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon counter-strafe' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Counter-strafe maîtrisé' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Counter-strafe parfait' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  perfectCounterStrafeRate: {
    id: 'perfectCounterStrafeRate',
    name: 'Counter-Strafe Parfait',
    shortName: 'Perfect CS',
    category: 'movement',
    subcategory: 'counter-strafe',
    description: 'Pourcentage de tirs avec un counter-strafe parfait (vitesse = 0 u/s).',
    formula: 'Tirs avec vitesse = 0 u/s ÷ Total tirs × 100',
    interpretation: [
      { max: 15, label: 'Faible', color: 'red', description: 'Rarement immobile' },
      { max: 30, label: 'Moyen', color: 'orange', description: 'Parfois immobile' },
      { max: 45, label: 'Bon', color: 'yellow', description: 'Souvent immobile' },
      { max: 60, label: 'Très bon', color: 'green', description: 'Très bon timing' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Timing parfait' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  avgSpeedAtShot: {
    id: 'avgSpeedAtShot',
    name: 'Vitesse Moyenne au Tir',
    shortName: 'Speed@Shot',
    category: 'movement',
    subcategory: 'counter-strafe',
    description: 'Vitesse moyenne du joueur au moment du tir (unités/seconde).',
    formula: 'Somme des vitesses au tir ÷ Nombre de tirs',
    interpretation: [
      { max: 20, label: 'Excellent', color: 'blue', description: 'Presque toujours immobile' },
      { max: 40, label: 'Très bon', color: 'green', description: 'Très bonne discipline' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bonne discipline' },
      { max: 100, label: 'Moyen', color: 'orange', description: 'À améliorer' },
      { max: Infinity, label: 'Faible', color: 'red', description: 'Tire en courant' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    unit: 'u/s',
    decimals: 1,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false,
  },

  crouchShotRate: {
    id: 'crouchShotRate',
    name: 'Taux Crouch Shot',
    shortName: 'Crouch%',
    category: 'movement',
    subcategory: 'crouch',
    description: 'Pourcentage de tirs effectués en position accroupie.',
    detailedDescription: `Le crouch (accroupissement) améliore la précision mais réduit la mobilité.

Usage optimal:
• Crouch pendant le spray pour améliorer la précision
• Crouch rapide pour esquiver les headshots
• Éviter de crouch à découvert

Un taux trop élevé peut indiquer une sur-utilisation du crouch.`,
    formula: 'Tirs en crouch ÷ Total tirs × 100',
    interpretation: [
      { max: 15, label: 'Faible', color: 'orange', description: 'Sous-utilise le crouch' },
      { max: 30, label: 'Optimal', color: 'green', description: 'Usage équilibré' },
      { max: 45, label: 'Élevé', color: 'yellow', description: 'Crouch fréquent' },
      { max: 60, label: 'Très élevé', color: 'orange', description: 'Crouch excessif' },
      { max: Infinity, label: 'Critique', color: 'red', description: 'Crouch addiction' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false, // Ni trop haut ni trop bas
  },

  scopedShotRate: {
    id: 'scopedShotRate',
    name: 'Taux Scope',
    shortName: 'Scope%',
    category: 'movement',
    subcategory: 'scope',
    description: "Pourcentage de tirs avec arme à lunette effectués en visant (scoped).",
    formula: 'Tirs scoped ÷ Total tirs armes à lunette × 100',
    interpretation: [
      { max: 50, label: 'Faible', color: 'red', description: 'No-scope fréquent' },
      { max: 70, label: 'Moyen', color: 'orange', description: 'Mix scope/no-scope' },
      { max: 85, label: 'Bon', color: 'yellow', description: 'Généralement scoped' },
      { max: 95, label: 'Très bon', color: 'green', description: 'Discipline du scope' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Toujours scoped' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  quickScopeRate: {
    id: 'quickScopeRate',
    name: 'Taux Quick Scope',
    shortName: 'Quick Scope',
    category: 'movement',
    subcategory: 'scope',
    description: 'Pourcentage de tirs scoped effectués rapidement après le scope.',
    detailedDescription: `Le quick scope est la technique de viser rapidement (scope) et tirer immédiatement.

Avantages:
• Plus de mobilité entre les tirs
• Plus difficile à préfire
• Permet des repositionnements rapides

Un taux élevé indique un bon usage du quick scope vs hard scope.`,
    interpretation: [
      { max: 30, label: 'Hard scoper', color: 'orange', description: 'Reste longtemps scoped' },
      { max: 50, label: 'Mixte', color: 'yellow', description: 'Mix quick/hard scope' },
      { max: 70, label: 'Bon', color: 'green', description: 'Bon quick scope' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Quick scope master' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  airborneShotRate: {
    id: 'airborneShotRate',
    name: 'Taux Airborne Shot',
    shortName: 'Airborne%',
    category: 'movement',
    subcategory: 'general',
    description: 'Pourcentage de tirs effectués en l\'air. Plus c\'est bas, mieux c\'est.',
    formula: 'Tirs en l\'air ÷ Total tirs × 100',
    interpretation: [
      { max: 2, label: 'Excellent', color: 'blue', description: 'Presque jamais en l\'air' },
      { max: 5, label: 'Bon', color: 'green', description: 'Rarement en l\'air' },
      { max: 10, label: 'Moyen', color: 'yellow', description: 'Parfois en l\'air' },
      { max: 20, label: 'Élevé', color: 'orange', description: 'Souvent en l\'air' },
      { max: Infinity, label: 'Critique', color: 'red', description: 'Jump shot addiction' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 1,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false,
  },

  walkDiscipline: {
    id: 'walkDiscipline',
    name: 'Discipline Walk',
    shortName: 'Walk Disc.',
    category: 'movement',
    subcategory: 'general',
    description: 'Score de discipline d\'utilisation du walk pour éviter de faire du bruit.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Court trop souvent' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Walk basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon usage du walk' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Walk maîtrisé' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Silent assassin' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },
};

// =============================================================================
// MÉTRIQUES AWARENESS (Nouvelles v2)
// =============================================================================

export const AWARENESS_METRICS: Record<string, MetricDefinition> = {
  bombAwarenessScore: {
    id: 'bombAwarenessScore',
    name: 'Awareness Bombe',
    shortName: 'Bomb Aware',
    category: 'awareness',
    subcategory: 'bomb',
    description: 'Score de conscience de la bombe (rotations, défuses).',
    detailedDescription: `Cette métrique évalue votre conscience de la bombe:
• Rotations anticipées vers le site planté
• Défuses réussies
• Fake défuses pour gagner du temps
• Temps de réaction après plant`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Ignore souvent la bombe' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Awareness basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon awareness' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bon awareness' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Awareness parfait' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  defuseSuccessRate: {
    id: 'defuseSuccessRate',
    name: 'Taux Défuse',
    shortName: 'Defuse%',
    category: 'awareness',
    subcategory: 'bomb',
    description: 'Pourcentage de tentatives de défuse réussies.',
    formula: 'Défuses réussies ÷ Tentatives de défuse × 100',
    interpretation: [
      { max: 50, label: 'Faible', color: 'red', description: 'Défuses souvent ratées' },
      { max: 70, label: 'Moyen', color: 'orange', description: 'Taux moyen' },
      { max: 85, label: 'Bon', color: 'yellow', description: 'Bon taux' },
      { max: 95, label: 'Très bon', color: 'green', description: 'Très bon taux' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Clutch defuser' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  flashDodgeRate: {
    id: 'flashDodgeRate',
    name: 'Taux Esquive Flash',
    shortName: 'Flash Dodge',
    category: 'awareness',
    subcategory: 'flash',
    description: 'Pourcentage de flashs ennemies esquivées ou partiellement esquivées.',
    detailedDescription: `Mesure votre capacité à éviter les flashbangs ennemies:
• Se retourner pour éviter le flash
• Se cacher derrière un mur
• Regarder dans la direction opposée

Un taux élevé indique une bonne anticipation des flashs.`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Souvent full flash' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Esquive basique' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bonne esquive' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Très bonne esquive' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Flash ninja' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  blindDeathRate: {
    id: 'blindDeathRate',
    name: 'Taux Mort Aveuglé',
    shortName: 'Blind Deaths',
    category: 'awareness',
    subcategory: 'flash',
    description: 'Pourcentage de morts survenues pendant que vous étiez aveuglé.',
    formula: 'Morts pendant flash ÷ Total morts × 100',
    interpretation: [
      { max: 5, label: 'Excellent', color: 'blue', description: 'Rarement tué aveuglé' },
      { max: 10, label: 'Bon', color: 'green', description: 'Peu de morts aveuglé' },
      { max: 15, label: 'Moyen', color: 'yellow', description: 'Parfois tué aveuglé' },
      { max: 25, label: 'Élevé', color: 'orange', description: 'Souvent tué aveuglé' },
      { max: Infinity, label: 'Critique', color: 'red', description: 'Cible facile pour les flashs' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false,
  },

  infoGatheringScore: {
    id: 'infoGatheringScore',
    name: 'Score Info Gathering',
    shortName: 'Info',
    category: 'awareness',
    subcategory: 'info',
    description: 'Évalue votre capacité à obtenir de l\'information sans mourir.',
    detailedDescription: `Cette métrique évalue votre capacité à obtenir de l'info:
• Premiers contacts (spot ennemis en premier)
• Survie après avoir donné l'info
• Rotations basées sur l'info obtenue

Un score élevé indique un bon lurker/info player.`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Peu d\'info' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Info basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bonne info' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bonne info' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Info master' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  firstContactRate: {
    id: 'firstContactRate',
    name: 'Taux Premier Contact',
    shortName: '1st Contact',
    category: 'awareness',
    subcategory: 'info',
    description: 'Pourcentage de rounds où vous avez eu le premier contact visuel avec l\'ennemi.',
    interpretation: [
      { max: 10, label: 'Faible', color: 'red', description: 'Rarement premier contact' },
      { max: 20, label: 'Moyen', color: 'orange', description: 'Parfois premier contact' },
      { max: 35, label: 'Bon', color: 'yellow', description: 'Souvent premier contact' },
      { max: 50, label: 'Très bon', color: 'green', description: 'Fréquent premier contact' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Always first' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },
};

// =============================================================================
// MÉTRIQUES TEAMPLAY (Nouvelles v2)
// =============================================================================

export const TEAMPLAY_METRICS: Record<string, MetricDefinition> = {
  tradeEfficiency: {
    id: 'tradeEfficiency',
    name: 'Efficacité Trade',
    shortName: 'Trade Eff.',
    category: 'teamplay',
    subcategory: 'trading',
    description: 'Score combinant la vitesse et le taux de réussite des trades.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Trading insuffisant' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Trading basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon trading' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bon trading' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Trade master' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  tradesGiven: {
    id: 'tradesGiven',
    name: 'Trades Donnés',
    shortName: 'Trades+',
    category: 'teamplay',
    subcategory: 'trading',
    description: 'Nombre de trades que vous avez effectués (vengé un coéquipier).',
    interpretation: [
      { max: 2, label: 'Faible', color: 'red', description: 'Peu de trades' },
      { max: 5, label: 'Moyen', color: 'orange', description: 'Quelques trades' },
      { max: 8, label: 'Bon', color: 'yellow', description: 'Bons trades' },
      { max: 12, label: 'Très bon', color: 'green', description: 'Beaucoup de trades' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Trade king' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  tradesReceived: {
    id: 'tradesReceived',
    name: 'Trades Reçus',
    shortName: 'Trades-',
    category: 'teamplay',
    subcategory: 'trading',
    description: 'Nombre de fois où vous avez été tradé (vengé par un coéquipier).',
    interpretation: [
      { max: 2, label: 'Faible', color: 'orange', description: 'Rarement tradé' },
      { max: 4, label: 'Moyen', color: 'yellow', description: 'Parfois tradé' },
      { max: 6, label: 'Bon', color: 'green', description: 'Souvent tradé' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Toujours tradé' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  avgTradeTime: {
    id: 'avgTradeTime',
    name: 'Temps Moyen Trade',
    shortName: 'Trade Time',
    category: 'teamplay',
    subcategory: 'trading',
    description: 'Temps moyen pour effectuer un trade après la mort d\'un coéquipier.',
    formula: 'Somme des temps de trade ÷ Nombre de trades',
    interpretation: [
      { max: 1.5, label: 'Excellent', color: 'blue', description: 'Trades instantanés' },
      { max: 2.5, label: 'Bon', color: 'green', description: 'Trades rapides' },
      { max: 4.0, label: 'Moyen', color: 'yellow', description: 'Trades corrects' },
      { max: 6.0, label: 'Lent', color: 'orange', description: 'Trades lents' },
      { max: Infinity, label: 'Très lent', color: 'red', description: 'Trades trop lents' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    unit: 's',
    decimals: 1,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false,
  },

  flashAssistScore: {
    id: 'flashAssistScore',
    name: 'Score Flash Assist',
    shortName: 'Flash Assist',
    category: 'teamplay',
    subcategory: 'support',
    description: 'Évalue votre capacité à créer des opportunités pour vos coéquipiers avec vos flashs.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Peu de support flash' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Support basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon support' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bon support' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Support master' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  coordinationScore: {
    id: 'coordinationScore',
    name: 'Score Coordination',
    shortName: 'Coord.',
    category: 'teamplay',
    subcategory: 'coordination',
    description: 'Évalue votre coordination avec l\'équipe (peeks synchronisés, exécutes).',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Joue solo' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Coordination basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bonne coordination' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bonne coordination' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Team player parfait' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  entrySuccessRate: {
    id: 'entrySuccessRate',
    name: 'Taux Entry Success',
    shortName: 'Entry%',
    category: 'teamplay',
    subcategory: 'entry',
    description: 'Pourcentage de duels d\'entrée gagnés.',
    formula: 'Entry kills ÷ Entry attempts × 100',
    interpretation: [
      { max: 35, label: 'Faible', color: 'red', description: 'Entry difficile' },
      { max: 45, label: 'Moyen', color: 'orange', description: 'Entry standard' },
      { max: 55, label: 'Bon', color: 'yellow', description: 'Bon entry' },
      { max: 65, label: 'Très bon', color: 'green', description: 'Très bon entry' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Entry king' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  entryAttempts: {
    id: 'entryAttempts',
    name: 'Tentatives Entry',
    shortName: 'Entry Tries',
    category: 'teamplay',
    subcategory: 'entry',
    description: 'Nombre de fois où vous avez pris le premier duel du round.',
    interpretation: [
      { max: 3, label: 'Faible', color: 'orange', description: 'Peu d\'entries' },
      { max: 6, label: 'Moyen', color: 'yellow', description: 'Quelques entries' },
      { max: 10, label: 'Bon', color: 'green', description: 'Entrys fréquents' },
      { max: Infinity, label: 'Entry Main', color: 'blue', description: 'Entry fragger' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  clutchWinRate: {
    id: 'clutchWinRate',
    name: 'Taux Clutch',
    shortName: 'Clutch%',
    category: 'teamplay',
    subcategory: 'clutch',
    description: 'Pourcentage de situations clutch (1vX) gagnées.',
    formula: 'Clutchs gagnés ÷ Situations clutch × 100',
    interpretation: [
      { max: 15, label: 'Faible', color: 'red', description: 'Clutch difficile' },
      { max: 25, label: 'Moyen', color: 'orange', description: 'Clutch standard' },
      { max: 35, label: 'Bon', color: 'yellow', description: 'Bon clutcher' },
      { max: 50, label: 'Très bon', color: 'green', description: 'Très bon clutcher' },
      { max: Infinity, label: 'Clutch Master', color: 'blue', description: 'Clutch legend' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'global',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  clutchAttempts: {
    id: 'clutchAttempts',
    name: 'Situations Clutch',
    shortName: 'Clutch Sits',
    category: 'teamplay',
    subcategory: 'clutch',
    description: 'Nombre de situations clutch (dernier survivant).',
    interpretation: [
      { max: 2, label: 'Peu', color: 'yellow', description: 'Peu de clutchs' },
      { max: 5, label: 'Moyen', color: 'yellow', description: 'Quelques clutchs' },
      { max: 8, label: 'Fréquent', color: 'orange', description: 'Souvent en clutch' },
      { max: Infinity, label: 'Très fréquent', color: 'red', description: 'Toujours dernier vivant' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false, // Pas nécessairement mieux d'être souvent en clutch
  },

  anchorScore: {
    id: 'anchorScore',
    name: 'Score Anchor',
    shortName: 'Anchor',
    category: 'teamplay',
    subcategory: 'coordination',
    description: 'Évalue votre capacité à tenir un site en solo.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Anchor difficile' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Anchor basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon anchor' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bon anchor' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Rock solid anchor' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },
};

// =============================================================================
// MÉTRIQUES UTILITY AMÉLIORÉES (v2)
// =============================================================================

export const UTILITY_METRICS_V2: Record<string, MetricDefinition> = {
  flashEfficiencyV2: {
    id: 'flashEfficiencyV2',
    name: 'Efficacité Flash v2',
    shortName: 'Flash Eff.',
    category: 'utility',
    subcategory: 'flash',
    description: 'Score d\'efficacité des flashs basé sur la durée réelle d\'aveuglement.',
    detailedDescription: `Utilise les données player_blind pour calculer précisément:
• Durée totale d'aveuglement des ennemis
• Durée moyenne par flash
• Ratio ennemis/équipe flashés
• Taux de pop-flash (kill rapide après flash)`,
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Flashs inefficaces' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Efficacité basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bonne efficacité' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bonne efficacité' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Efficacité optimale' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  avgEnemyBlindDuration: {
    id: 'avgEnemyBlindDuration',
    name: 'Durée Moyenne Aveuglement',
    shortName: 'Avg Blind',
    category: 'utility',
    subcategory: 'flash',
    description: 'Durée moyenne pendant laquelle les ennemis sont aveuglés par vos flashs.',
    formula: 'Total durée aveuglement ennemis ÷ Nombre d\'ennemis flashés',
    interpretation: [
      { max: 1.0, label: 'Faible', color: 'red', description: 'Flashs partiels' },
      { max: 1.5, label: 'Moyen', color: 'orange', description: 'Durée moyenne' },
      { max: 2.0, label: 'Bon', color: 'yellow', description: 'Bonne durée' },
      { max: 2.5, label: 'Très bon', color: 'green', description: 'Full blinds' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Maximum blind' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    unit: 's',
    decimals: 2,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  popFlashRate: {
    id: 'popFlashRate',
    name: 'Taux Pop-Flash',
    shortName: 'Pop Flash',
    category: 'utility',
    subcategory: 'flash',
    description: 'Pourcentage de flashs suivis d\'un kill dans les 2 secondes.',
    formula: 'Pop-flash kills ÷ Flashs lancés × 100',
    interpretation: [
      { max: 10, label: 'Faible', color: 'red', description: 'Peu de pop-flashs' },
      { max: 20, label: 'Moyen', color: 'orange', description: 'Quelques pop-flashs' },
      { max: 35, label: 'Bon', color: 'yellow', description: 'Bons pop-flashs' },
      { max: 50, label: 'Très bon', color: 'green', description: 'Très bons pop-flashs' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Pop-flash master' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  teamFlashRate: {
    id: 'teamFlashRate',
    name: 'Taux Team Flash',
    shortName: 'Team Flash',
    category: 'utility',
    subcategory: 'flash',
    description: 'Pourcentage de flashs touchant des coéquipiers. Plus c\'est bas, mieux c\'est.',
    formula: 'Équipiers flashés ÷ Total personnes flashées × 100',
    interpretation: [
      { max: 5, label: 'Excellent', color: 'blue', description: 'Presque jamais de team flash' },
      { max: 15, label: 'Bon', color: 'green', description: 'Peu de team flashs' },
      { max: 25, label: 'Moyen', color: 'yellow', description: 'Team flashs occasionnels' },
      { max: 40, label: 'Élevé', color: 'orange', description: 'Trop de team flashs' },
      { max: Infinity, label: 'Critique', color: 'red', description: 'Team flash addict' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false,
  },

  avgMolotovDamage: {
    id: 'avgMolotovDamage',
    name: 'Dégâts Moyens Molotov',
    shortName: 'Molly Dmg',
    category: 'utility',
    subcategory: 'molotov',
    description: 'Dégâts moyens infligés par molotov/incendiaire.',
    formula: 'Total dégâts molotov ÷ Molotovs lancés',
    interpretation: [
      { max: 10, label: 'Faible', color: 'red', description: 'Molotovs inefficaces' },
      { max: 25, label: 'Moyen', color: 'orange', description: 'Dégâts moyens' },
      { max: 40, label: 'Bon', color: 'yellow', description: 'Bons dégâts' },
      { max: 60, label: 'Très bon', color: 'green', description: 'Très bons dégâts' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Molotov master' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    unit: 'HP',
    decimals: 1,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  heMultiHitRate: {
    id: 'heMultiHitRate',
    name: 'Taux Multi-Hit HE',
    shortName: 'HE Multi',
    category: 'utility',
    subcategory: 'he',
    description: 'Pourcentage de HE touchant 2+ joueurs.',
    formula: 'HE avec 2+ victimes ÷ Total HE × 100',
    interpretation: [
      { max: 10, label: 'Faible', color: 'red', description: 'HE individuels' },
      { max: 25, label: 'Moyen', color: 'orange', description: 'Quelques multi-hits' },
      { max: 40, label: 'Bon', color: 'yellow', description: 'Bons multi-hits' },
      { max: 60, label: 'Très bon', color: 'green', description: 'Beaucoup de multi-hits' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'HE stacker' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  utilityUsageRate: {
    id: 'utilityUsageRate',
    name: 'Taux Utilisation',
    shortName: 'Util Usage',
    category: 'utility',
    subcategory: 'general',
    description: 'Pourcentage des utilitaires achetés effectivement utilisés.',
    formula: 'Grenades utilisées ÷ Grenades achetées × 100',
    interpretation: [
      { max: 60, label: 'Faible', color: 'red', description: 'Beaucoup de gaspillage' },
      { max: 75, label: 'Moyen', color: 'orange', description: 'Usage moyen' },
      { max: 85, label: 'Bon', color: 'yellow', description: 'Bon usage' },
      { max: 95, label: 'Très bon', color: 'green', description: 'Très bon usage' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Pas de gaspillage' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },
};

// =============================================================================
// MÉTRIQUES ECONOMY AMÉLIORÉES (v2)
// =============================================================================

export const ECONOMY_METRICS_V2: Record<string, MetricDefinition> = {
  buyDecisionScore: {
    id: 'buyDecisionScore',
    name: 'Score Décisions Achat',
    shortName: 'Buy Decision',
    category: 'economy',
    subcategory: 'economy-decision',
    description: 'Évalue la qualité de vos décisions d\'achat (full, force, eco, save).',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Mauvaises décisions' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Décisions basiques' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bonnes décisions' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bonnes décisions' },
      { max: Infinity, label: 'IGL Level', color: 'blue', description: 'Décisions optimales' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  teamBuySyncRate: {
    id: 'teamBuySyncRate',
    name: 'Sync Achat Équipe',
    shortName: 'Team Sync',
    category: 'economy',
    subcategory: 'economy-decision',
    description: 'Pourcentage de rounds où votre achat était synchronisé avec l\'équipe.',
    formula: 'Rounds sync ÷ Total rounds × 100',
    interpretation: [
      { max: 60, label: 'Faible', color: 'red', description: 'Souvent désynchronisé' },
      { max: 75, label: 'Moyen', color: 'orange', description: 'Parfois désynchronisé' },
      { max: 85, label: 'Bon', color: 'yellow', description: 'Généralement sync' },
      { max: 95, label: 'Très bon', color: 'green', description: 'Très bon sync' },
      { max: Infinity, label: 'Parfait', color: 'blue', description: 'Toujours synchronisé' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  helmetBuyRate: {
    id: 'helmetBuyRate',
    name: 'Taux Achat Casque',
    shortName: 'Helmet%',
    category: 'economy',
    subcategory: 'equipment',
    description: 'Pourcentage de rounds avec full buy où vous aviez un casque.',
    interpretation: [
      { max: 70, label: 'Faible', color: 'red', description: 'Oublie souvent le casque' },
      { max: 85, label: 'Moyen', color: 'orange', description: 'Parfois sans casque' },
      { max: 95, label: 'Bon', color: 'yellow', description: 'Généralement avec casque' },
      { max: Infinity, label: 'Parfait', color: 'green', description: 'Toujours équipé' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  defuserBuyRate: {
    id: 'defuserBuyRate',
    name: 'Taux Achat Defuser',
    shortName: 'Defuser%',
    category: 'economy',
    subcategory: 'equipment',
    description: 'Pourcentage de rounds CT avec full buy où vous aviez un defuser.',
    interpretation: [
      { max: 60, label: 'Faible', color: 'red', description: 'Oublie souvent le defuser' },
      { max: 80, label: 'Moyen', color: 'orange', description: 'Parfois sans defuser' },
      { max: 95, label: 'Bon', color: 'yellow', description: 'Généralement avec defuser' },
      { max: Infinity, label: 'Parfait', color: 'green', description: 'Toujours équipé' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },

  avgMoneyAtDeath: {
    id: 'avgMoneyAtDeath',
    name: 'Argent Moyen à la Mort',
    shortName: 'Money@Death',
    category: 'economy',
    subcategory: 'economy-decision',
    description: 'Argent moyen restant quand vous mourez. Indicateur de gaspillage.',
    interpretation: [
      { max: 500, label: 'Excellent', color: 'blue', description: 'Utilise bien son argent' },
      { max: 1000, label: 'Bon', color: 'green', description: 'Bon usage' },
      { max: 2000, label: 'Moyen', color: 'yellow', description: 'Parfois du gaspillage' },
      { max: 4000, label: 'Élevé', color: 'orange', description: 'Beaucoup de gaspillage' },
      { max: Infinity, label: 'Critique', color: 'red', description: 'Économe excessif' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '$',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: false,
  },

  ecoImpactScore: {
    id: 'ecoImpactScore',
    name: 'Impact en Eco',
    shortName: 'Eco Impact',
    category: 'economy',
    subcategory: 'economy-decision',
    description: 'Score d\'impact lors des rounds eco (récupérer des armes, faire des kills).',
    interpretation: [
      { max: 20, label: 'Faible', color: 'red', description: 'Peu d\'impact en eco' },
      { max: 40, label: 'Moyen', color: 'orange', description: 'Impact basique' },
      { max: 60, label: 'Bon', color: 'yellow', description: 'Bon impact' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Très bon impact' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Eco warrior' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    isNew: true,
    requiresV2Parser: true,
    higherIsBetter: true,
  },
};

// =============================================================================
// EXPORT COMBINÉ
// =============================================================================

export const ALL_METRICS_V2: Record<string, MetricDefinition> = {
  ...PERFORMANCE_METRICS,
  ...ANALYSIS_METRICS,
  ...MOVEMENT_METRICS,
  ...AWARENESS_METRICS,
  ...TEAMPLAY_METRICS,
  ...UTILITY_METRICS_V2,
  ...ECONOMY_METRICS_V2,
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Obtenir une définition de métrique
 */
export function getMetricDefinition(metricId: string): MetricDefinition | undefined {
  return ALL_METRICS_V2[metricId];
}

/**
 * Obtenir l'interprétation pour une valeur
 */
export function getInterpretation(
  metricId: string,
  value: number
): InterpretationThreshold | undefined {
  const definition = getMetricDefinition(metricId);
  if (!definition) return undefined;

  return definition.interpretation.find((i) => value <= i.max);
}

/**
 * Formater une valeur selon la définition
 */
export function formatMetricValue(metricId: string, value: number): string {
  const definition = getMetricDefinition(metricId);
  if (!definition) return value.toString();

  const decimals = definition.decimals ?? 2;

  switch (definition.format) {
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'integer':
      return Math.round(value).toString();
    case 'ratio':
      return value.toFixed(decimals);
    case 'time':
      return `${value.toFixed(decimals)}${definition.unit || ''}`;
    case 'speed':
      return `${value.toFixed(decimals)} ${definition.unit || 'u/s'}`;
    case 'decimal':
    default:
      return `${value.toFixed(decimals)}${definition.unit ? ` ${definition.unit}` : ''}`;
  }
}

/**
 * Obtenir les métriques par catégorie
 */
export function getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return Object.values(ALL_METRICS_V2).filter((m) => m.category === category);
}

/**
 * Obtenir les métriques par sous-catégorie
 */
export function getMetricsBySubcategory(subcategory: MetricSubcategory): MetricDefinition[] {
  return Object.values(ALL_METRICS_V2).filter((m) => m.subcategory === subcategory);
}

/**
 * Obtenir uniquement les nouvelles métriques v2
 */
export function getNewMetrics(): MetricDefinition[] {
  return Object.values(ALL_METRICS_V2).filter((m) => m.isNew);
}

/**
 * Obtenir les métriques nécessitant le parser v2
 */
export function getV2ParserMetrics(): MetricDefinition[] {
  return Object.values(ALL_METRICS_V2).filter((m) => m.requiresV2Parser);
}

/**
 * Grouper les métriques par catégorie
 */
export function groupMetricsByCategory(): Record<MetricCategory, MetricDefinition[]> {
  const grouped: Record<MetricCategory, MetricDefinition[]> = {
    performance: [],
    aim: [],
    positioning: [],
    utility: [],
    economy: [],
    timing: [],
    decision: [],
    movement: [],
    awareness: [],
    teamplay: [],
  };

  for (const metric of Object.values(ALL_METRICS_V2)) {
    grouped[metric.category].push(metric);
  }

  return grouped;
}
