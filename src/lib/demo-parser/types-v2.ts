/**
 * Types CS2 Demo Parser v2.0 - Définitions exhaustives
 *
 * Ce fichier contient toutes les interfaces TypeScript pour les données
 * extraites par le parser v2, incluant les nouvelles métriques pour:
 * - Économie détaillée par joueur/round
 * - Événements de tirs d'armes (accuracy réelle)
 * - Événements de flash (player_blind)
 * - Événements bombe complets
 * - Positions continues avec états joueurs
 * - Données dérivées (clutches, trades, entries)
 */

// =============================================================================
// TYPES DE BASE
// =============================================================================

/**
 * Position 3D dans l'espace de jeu
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Vecteur de vélocité 3D
 */
export interface Velocity3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Angles de vue du joueur
 */
export interface ViewAngles {
  yaw: number;
  pitch: number;
}

/**
 * Catégories d'armes
 */
export type WeaponCategory =
  | 'rifles'
  | 'smgs'
  | 'pistols'
  | 'snipers'
  | 'shotguns'
  | 'heavy'
  | 'grenades'
  | 'other';

/**
 * Types de grenades
 */
export type GrenadeType = 'flash' | 'smoke' | 'he' | 'molotov' | 'decoy';

/**
 * Types d'événements bombe
 */
export type BombEventType =
  | 'planted'
  | 'defused'
  | 'exploded'
  | 'dropped'
  | 'pickup'
  | 'beginplant'
  | 'abortplant'
  | 'begindefuse'
  | 'abortdefuse';

/**
 * Sites de bombe
 */
export type BombSite = 'A' | 'B' | 'unknown';

/**
 * Équipes
 */
export type Team = 'CT' | 'T' | 'unknown';
export const TEAM_CT = 2;
export const TEAM_T = 3;

// =============================================================================
// STRUCTURES DE DONNÉES PRINCIPALES
// =============================================================================

/**
 * Résultat complet du parsing v2
 */
export interface ParsedDemoDataV2 {
  version: string;
  metadata: DemoMetadataV2;
  players: PlayerInfoV2[];
  rounds: RoundInfoV2[];
  kills: KillEventV2[];
  damages: DamageEventV2[];
  grenades: GrenadeEventV2[];
  playerBlinds: PlayerBlindEvent[];
  bombEvents: BombEvent[];
  economyByRound: RoundEconomy[];
  purchases: ItemPurchase[];
  weaponFires?: WeaponFireEvent[];
  positions?: PositionSnapshotV2[];
  clutches: ClutchSituation[];
  entryDuels: EntryDuel[];
  trades: TradeEvent[];
  parsingStats: ParsingStats;
}

/**
 * Métadonnées de la démo
 */
export interface DemoMetadataV2 {
  map: string;
  duration: number;
  tickrate: number;
  matchDate: string | null;
  serverName?: string;
  demoVersion?: string;
  error?: string;
}

/**
 * Informations joueur
 */
export interface PlayerInfoV2 {
  steamId: string;
  name: string;
  team: number;
}

/**
 * Informations de round
 */
export interface RoundInfoV2 {
  roundNumber: number;
  winner: number;
  reason: number;
  tick: number;
}

// =============================================================================
// ÉVÉNEMENTS DE COMBAT
// =============================================================================

/**
 * Événement de kill détaillé
 */
export interface KillEventV2 {
  tick: number;
  round: number;

  // Attaquant
  attackerSteamId: string;
  attackerName: string;
  attackerPosition: Position3D;

  // Victime
  victimSteamId: string;
  victimName: string;
  victimPosition: Position3D;

  // Arme
  weapon: string;
  weaponCategory: WeaponCategory;

  // Conditions du kill
  headshot: boolean;
  penetrated: boolean;
  attackerBlind: boolean;
  noScope: boolean;
  throughSmoke: boolean;
  assistedFlash: boolean;

  // Statistiques
  distance: number;
}

/**
 * Événement de dégâts détaillé
 */
export interface DamageEventV2 {
  tick: number;
  round: number;

  attackerSteamId: string;
  victimSteamId: string;

  damage: number;
  damageArmor: number;
  healthRemaining: number;
  armorRemaining: number;

  weapon: string;
  weaponCategory: WeaponCategory;
  hitgroup: number;
}

/**
 * Événement de tir d'arme (pour calcul accuracy)
 */
export interface WeaponFireEvent {
  tick: number;
  round: number;

  steamId: string;
  weapon: string;
  weaponCategory: WeaponCategory;
  silencer: boolean;

  // État du joueur au moment du tir
  position: Position3D;
  velocity: Velocity3D;
  speed: number;
  viewAngles: ViewAngles;

  // Conditions
  isScoped: boolean;
  isCrouching: boolean;
  isAirborne: boolean;
  isMoving: boolean;
  isCounterStrafed: boolean;
}

// =============================================================================
// ÉVÉNEMENTS DE GRENADES
// =============================================================================

/**
 * Événement de grenade
 */
export interface GrenadeEventV2 {
  type: GrenadeType;
  tick: number;
  round: number;
  throwerSteamId: string;
  position: Position3D;
}

