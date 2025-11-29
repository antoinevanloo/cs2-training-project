import { AnalysisResult, AnalysisScores } from '../analysis/types';
import { allCoachingRules } from './rules';
import { exercises } from './exercises';
import { CoachingReport, Recommendation, Exercise, WeeklyPlan, DayPlan } from './types';

export class CoachingEngine {
  generateReport(analysis: AnalysisResult): CoachingReport {
    // Evaluate all rules
    const triggeredRules = allCoachingRules
      .filter((rule) => rule.condition(analysis))
      .sort((a, b) => a.priority - b.priority);

    // Generate recommendations
    const recommendations: Recommendation[] = triggeredRules.map((rule) => ({
      id: rule.id,
      category: rule.category,
      severity: this.getSeverity(rule.priority),
      title: rule.recommendation.title,
      description: rule.recommendation.description,
      exercises: rule.recommendation.exercises,
      workshopMaps: rule.recommendation.workshopMaps,
    }));

    // Priority issues (top 5)
    const priorityIssues = recommendations.slice(0, 5).map((r) => ({
      area: r.category,
      issue: r.id,
      severity: r.severity,
    }));

    // Generate weekly plan
    const weeklyPlan = this.generateWeeklyPlan(recommendations, analysis.weaknesses);

    // Select recommended exercises
    const recommendedExercises = this.selectExercises(recommendations, analysis.scores);

    return {
      generatedAt: new Date().toISOString(),
      priorityIssues,
      recommendations,
      exercises: recommendedExercises,
      weeklyPlan,
      summary: this.generateSummary(analysis, recommendations),
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
    const createDayPlan = (focus: string, dayExercises: Exercise[], duration: number): DayPlan => ({
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

    // Find weak areas
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

    // Add exercises for weak areas
    for (const area of weakAreas.slice(0, 3)) {
      const areaExercises = exercises.filter(
        (e) =>
          e.description?.toLowerCase().includes(area) ||
          e.name.toLowerCase().includes(area)
      );
      selectedExercises.push(...areaExercises.slice(0, 2));
    }

    // Add exercises from priority recommendations
    for (const rec of recommendations.slice(0, 3)) {
      selectedExercises.push(...rec.exercises.slice(0, 1));
    }

    // Deduplicate
    const unique = selectedExercises.filter(
      (e, i, arr) => arr.findIndex((x) => x.name === e.name) === i
    );

    return unique.slice(0, 10);
  }

  private generateSummary(
    analysis: AnalysisResult,
    recommendations: Recommendation[]
  ): string {
    const { scores, strengths, weaknesses } = analysis;

    let summary = `Score global : ${scores.overall}/100. `;

    if (strengths.length > 0) {
      summary += `Points forts : ${strengths.join(', ')}. `;
    }

    if (weaknesses.length > 0) {
      summary += `Axes d'amélioration prioritaires : ${weaknesses.join(', ')}. `;
    }

    const criticalCount = recommendations.filter((r) => r.severity === 'critical').length;

    if (criticalCount > 0) {
      summary += `${criticalCount} problème(s) critique(s) identifié(s) nécessitant une attention immédiate.`;
    }

    return summary;
  }
}

export const coachingEngine = new CoachingEngine();
