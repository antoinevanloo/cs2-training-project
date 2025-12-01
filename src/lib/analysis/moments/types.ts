/**
 * Types pour la détection et gestion des moments clés
 *
 * Permet d'identifier automatiquement :
 * - Highlights (clutchs, aces, multi-kills)
 * - Erreurs à apprendre
 * - Moments de coordination équipe
 */

// ============================================
// TYPES DE MOMENTS
// ============================================

export type MomentType =
  | 'ace'              // 5 kills dans un round
  | 'clutch_win'       // 1vX gagné
  | 'clutch_attempt'   // 1vX tenté
  | 'multi_kill'       // 3+ kills rapides
  | 'eco_win'          // Kill(s) importants en eco
  | 'entry_kill'       // Opening kill réussi
  | 'entry_death'      // Opening death
  | 'trade_kill'       // Trade rapide
  | 'failed_trade'     // Trade raté
  | 'utility_play'     // Excellent use of utility
  | 'flash_assist'     // Flash qui mène à un kill
  | 'smoke_kill'       // Kill à travers smoke
  | 'wallbang'         // Kill wallbang
  | 'noscope'          // AWP noscope kill
  | 'jumping_kill'     // Kill en sautant
  | 'mistake_peek'     // Mauvais peek (mort inutile)
  | 'mistake_position' // Mauvaise position
  | 'mistake_utility'  // Utility gaspillée
  | 'team_execute'     // Execute coordonné réussi
  | 'round_mvp';       // MVP du round

export type MomentTag = 'highlight' | 'learning' | 'mistake' | 'team' | 'funny' | 'close_call';

export type MomentImportance = 'low' | 'medium' | 'high' | 'epic';

// ============================================
// MOMENT PRINCIPAL
// ============================================

export interface Moment {
  /** Identifiant unique */
  id: string;

  /** Type de moment */
  type: MomentType;

  /** Tags associés */
  tags: MomentTag[];

  /** Importance du moment */
  importance: MomentImportance;

  /** Score d'intérêt (0-100) */
  interestScore: number;

  /** Informations temporelles */
  timing: MomentTiming;

  /** Joueur principal concerné */
  player: MomentPlayer;

  /** Autres joueurs impliqués */
  involvedPlayers: MomentPlayer[];

  /** Contexte du round */
  context: MomentContext;

  /** Détails spécifiques selon le type */
  details: MomentDetails;

  /** Titre auto-généré */
  title: string;

  /** Description détaillée */
  description: string;

  /** Leçons à tirer (pour moments d'apprentissage) */
  lessons?: string[];

  /** Clip info (pour export) */
  clipInfo: ClipInfo;
}

// ============================================
// SOUS-TYPES
// ============================================

export interface MomentTiming {
  /** Numéro du round */
  round: number;

  /** Tick de début */
  startTick: number;

  /** Tick de fin */
  endTick: number;

  /** Temps dans le round (secondes) */
  roundTime: number;

  /** Timestamp absolu */
  matchTime: number;

  /** Durée du moment (secondes) */
  duration: number;
}

export interface MomentPlayer {
  steamId: string;
  name: string;
  team: 'CT' | 'T';
  health?: number;
  armor?: number;
  weapon?: string;
  position?: { x: number; y: number; z: number };
}

export interface MomentContext {
  /** Score actuel */
  score: { ct: number; t: number };

  /** Joueurs en vie (début du moment) */
  aliveCT: number;
  aliveT: number;

  /** État de la bombe */
  bombState: 'carried' | 'planted' | 'defused' | 'exploded' | 'dropped' | null;

  /** Site concerné */
  site?: 'A' | 'B' | null;

  /** Type de buy */
  buyType: 'full' | 'half' | 'eco' | 'force' | 'pistol';

  /** Round type */
  roundType: 'pistol' | 'force' | 'eco' | 'full_buy' | 'bonus';
}

export interface MomentDetails {
  // Pour clutch
  clutchInfo?: {
    startingPlayers: number; // 1v?
    opponentsKilled: number;
    survived: boolean;
    bombDefused?: boolean;
    bombPlanted?: boolean;
    timeRemaining?: number;
  };

