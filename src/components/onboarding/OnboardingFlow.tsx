'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getCategoryStyle } from '@/lib/design/tokens';
import { getCategoryIcon } from '@/lib/design/icons';
import { ANALYSIS_CATEGORIES, type AnalysisCategory } from '@/lib/preferences/types';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Target,
  User,
  Gamepad2,
  Sparkles,
  Trophy,
  Crosshair,
  MapPin,
  BarChart3,
  Zap,
  X,
} from 'lucide-react';

// Types
export interface OnboardingData {
  username?: string;
  steamId?: string;
  rank?: string;
  role?: string;
  preferredMaps?: string[];
  priorityCategories?: AnalysisCategory[];
  goals?: string[];
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
  initialData?: Partial<OnboardingData>;
  className?: string;
}

interface StepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}

// Constants
const RANKS = [
  { value: 'silver', label: 'Silver', icon: '🥈' },
  { value: 'gold', label: 'Gold Nova', icon: '🥇' },
  { value: 'mg', label: 'Master Guardian', icon: '⚔️' },
  { value: 'dmg', label: 'DMG', icon: '🗡️' },
  { value: 'le', label: 'LE/LEM', icon: '🦅' },
  { value: 'supreme', label: 'Supreme', icon: '👑' },
  { value: 'global', label: 'Global Elite', icon: '🌍' },
  { value: 'faceit', label: 'FACEIT/Premier', icon: '🎮' },
];

const ROLES = [
  { value: 'entry', label: 'Entry Fragger', description: 'Premier à entrer, créer des ouvertures' },
  { value: 'awp', label: 'AWPer', description: 'Sniper principal, angles longs' },
  { value: 'support', label: 'Support', description: 'Utilitaires, trade kills' },
  { value: 'lurker', label: 'Lurker', description: 'Jeu solo, timing' },
  { value: 'igl', label: 'IGL', description: 'Leader, stratégie' },
  { value: 'flex', label: 'Flex', description: 'Polyvalent, adaptable' },
];

const MAPS = [
  { value: 'de_dust2', label: 'Dust II', emoji: '🏜️' },
  { value: 'de_mirage', label: 'Mirage', emoji: '🏰' },
  { value: 'de_inferno', label: 'Inferno', emoji: '🔥' },
  { value: 'de_anubis', label: 'Anubis', emoji: '🐍' },
  { value: 'de_ancient', label: 'Ancient', emoji: '🏛️' },
  { value: 'de_nuke', label: 'Nuke', emoji: '☢️' },
  { value: 'de_vertigo', label: 'Vertigo', emoji: '🏗️' },
];