/**
 * Événement player_blind (flash reçue)
 */
export interface PlayerBlindEvent {
  tick: number;
  round: number;
  victimSteamId: string;
  attackerSteamId: string;
  duration: number;
  entityId: number;
}

// =============================================================================
// ÉVÉNEMENTS BOMBE
// =============================================================================

/**
 * Événement de bombe
 */
export interface BombEvent {
  type: BombEventType;
  tick: number;
  round: number;
  steamId: string;
  site?: number;
  hasKit?: boolean;
  position?: Position3D;
}

// =============================================================================
// ÉCONOMIE
// =============================================================================

/**
 * Économie d'un round
 */
export interface RoundEconomy {
  round: number;
  tick: number;
  players: PlayerRoundEconomy[];
}

/**
 * Économie d'un joueur pour un round
 */
export interface PlayerRoundEconomy {
  steamId: string;
  balance: number;
  equipmentValue: number;
  spentThisRound: number;
  hasHelmet: boolean;
  hasDefuser: boolean;
  armorValue: number;
  team: number;
  weapon: string;
}

/**
 * Achat d'item
 */
export interface ItemPurchase {
  tick: number;
  round: number;
  steamId: string;
  item: string;
  itemCategory: WeaponCategory;
  team: number;
}

// =============================================================================
// POSITIONS ET ÉTATS
// =============================================================================

/**
 * Snapshot de positions à un tick donné
 */
export interface PositionSnapshotV2 {
  tick: number;
  players: PlayerStateSnapshot[];
}

/**
 * État complet d'un joueur à un tick
 */
export interface PlayerStateSnapshot {
  steamId: string;

  // Position
  x: number;
  y: number;
  z: number;

  // Mouvement
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  speed: number;

  // Santé
  health: number;
  armor: number;

  // Équipe
  team: number;

  // État
  isScoped: boolean;
  isWalking: boolean;
  isCrouching: boolean;
  isAirborne: boolean;

  // Équipement
  weapon: string;
  balance: number;
}

// =============================================================================
// DONNÉES DÉRIVÉES
// =============================================================================

/**
 * Situation de clutch
 */
export interface ClutchSituation {
  round: number;
  steamId: string;
  killsInClutch: number;
  startTick: number;
  won: boolean;
  versus?: number; // 1v1, 1v2, etc.
}

/**
 * Duel d'entrée
 */
export interface EntryDuel {
  round: number;
  tick: number;
  winnerId: string;
  loserId: string;
  weapon: string;
  headshot: boolean;
  distance: number;
}

/**
 * Événement de trade
 */
export interface TradeEvent {
  round: number;
  originalKillTick: number;
  tradeTick: number;
  timeToTrade: number;
  originalVictimId: string;
  originalKillerId: string;
  traderId: string;
}

// =============================================================================
// STATISTIQUES
// =============================================================================

/**
 * Statistiques de parsing
 */
