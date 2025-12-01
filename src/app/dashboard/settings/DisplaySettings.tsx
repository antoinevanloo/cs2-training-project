'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDisplayPreferences } from '@/lib/preferences/hooks';
import {
  Monitor,
  Sun,
  Moon,
  Sparkles,
  BarChart2,
  Palette,
  Languages,
  Minimize2,
  Play,
} from 'lucide-react';

type Theme = 'dark' | 'light' | 'system' | 'gaming';
type Language = 'fr' | 'en';
type AnimationLevel = 'full' | 'reduced' | 'none';
type ChartStyle = 'filled' | 'line' | 'both';
type ColorScheme = 'default' | 'colorblind' | 'highContrast';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
}

function OptionCard({ selected, onClick, icon, label, description, disabled }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-lg border-2 transition-all text-left w-full
        ${selected
          ? 'border-cs2-accent bg-cs2-accent/10'
          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${selected ? 'bg-cs2-accent/20 text-cs2-accent' : 'bg-gray-700 text-gray-400'}`}>
          {icon}
        </div>
        <div>
          <div className={`font-medium ${selected ? 'text-white' : 'text-gray-300'}`}>
            {label}
          </div>
          {description && (
            <div className="text-xs text-gray-500 mt-0.5">{description}</div>
          )}
        </div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cs2-accent" />
      )}
    </button>
  );
}

export function DisplaySettings() {
  const {
    theme,
    language,
    compactMode,
    animationLevel,
    chartStyle,
    colorScheme,
    setTheme,
    setLanguage,
    setCompactMode,
    setAnimationLevel,
    setChartStyle,
    setColorScheme,
  } = useDisplayPreferences();

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Les changements sont sauvegardés automatiquement via le context

  const themeOptions: { value: Theme; icon: React.ReactNode; label: string; description: string }[] = [
    { value: 'dark', icon: <Moon className="w-5 h-5" />, label: 'Sombre', description: 'Mode sombre par défaut' },
    { value: 'light', icon: <Sun className="w-5 h-5" />, label: 'Clair', description: 'Mode clair' },
    { value: 'system', icon: <Monitor className="w-5 h-5" />, label: 'Système', description: 'Suit les préférences système' },
    { value: 'gaming', icon: <Sparkles className="w-5 h-5" />, label: 'Gaming', description: 'Mode sombre avec accents néon' },
  ];

  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const animationOptions: { value: AnimationLevel; icon: React.ReactNode; label: string; description: string }[] = [
    { value: 'full', icon: <Play className="w-5 h-5" />, label: 'Complètes', description: 'Toutes les animations activées' },
    { value: 'reduced', icon: <Play className="w-5 h-5 opacity-50" />, label: 'Réduites', description: 'Animations essentielles uniquement' },
    { value: 'none', icon: <Minimize2 className="w-5 h-5" />, label: 'Aucune', description: 'Aucune animation' },
  ];

  const chartOptions: { value: ChartStyle; icon: React.ReactNode; label: string }[] = [
    { value: 'filled', icon: <BarChart2 className="w-5 h-5" />, label: 'Rempli' },
    { value: 'line', icon: <BarChart2 className="w-5 h-5" />, label: 'Ligne' },
    { value: 'both', icon: <BarChart2 className="w-5 h-5" />, label: 'Les deux' },
  ];

  const colorSchemeOptions: { value: ColorScheme; icon: React.ReactNode; label: string; description: string }[] = [
    { value: 'default', icon: <Palette className="w-5 h-5" />, label: 'Par défaut', description: 'Palette de couleurs standard' },
    { value: 'colorblind', icon: <Palette className="w-5 h-5" />, label: 'Daltonien', description: 'Optimisé pour le daltonisme' },
    { value: 'highContrast', icon: <Palette className="w-5 h-5" />, label: 'Contraste élevé', description: 'Meilleure lisibilité' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-400" />
          Affichage
        </CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Personnalisez l'apparence de l'interface
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

        {/* Thème */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-400" />
            Thème
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {themeOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={theme === option.value}
                onClick={() => setTheme(option.value)}
                icon={option.icon}
                label={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Langue */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Languages className="w-4 h-4 text-gray-400" />
            Langue
          </h4>
          <div className="flex gap-3">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLanguage(option.value)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${language === option.value
                    ? 'border-cs2-accent bg-cs2-accent/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }
                `}
              >
                <span className="text-xl">{option.flag}</span>
                <span className={language === option.value ? 'text-white' : 'text-gray-300'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode compact */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Minimize2 className="w-4 h-4 text-gray-400" />
            Mode compact
          </h4>
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <div>
              <div className="text-sm text-white">Activer le mode compact</div>
              <div className="text-xs text-gray-500">Réduit l'espacement pour afficher plus de contenu</div>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${compactMode ? 'bg-cs2-accent' : 'bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${compactMode ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Animations */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-gray-400" />
            Animations
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {animationOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={animationLevel === option.value}
                onClick={() => setAnimationLevel(option.value)}
                icon={option.icon}
                label={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Style des graphiques */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            Style des graphiques
          </h4>
          <div className="flex gap-3">
            {chartOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setChartStyle(option.value)}
                className={`
                  flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${chartStyle === option.value
                    ? 'border-cs2-accent bg-cs2-accent/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }
                `}
              >
                <div className={`p-2 rounded ${chartStyle === option.value ? 'bg-cs2-accent/20 text-cs2-accent' : 'bg-gray-700 text-gray-400'}`}>
                  {option.icon}
                </div>
                <span className={chartStyle === option.value ? 'text-white' : 'text-gray-300'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Schéma de couleurs */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" />
            Schéma de couleurs
          </h4>
          <div className="space-y-2">
            {colorSchemeOptions.map((option) => (
              <OptionCard
                key={option.value}
                selected={colorScheme === option.value}
                onClick={() => setColorScheme(option.value)}
                icon={option.icon}
                label={option.label}
                description={option.description}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Aperçu</h4>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cs2-accent to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                85
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Score global</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">+5%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full mt-2">
                  <div className="h-full bg-gradient-to-r from-cs2-accent to-blue-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
