'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAnalysisPreferences } from '@/lib/preferences/hooks';
import { ANALYSIS_CATEGORIES, type AnalysisCategory, type CategoryWeights } from '@/lib/preferences/types';
import { getCategoryStyle, CATEGORY_STYLES } from '@/lib/design/tokens';
import { getCategoryIcon } from '@/lib/design/icons';
import {
  Target,
  Sliders,
  RotateCcw,
  Info,
  ChevronUp,
  ChevronDown,
  Lock,
  Star,
} from 'lucide-react';

// Slider component
interface WeightSliderProps {
  category: AnalysisCategory;
  weight: number;
  onChange: (value: number) => void;
  isPriority: boolean;
  onPriorityToggle: () => void;
}

function WeightSlider({ category, weight, onChange, isPriority, onPriorityToggle }: WeightSliderProps) {
  const style = getCategoryStyle(category);
  const IconComponent = getCategoryIcon(category);

  return (
    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${style.color}20` }}
          >
            <IconComponent className="w-5 h-5" color={style.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{style.label}</span>
              {isPriority && (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              )}
            </div>
            <p className="text-xs text-gray-500">{style.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPriorityToggle}
            className={`p-1.5 rounded transition-colors ${
              isPriority
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-700 text-gray-400 hover:text-gray-300'
            }`}
            title={isPriority ? 'Retirer de la priorité' : 'Marquer comme priorité'}
          >
            <Star className={`w-4 h-4 ${isPriority ? 'fill-current' : ''}`} />
          </button>
          <span
            className="text-lg font-bold w-12 text-right"
            style={{ color: style.color }}
          >
            {weight.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="30"
          step="0.5"
          value={weight}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${style.color} 0%, ${style.color} ${(weight / 30) * 100}%, #374151 ${(weight / 30) * 100}%, #374151 100%)`,
          }}
        />
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${style.color};
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          input[type='range']::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${style.color};
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>

      <div className="flex justify-between mt-1 text-[10px] text-gray-600">
        <span>0%</span>
        <span>15%</span>
        <span>30%</span>
      </div>
    </div>
  );
}

// Presets
interface Preset {
  name: string;
  description: string;
  weights: CategoryWeights;
  priorities: AnalysisCategory[];
}

const PRESETS: Preset[] = [
  {
    name: 'Équilibré',
    description: 'Poids égaux pour toutes les catégories',
    weights: {
      aim: 11.11, positioning: 11.11, utility: 11.11, economy: 11.11, timing: 11.11,
      decision: 11.11, movement: 11.11, awareness: 11.11, teamplay: 11.11,
    },
    priorities: [],
  },
  {
    name: 'Entry Fragger',
    description: 'Focus aim, movement et timing',
    weights: {
      aim: 20, positioning: 10, utility: 5, economy: 5, timing: 20,
      decision: 10, movement: 15, awareness: 10, teamplay: 5,
    },
    priorities: ['aim', 'timing', 'movement'],
  },
  {
    name: 'AWPer',
    description: 'Focus positioning, timing et awareness',
    weights: {
      aim: 15, positioning: 20, utility: 5, economy: 10, timing: 15,
      decision: 10, movement: 5, awareness: 15, teamplay: 5,
    },
    priorities: ['positioning', 'timing', 'awareness'],
  },
  {
    name: 'Support',
    description: 'Focus utility, teamplay et economy',
    weights: {
      aim: 10, positioning: 10, utility: 20, economy: 15, timing: 5,
      decision: 10, movement: 5, awareness: 10, teamplay: 15,
    },
    priorities: ['utility', 'teamplay', 'economy'],
  },
  {
    name: 'IGL',
    description: 'Focus decision, awareness et teamplay',
    weights: {
      aim: 10, positioning: 10, utility: 10, economy: 15, timing: 5,
      decision: 20, movement: 5, awareness: 15, teamplay: 10,
    },
    priorities: ['decision', 'awareness', 'economy'],
  },
];

