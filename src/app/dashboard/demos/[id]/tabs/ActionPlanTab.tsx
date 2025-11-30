'use client';

import { useEffect, useState } from 'react';
import { ActionPlanCard } from '@/components/coaching';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface ActionPlanTabProps {
  demoId: string;
}

interface Exercise {
  id: string;
  name: string;
  duration: number;
  category: string;
}

interface WeeklyGoal {
  id: string;
  description: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  deadline: string;
}

interface Checkpoint {
  day: number;
  focus: string;
  exercises: string[];
  expectedProgress: string;
}

interface ActionPlan {
  weeklyFocus: {
    primary: string;
    secondary: string;
  };
  dailyRoutine: {
    warmup: Exercise[];
    mainTraining: Exercise[];
    cooldown: Exercise[];
    totalDuration: number;
  };
  weeklyGoals: WeeklyGoal[];
  checkpoints: Checkpoint[];
}

export function ActionPlanTab({ demoId }: ActionPlanTabProps) {
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coaching/actionable/${demoId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du chargement');
      }

      const result = await response.json();

      if (!result.success || !result.report?.actionPlan) {
        throw new Error('Plan d\'action non disponible');
      }

      setPlan(result.report.actionPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlan();
  }, [demoId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-cs2-accent animate-spin mb-4" />
        <p className="text-gray-400">Génération du plan d&apos;entraînement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchActionPlan} variant="secondary" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Pas de plan d&apos;action disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat
          label="Durée quotidienne"
          value={`${plan.dailyRoutine.totalDuration} min`}
          icon="⏱️"
        />
        <QuickStat
          label="Exercices"
          value={`${plan.dailyRoutine.warmup.length + plan.dailyRoutine.mainTraining.length + plan.dailyRoutine.cooldown.length}`}
          icon="🎮"
        />
        <QuickStat
          label="Objectifs"
          value={`${plan.weeklyGoals.length}`}
          icon="🎯"
        />
        <QuickStat
          label="Checkpoints"
          value={`${plan.checkpoints.length}`}
          icon="📅"
        />
      </div>

      {/* Main Action Plan */}
      <ActionPlanCard plan={plan} />

      {/* Tips */}
      <Card className="bg-gray-800/30 border-gray-700/30">
        <CardContent className="p-4">
          <h4 className="text-white font-medium mb-3">Conseils pour réussir</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Fais les exercices d&apos;échauffement avant chaque session de jeu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Concentre-toi sur une compétence à la fois plutôt que tout en même temps</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>20 minutes de pratique ciblée vaut mieux que 2h de jeu sans focus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Analyse tes démos régulièrement pour suivre ta progression</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/30 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
