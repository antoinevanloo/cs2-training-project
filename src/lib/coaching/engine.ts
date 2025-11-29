import { AnalysisResult, AnalysisScores } from '../analysis/types';
import { allCoachingRules } from './rules';
import { exercises } from './exercises';
import {
  CoachingReport,
  Recommendation,
  Exercise,
  WeeklyPlan,
  DayPlan,
  CoachingRule,
} from './types';
import {
  PlayerContext,
  PlayerRole,
  CS2Rank,
  evaluateRuleWithContext,
  getContextSummary,
  PLAYER_ROLES,
  detectPlayerRole,
  isGlobalFeatureEnabled,
  isCategoryEnabled,
  isRuleEnabled,
  getFeatures,
  CoachingThresholds,
} from './config';

/**
 * Options pour la génération du rapport de coaching
 */
export interface CoachingOptions {
  /** Rôle du joueur (optionnel, sera détecté automatiquement si non fourni) */
  role?: PlayerRole;
  /** Map jouée */
  map?: string;
  /** Rank du joueur */
  rank?: CS2Rank;
  /** Côté dominant (CT ou T) */
  side?: 'ct' | 't';
  /** Forcer la détection automatique du rôle même si un rôle est fourni */
  forceAutoDetect?: boolean;
}

/**
 * Résultat détaillé d'une règle évaluée
 */
export interface EvaluatedRule {
  rule: CoachingRule;
  triggered: boolean;
  disabled: boolean;
  disabledReason?: string;
  adjustments?: {
    originalThreshold?: number;
    adjustedThreshold?: number;
    modifiers?: {
      role?: number;
      map?: number;
      rank?: number;
    };
  };
}

/**
 * Rapport de coaching étendu avec informations de contexte
 */
export interface ExtendedCoachingReport extends CoachingReport {
  context: {
    role?: PlayerRole;
    roleName?: string;
    map?: string;
    rank?: CS2Rank;
    side?: 'ct' | 't';
    summary: string;
  };
  evaluatedRules: {
    triggered: number;
    disabled: number;
    total: number;
    details: EvaluatedRule[];
  };
  featuresStatus: {
    coachingEnabled: boolean;
    roleAdjustment: boolean;
    mapAdjustment: boolean;
    rankAdjustment: boolean;
  };
}

export class CoachingEngine {
  /**
   * Génère un rapport de coaching avec contexte
   */
  generateReport(
    analysis: AnalysisResult,
    options: CoachingOptions = {}
  ): ExtendedCoachingReport {
    const features = getFeatures();

    // Vérifier si le coaching est activé
    if (!isGlobalFeatureEnabled('coachingEnabled')) {
      return this.createDisabledReport(analysis, 'Le système de coaching est désactivé');
    }

    // Construire le contexte du joueur
    const context = this.buildPlayerContext(analysis, options);

    // Évaluer toutes les règles avec le contexte
    const evaluatedRules = this.evaluateRulesWithContext(analysis, context);

    // Filtrer les règles déclenchées et actives
    const triggeredRules = evaluatedRules
      .filter((er) => er.triggered && !er.disabled)
      .map((er) => er.rule)
      .sort((a, b) => a.priority - b.priority);

    // Générer les recommandations
    const recommendations: Recommendation[] = triggeredRules.map((rule) => ({
      id: rule.id,
      category: rule.category,
      severity: this.getSeverity(rule.priority),
      title: rule.recommendation.title,
      description: this.enrichDescription(rule, context),
      exercises: rule.recommendation.exercises,
      workshopMaps: rule.recommendation.workshopMaps,
    }));

    // Limiter selon la configuration
    const maxIssues = features.display.maxPriorityIssues;
    const maxRecs = features.display.maxRecommendations;

    // Priority issues
    const priorityIssues = recommendations.slice(0, maxIssues).map((r) => ({
      area: r.category,
      issue: r.id,
      severity: r.severity,
    }));

    // Weekly plan
    const weeklyPlan = isGlobalFeatureEnabled('weeklyPlanEnabled')
      ? this.generateWeeklyPlan(recommendations, analysis.weaknesses)
      : this.createEmptyWeeklyPlan();

    // Exercises
    const recommendedExercises = isGlobalFeatureEnabled('exerciseSuggestionsEnabled')
      ? this.selectExercises(recommendations, analysis.scores)
      : [];

    return {
      generatedAt: new Date().toISOString(),
      priorityIssues,
      recommendations: recommendations.slice(0, maxRecs),
      exercises: recommendedExercises,
      weeklyPlan,
      summary: this.generateSummary(analysis, recommendations, context),
      context: {
        role: context.role,
        roleName: context.role ? PLAYER_ROLES[context.role].name : undefined,
        map: context.map,
        rank: context.rank,
        side: context.side,
        summary: getContextSummary(context),
      },
      evaluatedRules: {
        triggered: evaluatedRules.filter((er) => er.triggered && !er.disabled).length,
        disabled: evaluatedRules.filter((er) => er.disabled).length,
        total: evaluatedRules.length,
        details: evaluatedRules,
      },
      featuresStatus: {
        coachingEnabled: isGlobalFeatureEnabled('coachingEnabled'),
        roleAdjustment: isGlobalFeatureEnabled('roleAdjustmentEnabled'),
        mapAdjustment: isGlobalFeatureEnabled('mapAdjustmentEnabled'),
        rankAdjustment: isGlobalFeatureEnabled('rankAdjustmentEnabled'),
      },
    };
  }