export function AnalysisSettings() {
  const {
    categoryWeights,
    priorityCategories,
    setCategoryWeights,
    setPriorityCategories,
  } = useAnalysisPreferences();

  const [localWeights, setLocalWeights] = useState<CategoryWeights>(categoryWeights);
  const [localPriorities, setLocalPriorities] = useState<AnalysisCategory[]>(priorityCategories);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculer le total des poids
  const totalWeight = useMemo(() => {
    return Object.values(localWeights).reduce((sum, w) => sum + w, 0);
  }, [localWeights]);

  const isBalanced = Math.abs(totalWeight - 100) < 0.1;

  // Handler pour changer un poids
  const handleWeightChange = (category: AnalysisCategory, value: number) => {
    setLocalWeights(prev => ({
      ...prev,
      [category]: value,
    }));
    setHasChanges(true);
  };

  // Handler pour toggle la priorité
  const handlePriorityToggle = (category: AnalysisCategory) => {
    setLocalPriorities(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (prev.length < 3) {
        return [...prev, category];
      }
      return prev;
    });
    setHasChanges(true);
  };

  // Appliquer un preset
  const applyPreset = (preset: Preset) => {
    setLocalWeights(preset.weights);
    setLocalPriorities(preset.priorities);
    setHasChanges(true);
  };

  // Normaliser les poids à 100%
  const normalizeWeights = () => {
    const factor = 100 / totalWeight;
    const normalized = {} as CategoryWeights;
    ANALYSIS_CATEGORIES.forEach(cat => {
      normalized[cat] = parseFloat((localWeights[cat] * factor).toFixed(2));
    });
    setLocalWeights(normalized);
    setHasChanges(true);
  };

  // Réinitialiser aux valeurs égales
  const resetToEqual = () => {
    const equalWeight = 100 / ANALYSIS_CATEGORIES.length;
    const weights = {} as CategoryWeights;
    ANALYSIS_CATEGORIES.forEach(cat => {
      weights[cat] = parseFloat(equalWeight.toFixed(2));
    });
    setLocalWeights(weights);
    setLocalPriorities([]);
    setHasChanges(true);
  };

  // Sauvegarder
  const handleSave = async () => {
    if (!isBalanced) {
      setMessage({ type: 'error', text: 'Le total des poids doit être égal à 100%' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await setCategoryWeights(localWeights);
      await setPriorityCategories(localPriorities);
      setHasChanges(false);
      setMessage({ type: 'success', text: 'Préférences d\'analyse sauvegardées' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-400" />
          Préférences d'analyse
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Personnalisez l'importance de chaque catégorie dans votre score global
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Presets */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            Profils prédéfinis
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors text-left"
              >
                <div className="font-medium text-white text-sm">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Total indicator */}
        <div className={`p-4 rounded-lg border ${
          isBalanced
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 ${isBalanced ? 'text-green-400' : 'text-amber-400'}`} />
              <span className={`text-sm font-medium ${isBalanced ? 'text-green-400' : 'text-amber-400'}`}>
                Total des poids : {totalWeight.toFixed(1)}%
              </span>
            </div>
            {!isBalanced && (
              <Button
                size="sm"
                variant="secondary"
                onClick={normalizeWeights}
              >
                Normaliser à 100%
              </Button>
            )}
          </div>
          {!isBalanced && (
            <p className="text-xs text-amber-300/70 mt-1">
              Le total doit être égal à 100% pour sauvegarder
            </p>
          )}
        </div>

        {/* Priority info */}
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Star className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300">
                Catégories prioritaires ({localPriorities.length}/3)
              </p>
              <p className="text-xs text-yellow-300/70 mt-0.5">
                Les catégories marquées comme prioritaires apparaissent en premier dans vos rapports et reçoivent plus d'attention dans les conseils.
              </p>
            </div>
          </div>
        </div>

        {/* Weight sliders */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-gray-400" />
            Poids par catégorie
          </h4>
          <div className="grid gap-3">
            {ANALYSIS_CATEGORIES.map((category) => (
              <WeightSlider
                key={category}
                category={category}
                weight={localWeights[category] || 11.11}
                onChange={(value) => handleWeightChange(category, value)}
                isPriority={localPriorities.includes(category)}
                onPriorityToggle={() => handlePriorityToggle(category)}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <Button
            variant="secondary"
            onClick={resetToEqual}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-400">Modifications non sauvegardées</span>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || !isBalanced || isSaving}
              isLoading={isSaving}
            >
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Note */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            <strong>Note :</strong> Ces poids personnalisés sont utilisés pour calculer votre score global.
            Les conseils de coaching tiendront compte de vos catégories prioritaires.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
