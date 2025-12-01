'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  Banknote,
} from 'lucide-react';

// Types
interface RoundEconomy {
  roundNumber: number;
  startMoney: number;
  spent: number;
  remaining: number;
  earned: number; // Argent gagné pendant le round
  endMoney: number;
  buyType: 'full' | 'force' | 'eco' | 'save' | 'pistol' | 'half';
  equipmentValue: number;
  isWin: boolean;
  teamBuySync: boolean; // Si achat synchronisé avec l'équipe
  isGoodDecision: boolean; // Si la décision d'achat était correcte
}

interface EconomyFlowProps {
  rounds: RoundEconomy[];
  playerName?: string;
  variant?: 'waterfall' | 'area' | 'combined';
  showTeamSync?: boolean;
  showDecisions?: boolean;
  className?: string;
}

// Couleurs par type d'achat
const BUY_TYPE_COLORS: Record<RoundEconomy['buyType'], { primary: string; bg: string; label: string }> = {
  full: { primary: '#22c55e', bg: 'bg-green-500/20', label: 'Full Buy' },
  force: { primary: '#f97316', bg: 'bg-orange-500/20', label: 'Force Buy' },
  eco: { primary: '#ef4444', bg: 'bg-red-500/20', label: 'Eco' },
  save: { primary: '#6b7280', bg: 'bg-gray-500/20', label: 'Save' },
  pistol: { primary: '#a855f7', bg: 'bg-purple-500/20', label: 'Pistol' },
  half: { primary: '#eab308', bg: 'bg-yellow-500/20', label: 'Half Buy' },
};