  /**
   * Construit le contexte du joueur à partir des options et de l'analyse
   */
  private buildPlayerContext(
    analysis: AnalysisResult,
    options: CoachingOptions
  ): PlayerContext {
    const context: PlayerContext = {
      map: options.map,
      rank: options.rank,
      side: options.side,
    };

    // Détection du rôle
    if (options.role && !options.forceAutoDetect) {
      context.role = options.role;
    } else if (isGlobalFeatureEnabled('autoRoleDetectionEnabled')) {
      context.role = this.detectRole(analysis);
    }

    return context;
  }

  /**
   * Détecte automatiquement le rôle du joueur basé sur ses stats
   */
  private detectRole(analysis: AnalysisResult): PlayerRole {
    const stats = analysis.playerStats;
    const utilityAnalysis = analysis.analyses.utility;

    // Calculer les inputs pour la détection
    // Note: entryKills n'est pas disponible dans PlayerStats actuel, on utilise des proxies
    const kd = stats.kills / Math.max(1, stats.deaths);
    const entryKillRate = kd > 1.2 ? 0.2 : 0.1; // Estimation basée sur K/D
    const avgWeaponValue = this.estimateAvgWeaponValue(analysis);
    const isolatedDeathRate = this.estimateIsolatedDeathRate(analysis);
    const flashesThrown = utilityAnalysis?.flashEfficiency?.thrown || 0;
    const smokesThrown = utilityAnalysis?.smokeUsage?.thrown || 0;
    const firstKillRate = kd > 1.3 ? 0.15 : 0.08; // Estimation

    return detectPlayerRole({
      entryKillRate,
      avgWeaponValue,
      isolatedDeathRate,
      flashesThrown,
      smokesThrown,
      avgPositionDistance: 500, // Valeur par défaut, non disponible dans l'analyse actuelle
      firstKillRate,
    });
  }

  /**
   * Estime la valeur moyenne de l'arme utilisée
   * Note: Sans données détaillées des armes, on utilise le rating comme proxy
   */
  private estimateAvgWeaponValue(analysis: AnalysisResult): number {
    // Si le rating est très élevé avec peu de kills, probablement un AWPer
    const stats = analysis.playerStats;
    const kd = stats.kills / Math.max(1, stats.deaths);

    // Un AWPer a généralement un bon K/D avec moins de kills totaux
    // mais un impact élevé (rating > 1.1)
    if (stats.rating > 1.1 && kd > 1.3) {
      // Pourrait être un AWPer, mais on ne peut pas le confirmer sans données d'armes
      // On retourne une valeur intermédiaire
      return 3500;
    }

    return 2900; // Valeur moyenne d'un rifle
  }

  /**
   * Estime le taux de morts isolées
   */
  private estimateIsolatedDeathRate(analysis: AnalysisResult): number {
    // Pour l'instant, utiliser le score de map control comme proxy
    const mapControlScore = analysis.analyses.positioning?.mapControl?.score || 60;
    // Score bas = plus isolé
    return (100 - mapControlScore) / 100;
  }

