'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Crosshair,
  Skull,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';

// Types
interface KillEvent {
  tick: number;
  timestamp: number; // Secondes depuis le début du round
  attackerSteamId: string;
  attackerName: string;
  attackerTeam: number;
  victimSteamId: string;
  victimName: string;
  victimTeam: number;
  weapon: string;
  isHeadshot: boolean;
}

interface TradeEvent {
  originalKill: KillEvent;
  tradeKill: KillEvent;
  tradeTime: number; // Secondes entre les deux kills
  isSuccessful: boolean; // true si l'équipe de la victime originale a tradé
}

interface TradeTimelineProps {
  trades: TradeEvent[];
  kills: KillEvent[];
  playerSteamId: string;
  playerTeam: number;
  roundNumber?: number;
  maxTradeTime?: number; // Temps max considéré comme trade (default 5s)
  showAllPlayers?: boolean;
  variant?: 'full' | 'compact' | 'mini';
  className?: string;
}

// Couleurs pour les équipes
const TEAM_COLORS = {
  ct: {
    primary: '#4299e1',
    secondary: '#2b6cb0',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  t: {
    primary: '#ed8936',
    secondary: '#c05621',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
  },
};

// Helper pour obtenir la couleur de temps de trade
function getTradeTimeColor(tradeTime: number): string {
  if (tradeTime < 2) return '#22c55e'; // Vert - excellent
  if (tradeTime < 3) return '#eab308'; // Jaune - bon
  if (tradeTime < 4) return '#f97316'; // Orange - moyen
  return '#ef4444'; // Rouge - lent
}

// Helper pour formater le temps
function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

// Composant pour un événement de kill
function KillEventCard({
  kill,
  isPlayer,
  side,
}: {
  kill: KillEvent;
  isPlayer: boolean;
  side: 'attacker' | 'victim';
}) {
  const teamColors = kill.attackerTeam === 3 ? TEAM_COLORS.ct : TEAM_COLORS.t;
  const isAttacker = side === 'attacker';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
        isAttacker ? teamColors.bg : 'bg-gray-800/50',
        isPlayer && 'ring-2 ring-cs2-accent/50'
      )}
    >
      {isAttacker ? (
        <Crosshair className={cn('w-4 h-4', teamColors.text)} />
      ) : (
        <Skull className="w-4 h-4 text-red-400" />
      )}
      <span className={cn('font-medium', isPlayer && 'text-cs2-accent')}>
        {isAttacker ? kill.attackerName : kill.victimName}
      </span>
      {kill.isHeadshot && isAttacker && (
        <span className="text-xs text-yellow-400">HS</span>
      )}
    </div>
  );
}

