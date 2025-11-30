'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, className = '', onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline' | 'gaming';
}

export function TabsList({ children, className = '', variant = 'default' }: TabsListProps) {
  const variantClasses = {
    default: 'flex gap-1 p-1 bg-gray-800/50 rounded-lg border border-gray-700/50',
    pills: 'flex gap-2',
    underline: 'flex gap-6 border-b border-gray-700 pb-0',
    gaming: 'flex gap-1 p-1.5 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl border border-cs2-accent/20 shadow-inner-glow',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({
  value,
  children,
  icon,
  badge,
  disabled = false,
  className = ''
}: TabsTriggerProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={`
        relative flex items-center gap-2
        px-4 py-2.5 rounded-lg
        font-medium text-sm
        transition-all duration-200
        ${isActive
          ? 'bg-cs2-accent text-white shadow-glow-sm'
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={`
            px-1.5 py-0.5 rounded-full text-xs font-bold
            ${isActive ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-300'}
          `}
        >
          {badge}
        </span>
      )}
      {/* Active indicator animation */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"
          style={{ backgroundSize: '200% 100%' }}
        />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  keepMounted?: boolean;
}

export function TabsContent({
  value,
  children,
  className = '',
  keepMounted = false
}: TabsContentProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  const { activeTab } = context;
  const isActive = activeTab === value;

  // Si keepMounted, on garde le contenu dans le DOM mais caché
  if (keepMounted) {
    return (
      <div
        role="tabpanel"
        className={`mt-4 ${isActive ? 'block animate-fade-in' : 'hidden'} ${className}`}
        hidden={!isActive}
      >
        {children}
      </div>
    );
  }

  if (!isActive) {
    return null;
  }

  return (
    <div role="tabpanel" className={`mt-4 animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

// Composant InsightTabs pour affichage avec résumé
interface InsightTabsProps {
  defaultValue: string;
  children: ReactNode;
  insights?: {
    id: string;
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  className?: string;
}

export function InsightTabs({ defaultValue, children, insights, className = '' }: InsightTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {/* Insights bar si fourni */}
        {insights && insights.length > 0 && (
          <div className="flex gap-4 mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{insight.label}</span>
                <span className={`
                  text-sm font-bold
                  ${insight.trend === 'up' ? 'text-green-400' : ''}
                  ${insight.trend === 'down' ? 'text-red-400' : ''}
                  ${insight.trend === 'neutral' || !insight.trend ? 'text-white' : ''}
                `}>
                  {insight.value}
                </span>
                {insight.trend && insight.trend !== 'neutral' && (
                  <span className={insight.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                    {insight.trend === 'up' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
    </TabsContext.Provider>
  );
}
