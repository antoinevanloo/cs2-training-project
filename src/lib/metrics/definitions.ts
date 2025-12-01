/**
 * Définitions complètes des métriques CS2 Coach
 *
 * Ce fichier contient toutes les définitions de métriques avec:
 * - Description et formule de calcul
 * - Interprétation des valeurs
 * - Granularités disponibles
 * - Formatage d'affichage
 */

// Importer les types depuis le fichier de types partagé
import type {
  GranularityLevel,
  MetricCategory,
  MetricFormat,
  InterpretationThreshold,
  MetricDefinition,
} from './types';

// Re-exporter les types pour la compatibilité
export type { GranularityLevel, MetricCategory, MetricFormat, InterpretationThreshold, MetricDefinition };

// ============================================
// MÉTRIQUES DE PERFORMANCE (Niveau joueur)
// ============================================

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
    formulaExplanation: `La formule prend en compte:
• KAST: Pourcentage de rounds avec contribution
• KPR: Kills par round
• DPR: Deaths par round (coefficient négatif)
• Impact: Score d'impact (entry kills, clutchs)
• ADR: Dégâts moyens par round`,
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
  },

  adr: {
    id: 'adr',
    name: 'Average Damage per Round',
    shortName: 'ADR',
    category: 'performance',
    description:
      'Moyenne des dégâts infligés par round. Indicateur direct de votre contribution aux rounds.',
    detailedDescription: `L'ADR (Average Damage per Round) mesure les dégâts que vous infligez en moyenne à chaque round.

C'est une métrique très fiable car elle ne dépend pas de qui obtient le kill final. Un joueur avec un ADR élevé contribue significativement même s'il n'a pas le plus de kills.

Un ADR de 100 signifie que vous infligez en moyenne l'équivalent d'un kill par round.`,
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
  },

  kast: {
    id: 'kast',
    name: 'Kill/Assist/Survive/Trade',
    shortName: 'KAST',
    category: 'performance',
    description:
      'Pourcentage de rounds où vous avez eu un impact positif (Kill, Assist, Survie ou Trade).',
    detailedDescription: `Le KAST mesure votre constance dans la contribution aux rounds. Un round est compté positivement si vous avez:

• Kill: Tué au moins un ennemi
• Assist: Assisté un coéquipier
• Survive: Survécu au round
• Trade: Été échangé rapidement après votre mort

Un KAST élevé indique que vous contribuez de manière constante, même dans les rounds perdus.`,
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
  },

  headshotPercentage: {
    id: 'headshotPercentage',
    name: 'Headshot Percentage',
    shortName: 'HS%',
    category: 'aim',
    description: 'Pourcentage de vos kills réalisés par headshot.',
    detailedDescription: `Le HS% mesure la précision de votre visée. Un pourcentage élevé indique que vous visez bien la tête.

Attention: un HS% très élevé n'est pas toujours optimal. Certaines armes (AWP, spray AK) ne nécessitent pas de headshot.

Les joueurs professionnels ont généralement un HS% entre 45% et 55%.`,
    formula: 'Kills par headshot ÷ Total kills × 100',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Visez plus la tête' },
      { max: 40, label: 'Moyen', color: 'orange', description: 'Crosshair placement à améliorer' },
      { max: 50, label: 'Bon', color: 'yellow', description: 'Bonne précision' },
      { max: 60, label: 'Très bon', color: 'green', description: 'Excellent aim' },
      { max: Infinity, label: 'Exceptionnel', color: 'blue', description: 'Precision chirurgicale' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    aggregationMethod: 'weighted',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    featureFlag: 'analysis.aim',
  },

  winRate: {
    id: 'winRate',
    name: 'Win Rate',
    shortName: 'Win%',
    category: 'performance',
    description: 'Pourcentage de parties gagnées.',
    detailedDescription: `Le Win Rate représente votre taux de victoire. C'est une métrique globale qui dépend aussi de vos coéquipiers.

Un Win Rate de 50% est la moyenne théorique. Au-dessus, vous montez en rank, en dessous vous descendez.

Note: Cette métrique est plus fiable sur un grand nombre de parties.`,
    formula: 'Victoires ÷ (Victoires + Défaites) × 100',
    interpretation: [
      { max: 40, label: 'Faible', color: 'red', description: 'Plus de défaites que de victoires' },
      { max: 48, label: 'Sous la moyenne', color: 'orange', description: 'Légèrement négatif' },
      { max: 52, label: 'Moyen', color: 'yellow', description: 'Équilibré' },
      { max: 55, label: 'Bon', color: 'green', description: 'Tendance positive' },
      { max: 60, label: 'Très bon', color: 'green', description: 'Excellente progression' },
      { max: Infinity, label: 'Dominant', color: 'blue', description: 'Très haute performance' },
    ],
    availableGranularities: ['global', 'map'],
    defaultGranularity: 'global',
    aggregationMethod: 'weighted',
    format: 'percentage',
    unit: '%',
    decimals: 0,
  },

  kd: {
    id: 'kd',
    name: 'Kill/Death Ratio',
    shortName: 'K/D',
    category: 'performance',
    description: 'Ratio entre vos kills et vos morts.',
    detailedDescription: `Le K/D (Kill/Death ratio) est une métrique simple mais populaire.

Un K/D de 1.00 signifie que vous tuez autant que vous mourez. Au-dessus de 1.00, vous avez un impact positif.

Attention: le K/D ne prend pas en compte les assists ou l'impact économique.`,
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
  },

  dpr: {
    id: 'dpr',
    name: 'Deaths per Round',
    shortName: 'DPR',
    category: 'performance',
    description: 'Nombre moyen de morts par round. Plus c\'est bas, mieux c\'est.',
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
  },
};

