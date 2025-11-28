import { Prisma } from '@prisma/client';

// Types pour les includes communs
export type DemoWithAnalysis = Prisma.DemoGetPayload<{
  include: {
    analysis: true;
    playerStats: true;
    rounds: true;
  };
}>;

export type DemoWithPlayerStats = Prisma.DemoGetPayload<{
  include: {
    playerStats: true;
  };
}>;

export type UserWithStats = Prisma.UserGetPayload<{
  include: {
    stats: true;
  };
}>;

export type AnalysisWithDemo = Prisma.AnalysisGetPayload<{
  include: {
    demo: true;
  };
}>;

// Types pour les données JSON
export interface WeaponStats {
  [weapon: string]: {
    kills: number;
    headshots: number;
    damage: number;
  };
}

export interface MapStats {
  [mapName: string]: {
    played: number;
    winRate: number;
    avgRating: number;
  };
}

export interface RatingHistoryEntry {
  date: string;
  rating: number;
}

// Types pour les filtres de requêtes
export interface DemoFilters {
  userId?: string;
  mapName?: string;
  status?: string;
  matchResult?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}
