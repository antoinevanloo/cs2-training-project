'use client';

import Link from 'next/link';
import { DeleteDemoButton } from './DeleteDemoButton';

export type DemoStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface DemoActionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  /** Condition pour afficher l'action */
  showWhen?: (status: DemoStatus, hasAnalysis: boolean) => boolean;
  /** Style variant */
  variant?: 'default' | 'primary' | 'danger';
}

interface DemoCardActionsProps {
  demoId: string;
  demoName: string;
  status: DemoStatus;
  hasAnalysis: boolean;
  /** Actions supplémentaires personnalisées */
  extraActions?: DemoActionConfig[];
}

// Icônes SVG inline pour éviter les dépendances
const AnalysisIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const CoachingIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const variantStyles = {
  default: 'text-gray-400 hover:text-white hover:bg-gray-700',
  primary: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/20',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/20',
};

export function DemoCardActions({
  demoId,
  demoName,
  status,
  hasAnalysis,
  extraActions = [],
}: DemoCardActionsProps) {
  // Actions par défaut - configurables et extensibles
  const defaultActions: DemoActionConfig[] = [
    {
      id: 'analysis',
      label: 'Voir l\'analyse',
      icon: <AnalysisIcon />,
      href: `/dashboard/demos/${demoId}/analysis`,
      variant: 'primary',
      showWhen: (s, analysis) => s === 'COMPLETED' && analysis,
    },
    {
      id: 'coaching',
      label: 'Rapport coaching',
      icon: <CoachingIcon />,
      href: `/dashboard/demos/${demoId}/coaching-report`,
      variant: 'default',
      showWhen: (s, analysis) => s === 'COMPLETED' && analysis,
    },
  ];

  // Fusionner les actions par défaut avec les actions personnalisées
  const allActions = [...defaultActions, ...extraActions];

  // Filtrer les actions visibles selon le statut
  const visibleActions = allActions.filter((action) => {
    if (!action.showWhen) return true;
    return action.showWhen(status, hasAnalysis);
  });

  return (
    <div className="flex items-center gap-1">
      {visibleActions.map((action) => {
        const className = `p-2 rounded-lg transition-colors ${variantStyles[action.variant || 'default']}`;

        if (action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              className={className}
              title={action.label}
              onClick={(e) => e.stopPropagation()}
            >
              {action.icon}
              <span className="sr-only">{action.label}</span>
            </Link>
          );
        }

        if (action.onClick) {
          return (
            <button
              key={action.id}
              type="button"
              className={className}
              title={action.label}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                action.onClick?.();
              }}
            >
              {action.icon}
              <span className="sr-only">{action.label}</span>
            </button>
          );
        }

        return null;
      })}

      {/* Bouton de suppression - toujours visible */}
      <DeleteDemoButton
        demoId={demoId}
        demoName={demoName}
        variant="icon"
      />
    </div>
  );
}