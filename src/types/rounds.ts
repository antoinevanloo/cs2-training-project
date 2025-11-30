/**
 * Types pour les rounds CS2
 * Centralise les types utilises dans l'analyse round par round
 */

export type RoundEventType =
  | 'kill'
  | 'death'
  | 'assist'
  | 'flash_assist'
  | 'plant'
  | 'defuse'
  | 'damage';

export interface RoundEvent {
  type: RoundEventType;
  tick?: number;
  timestamp?: number;
  attacker?: string;
  attackerSteamId?: string;
  victim?: string;
  victimSteamId?: string;
  weapon?: string;
  headshot?: boolean;
  assistedFlash?: boolean;
  damage?: number;
}

export interface Round {
  roundNumber: number;
  winnerTeam: number;
  winReason: string;
  team1Money: number;
  team2Money: number;
  team1Equipment: number;
  team2Equipment: number;
  duration: number;
  events: RoundEvent[];
}

export interface PlayerRoundStats {
  kills: number;
  deaths: number;
  assists: number;
}

export interface HalfStats {
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
}

export const WIN_REASON_LABELS: Record<string, string> = {
  bomb_exploded: 'Bombe explosee',
  bomb_defused: 'Bombe desamorcee',
  elimination: 'Elimination',
  time: 'Temps ecoule',
  ct_win: 'CT Win',
  t_win: 'T Win',
};
