'use client';

import Link from 'next/link';
import { ChevronRight, Globe, Map, FileText, Clock } from 'lucide-react';
import { GranularityLevel } from './GranularityBadge';

interface BreadcrumbItem {
  label: string;
  href?: string;
  level: GranularityLevel;
}

interface BreadcrumbGranularityProps {
  items: BreadcrumbItem[];
  className?: string;
}

const LEVEL_CONFIG: Record<GranularityLevel, { icon: typeof Globe; color: string; bgColor: string }> = {
  global: { icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  map: { icon: Map, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  demo: { icon: FileText, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  round: { icon: Clock, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
};

export function BreadcrumbGranularity({ items, className = '' }: BreadcrumbGranularityProps) {
  return (
    <nav className={`flex items-center gap-1 ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const config = LEVEL_CONFIG[item.level];
        const Icon = config.icon;
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  text-sm font-medium transition-colors
                  ${config.color} hover:${config.bgColor}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  text-sm font-medium
                  ${isLast ? `${config.bgColor} ${config.color}` : 'text-gray-400'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </span>
            )}

            {!isLast && (
              <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Composant simplifié pour afficher juste le niveau actuel avec navigation
interface GranularityNavigatorProps {
  currentLevel: GranularityLevel;
  currentLabel: string;
  parentLevel?: GranularityLevel;
  parentLabel?: string;
  parentHref?: string;
  className?: string;
}

export function GranularityNavigator({
  currentLevel,
  currentLabel,
  parentLevel,
  parentLabel,
  parentHref,
  className = '',
}: GranularityNavigatorProps) {
  const currentConfig = LEVEL_CONFIG[currentLevel];
  const CurrentIcon = currentConfig.icon;
  const parentConfig = parentLevel ? LEVEL_CONFIG[parentLevel] : null;
  const ParentIcon = parentConfig?.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Lien parent */}
      {parentLevel && parentLabel && parentHref && ParentIcon && (
        <>
          <Link
            href={parentHref}
            className={`
              flex items-center gap-1.5 text-sm
              ${parentConfig!.color} hover:underline
            `}
          >
            <ParentIcon className="w-4 h-4" />
            <span>{parentLabel}</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </>
      )}

      {/* Niveau actuel */}
      <span
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium
          ${currentConfig.bgColor} ${currentConfig.color}
        `}
      >
        <CurrentIcon className="w-4 h-4" />
        <span>{currentLabel}</span>
      </span>
    </div>
  );
}

// Exemple d'utilisation:
// <BreadcrumbGranularity
//   items={[
//     { label: 'Global', href: '/dashboard/overview', level: 'global' },
//     { label: 'Dust2', href: '/dashboard/maps/dust2', level: 'map' },
//     { label: 'Partie du 15/01', level: 'demo' },
//   ]}
// />
//
// <GranularityNavigator
//   currentLevel="demo"
//   currentLabel="Partie du 15/01"
//   parentLevel="map"
//   parentLabel="Dust2"
//   parentHref="/dashboard/maps/dust2"
// />