export interface ParsingStats {
  totalKills: number;
  totalDamages: number;
  totalGrenades: number;
  totalBlinds: number;
  totalBombEvents: number;
  totalWeaponFires: number;
  totalPositionSnapshots: number;
  totalPurchases: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Hitgroups (parties du corps)
 */
export const HITGROUP = {
  GENERIC: 0,
  HEAD: 1,
  CHEST: 2,
  STOMACH: 3,
  LEFT_ARM: 4,
  RIGHT_ARM: 5,
  LEFT_LEG: 6,
  RIGHT_LEG: 7,
  GEAR: 10,
} as const;

export type HitgroupType = (typeof HITGROUP)[keyof typeof HITGROUP];

/**
 * Raisons de fin de round
 */
export const ROUND_END_REASON = {
  TARGET_BOMBED: 1,
  VIP_ESCAPED: 2,
  VIP_ASSASSINATED: 3,
  TERRORISTS_ESCAPED: 4,
  CT_STOPPED_ESCAPE: 5,
  TERRORISTS_SURRENDERED: 6,
  BOMB_DEFUSED: 7,
  CT_WIN: 8,
  TERRORIST_WIN: 9,
  DRAW: 10,
  HOSTAGES_RESCUED: 11,
  TARGET_SAVED: 12,
  HOSTAGES_NOT_RESCUED: 13,
  TERRORISTS_NOT_ESCAPED: 14,
  VIP_NOT_ESCAPED: 15,
  GAME_START: 16,
  TERRORISTS_SURRENDERED_2: 17,
  CT_SURRENDERED: 18,
} as const;

export type RoundEndReasonType = (typeof ROUND_END_REASON)[keyof typeof ROUND_END_REASON];

/**
 * Seuils pour le counter-strafing
 */
export const MOVEMENT_THRESHOLDS = {
  COUNTER_STRAFE_PERFECT: 0,
  COUNTER_STRAFE_GOOD: 34,
  WALKING_SPEED: 130,
  RUNNING_SPEED: 250,
  MAX_SPEED: 260,
} as const;

/**
 * Seuils de temps pour les trades (en secondes)
 */
export const TRADE_THRESHOLDS = {
  INSTANT: 1.0,
  FAST: 2.0,
  NORMAL: 3.0,
  SLOW: 5.0,
} as const;

/**
 * Seuils de durée flash (en secondes)
 */
export const FLASH_THRESHOLDS = {
  FULL_BLIND: 2.0,
  SIGNIFICANT: 1.0,
  PARTIAL: 0.5,
} as const;

/**
 * Catégories d'armes avec leurs armes
 */
export const WEAPON_CATEGORIES: Record<WeaponCategory, string[]> = {
  rifles: ['ak47', 'm4a1', 'm4a1_silencer', 'sg556', 'aug', 'galilar', 'famas'],
  smgs: ['mp9', 'mac10', 'mp7', 'ump45', 'p90', 'mp5sd', 'bizon'],
  pistols: [
    'glock',
    'usp_silencer',
    'hkp2000',
    'p250',
    'fiveseven',
    'tec9',
    'deagle',
    'elite',
    'cz75a',
    'revolver',
  ],
  snipers: ['awp', 'ssg08', 'scar20', 'g3sg1'],
  shotguns: ['nova', 'xm1014', 'mag7', 'sawedoff'],
  heavy: ['m249', 'negev'],
  grenades: ['hegrenade', 'flashbang', 'smokegrenade', 'molotov', 'incgrenade', 'decoy'],
  other: [],
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Normalise le nom d'une arme
 */
export function normalizeWeapon(weapon: string): string {
  return weapon.toLowerCase().replace('weapon_', '');
}

/**
 * Retourne la catégorie d'une arme
 */
export function getWeaponCategory(weapon: string): WeaponCategory {
  const normalized = normalizeWeapon(weapon);
  for (const [category, weapons] of Object.entries(WEAPON_CATEGORIES)) {
    if (weapons.includes(normalized)) {
      return category as WeaponCategory;
    }
  }
  return 'other';
}

/**
 * Convertit un numéro d'équipe en type
 */
export function getTeamFromNumber(teamNum: number): Team {
  if (teamNum === TEAM_CT) return 'CT';
  if (teamNum === TEAM_T) return 'T';
  return 'unknown';
}

/**
 * Convertit un numéro de site en type
 */
export function getBombSiteFromNumber(siteNum: number | undefined): BombSite {
  if (siteNum === 0) return 'A';
  if (siteNum === 1) return 'B';
  return 'unknown';
}

/**
 * Calcule la distance entre deux positions
 */
export function calculateDistance(pos1: Position3D, pos2: Position3D): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcule la vitesse à partir d'un vecteur vélocité
 */
export function calculateSpeed(velocity: Velocity3D): number {
  return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
}

/**
 * Vérifie si un joueur est counter-strafé
 */
export function isCounterStrafed(speed: number): boolean {
  return speed <= MOVEMENT_THRESHOLDS.COUNTER_STRAFE_GOOD;
}

/**
 * Vérifie si un joueur marche
 */
export function isWalkingSpeed(speed: number): boolean {
  return speed > 0 && speed <= MOVEMENT_THRESHOLDS.WALKING_SPEED;
}

/**
 * Classifie la durée d'un flash
 */
export function classifyFlashDuration(
  duration: number
): 'full' | 'significant' | 'partial' | 'minimal' {
  if (duration >= FLASH_THRESHOLDS.FULL_BLIND) return 'full';
  if (duration >= FLASH_THRESHOLDS.SIGNIFICANT) return 'significant';
  if (duration >= FLASH_THRESHOLDS.PARTIAL) return 'partial';
  return 'minimal';
}

/**
 * Classifie la vitesse d'un trade
 */
export function classifyTradeSpeed(
  timeToTrade: number
): 'instant' | 'fast' | 'normal' | 'slow' | 'late' {
  if (timeToTrade <= TRADE_THRESHOLDS.INSTANT) return 'instant';
  if (timeToTrade <= TRADE_THRESHOLDS.FAST) return 'fast';
  if (timeToTrade <= TRADE_THRESHOLDS.NORMAL) return 'normal';
  if (timeToTrade <= TRADE_THRESHOLDS.SLOW) return 'slow';
  return 'late';
}

/**
 * Convertit des ticks en secondes
 */
export function ticksToSeconds(ticks: number, tickrate = 128): number {
  return ticks / tickrate;
}

/**
 * Convertit des secondes en ticks
 */
export function secondsToTicks(seconds: number, tickrate = 128): number {
  return Math.round(seconds * tickrate);
}

// =============================================================================
// RÉTRO-COMPATIBILITÉ
// =============================================================================

// Export des anciens noms pour compatibilité
export type {
  KillEventV2 as KillEvent,
  DamageEventV2 as DamageEvent,
  GrenadeEventV2 as GrenadeEvent,
  PositionSnapshotV2 as PositionSnapshot,
  PlayerStateSnapshot as PlayerPosition,
  ParsedDemoDataV2 as ParsedDemoData,
  DemoMetadataV2 as DemoMetadata,
  PlayerInfoV2 as PlayerInfo,
  RoundInfoV2 as RoundInfo,
};

// Legacy interface pour économie simple
export interface EconomySnapshot {
  round: number;
  tick: number;
}
