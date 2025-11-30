import { z } from 'zod';

// Schémas pour les métriques internes
const AimMetricsSchema = z.object({
  crosshairPlacement: z.object({ score: z.number(), headLevelTime: z.number() }),
  reactionTime: z.object({ average: z.number(), best: z.number() }),
  accuracy: z.object({ overall: z.number(), headshot: z.number() }),
  sprayControl: z.object({ score: z.number(), transferSpeed: z.number() }),
  firstBulletAccuracy: z.number(),
});

const PositioningMetricsSchema = z.object({
  mapControl: z.object({ score: z.number(), avgAreaControlled: z.number() }),
  rotationSpeed: z.object({ average: z.number(), optimal: z.number() }),
  deathPositions: z.array(z.object({ x: z.number(), y: z.number(), count: z.number(), isBadPosition: z.boolean() })),
  commonMistakes: z.array(z.string()),
});

const UtilityMetricsSchema = z.object({
  flashEfficiency: z.object({ thrown: z.number(), enemiesFlashed: z.number(), effectiveness: z.number() }),
  smokeUsage: z.object({ thrown: z.number(), usedForExecute: z.number() }),
  molotovDamage: z.object({ thrown: z.number(), totalDamage: z.number() }),
  heUsage: z.object({ thrown: z.number(), totalDamage: z.number() }),
});

const EconomyMetricsSchema = z.object({
  buyDecisions: z.object({ correct: z.number(), incorrect: z.number(), score: z.number() }),
  saveRounds: z.object({ appropriate: z.number(), inappropriate: z.number() }),
  impactOnTeam: z.object({ positiveRounds: z.number(), negativeRounds: z.number() }),
  avgMoneyAtDeath: z.number(),
});

const TimingMetricsSchema = z.object({
  peekTiming: z.object({ score: z.number(), avgPrefire: z.boolean() }),
  tradeSpeed: z.object({ average: z.number(), successful: z.number() }),
  rotationTiming: z.object({ early: z.number(), onTime: z.number(), late: z.number() }),
});

const DecisionMetricsSchema = z.object({
  clutchPerformance: z.object({ attempts: z.number(), won: z.number(), score: z.number() }),
  retakeDecisions: z.object({ correct: z.number(), incorrect: z.number() }),
  aggressionLevel: z.enum(['passive', 'balanced', 'aggressive']),
  riskTaking: z.object({ calculated: z.number(), reckless: z.number() }),
});

// Schéma principal pour l'objet `Analysis` de Prisma
export const AnalysisSchema = z.object({
  aimAnalysis: AimMetricsSchema,
  positioningAnalysis: PositioningMetricsSchema,
  utilityAnalysis: UtilityMetricsSchema,
  economyAnalysis: EconomyMetricsSchema,
  timingAnalysis: TimingMetricsSchema,
  decisionAnalysis: DecisionMetricsSchema,
});

// Schéma pour le rapport de coaching
const RecommendationSchema = z.object({
  id: z.string(),
  category: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  exercises: z.array(z.object({ name: z.string(), duration: z.number(), type: z.string() })),
  workshopMaps: z.array(z.object({ name: z.string(), url: z.string() })),
});

export const CoachingReportSchema = z.object({
  generatedAt: z.string().datetime(),
  priorityIssues: z.array(z.object({ area: z.string(), issue: z.string(), severity: z.string() })),
  recommendations: z.array(RecommendationSchema),
  exercises: z.array(z.any()), // Peut être affiné si nécessaire
  weeklyPlan: z.any(), // Peut être affiné si nécessaire
  summary: z.string(),
  context: z.object({
      role: z.string().optional(),
      roleName: z.string().optional(),
      map: z.string().optional(),
      rank: z.string().optional(),
      side: z.enum(['ct', 't']).optional(),
      summary: z.string(),
  }),
  evaluatedRules: z.any(), // Peut être affiné si nécessaire
  featuresStatus: z.any(), // Peut être affiné si nécessaire
});

// Inférence de types
export type AimAnalysis = z.infer<typeof AimMetricsSchema>;
export type PositioningAnalysis = z.infer<typeof PositioningMetricsSchema>;
export type UtilityAnalysis = z.infer<typeof UtilityMetricsSchema>;
export type EconomyAnalysis = z.infer<typeof EconomyMetricsSchema>;
export type TimingAnalysis = z.infer<typeof TimingMetricsSchema>;
export type DecisionAnalysis = z.infer<typeof DecisionMetricsSchema>;
export type CoachingReport = z.infer<typeof CoachingReportSchema>;
