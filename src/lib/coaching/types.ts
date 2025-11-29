import { AnalysisResult } from '../analysis/types';

export interface CoachingRule {
  id: string;
  category: 'aim' | 'positioning' | 'utility' | 'economy' | 'timing' | 'decision';
  priority: number;
  condition: (analysis: AnalysisResult) => boolean;
  recommendation: {
    title: string;
    description: string;
    exercises: Exercise[];
    workshopMaps: string[];
  };
}

export interface Exercise {
  name: string;
  duration: number;
  type: 'workshop' | 'community_server' | 'external' | 'theory';
  description?: string;
}

export interface Recommendation {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  exercises: Exercise[];
  workshopMaps: string[];
}

export interface DayPlan {
  focus: string;
  exercises: Exercise[];
  duration: number;
}

export interface WeeklyPlan {
  monday: DayPlan;
  tuesday: DayPlan;
  wednesday: DayPlan;
  thursday: DayPlan;
  friday: DayPlan;
  saturday: DayPlan;
  sunday: DayPlan;
}

export interface PriorityIssue {
  area: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface CoachingReport {
  generatedAt: string;
  priorityIssues: PriorityIssue[];
  recommendations: Recommendation[];
  exercises: Exercise[];
  weeklyPlan: WeeklyPlan;
  summary: string;
}