  /**
   * Évalue toutes les règles avec le contexte
   */
  private evaluateRulesWithContext(
    analysis: AnalysisResult,
    context: PlayerContext
  ): EvaluatedRule[] {
    return allCoachingRules.map((rule) => {
      // Vérifier si la catégorie est activée
      if (!isCategoryEnabled(rule.category)) {
        return {
          rule,
          triggered: false,
          disabled: true,
          disabledReason: `Catégorie "${rule.category}" désactivée`,
        };
      }

      // Vérifier si la règle est activée
      if (!isRuleEnabled(rule.category, rule.id)) {
        return {
          rule,
          triggered: false,
          disabled: true,
          disabledReason: `Règle "${rule.id}" désactivée`,
        };
      }

      // Évaluer la règle de base
      const baseTriggered = rule.condition(analysis);

      // Si les ajustements contextuels sont activés, évaluer avec contexte
      const useRoleAdjustment = isGlobalFeatureEnabled('roleAdjustmentEnabled');
      const useMapAdjustment = isGlobalFeatureEnabled('mapAdjustmentEnabled');
      const useRankAdjustment = isGlobalFeatureEnabled('rankAdjustmentEnabled');

      if (!useRoleAdjustment && !useMapAdjustment && !useRankAdjustment) {
        return {
          rule,
          triggered: baseTriggered,
          disabled: false,
        };
      }

      // Appliquer le contexte pour les règles spécifiques
      const contextResult = this.evaluateWithContext(
        rule,
        analysis,
        context,
        baseTriggered
      );

      return contextResult;
    });
  }

  /**
   * Évalue une règle avec le contexte complet
   */
  private evaluateWithContext(
    rule: CoachingRule,
    analysis: AnalysisResult,
    context: PlayerContext,
    baseTriggered: boolean
  ): EvaluatedRule {
    // Règles avec ajustements contextuels connus
    const contextualRules: Record<
      string,
      { category: keyof CoachingThresholds; getValue: (a: AnalysisResult) => number }
    > = {
      isolated_death_rate: {
        category: 'positioning',
        getValue: (a) => this.estimateIsolatedDeathRate(a),
      },
      poor_trade_speed: {
        category: 'timing',
        getValue: (a) =>
          a.analyses.timing?.tradeSpeed?.successful ?? 0.5,
      },
      low_opening_duel_rate: {
        category: 'decision',
        getValue: (a) => {
          // Estimation basée sur les métriques disponibles
          // Un joueur avec un bon rating et K/D a probablement un bon duel rate
          const stats = a.playerStats;
          const kd = stats.kills / Math.max(1, stats.deaths);
          return kd > 1.2 ? 0.55 : kd > 1.0 ? 0.45 : 0.35;
        },
      },
      late_rotations: {
        category: 'timing',
        getValue: () => 5, // Valeur par défaut
      },
    };

    const contextualRule = contextualRules[rule.id];

    if (contextualRule) {
      const actualValue = contextualRule.getValue(analysis);
      const result = evaluateRuleWithContext(
        rule.id,
        contextualRule.category,
        actualValue,
        context
      );

      if (result.disabled) {
        return {
          rule,
          triggered: false,
          disabled: true,
          disabledReason: result.disabledReason,
          adjustments: {
            originalThreshold: result.originalThreshold,
            adjustedThreshold: result.adjustedThreshold,
            modifiers: result.modifiers,
          },
        };
      }

      return {
        rule,
        triggered: result.triggered,
        disabled: false,
        adjustments: {
          originalThreshold: result.originalThreshold,
          adjustedThreshold: result.adjustedThreshold,
          modifiers: result.modifiers,
        },
      };
    }

    // Pour les autres règles, utiliser le résultat de base
    return {
      rule,
      triggered: baseTriggered,
      disabled: false,
    };
  }

  /**
   * Enrichit la description d'une recommandation avec le contexte
   */
  private enrichDescription(rule: CoachingRule, context: PlayerContext): string {
    let description = rule.recommendation.description;

    if (context.role) {
      const roleProfile = PLAYER_ROLES[context.role];

      // Ajouter des conseils spécifiques au rôle
      if (rule.category === 'positioning' && context.role === 'entry') {
        description +=
          ' En tant qu\'entry, concentre-toi sur créer de l\'espace même si tu meurs.';
      } else if (rule.category === 'utility' && context.role === 'support') {
        description +=
          ' En tant que support, tes flashs et smokes sont essentiels pour l\'équipe.';
      } else if (rule.category === 'aim' && context.role === 'awper') {
        description += ' En tant qu\'AWPer, ta précision au premier tir est cruciale.';
      }
    }

    if (context.map) {
      // Conseils spécifiques à la map
      if (context.map.includes('inferno') && rule.id === 'late_rotations') {
        description += ' Sur Inferno, les rotations sont naturellement longues.';
      } else if (context.map.includes('nuke') && rule.id === 'isolated_death_rate') {
        description +=
          ' Sur Nuke, les positions isolées (outside, ramp) sont normales.';
      }
    }

    return description;
  }

