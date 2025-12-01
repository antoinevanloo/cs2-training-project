'use client';

import { Globe, Map, FileText, Clock, Info } from 'lucide-react';
import { ReactNode, useState } from 'react';
import type { GranularityLevel } from '@/lib/metrics/types';

export type { GranularityLevel };

interface GranularityConfig {
  icon: ReactNode;
  label: string;
  labelFr: string;
  color: string;
  bgColor: string;
  description: string;
}

const GRANULARITY_CONFIG: Record<GranularityLevel, GranularityConfig> = {
  global: {
    icon: <Globe className="w-3 h-3" />,
    label: 'Global',
    labelFr: 'Global',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Calculé sur toutes vos parties',
  },
  map: {
    icon: <Map className="w-3 h-3" />,
    label: 'Map',
    labelFr: 'Par Map',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Calculé sur toutes vos parties de cette map',
  },
  demo: {
    icon: <FileText className="w-3 h-3" />,
    label: 'Demo',
    labelFr: 'Par Partie',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    description: 'Calculé sur cette partie uniquement',
  },
  round: {
    icon: <Clock className="w-3 h-3" />,
    label: 'Round',
    labelFr: 'Par Round',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Données de ce round spécifique',
  },
};

interface GranularityBadgeProps {
  level: GranularityLevel;
  showLabel?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function GranularityBadge({
  level,
  showLabel = false,
  showTooltip = true,
  size = 'sm',
  className = '',
}: GranularityBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = GRANULARITY_CONFIG[level];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
  };

  return (
    <div className="relative inline-flex">
      <span
        className={`
          inline-flex items-center rounded-full font-medium
          ${config.bgColor} ${config.color}
          ${sizeClasses[size]}
          ${className}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {config.icon}
        {showLabel && <span>{config.labelFr}</span>}
      </span>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <div className={`font-medium ${config.color}`}>{config.labelFr}</div>
            <div className="text-xs text-gray-400 mt-0.5">{config.description}</div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher le contexte de granularité (ex: "sur Dust2", "partie du 15/01")
interface GranularityContextProps {
  level: GranularityLevel;
  context?: string; // "Dust2", "15/01/2025", etc.
  count?: number; // Nombre de données sources
  className?: string;
}

export function GranularityContext({
  level,
  context,
  count,
  className = '',
}: GranularityContextProps) {
  const config = GRANULARITY_CONFIG[level];

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <GranularityBadge level={level} showLabel />
      {context && (
        <span className="text-gray-400">
          {level === 'map' && `sur ${context}`}
          {level === 'demo' && `partie du ${context}`}
          {level === 'round' && `round ${context}`}
          {level === 'global' && context}
        </span>
      )}
      {count !== undefined && (
        <span className="text-gray-500">({count} {level === 'round' ? 'rounds' : 'parties'})</span>
      )}
    </div>
  );
}

// Composant InfoButton pour afficher des explications
interface InfoButtonProps {
  onClick?: () => void;
  className?: string;
}

export function InfoButton({ onClick, className = '' }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-1 rounded-full text-gray-400 hover:text-gray-200
        hover:bg-gray-700/50 transition-colors
        ${className}
      `}
      aria-label="Plus d'informations"
    >
      <Info className="w-4 h-4" />
    </button>
  );
}

// Export des configs pour utilisation externe
export { GRANULARITY_CONFIG };