// Seuils d'argent (CS2)
const MONEY_THRESHOLDS = {
  fullBuy: 4750, // AK/M4 + full util + armor
  forceBuy: 3000,
  halfBuy: 2000,
};

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as RoundEconomy;
  const buyTypeConfig = BUY_TYPE_COLORS[data.buyType];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="font-semibold text-white">Round {data.roundNumber}</span>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: `${buyTypeConfig.primary}30`, color: buyTypeConfig.primary }}
        >
          {buyTypeConfig.label}
        </span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Départ:</span>
          <span className="text-white font-medium">${data.startMoney.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Dépensé:</span>
          <span className="text-red-400 font-medium">-${data.spent.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Équipement:</span>
          <span className="text-blue-400 font-medium">${data.equipmentValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Gagné:</span>
          <span className="text-green-400 font-medium">+${data.earned.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
          <span className="text-gray-400">Fin de round:</span>
          <span className="text-white font-bold">${data.endMoney.toLocaleString()}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700 flex items-center gap-2">
        {data.isWin ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
        <span className={data.isWin ? 'text-green-400' : 'text-red-400'}>
          {data.isWin ? 'Victoire' : 'Défaite'}
        </span>
        {!data.isGoodDecision && (
          <span className="text-yellow-400 text-xs ml-auto">⚠ Mauvaise décision</span>
        )}
      </div>
    </div>
  );
}

// Composant de barre de buy type
function BuyTypeBar({ rounds }: { rounds: RoundEconomy[] }) {
  return (
    <div className="flex h-6 rounded-lg overflow-hidden">
      {rounds.map((round, index) => {
        const config = BUY_TYPE_COLORS[round.buyType];
        return (
          <div
            key={index}
            className="flex-1 relative group cursor-pointer"
            style={{ backgroundColor: config.primary }}
            title={`R${round.roundNumber}: ${config.label}`}
          >
            {!round.isGoodDecision && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-yellow-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Stats d'économie
function EconomyStats({ rounds }: { rounds: RoundEconomy[] }) {
  const stats = useMemo(() => {
    const buyTypes = rounds.reduce((acc, r) => {
      acc[r.buyType] = (acc[r.buyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const badDecisions = rounds.filter((r) => !r.isGoodDecision).length;
    const avgEquipment = rounds.reduce((sum, r) => sum + r.equipmentValue, 0) / rounds.length;
    const teamSyncRate = (rounds.filter((r) => r.teamBuySync).length / rounds.length) * 100;

    return { buyTypes, badDecisions, avgEquipment, teamSyncRate };
  }, [rounds]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">Full Buys</span>
        </div>
        <div className="text-xl font-bold text-white">
          {stats.buyTypes.full || 0}
        </div>
      </div>
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">Équip. moyen</span>
        </div>
        <div className="text-xl font-bold text-white">
          ${Math.round(stats.avgEquipment).toLocaleString()}
        </div>
      </div>
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-gray-400">Mauvais achats</span>
        </div>
        <div className="text-xl font-bold text-yellow-400">
          {stats.badDecisions}
        </div>
      </div>
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">Sync équipe</span>
        </div>
        <div className="text-xl font-bold text-white">
          {stats.teamSyncRate.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

// Chart Area
function AreaVariant({ rounds }: { rounds: RoundEconomy[] }) {
  const data = rounds.map((r) => ({
    ...r,
    name: `R${r.roundNumber}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="moneyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={MONEY_THRESHOLDS.fullBuy} stroke="#22c55e" strokeDasharray="5 5" />
        <ReferenceLine y={MONEY_THRESHOLDS.forceBuy} stroke="#f97316" strokeDasharray="5 5" />
        <Area
          type="monotone"
          dataKey="startMoney"
          stroke="#22c55e"
          fill="url(#moneyGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Chart Waterfall (Combined)
function WaterfallVariant({ rounds }: { rounds: RoundEconomy[] }) {
  const data = rounds.map((r) => ({
    ...r,
    name: `R${r.roundNumber}`,
    buyTypeColor: BUY_TYPE_COLORS[r.buyType].primary,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: '#374151' }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={MONEY_THRESHOLDS.fullBuy} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Full Buy', fill: '#22c55e', fontSize: 10 }} />

        {/* Barres de dépenses (négatives) */}
        <Bar dataKey="spent" fill="#ef4444" opacity={0.6} barSize={20} />

        {/* Ligne d'argent de départ */}
        <Area
          type="monotone"
          dataKey="startMoney"
          stroke="#3b82f6"
          fill="none"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 3 }}
        />

        {/* Ligne d'argent de fin */}
        <Area
          type="monotone"
          dataKey="endMoney"
          stroke="#22c55e"
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: '#22c55e', r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Composant principal
export function EconomyFlow({
  rounds,
  playerName,
  variant = 'combined',
  showTeamSync = true,
  showDecisions = true,
  className,
}: EconomyFlowProps) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  // Analyse des patterns
  const patterns = useMemo(() => {
    const consecutiveEcos = rounds.reduce((max, r, i, arr) => {
      if (r.buyType === 'eco' || r.buyType === 'save') {
        let count = 1;
        while (i + count < arr.length && (arr[i + count].buyType === 'eco' || arr[i + count].buyType === 'save')) {
          count++;
        }
        return Math.max(max, count);
      }
      return max;
    }, 0);

    const brokenBuys = rounds.filter(
      (r) => r.startMoney >= MONEY_THRESHOLDS.fullBuy && r.buyType !== 'full'
    ).length;

    return { consecutiveEcos, brokenBuys };
  }, [rounds]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h3 className="text-white font-semibold">
            Économie {playerName && `- ${playerName}`}
          </h3>
        </div>

        {/* Warnings */}
        <div className="flex items-center gap-2">
          {patterns.consecutiveEcos >= 3 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
              {patterns.consecutiveEcos} ecos consécutifs
            </span>
          )}
          {patterns.brokenBuys > 0 && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
              {patterns.brokenBuys} achats cassés
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <EconomyStats rounds={rounds} />

      {/* Buy type bar */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Types d'achats par round</div>
        <BuyTypeBar rounds={rounds} />
      </div>

      {/* Chart */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        {variant === 'area' && <AreaVariant rounds={rounds} />}
        {(variant === 'waterfall' || variant === 'combined') && <WaterfallVariant rounds={rounds} />}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        {Object.entries(BUY_TYPE_COLORS).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: config.primary }}
            />
            <span className="text-gray-400">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export types
export type { RoundEconomy, EconomyFlowProps };
