'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  badge?: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'error';
  };
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const badgeVariants = {
  default: 'bg-gray-700/50 text-gray-300',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabNavigationProps) {
  const baseStyles = 'flex items-center gap-2 font-medium transition-all duration-200 whitespace-nowrap';

  const getTabStyles = (isActive: boolean) => {
    const sizeStyle = sizeStyles[size];

    switch (variant) {
      case 'pills':
        return `${baseStyles} ${sizeStyle} rounded-lg ${
          isActive
            ? 'bg-cs2-accent text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
        }`;

      case 'underline':
        return `${baseStyles} ${sizeStyle} border-b-2 ${
          isActive
            ? 'border-cs2-accent text-white'
            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
        }`;

      default:
        return `${baseStyles} ${sizeStyle} rounded-t-lg ${
          isActive
            ? 'bg-gray-800 text-white border-b-2 border-cs2-accent'
            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
        }`;
    }
  };

  return (
    <div
      className={`flex ${fullWidth ? 'w-full' : ''} ${
        variant === 'underline' ? 'border-b border-gray-700/50' : 'gap-1'
      } overflow-x-auto scrollbar-hide ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`${getTabStyles(isActive)} ${fullWidth ? 'flex-1 justify-center' : ''}`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700/50">
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${badgeVariants[tab.badge.variant]}`}>
                {tab.badge.text}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Hook pour gérer l'état des onglets avec URL
export function useTabState(defaultTab: string, paramName = 'tab') {
  // Note: Pour une implémentation complète, utiliser useSearchParams de next/navigation
  // Pour l'instant, on utilise un état local simple
  const { useState } = require('react');
  const [activeTab, setActiveTab] = useState(defaultTab);

  return { activeTab, setActiveTab };
}
