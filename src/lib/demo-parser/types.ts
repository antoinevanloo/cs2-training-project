export interface DemoParseResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ParsedDemoData {
  metadata: DemoMetadata;
  players: PlayerInfo[];
  rounds: RoundInfo[];
  kills: KillEvent[];
  damages: DamageEvent[];
  grenades: GrenadeEvent[];
  positions: PositionSnapshot[];
  economy: EconomySnapshot[];
}

export interface DemoMetadata {
  map: string;
  duration: number;
  tickrate: number;
  matchDate?: string | null; // Date ISO du match si trouvée dans les convars
}

export interface PlayerInfo {
  steamId: string;
  name: string;
  team: number;
}

export interface RoundInfo {
  roundNumber: number;
  winner: number;
  reason: number;
  tick: number;
}

export interface KillEvent {
  tick: number;
  round: number;
  attackerSteamId: string;
  attackerName: string;
  victimSteamId: string;
  victimName: string;
  weapon: string;
  headshot: boolean;
  penetrated: boolean;
  attackerBlind: boolean;
  noScope: boolean;
  throughSmoke: boolean;
  attackerPosition: Position3D;
  victimPosition: Position3D;
}

export interface DamageEvent {
  tick: number;
  round: number;
  attackerSteamId: string;
  victimSteamId: string;
  damage: number;
  damageArmor: number;
  weapon: string;
  hitgroup: number;
}

export interface GrenadeEvent {
  type: 'flash' | 'smoke' | 'he' | 'molotov';
  tick: number;
  round: number;
  throwerSteamId: string;
  position: Position3D;
}

export interface PositionSnapshot {
  tick: number;
  players: PlayerPosition[];
}

export interface PlayerPosition {
  steamId: string;
  x: number;
  y: number;
  z: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface EconomySnapshot {
  round: number;
  tick: number;
}

// Hitgroup constants
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

// Round end reasons
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