  // Pour multi-kill
  multiKillInfo?: {
    killCount: number;
    timeSpan: number; // seconds
    weapons: string[];
    headshots: number;
    isAce: boolean;
  };

  // Pour entry
  entryInfo?: {
    won: boolean;
    weapon: string;
    traded: boolean;
    tradeTime?: number;
  };

  // Pour utility
  utilityInfo?: {
    utilityType: 'flash' | 'smoke' | 'molotov' | 'he';
    playersAffected: number;
    damageDealt?: number;
    assistedKill?: boolean;
  };

  // Pour mistake
  mistakeInfo?: {
    mistakeType: string;
    whatWentWrong: string;
    whatShouldHaveDone: string;
    impactLevel: 'minor' | 'moderate' | 'major';
  };

  // Pour team execute
  teamInfo?: {
    playersInvolved: number;
    utilityUsed: number;
    executeSuccess: boolean;
    siteTaken?: string;
  };

  // Kills associés
  kills?: MomentKill[];
}

export interface MomentKill {
  tick: number;
  killer: string;
  victim: string;
  weapon: string;
  headshot: boolean;
  throughSmoke: boolean;
  wallbang: boolean;
  noscope: boolean;
  flashed: boolean;
  airborne: boolean;
}

export interface ClipInfo {
  /** Tick de début recommandé (avec buffer) */
  startTick: number;

  /** Tick de fin recommandé (avec buffer) */
  endTick: number;

  /** Durée suggérée en secondes */
  suggestedDuration: number;

  /** POV recommandé */
  recommendedPov: string; // steamId

  /** Commandes demo pour extraire */
  demoCommands: {
    gotoTick: string;
    specPlayer: string;
    startRecording: string;
    stopRecording: string;
  };

  /** Pour export FFmpeg (futur) */
  ffmpegTimestamps?: {
    start: string;
    end: string;
  };
}

// ============================================
// COLLECTION DE MOMENTS
// ============================================

export interface MomentCollection {
  /** ID de la démo */
  demoId: string;

  /** Joueur analysé */
  playerSteamId: string;
  playerName: string;

  /** Statistiques globales */
  stats: MomentStats;

  /** Tous les moments détectés */
  moments: Moment[];

  /** Moments filtrés par type */
  byType: Record<MomentType, Moment[]>;

  /** Moments filtrés par tag */
  byTag: Record<MomentTag, Moment[]>;

  /** Top moments (par intérêt) */
  topMoments: Moment[];

  /** Moments à apprendre */
  learningMoments: Moment[];

  /** Erreurs à corriger */
  mistakes: Moment[];
}

export interface MomentStats {
  totalMoments: number;
  highlights: number;
  mistakes: number;
  learningOpportunities: number;
  clutchAttempts: number;
  clutchWins: number;
  multiKills: number;
  aces: number;
}

// ============================================
// FILTRES ET OPTIONS
// ============================================

export interface MomentDetectionOptions {
  /** Seuil minimum d'intérêt (0-100) */
  minInterestScore?: number;

  /** Types de moments à détecter */
  detectTypes?: MomentType[];

  /** Inclure les erreurs */
  includeMistakes?: boolean;

  /** Inclure les moments d'équipe */
  includeTeamMoments?: boolean;

  /** Buffer avant/après le moment (ticks) */
  clipBuffer?: {
    before: number;
    after: number;
  };
}

export interface MomentFilter {
  types?: MomentType[];
  tags?: MomentTag[];
  minImportance?: MomentImportance;
  minInterestScore?: number;
  round?: number | { min: number; max: number };
  player?: string;
}

// ============================================
// EXPORT CONFIG
// ============================================

export interface MomentExportOptions {
  format: 'timestamps' | 'json' | 'csv' | 'clipboard';
  includePov: boolean;
  includeContext: boolean;
  includeLessons: boolean;
}

export interface MomentExport {
  moments: Array<{
    round: number;
    tick: number;
    time: string;
    type: string;
    title: string;
    description?: string;
    pov?: string;
    lessons?: string[];
  }>;
}