// ============================================
// MÉTRIQUES D'ANALYSE (Scores sur 100)
// ============================================

export const ANALYSIS_METRICS: Record<string, MetricDefinition> = {
  overallScore: {
    id: 'overallScore',
    name: 'Score Global',
    shortName: 'Score',
    category: 'performance',
    description: 'Score global combinant les 6 catégories d\'analyse.',
    detailedDescription: `Le Score Global est une moyenne pondérée des 6 scores de catégorie:
• Aim (25%)
• Positionnement (20%)
• Utilitaires (15%)
• Économie (10%)
• Timing (15%)
• Décisions (15%)

Les poids sont ajustés dynamiquement si certaines catégories sont désactivées.`,
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
  },

  aimScore: {
    id: 'aimScore',
    name: 'Score Aim',
    shortName: 'Aim',
    category: 'aim',
    description: 'Évalue votre précision, réflexes et contrôle du spray.',
    detailedDescription: `Le Score Aim analyse plusieurs aspects de votre visée:
• Headshot percentage
• First bullet accuracy
• Spray control
• Temps de réaction
• Crosshair placement

Un score élevé indique une bonne mécanique de visée.`,
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
  },

  positioningScore: {
    id: 'positioningScore',
    name: 'Score Positionnement',
    shortName: 'Position',
    category: 'positioning',
    description: 'Évalue votre positionnement, rotations et gestion des angles.',
    detailedDescription: `Le Score Positionnement analyse:
• Map control (zones contrôlées)
• Vitesse de rotation
• Positions de mort (tradeables ou non)
• Taux de morts isolées
• Utilisation des angles

Un score élevé signifie que vous vous positionnez bien et mourez rarement seul.`,
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
  },

  utilityScore: {
    id: 'utilityScore',
    name: 'Score Utilitaires',
    shortName: 'Utility',
    category: 'utility',
    description: 'Évalue votre utilisation des grenades et utilitaires.',
    detailedDescription: `Le Score Utilitaires analyse:
• Efficacité des flashbangs (ennemis aveuglés)
• Pertinence des smokes (timing, placement)
• Dégâts des molotovs et HE
• Utilité non utilisée à la mort
• Usage total par match

Un score élevé indique une bonne maîtrise des utilitaires.`,
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
  },

  economyScore: {
    id: 'economyScore',
    name: 'Score Économie',
    shortName: 'Economy',
    category: 'economy',
    description: 'Évalue vos décisions économiques (achats, saves).',
    detailedDescription: `Le Score Économie analyse:
• Décisions d'achat (full buy, force, save)
• Respect des saves d'équipe
• Impact en éco-rounds
• Argent à la mort (argent gaspillé)
• Impact sur l'économie d'équipe

Un score élevé indique une bonne gestion économique.`,
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
  },

  timingScore: {
    id: 'timingScore',
    name: 'Score Timing',
    shortName: 'Timing',
    category: 'timing',
    description: 'Évalue vos timings de peeks, trades et rotations.',
    detailedDescription: `Le Score Timing analyse:
• Timing des peeks (trop tôt, trop tard, optimal)
• Vitesse de trade (temps pour venger un coéquipier)
• Taux de réussite des trades
• Timing des rotations (anticipation)
• Prefire rate

Un score élevé indique une bonne lecture du timing du jeu.`,
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
  },

  decisionScore: {
    id: 'decisionScore',
    name: 'Score Décisions',
    shortName: 'Decision',
    category: 'decision',
    description: 'Évalue vos décisions de jeu (clutchs, entries, agressivité).',
    detailedDescription: `Le Score Décisions analyse:
• Performance en clutch (1vX)
• Décisions d'entry (bon timing pour entrer)
• Niveau d'agressivité (adapté au contexte)
• Prise de risque (calculée vs téméraire)
• Retakes réussis

Un score élevé indique un bon game sense et de bonnes décisions.`,
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
  },
};