// Composant pour une trade complète
function TradeCard({
  trade,
  playerSteamId,
  expanded,
  onToggle,
}: {
  trade: TradeEvent;
  playerSteamId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { originalKill, tradeKill, tradeTime, isSuccessful } = trade;
  const tradeTimeColor = getTradeTimeColor(tradeTime);

  const isPlayerInvolved =
    originalKill.attackerSteamId === playerSteamId ||
    originalKill.victimSteamId === playerSteamId ||
    tradeKill.attackerSteamId === playerSteamId ||
    tradeKill.victimSteamId === playerSteamId;

  const playerTradedSomeone = tradeKill.attackerSteamId === playerSteamId;
  const playerGotTraded = tradeKill.victimSteamId === playerSteamId;

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all duration-200',
        isSuccessful ? 'border-green-500/30' : 'border-red-500/30',
        isPlayerInvolved && 'ring-1 ring-cs2-accent/30'
      )}
    >
      {/* Header - toujours visible */}
      <div
        className={cn(
          'p-3 cursor-pointer hover:bg-white/5 transition-colors',
          isSuccessful ? 'bg-green-500/5' : 'bg-red-500/5'
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          {/* Trade flow mini */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">{originalKill.victimName}</span>
            <Skull className="w-3 h-3 text-red-400" />
            <ArrowRight className="w-3 h-3 text-gray-500" />
            <span
              className={cn(
                'font-medium',
                playerTradedSomeone ? 'text-cs2-accent' : 'text-white'
              )}
            >
              {tradeKill.attackerName}
            </span>
            <Crosshair className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">{tradeKill.victimName}</span>
          </div>

          {/* Trade time badge */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${tradeTimeColor}20`,
                color: tradeTimeColor,
              }}
            >
              <Clock className="w-3 h-3" />
              {formatTime(tradeTime)}
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Détails expandables */}
      {expanded && (
        <div className="p-3 border-t border-gray-700/30 bg-gray-900/30">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Kill original */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Kill original
              </div>
              <KillEventCard
                kill={originalKill}
                isPlayer={originalKill.attackerSteamId === playerSteamId}
                side="attacker"
              />
              <div className="flex items-center gap-1 text-xs text-gray-400 pl-2">
                <ArrowRight className="w-3 h-3" />
                <KillEventCard
                  kill={originalKill}
                  isPlayer={originalKill.victimSteamId === playerSteamId}
                  side="victim"
                />
              </div>
            </div>

            {/* Flèche et temps */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="w-16 h-1 rounded-full"
                style={{ backgroundColor: tradeTimeColor }}
              />
              <div
                className="mt-1 text-lg font-bold"
                style={{ color: tradeTimeColor }}
              >
                {formatTime(tradeTime)}
              </div>
              <div className="text-xs text-gray-500">temps de trade</div>
            </div>

            {/* Trade kill */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Trade
              </div>
              <KillEventCard
                kill={tradeKill}
                isPlayer={tradeKill.attackerSteamId === playerSteamId}
                side="attacker"
              />
              <div className="flex items-center gap-1 text-xs text-gray-400 pl-2">
                <ArrowRight className="w-3 h-3" />
                <KillEventCard
                  kill={tradeKill}
                  isPlayer={tradeKill.victimSteamId === playerSteamId}
                  side="victim"
                />
              </div>
            </div>
          </div>

          {/* Weapon info */}
          <div className="mt-3 pt-3 border-t border-gray-700/30 flex items-center justify-between text-xs text-gray-400">
            <span>Arme: {tradeKill.weapon}</span>
            <span>@ {formatTime(tradeKill.timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant principal
export function TradeTimeline({
  trades,
  kills,
  playerSteamId,
  playerTeam,
  roundNumber,
  maxTradeTime = 5,
  showAllPlayers = true,
  variant = 'full',
  className,
}: TradeTimelineProps) {
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [showOnlyPlayer, setShowOnlyPlayer] = useState(!showAllPlayers);

  // Filtrer les trades
  const filteredTrades = useMemo(() => {
    if (showOnlyPlayer) {
      return trades.filter(
        (t) =>
          t.originalKill.attackerSteamId === playerSteamId ||
          t.originalKill.victimSteamId === playerSteamId ||
          t.tradeKill.attackerSteamId === playerSteamId ||
          t.tradeKill.victimSteamId === playerSteamId
      );
    }
    return trades;
  }, [trades, playerSteamId, showOnlyPlayer]);

  // Stats
  const stats = useMemo(() => {
    const playerTrades = trades.filter(
      (t) => t.tradeKill.attackerSteamId === playerSteamId
    );
    const playerGotTraded = trades.filter(
      (t) => t.tradeKill.victimSteamId === playerSteamId
    );
    const avgTradeTime =
      playerTrades.length > 0
        ? playerTrades.reduce((sum, t) => sum + t.tradeTime, 0) /
          playerTrades.length
        : 0;

    return {
      totalTrades: trades.length,
      playerTradesGiven: playerTrades.length,
      playerTradesReceived: playerGotTraded.length,
      avgTradeTime,
      fastTrades: playerTrades.filter((t) => t.tradeTime < 2).length,
    };
  }, [trades, playerSteamId]);

  // Mini variant
  if (variant === 'mini') {
    return (
      <div className={cn('flex items-center gap-4 text-sm', className)}>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-white font-medium">{stats.playerTradesGiven}</span>
          <span className="text-gray-500">trades donnés</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">
            {formatTime(stats.avgTradeTime)}
          </span>
          <span className="text-gray-500">avg</span>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Stats bar */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {stats.playerTradesGiven}
              </div>
              <div className="text-xs text-gray-500">trades donnés</div>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div>
              <div className="text-2xl font-bold text-red-400">
                {stats.playerTradesReceived}
              </div>
              <div className="text-xs text-gray-500">trades reçus</div>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-2xl font-bold"
              style={{ color: getTradeTimeColor(stats.avgTradeTime) }}
            >
              {formatTime(stats.avgTradeTime)}
            </div>
            <div className="text-xs text-gray-500">temps moyen</div>
          </div>
        </div>

        {/* Liste simplifiée */}
        <div className="space-y-1">
          {filteredTrades.slice(0, 5).map((trade, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-900/30 rounded text-sm"
            >
              <span className="text-gray-400">
                {trade.tradeKill.attackerName} → {trade.tradeKill.victimName}
              </span>
              <span
                className="font-medium"
                style={{ color: getTradeTimeColor(trade.tradeTime) }}
              >
                {formatTime(trade.tradeTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold">
            Trades {roundNumber !== undefined && `(Round ${roundNumber})`}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
              {stats.playerTradesGiven} donnés
            </span>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
              {stats.playerTradesReceived} reçus
            </span>
          </div>
        </div>

        {/* Toggle filtre */}
        <button
          onClick={() => setShowOnlyPlayer(!showOnlyPlayer)}
          className={cn(
            'px-3 py-1 rounded-lg text-sm transition-colors',
            showOnlyPlayer
              ? 'bg-cs2-accent/20 text-cs2-accent'
              : 'bg-gray-700/50 text-gray-400 hover:text-white'
          )}
        >
          {showOnlyPlayer ? 'Mes trades' : 'Tous les trades'}
        </button>
      </div>

      {/* Stats détaillées */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-gray-800/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
          <div className="text-xs text-gray-500">Total trades</div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">
            {stats.playerTradesGiven}
          </div>
          <div className="text-xs text-gray-500">Trades donnés</div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg text-center">
          <div
            className="text-2xl font-bold"
            style={{ color: getTradeTimeColor(stats.avgTradeTime) }}
          >
            {formatTime(stats.avgTradeTime)}
          </div>
          <div className="text-xs text-gray-500">Temps moyen</div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.fastTrades}</div>
          <div className="text-xs text-gray-500">Trades rapides (&lt;2s)</div>
        </div>
      </div>

      {/* Liste des trades */}
      {filteredTrades.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Aucun trade {showOnlyPlayer ? 'impliquant le joueur' : ''} dans ce round
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTrades.map((trade, index) => (
            <TradeCard
              key={index}
              trade={trade}
              playerSteamId={playerSteamId}
              expanded={expandedTrade === index}
              onToggle={() =>
                setExpandedTrade(expandedTrade === index ? null : index)
              }
            />
          ))}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 pt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>&lt;2s excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>2-3s bon</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>3-4s moyen</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>&gt;4s lent</span>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { TradeEvent, KillEvent, TradeTimelineProps };
