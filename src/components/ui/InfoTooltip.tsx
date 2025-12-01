'use client';

import { useState, ReactNode } from 'react';
import { Info, HelpCircle, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TooltipVariant = 'info' | 'help' | 'warning' | 'locked';
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface InfoTooltipProps {
  /** Contenu du tooltip */
  content: ReactNode;
  /** Variante visuelle */
  variant?: TooltipVariant;
  /** Position du tooltip */
  position?: TooltipPosition;
  /** Taille de l'icône */
  size?: 'sm' | 'md' | 'lg';
  /** Classes additionnelles pour l'icône */
  iconClassName?: string;
  /** Classes additionnelles pour le tooltip */
  tooltipClassName?: string;
  /** Icône personnalisée (remplace l'icône par défaut) */
  icon?: ReactNode;
  /** Afficher uniquement au hover (pas de clic sur mobile) */
  hoverOnly?: boolean;
}

const VARIANT_ICONS = {
  info: Info,
  help: HelpCircle,
  warning: AlertCircle,
  locked: Lock,
};

const VARIANT_COLORS = {
  info: 'text-blue-400 hover:text-blue-300',
  help: 'text-gray-400 hover:text-gray-300',
  warning: 'text-yellow-400 hover:text-yellow-300',
  locked: 'text-gray-500 hover:text-gray-400',
};

const POSITION_CLASSES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_CLASSES = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
};

const SIZE_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function InfoTooltip({
  content,
  variant = 'info',
  position = 'top',
  size = 'md',
  iconClassName,
  tooltipClassName,
  icon,
  hoverOnly = false,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const IconComponent = VARIANT_ICONS[variant];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => !hoverOnly && setIsVisible(!isVisible)}
    >
      {/* Icône */}
      <button
        type="button"
        className={cn(
          'cursor-help transition-colors focus:outline-none',
          VARIANT_COLORS[variant],
          iconClassName
        )}
        aria-label="Plus d'informations"
      >
        {icon || <IconComponent className={SIZE_CLASSES[size]} />}
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 min-w-[200px] max-w-[300px] p-3 rounded-lg',
            'bg-gray-800 border border-gray-700 shadow-xl',
            'text-sm text-gray-200',
            'animate-in fade-in zoom-in-95 duration-150',
            POSITION_CLASSES[position],
            tooltipClassName
          )}
        >
          {content}
          {/* Flèche */}
          <div
            className={cn(
              'absolute w-0 h-0 border-[6px]',
              ARROW_CLASSES[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Tooltip pour expliquer le système de poids
 */
export function WeightTooltip({
  originalWeight,
  adjustedWeight,
  isEnabled,
}: {
  originalWeight: number;
  adjustedWeight: number;
  isEnabled: boolean;
}) {
  const difference = adjustedWeight - originalWeight;
  const redistributed = !isEnabled ? originalWeight : difference;

  return (
    <InfoTooltip
      variant="help"
      size="sm"
      content={
        <div className="space-y-2">
          <div className="font-medium text-white">Poids de la catégorie</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Poids de base:</span>
              <span className="text-white">{originalWeight.toFixed(1)}%</span>
            </div>
            {isEnabled ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Redistribution reçue:</span>
                  <span className={difference > 0 ? 'text-green-400' : 'text-white'}>
                    {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                  <span className="text-gray-300 font-medium">Poids effectif:</span>
                  <span className="text-cs2-accent font-bold">{adjustedWeight.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <div className="text-yellow-400/80 text-xs mt-2">
                Cette catégorie est désactivée. Son poids ({redistributed.toFixed(1)}%) est
                redistribué proportionnellement aux autres catégories.
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

/**
 * Tooltip pour une feature désactivée
 */
export function DisabledFeatureTooltip({
  reason,
  requiredTier,
}: {
  reason: 'disabled_by_user' | 'tier_restriction' | 'beta' | 'coming_soon';
  requiredTier?: string;
}) {
  const messages = {
    disabled_by_user: {
      title: 'Catégorie désactivée',
      description: 'Vous avez désactivé cette catégorie dans vos paramètres.',
      action: 'Réactiver dans Paramètres → Fonctionnalités',
    },
    tier_restriction: {
      title: 'Fonctionnalité Premium',
      description: `Cette analyse nécessite un abonnement ${requiredTier || 'supérieur'}.`,
      action: 'Voir les plans disponibles',
    },
    beta: {
      title: 'En version Beta',
      description: 'Cette fonctionnalité est en cours de développement.',
      action: 'Rejoindre le programme Beta',
    },
    coming_soon: {
      title: 'Bientôt disponible',
      description: 'Cette fonctionnalité sera disponible prochainement.',
      action: null,
    },
  };

  const msg = messages[reason];

  return (
    <InfoTooltip
      variant="locked"
      size="sm"
      content={
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-white">{msg.title}</span>
          </div>
          <p className="text-gray-300 text-xs">{msg.description}</p>
          {msg.action && (
            <p className="text-cs2-accent text-xs cursor-pointer hover:underline">
              {msg.action} →
            </p>
          )}
        </div>
      }
    />
  );
}

/**
 * Badge informatif avec tooltip intégré
 */
export function InfoBadge({
  label,
  value,
  tooltip,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  tooltip?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const variantClasses = {
    default: 'bg-gray-800/50 text-gray-300',
    success: 'bg-green-500/10 text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    error: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
      variantClasses[variant]
    )}>
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium">{value}</span>
      {tooltip && <InfoTooltip variant="help" size="sm" content={tooltip} />}
    </div>
  );
}