  /**
   * Crée un rapport désactivé
   */
  private createDisabledReport(
    analysis: AnalysisResult,
    reason: string
  ): ExtendedCoachingReport {
    return {
      generatedAt: new Date().toISOString(),
      priorityIssues: [],
      recommendations: [],
      exercises: [],
      weeklyPlan: this.createEmptyWeeklyPlan(),
      summary: reason,
      context: {
        summary: 'Coaching désactivé',
      },
      evaluatedRules: {
        triggered: 0,
        disabled: 0,
        total: 0,
        details: [],
      },
      featuresStatus: {
        coachingEnabled: false,
        roleAdjustment: false,
        mapAdjustment: false,
        rankAdjustment: false,
      },
    };
  }

  /**
   * Crée un plan hebdomadaire vide
   */
  private createEmptyWeeklyPlan(): WeeklyPlan {
    const emptyDay: DayPlan = { focus: 'repos', exercises: [], duration: 0 };
    return {
      monday: emptyDay,
      tuesday: emptyDay,
      wednesday: emptyDay,
      thursday: emptyDay,
      friday: emptyDay,
      saturday: emptyDay,
      sunday: emptyDay,
    };
  }

  private getSeverity(priority: number): 'critical' | 'high' | 'medium' | 'low' {
    if (priority <= 1) return 'critical';
    if (priority <= 2) return 'high';
    if (priority <= 3) return 'medium';
    return 'low';
  }

  private generateWeeklyPlan(
    recommendations: Recommendation[],
    _weaknesses: string[]
  ): WeeklyPlan {
    const createDayPlan = (
      focus: string,
      dayExercises: Exercise[],
      duration: number
    ): DayPlan => ({
      focus,
      exercises: dayExercises,
      duration,
    });

    const getExercisesForCategory = (category: string): Exercise[] => {
      const categoryRecs = recommendations.filter((r) => r.category === category);
      return categoryRecs.slice(0, 2).flatMap((r) => r.exercises.slice(0, 2));
    };

    return {
      monday: createDayPlan('aim', getExercisesForCategory('aim'), 30),
      tuesday: createDayPlan('positioning', getExercisesForCategory('positioning'), 30),
      wednesday: createDayPlan('utility', getExercisesForCategory('utility'), 30),
      thursday: createDayPlan('timing', getExercisesForCategory('timing'), 30),
      friday: createDayPlan('aim', getExercisesForCategory('aim'), 30),
      saturday: createDayPlan('decision', getExercisesForCategory('decision'), 45),
      sunday: createDayPlan('recovery', [
        { name: 'Aim Botz léger', duration: 10, type: 'workshop' },
        { name: 'DM FFA relaxed', duration: 10, type: 'community_server' },
      ], 20),
    };
  }

  private selectExercises(
    recommendations: Recommendation[],
    scores: AnalysisScores
  ): Exercise[] {
    const selectedExercises: Exercise[] = [];

    const scoreEntries: [string, number][] = [
      ['aim', scores.aim],
      ['positioning', scores.positioning],
      ['utility', scores.utility],
      ['economy', scores.economy],
      ['timing', scores.timing],
      ['decision', scores.decision],
    ];
    const weakAreas = scoreEntries
      .filter(([, score]) => score < 50)
      .sort(([, a], [, b]) => a - b)
      .map(([area]) => area);

    for (const area of weakAreas.slice(0, 3)) {
      const areaExercises = exercises.filter(
        (e) =>
          e.description?.toLowerCase().includes(area) ||
          e.name.toLowerCase().includes(area)
      );
      selectedExercises.push(...areaExercises.slice(0, 2));
    }

    for (const rec of recommendations.slice(0, 3)) {
      selectedExercises.push(...rec.exercises.slice(0, 1));
    }

    const unique = selectedExercises.filter(
      (e, i, arr) => arr.findIndex((x) => x.name === e.name) === i
    );

    return unique.slice(0, 10);
  }

  private generateSummary(
    analysis: AnalysisResult,
    recommendations: Recommendation[],
    context: PlayerContext
  ): string {
    const { scores, strengths, weaknesses } = analysis;

    let summary = `Score global : ${scores.overall}/100. `;

    // Ajouter le contexte
    if (context.role) {
      const roleName = PLAYER_ROLES[context.role].name;
      summary += `Analyse en tant que ${roleName}. `;
    }

    if (strengths.length > 0) {
      summary += `Points forts : ${strengths.join(', ')}. `;
    }

    if (weaknesses.length > 0) {
      summary += `Axes d'amélioration prioritaires : ${weaknesses.join(', ')}. `;
    }

    const criticalCount = recommendations.filter(
      (r) => r.severity === 'critical'
    ).length;

    if (criticalCount > 0) {
      summary += `${criticalCount} problème(s) critique(s) identifié(s) nécessitant une attention immédiate.`;
    }

    return summary;
  }
}

export const coachingEngine = new CoachingEngine();