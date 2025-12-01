'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useGoals, useActiveGoals } from '@/lib/preferences/hooks';
import { ANALYSIS_CATEGORIES, type AnalysisCategory, type UserGoal } from '@/lib/preferences/types';
import { getCategoryStyle } from '@/lib/design/tokens';
import { getCategoryIcon } from '@/lib/design/icons';
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Flag,
  X,
  Save,
} from 'lucide-react';

// Goal Card Component
interface GoalCardProps {
  goal: UserGoal;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAchieved: () => void;
}

function GoalCard({ goal, onEdit, onDelete, onMarkAchieved }: GoalCardProps) {
  const category = goal.category as AnalysisCategory;
  const style = getCategoryStyle(category);
  const IconComponent = getCategoryIcon(category);
  const currentValue = goal.currentValue ?? goal.startValue;

  const progress = goal.targetValue > goal.startValue
    ? ((currentValue - goal.startValue) / (goal.targetValue - goal.startValue)) * 100
    : 0;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isNearDeadline = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;

  const priorityColors: Record<string, string> = {
    low: 'text-gray-400 bg-gray-500/20',
    medium: 'text-blue-400 bg-blue-500/20',
    high: 'text-red-400 bg-red-500/20',
  };

  return (
    <div className={`p-4 bg-gray-800/30 rounded-lg border ${
      goal.achieved ? 'border-green-500/50' : 'border-gray-700'
    } hover:border-gray-600 transition-colors`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`p-2 rounded-lg shrink-0 ${goal.achieved ? 'bg-green-500/20' : ''}`}
            style={{ backgroundColor: goal.achieved ? undefined : `${style.color}20` }}
          >
            {goal.achieved ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <IconComponent className="w-5 h-5" color={style.color} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${goal.achieved ? 'text-green-400 line-through' : 'text-white'}`}>
                {goal.metric}
              </span>
              <span className="text-xs text-gray-500">({style.label})</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${priorityColors[goal.priority] || priorityColors.medium}`}>
                {goal.priority === 'low' ? 'Basse' :
                 goal.priority === 'medium' ? 'Moyenne' : 'Haute'}
              </span>
            </div>

            {!goal.achieved && (
              <>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">
                      {currentValue.toFixed(1)} / {goal.targetValue.toFixed(1)}
                    </span>
                    <span style={{ color: style.color }}>{clampedProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${clampedProgress}%`,
                        backgroundColor: style.color,
                      }}
                    />
                  </div>
                </div>

                {/* Deadline */}
                {goal.deadline && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${
                    isOverdue ? 'text-red-400' :
                    isNearDeadline ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {isOverdue ? (
                      <span>En retard de {Math.abs(daysRemaining!)} jours</span>
                    ) : (
                      <span>{daysRemaining} jour{daysRemaining! > 1 ? 's' : ''} restant{daysRemaining! > 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </>
            )}

            {goal.achieved && goal.achievedAt && (
              <p className="text-xs text-green-400/70 mt-1">
                Atteint le {new Date(goal.achievedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!goal.achieved && (
            <button
              onClick={onMarkAchieved}
              className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
              title="Marquer comme atteint"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Modifier"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Goal Form Component
interface GoalFormProps {
  goal?: Partial<UserGoal>;
  onSave: (data: Partial<UserGoal>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function GoalForm({ goal, onSave, onCancel, isSaving }: GoalFormProps) {
  const [formData, setFormData] = useState({
    metric: goal?.metric || '',
    category: goal?.category || 'aim' as AnalysisCategory,
    startValue: goal?.startValue ?? 0,
    currentValue: goal?.currentValue ?? 0,
    targetValue: goal?.targetValue ?? 100,
    priority: goal?.priority || 'medium' as 'low' | 'medium' | 'high',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
  });

  const categoryOptions = ANALYSIS_CATEGORIES.map(cat => {
    const style = getCategoryStyle(cat);
    return { value: cat, label: style.label };
  });

  const priorityOptions = [
    { value: 'low', label: 'Basse' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' },
  ];

  const metricSuggestions: Record<string, string[]> = {
    aim: ['Headshot %', 'First Bullet Accuracy', 'Spray Control', 'Reaction Time (ms)'],
    positioning: ['Deaths from poor position %', 'Angle advantage %', 'Rotation speed'],
    utility: ['Flash effectiveness %', 'Utility damage/round', 'Smoke usage'],
    economy: ['Buy decisions score', 'Eco round effectiveness', 'Money management'],
    timing: ['Peek timing score', 'Trade speed (s)', 'Rotation timing'],
    decision: ['Clutch win %', 'Retake success %', 'Risk/reward ratio'],
    movement: ['Counter-strafe %', 'Accurate while moving %', 'Jiggle peek success'],
    awareness: ['Info gathering score', 'Minimap usage', 'Sound cues reaction'],
    teamplay: ['Trade success %', 'Flash assists/game', 'Crossfire setups'],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">
          {goal?.id ? 'Modifier l\'objectif' : 'Nouvel objectif'}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label="Catégorie"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AnalysisCategory }))}
            options={categoryOptions}
          />
        </div>
        <div>
          <Select
            label="Priorité"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
            options={priorityOptions}
          />
        </div>
      </div>

      <div>
        <Input
          label="Métrique"
          placeholder="Ex: Headshot %, Rating, ADR..."
          value={formData.metric}
          onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
          required
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {metricSuggestions[formData.category]?.slice(0, 4).map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, metric: suggestion }))}
              className="px-2 py-0.5 text-xs bg-gray-700 text-gray-400 rounded hover:bg-gray-600 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          type="number"
          step="0.1"
          label="Valeur de départ"
          value={formData.startValue.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, startValue: parseFloat(e.target.value) || 0 }))}
        />
        <Input
          type="number"
          step="0.1"
          label="Valeur actuelle"
          value={formData.currentValue.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
        />
        <Input
          type="number"
          step="0.1"
          label="Objectif"
          value={formData.targetValue.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
        />
      </div>

      <Input
        type="date"
        label="Date limite (optionnel)"
        value={formData.deadline}
        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {goal?.id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

export function GoalsSettings() {
  const { goals, isLoading, actions } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'achieved'>('all');

  const filteredGoals = goals.filter(g => {
    if (filter === 'active') return !g.achieved;
    if (filter === 'achieved') return g.achieved;
    return true;
  });

  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);

  const handleSaveGoal = async (data: Partial<UserGoal>) => {
    setIsSaving(true);
    setMessage(null);

    try {
      if (editingGoal?.id) {
        await actions.updateGoal(editingGoal.id, {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          targetValue: data.targetValue,
          priority: data.priority as 'low' | 'medium' | 'high' | undefined,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
        });
        setMessage({ type: 'success', text: 'Objectif mis à jour' });
      } else {
        await actions.createGoal({
          metric: data.metric || '',
          category: (data.category || 'aim') as AnalysisCategory,
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          startValue: data.startValue || 0,
          targetValue: data.targetValue || 100,
          priority: (data.priority || 'medium') as 'low' | 'medium' | 'high',
          deadline: data.deadline ? new Date(data.deadline) : undefined,
        });
        setMessage({ type: 'success', text: 'Objectif créé' });
      }
      setShowForm(false);
      setEditingGoal(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Supprimer cet objectif ?')) return;

    try {
      await actions.deleteGoal(goalId);
      setMessage({ type: 'success', text: 'Objectif supprimé' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleMarkAchieved = async (goalId: string) => {
    try {
      await actions.markGoalAchieved(goalId);
      setMessage({ type: 'success', text: 'Objectif marqué comme atteint !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Objectifs personnels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cs2-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Objectifs personnels
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Définissez et suivez vos objectifs d'amélioration
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingGoal(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel objectif
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-800/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{activeGoals.length}</div>
            <div className="text-xs text-gray-400">Actifs</div>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{achievedGoals.length}</div>
            <div className="text-xs text-gray-400">Atteints</div>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">{goals.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'active', 'achieved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                filter === f
                  ? 'bg-cs2-accent text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Atteints'}
              <span className="ml-1 text-xs opacity-70">
                ({f === 'all' ? goals.length : f === 'active' ? activeGoals.length : achievedGoals.length})
              </span>
            </button>
          ))}
        </div>

        {/* Goal form */}
        {showForm && (
          <GoalForm
            goal={editingGoal || undefined}
            onSave={handleSaveGoal}
            onCancel={() => {
              setShowForm(false);
              setEditingGoal(null);
            }}
            isSaving={isSaving}
          />
        )}

        {/* Goals list */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              {filter === 'all'
                ? 'Aucun objectif défini'
                : filter === 'active'
                ? 'Aucun objectif actif'
                : 'Aucun objectif atteint'}
            </p>
            {filter === 'all' && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => setShowForm(true)}
              >
                Créer votre premier objectif
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => {
                  setEditingGoal(goal);
                  setShowForm(true);
                }}
                onDelete={() => handleDeleteGoal(goal.id)}
                onMarkAchieved={() => handleMarkAchieved(goal.id)}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Conseils pour vos objectifs</p>
              <ul className="text-xs text-blue-300/70 mt-1 space-y-0.5 list-disc list-inside">
                <li>Fixez des objectifs SMART : Spécifiques, Mesurables, Atteignables, Réalistes, Temporels</li>
                <li>Concentrez-vous sur 2-3 objectifs actifs maximum</li>
                <li>Vos objectifs apparaissent dans vos rapports d'analyse</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