// Step 1: Welcome
function WelcomeStep({ onUpdate }: StepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Bienvenue sur CS2 Coach !
        </h2>
        <p className="text-gray-400">
          Votre assistant personnel pour progresser sur Counter-Strike 2.
          Configurons votre profil en quelques étapes.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
          <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-sm text-white font-medium">Upload</div>
          <div className="text-xs text-gray-500">Vos démos</div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
          <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-sm text-white font-medium">Analyse</div>
          <div className="text-xs text-gray-500">Automatique</div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
          <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-sm text-white font-medium">Conseils</div>
          <div className="text-xs text-gray-500">Personnalisés</div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Rank selection
function RankStep({ data, onUpdate }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          Quel est votre rang actuel ?
        </h2>
        <p className="text-gray-400 text-sm">
          Nous adapterons les conseils à votre niveau
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {RANKS.map((rank) => (
          <button
            key={rank.value}
            className={cn(
              'p-4 rounded-lg border-2 transition-all text-left',
              data.rank === rank.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            )}
            onClick={() => onUpdate({ rank: rank.value })}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{rank.icon}</span>
              <span className={cn(
                'font-medium',
                data.rank === rank.value ? 'text-white' : 'text-gray-300'
              )}>
                {rank.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 3: Role selection
function RoleStep({ data, onUpdate }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Gamepad2 className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          Quel est votre rôle principal ?
        </h2>
        <p className="text-gray-400 text-sm">
          Les conseils seront adaptés à votre style de jeu
        </p>
      </div>

      <div className="space-y-2">
        {ROLES.map((role) => (
          <button
            key={role.value}
            className={cn(
              'w-full p-4 rounded-lg border-2 transition-all text-left',
              data.role === role.value
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            )}
            onClick={() => onUpdate({ role: role.value })}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={cn(
                  'font-medium',
                  data.role === role.value ? 'text-white' : 'text-gray-300'
                )}>
                  {role.label}
                </div>
                <div className="text-xs text-gray-500">{role.description}</div>
              </div>
              {data.role === role.value && (
                <Check className="w-5 h-5 text-purple-400" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 4: Map selection
function MapsStep({ data, onUpdate }: StepProps) {
  const selectedMaps = data.preferredMaps || [];

  const toggleMap = (mapValue: string) => {
    const newMaps = selectedMaps.includes(mapValue)
      ? selectedMaps.filter(m => m !== mapValue)
      : [...selectedMaps, mapValue];
    onUpdate({ preferredMaps: newMaps });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          Vos maps préférées ?
        </h2>
        <p className="text-gray-400 text-sm">
          Sélectionnez les maps sur lesquelles vous jouez le plus
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MAPS.map((map) => {
          const isSelected = selectedMaps.includes(map.value);
          return (
            <button
              key={map.value}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                isSelected
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              )}
              onClick={() => toggleMap(map.value)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{map.emoji}</span>
                <span className={cn(
                  'font-medium',
                  isSelected ? 'text-white' : 'text-gray-300'
                )}>
                  {map.label}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-green-400 ml-auto" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {selectedMaps.length} map{selectedMaps.length !== 1 ? 's' : ''} sélectionnée{selectedMaps.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// Step 5: Priority categories
function PrioritiesStep({ data, onUpdate }: StepProps) {
  const priorities = data.priorityCategories || [];

  const togglePriority = (category: AnalysisCategory) => {
    if (priorities.includes(category)) {
      onUpdate({ priorityCategories: priorities.filter(c => c !== category) });
    } else if (priorities.length < 3) {
      onUpdate({ priorityCategories: [...priorities, category] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          Quels aspects voulez-vous améliorer ?
        </h2>
        <p className="text-gray-400 text-sm">
          Choisissez jusqu'à 3 catégories prioritaires
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ANALYSIS_CATEGORIES.map((category) => {
          const style = getCategoryStyle(category);
          const Icon = getCategoryIcon(category);
          const isSelected = priorities.includes(category);
          const isDisabled = !isSelected && priorities.length >= 3;

          return (
            <button
              key={category}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                isSelected && 'border-2',
                !isSelected && !isDisabled && 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
                isDisabled && 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
              )}
              style={{
                borderColor: isSelected ? style.color : undefined,
                backgroundColor: isSelected ? `${style.color}15` : undefined,
              }}
              onClick={() => !isDisabled && togglePriority(category)}
              disabled={isDisabled}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon
                  className="w-6 h-6"
                  color={isSelected ? style.color : '#6b7280'}
                />
                <span className={cn(
                  'text-xs font-medium text-center',
                  isSelected ? 'text-white' : 'text-gray-400'
                )}>
                  {style.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {priorities.length}/3 priorités sélectionnées
      </p>
    </div>
  );
}

// Step 6: Complete
function CompleteStep({ data }: StepProps) {
  const rank = RANKS.find(r => r.value === data.rank);
  const role = ROLES.find(r => r.value === data.role);

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
        <Check className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Votre profil est prêt !
        </h2>
        <p className="text-gray-400">
          Vous pouvez maintenant uploader votre première démo
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 text-left">
        {rank && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Rang</span>
            <span className="text-white flex items-center gap-2">
              {rank.icon} {rank.label}
            </span>
          </div>
        )}
        {role && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Rôle</span>
            <span className="text-white">{role.label}</span>
          </div>
        )}
        {data.preferredMaps && data.preferredMaps.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Maps</span>
            <span className="text-white">
              {data.preferredMaps.map(m => MAPS.find(map => map.value === m)?.emoji).join(' ')}
            </span>
          </div>
        )}
        {data.priorityCategories && data.priorityCategories.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Priorités</span>
            <div className="flex items-center gap-1">
              {data.priorityCategories.map(cat => {
                const style = getCategoryStyle(cat);
                const Icon = getCategoryIcon(cat);
                return (
                  <Icon
                    key={cat}
                    className="w-4 h-4"
                    color={style.color}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Progress dots
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-2 h-2 rounded-full transition-all',
            i === current
              ? 'w-6 bg-blue-500'
              : i < current
              ? 'bg-blue-500'
              : 'bg-gray-700'
          )}
        />
      ))}
    </div>
  );
}

// Main component
export function OnboardingFlow({
  onComplete,
  onSkip,
  initialData = {},
  className,
}: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);

  const steps = [
    { component: WelcomeStep, canSkip: false },
    { component: RankStep, canSkip: true },
    { component: RoleStep, canSkip: true },
    { component: MapsStep, canSkip: true },
    { component: PrioritiesStep, canSkip: true },
    { component: CompleteStep, canSkip: false },
  ];

  const currentStep = steps[step];
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;

  const handleUpdate = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (isLastStep) {
      onComplete(data);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setStep(prev => prev - 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep.canSkip) {
      handleNext();
    }
  };

  const StepComponent = currentStep.component;

  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      {/* Header with skip */}
      {onSkip && (
        <div className="flex justify-end mb-4">
          <button
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            onClick={onSkip}
          >
            Passer
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <ProgressDots current={step} total={steps.length} />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        <StepComponent data={data} onUpdate={handleUpdate} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-800">
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            isFirstStep
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          )}
          onClick={handlePrev}
          disabled={isFirstStep}
        >
          <ChevronLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="flex items-center gap-3">
          {currentStep.canSkip && (
            <button
              className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors"
              onClick={handleSkipStep}
            >
              Passer cette étape
            </button>
          )}

          <button
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            onClick={handleNext}
          >
            {isLastStep ? 'Commencer' : 'Continuer'}
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { OnboardingFlowProps };
