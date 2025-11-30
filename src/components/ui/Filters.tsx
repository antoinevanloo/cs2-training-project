'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

// Filter Chip - Tag cliquable pour filtrage rapide
interface FilterChipProps {
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  icon?: ReactNode;
  color?: 'default' | 'accent' | 'ct' | 't' | 'success' | 'warning' | 'danger';
  className?: string;
}

const CHIP_COLORS = {
  default: {
    active: 'bg-gray-700 text-white border-gray-600',
    inactive: 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-white hover:border-gray-600',
  },
  accent: {
    active: 'bg-cs2-accent text-white border-cs2-accent shadow-glow-sm',
    inactive: 'bg-gray-800/50 text-cs2-accent border-cs2-accent/30 hover:border-cs2-accent/60',
  },
  ct: {
    active: 'bg-cs2-ct text-white border-cs2-ct',
    inactive: 'bg-gray-800/50 text-cs2-ct border-cs2-ct/30 hover:border-cs2-ct/60',
  },
  t: {
    active: 'bg-cs2-t text-white border-cs2-t',
    inactive: 'bg-gray-800/50 text-cs2-t border-cs2-t/30 hover:border-cs2-t/60',
  },
  success: {
    active: 'bg-green-500 text-white border-green-500',
    inactive: 'bg-gray-800/50 text-green-400 border-green-500/30 hover:border-green-500/60',
  },
  warning: {
    active: 'bg-yellow-500 text-black border-yellow-500',
    inactive: 'bg-gray-800/50 text-yellow-400 border-yellow-500/30 hover:border-yellow-500/60',
  },
  danger: {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-gray-800/50 text-red-400 border-red-500/30 hover:border-red-500/60',
  },
};

export function FilterChip({
  label,
  isActive,
  onClick,
  count,
  icon,
  color = 'default',
  className = '',
}: FilterChipProps) {
  const colors = CHIP_COLORS[color];

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1.5 rounded-full
        text-sm font-medium
        border
        transition-all duration-200
        ${isActive ? colors.active : colors.inactive}
        ${className}
      `}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs
          ${isActive ? 'bg-white/20' : 'bg-gray-700'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

// Filter Group - Groupe de filtres avec sélection multiple ou unique
interface FilterGroupProps<T extends string> {
  label?: string;
  options: {
    value: T;
    label: string;
    icon?: ReactNode;
    count?: number;
  }[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  allowEmpty?: boolean;
  className?: string;
}

export function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple = false,
  allowEmpty = true,
  className = '',
}: FilterGroupProps<T>) {
  const isActive = (optionValue: T) => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleClick = (optionValue: T) => {
    if (multiple) {
      const currentValue = (Array.isArray(value) ? value : [value]) as T[];
      if (currentValue.includes(optionValue)) {
        if (!allowEmpty && currentValue.length === 1) return;
        onChange(currentValue.filter(v => v !== optionValue) as T[]);
      } else {
        onChange([...currentValue, optionValue] as T[]);
      }
    } else {
      if (value === optionValue && allowEmpty) {
        onChange('' as T);
      } else {
        onChange(optionValue);
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            value={option.value}
            isActive={isActive(option.value)}
            onClick={() => handleClick(option.value)}
            icon={option.icon}
            count={option.count}
          />
        ))}
      </div>
    </div>
  );
}

// Range Filter - Slider pour filtrer par plage de valeurs
interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  unit?: string;
  className?: string;
}

export function RangeFilter({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  className = '',
}: RangeFilterProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (index: 0 | 1, newValue: number) => {
    const updated: [number, number] = [...localValue] as [number, number];
    updated[index] = newValue;

    // Ensure min <= max
    if (index === 0 && newValue > localValue[1]) {
      updated[1] = newValue;
    } else if (index === 1 && newValue < localValue[0]) {
      updated[0] = newValue;
    }

    setLocalValue(updated);
  };

  const handleCommit = () => {
    onChange(localValue);
  };

  const percentage = (val: number) => ((val - min) / (max - min)) * 100;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
        <span className="text-sm text-gray-400">
          {localValue[0]}{unit} - {localValue[1]}{unit}
        </span>
      </div>

      <div className="relative h-2 bg-gray-700 rounded-full">
        {/* Track */}
        <div
          className="absolute h-full bg-cs2-accent rounded-full"
          style={{
            left: `${percentage(localValue[0])}%`,
            width: `${percentage(localValue[1]) - percentage(localValue[0])}%`,
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={(e) => handleChange(0, Number(e.target.value))}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute w-full h-full appearance-none bg-transparent cursor-pointer range-slider"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => handleChange(1, Number(e.target.value))}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute w-full h-full appearance-none bg-transparent cursor-pointer range-slider"
        />
      </div>

      <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #ff6b00;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
        }
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #ff6b00;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #fff;
        }
      `}</style>
    </div>
  );
}

// Search Filter - Input de recherche avec suggestions
interface SearchFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  className?: string;
}

export function SearchFilter({
  placeholder = 'Rechercher...',
  value,
  onChange,
  suggestions = [],
  className = '',
}: SearchFilterProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 5);

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center gap-2
        px-3 py-2 rounded-lg
        bg-gray-800/50 border
        transition-colors duration-200
        ${isFocused ? 'border-cs2-accent' : 'border-gray-700'}
      `}>
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
          onBlur={() => { setIsFocused(false); setTimeout(() => setShowSuggestions(false), 200); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 py-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          {filteredSuggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Filter Bar - Barre de filtres complète avec reset
interface FilterBarProps {
  children: ReactNode;
  activeFiltersCount?: number;
  onReset?: () => void;
  className?: string;
}

export function FilterBar({
  children,
  activeFiltersCount = 0,
  onReset,
  className = '',
}: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 ${className}`}>
      <div className="flex items-center gap-2 text-gray-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-sm font-medium">Filtres</span>
        {activeFiltersCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-cs2-accent text-white text-xs font-bold">
            {activeFiltersCount}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-wrap items-center gap-3">
        {children}
      </div>

      {activeFiltersCount > 0 && onReset && (
        <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Réinitialiser
        </button>
      )}
    </div>
  );
}

// Select Filter - Dropdown pour sélection
interface SelectFilterProps<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}

export function SelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  className = '',
}: SelectFilterProps<T>) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm appearance-none cursor-pointer hover:border-gray-600 focus:border-cs2-accent focus:outline-none transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Date Range Filter - Sélection de période
interface DateRangeFilterProps {
  label?: string;
  value: { from: string; to: string };
  onChange: (value: { from: string; to: string }) => void;
  presets?: { label: string; from: string; to: string }[];
  className?: string;
}

export function DateRangeFilter({
  label,
  value,
  onChange,
  presets = [],
  className = '',
}: DateRangeFilterProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
        />
        <span className="text-gray-500">→</span>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
        />
      </div>

      {presets.length > 0 && (
        <div className="flex gap-2 mt-2">
          {presets.map((preset, i) => (
            <button
              key={i}
              onClick={() => onChange({ from: preset.from, to: preset.to })}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
