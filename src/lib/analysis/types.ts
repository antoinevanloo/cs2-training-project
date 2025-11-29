export interface AnalysisResult {
  playerStats: PlayerStats;
  scores: AnalysisScores;
  analyses: DetailedAnalyses;
  strengths: string[];
  weaknesses: string[];
}

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  hsPercentage: number;
  adr: number;
  kast: number;
  rating: number;
}

export interface AnalysisScores {
  overall: number;
  aim: number;
  positioning: number;
  utility: number;
  economy: number;
  timing: number;
  decision: number;
}

export interface DetailedAnalyses {
  aim: AimAnalysis;
  positioning: PositioningAnalysis;
  utility: UtilityAnalysis;
  economy: EconomyAnalysis;
  timing: TimingAnalysis;
  decision: DecisionAnalysis;
}

export interface AimAnalysis {
  crosshairPlacement: {
    score: number;
    headLevelTime: number;
  };
  reactionTime: {
    average: number;
    best: number;
  };
  accuracy: {
    overall: number;
    headshot: number;
  };
  sprayControl: {
    score: number;
    transferSpeed: number;
  };
  firstBulletAccuracy: number;
  metrics: Record<string, number>;
}

export interface PositioningAnalysis {
  mapControl: {
    score: number;
    avgAreaControlled: number;
  };
  rotationSpeed: {
    average: number;
    optimal: number;
  };
  deathPositions: Array<{
    x: number;
    y: number;
    count: number;
    isBadPosition: boolean;
  }>;
  commonMistakes: string[];
  metrics: Record<string, number>;
}

export interface UtilityAnalysis {
  flashEfficiency: {
    thrown: number;
    enemiesFlashed: number;
    effectiveness: number;
  };
  smokeUsage: {
    thrown: number;
    usedForExecute: number;
  };
  molotovDamage: {
    thrown: number;
    totalDamage: number;
  };
  heUsage: {
    thrown: number;
    totalDamage: number;
  };
  metrics: Record<string, number>;
}

export interface EconomyAnalysis {
  buyDecisions: {
    correct: number;
    incorrect: number;
    score: number;
  };
  saveRounds: {
    appropriate: number;
    inappropriate: number;
  };
  impactOnTeam: {
    positiveRounds: number;
    negativeRounds: number;
  };
  avgMoneyAtDeath: number;
  metrics: Record<string, number>;
}

export interface TimingAnalysis {
  peekTiming: {
    score: number;
    avgPrefire: boolean;
  };
  tradeSpeed: {
    average: number;
    successful: number;
  };
  rotationTiming: {
    early: number;
    onTime: number;
    late: number;
  };
  metrics: Record<string, number>;
}

export interface DecisionAnalysis {
  clutchPerformance: {
    attempts: number;
    won: number;
    score: number;
  };
  retakeDecisions: {
    correct: number;
    incorrect: number;
  };
  aggressionLevel: 'passive' | 'balanced' | 'aggressive';
  riskTaking: {
    calculated: number;
    reckless: number;
  };
  metrics: Record<string, number>;
}