// ============================================
// MÉTRIQUES DÉTAILLÉES PAR CATÉGORIE
// ============================================

export const DETAILED_METRICS: Record<string, MetricDefinition> = {
  // --- AIM ---
  firstBulletAccuracy: {
    id: 'firstBulletAccuracy',
    name: 'First Bullet Accuracy',
    shortName: 'FBA',
    category: 'aim',
    description: 'Précision du premier tir. Mesure le crosshair placement.',
    formula: 'Premiers tirs touchés ÷ Premiers tirs × 100',
    interpretation: [
      { max: 25, label: 'Faible', color: 'red', description: 'Crosshair placement à travailler' },
      { max: 35, label: 'Moyen', color: 'orange', description: 'Peut s\'améliorer' },
      { max: 45, label: 'Bon', color: 'yellow', description: 'Bon placement' },
      { max: 55, label: 'Très bon', color: 'green', description: 'Excellent placement' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Placement optimal' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    featureFlag: 'analysis.aim',
  },

  sprayControl: {
    id: 'sprayControl',
    name: 'Spray Control',
    shortName: 'Spray',
    category: 'aim',
    description: 'Capacité à contrôler le spray (rafales continues).',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Spray incontrôlé' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Spray basique' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon contrôle' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Spray maîtrisé' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Spray parfait' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.aim',
  },

  reactionTime: {
    id: 'reactionTime',
    name: 'Temps de Réaction',
    shortName: 'Reaction',
    category: 'aim',
    description: 'Temps moyen entre la visibilité d\'un ennemi et votre tir.',
    formula: 'Moyenne du temps entre apparition ennemi et premier tir',
    interpretation: [
      { max: 180, label: 'Excellent', color: 'blue', description: 'Réflexes exceptionnels' },
      { max: 220, label: 'Très bon', color: 'green', description: 'Réflexes rapides' },
      { max: 280, label: 'Bon', color: 'yellow', description: 'Réflexes corrects' },
      { max: 350, label: 'Moyen', color: 'orange', description: 'Peut s\'améliorer' },
      { max: Infinity, label: 'Lent', color: 'red', description: 'Réflexes à travailler' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: 'ms',
    decimals: 0,
    featureFlag: 'analysis.aim',
  },

  // --- POSITIONING ---
  isolationDeathRate: {
    id: 'isolationDeathRate',
    name: 'Taux de Morts Isolées',
    shortName: 'Iso Deaths',
    category: 'positioning',
    description: 'Pourcentage de morts sans possibilité de trade. Plus c\'est bas, mieux c\'est.',
    detailedDescription: `Une mort isolée est une mort qui ne peut pas être "tradée" (vengée) par un coéquipier.

Causes fréquentes:
• Jouer trop loin des coéquipiers
• Ne pas communiquer sa position
• Peeks agressifs sans backup

Un taux élevé indique un problème de positionnement ou de communication.`,
    formula: 'Morts sans trade possible ÷ Total morts × 100',
    interpretation: [
      { max: 20, label: 'Excellent', color: 'blue', description: 'Très bien positionné' },
      { max: 30, label: 'Bon', color: 'green', description: 'Bon teamplay' },
      { max: 40, label: 'Moyen', color: 'yellow', description: 'Peut s\'améliorer' },
      { max: 50, label: 'Élevé', color: 'orange', description: 'Trop souvent seul' },
      { max: Infinity, label: 'Critique', color: 'red', description: 'Problème majeur' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    featureFlag: 'analysis.positioning',
  },

  mapControl: {
    id: 'mapControl',
    name: 'Map Control',
    shortName: 'Control',
    category: 'positioning',
    description: 'Score de contrôle des zones de la map.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Peu de zones contrôlées' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Contrôle limité' },
      { max: 70, label: 'Bon', color: 'yellow', description: 'Bon contrôle' },
      { max: 85, label: 'Très bon', color: 'green', description: 'Très bon contrôle' },
      { max: Infinity, label: 'Dominant', color: 'blue', description: 'Contrôle total' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: '/100',
    decimals: 0,
    featureFlag: 'analysis.positioning',
  },

  // --- UTILITY ---
  flashEfficiency: {
    id: 'flashEfficiency',
    name: 'Efficacité des Flashs',
    shortName: 'Flash Eff.',
    category: 'utility',
    description: 'Ratio entre ennemis flashés et flashs lancés.',
    formula: 'Ennemis flashés ÷ Flashbangs lancées × 100',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Flashs inefficaces' },
      { max: 45, label: 'Moyen', color: 'orange', description: 'Peut s\'améliorer' },
      { max: 60, label: 'Bon', color: 'yellow', description: 'Bons flashs' },
      { max: 75, label: 'Très bon', color: 'green', description: 'Flashs efficaces' },
      { max: Infinity, label: 'Pro', color: 'blue', description: 'Flashs optimaux' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    featureFlag: 'analysis.utility',
  },

  utilityDamage: {
    id: 'utilityDamage',
    name: 'Dégâts Utilitaires',
    shortName: 'Util Dmg',
    category: 'utility',
    description: 'Total des dégâts infligés via molotov et HE grenades.',
    interpretation: [
      { max: 20, label: 'Faible', color: 'red', description: 'Peu de dégâts utility' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Usage basique' },
      { max: 100, label: 'Bon', color: 'yellow', description: 'Bon usage' },
      { max: 200, label: 'Très bon', color: 'green', description: 'Dégâts importants' },
      { max: Infinity, label: 'Dominant', color: 'blue', description: 'Usage maximal' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'integer',
    unit: ' dmg',
    decimals: 0,
    featureFlag: 'analysis.utility',
  },

  // --- TIMING ---
  tradeSpeed: {
    id: 'tradeSpeed',
    name: 'Vitesse de Trade',
    shortName: 'Trade Speed',
    category: 'timing',
    description: 'Temps moyen pour venger un coéquipier mort.',
    interpretation: [
      { max: 1.5, label: 'Excellent', color: 'blue', description: 'Trades instantanés' },
      { max: 2.5, label: 'Bon', color: 'green', description: 'Trades rapides' },
      { max: 4.0, label: 'Moyen', color: 'yellow', description: 'Peut s\'améliorer' },
      { max: 6.0, label: 'Lent', color: 'orange', description: 'Trades lents' },
      { max: Infinity, label: 'Très lent', color: 'red', description: 'Problème de réactivité' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'decimal',
    unit: 's',
    decimals: 1,
    featureFlag: 'analysis.timing',
  },

  tradeSuccessRate: {
    id: 'tradeSuccessRate',
    name: 'Taux de Trade Réussi',
    shortName: 'Trade %',
    category: 'timing',
    description: 'Pourcentage de trades réussis quand l\'opportunité se présente.',
    interpretation: [
      { max: 30, label: 'Faible', color: 'red', description: 'Trades ratés' },
      { max: 50, label: 'Moyen', color: 'orange', description: 'Trade inconstant' },
      { max: 65, label: 'Bon', color: 'yellow', description: 'Bon trading' },
      { max: 80, label: 'Très bon', color: 'green', description: 'Très bon trading' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Trading optimal' },
    ],
    availableGranularities: ['demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    featureFlag: 'analysis.timing',
  },

  // --- DECISION ---
  clutchWinRate: {
    id: 'clutchWinRate',
    name: 'Taux de Clutch Gagné',
    shortName: 'Clutch %',
    category: 'decision',
    description: 'Pourcentage de situations clutch (1vX) gagnées.',
    interpretation: [
      { max: 15, label: 'Faible', color: 'red', description: 'Clutchs difficiles' },
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
    featureFlag: 'analysis.decision',
  },

  entrySuccess: {
    id: 'entrySuccess',
    name: 'Succès Entry',
    shortName: 'Entry %',
    category: 'decision',
    description: 'Pourcentage de duels d\'entrée gagnés.',
    interpretation: [
      { max: 35, label: 'Faible', color: 'red', description: 'Entry difficile' },
      { max: 45, label: 'Moyen', color: 'orange', description: 'Entry standard' },
      { max: 55, label: 'Bon', color: 'yellow', description: 'Bon entry' },
      { max: 65, label: 'Très bon', color: 'green', description: 'Très bon entry' },
      { max: Infinity, label: 'Excellent', color: 'blue', description: 'Entry dominant' },
    ],
    availableGranularities: ['global', 'map', 'demo'],
    defaultGranularity: 'demo',
    format: 'percentage',
    unit: '%',
    decimals: 0,
    featureFlag: 'analysis.decision',
  },
};

// ============================================
// EXPORT COMBINÉ
// ============================================

export const ALL_METRICS: Record<string, MetricDefinition> = {
  ...PERFORMANCE_METRICS,
  ...ANALYSIS_METRICS,
  ...DETAILED_METRICS,
};

// Helper: Obtenir une définition de métrique
export function getMetricDefinition(metricId: string): MetricDefinition | undefined {
  return ALL_METRICS[metricId];
}

// Helper: Obtenir l'interprétation pour une valeur
export function getInterpretation(metricId: string, value: number): InterpretationThreshold | undefined {
  const definition = getMetricDefinition(metricId);
  if (!definition) return undefined;

  return definition.interpretation.find((i) => value <= i.max);
}

// Helper: Formater une valeur selon la définition
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
    case 'decimal':
    default:
      return `${value.toFixed(decimals)}${definition.unit ? ` ${definition.unit}` : ''}`;
  }
}

// Helper: Obtenir les métriques par catégorie
export function getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return Object.values(ALL_METRICS).filter((m) => m.category === category);
}
