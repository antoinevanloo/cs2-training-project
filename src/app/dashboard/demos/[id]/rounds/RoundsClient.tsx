'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GranularityBadge } from '@/components/ui/GranularityBadge';
import {
  ChevronLeft,
  Clock,
  Target,
  Skull,
  DollarSign,
  Crosshair,
  Zap,
  AlertTriangle,
} from 'lucide-react';

import type { Round } from '@/types/rounds';
import { WIN_REASON_LABELS } from '@/types/rounds';
import {
  getPlayerRoundStats,
  isRoundWin,
  getHalfStats,
  splitRoundsByHalf,
  getProblematicRounds,
  calculateKDRatio,
  formatRoundDuration,
} from '@/lib/rounds';

export interface RoundsClientProps {
  demoId: string;
  mapName: string;
  matchDate: string;
  scoreTeam1: number;
  scoreTeam2: number;
  matchResult: string;
  rounds: Round[];
  mainPlayerTeam: number;
  mainPlayerSteamId: string;
  /** Mode integre (sans header) pour utilisation comme onglet */
  embedded?: boolean;
}

export function RoundsClient({
  demoId,
  mapName,
  matchDate,
  scoreTeam1,
  scoreTeam2,
  rounds,
  mainPlayerTeam,
  mainPlayerSteamId,
  embedded = false,
}: RoundsClientProps) {
  const [selectedRound, setSelectedRound] = useState<number | null>(
    rounds.length > 0 ? rounds[0].roundNumber : null
  );

  // Pas de rounds disponibles
  if (rounds.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400">
          Aucune donnee de round disponible pour cette demo.
        </p>
      </Card>
    );
  }

  const { firstHalf, secondHalf, halfPoint } = splitRoundsByHalf(rounds);
  const firstHalfStats = getHalfStats(firstHalf, mainPlayerSteamId, mainPlayerTeam);
  const secondHalfStats = getHalfStats(secondHalf, mainPlayerSteamId, mainPlayerTeam);
  const currentRound = rounds.find((r) => r.roundNumber === selectedRound);
  const problematicRounds = getProblematicRounds(rounds, mainPlayerSteamId, mainPlayerTeam);

  return (
    <div className={`space-y-6 ${embedded ? '' : 'pb-20 lg:pb-0'}`}>
      {/* Header - uniquement en mode standalone */}
      {!embedded && (
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/dashboard/demos/${demoId}`}
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour a la partie
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Timeline des Rounds</h1>
              <GranularityBadge level="round" showLabel />
            </div>
            <p className="text-gray-400 mt-1">
              <span className="capitalize">{mapName.replace('de_', '')}</span>
              {' \u2022 '}
              {scoreTeam1} - {scoreTeam2}
              {' \u2022 '}
              {new Date(matchDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      )}

      {/* Resume par moitie */}
      <HalfSummaryCards
        firstHalfStats={firstHalfStats}
        secondHalfStats={secondHalfStats}
        mainPlayerTeam={mainPlayerTeam}
        halfPoint={halfPoint}
        totalRounds={rounds.length}
      />

      {/* Timeline visuelle des rounds */}
      <RoundTimeline
        firstHalf={firstHalf}
        secondHalf={secondHalf}
        halfPoint={halfPoint}
        mainPlayerTeam={mainPlayerTeam}
        mainPlayerSteamId={mainPlayerSteamId}
        selectedRound={selectedRound}
        onSelectRound={setSelectedRound}
      />

      {/* Detail du round selectionne */}
      {currentRound && (
        <RoundDetail
          round={currentRound}
          mainPlayerTeam={mainPlayerTeam}
          mainPlayerSteamId={mainPlayerSteamId}
        />
      )}

      {/* Rounds problematiques */}
      {problematicRounds.length > 0 && (
        <ProblematicRoundsCard
          rounds={problematicRounds}
          onSelectRound={setSelectedRound}
        />
      )}
    </div>
  );
}

// =============================================================================
// Sous-composants
// =============================================================================

interface HalfSummaryCardsProps {
  firstHalfStats: ReturnType<typeof getHalfStats>;
  secondHalfStats: ReturnType<typeof getHalfStats>;
  mainPlayerTeam: number;
  halfPoint: number;
  totalRounds: number;
}

function HalfSummaryCards({
  firstHalfStats,
  secondHalfStats,
  mainPlayerTeam,
  halfPoint,
  totalRounds,
}: HalfSummaryCardsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <HalfCard
        stats={firstHalfStats}
        side={mainPlayerTeam === 2 ? 'CT' : 'T'}
        roundRange={`R1-${halfPoint}`}
        variant="blue"
      />
      <HalfCard
        stats={secondHalfStats}
        side={mainPlayerTeam === 2 ? 'T' : 'CT'}
        roundRange={`R${halfPoint + 1}-${totalRounds}`}
        variant="orange"
      />
    </div>
  );
}

interface HalfCardProps {
  stats: ReturnType<typeof getHalfStats>;
  side: 'CT' | 'T';
  roundRange: string;
  variant: 'blue' | 'orange';
}

function HalfCard({ stats, side, roundRange, variant }: HalfCardProps) {
  const colorClass = variant === 'blue' ? 'text-blue-400' : 'text-orange-400';
  const bgClass =
    variant === 'blue'
      ? 'from-blue-900/20 to-gray-900/50'
      : 'from-orange-900/20 to-gray-900/50';

  return (
    <Card className={`border-gray-800/50 bg-gradient-to-br ${bgClass}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${colorClass}`}>
            {side} Side ({roundRange})
          </span>
          <span
            className={`font-bold ${
              stats.wins >= stats.losses ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {stats.wins} - {stats.losses}
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-500">K/D: </span>
            <span className="text-white">
              {stats.kills}/{stats.deaths}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Ratio: </span>
            <span
              className={
                stats.deaths > 0
                  ? stats.kills / stats.deaths >= 1
                    ? 'text-green-400'
                    : 'text-red-400'
                  : 'text-white'
              }
            >
              {calculateKDRatio(stats.kills, stats.deaths)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RoundTimelineProps {
  firstHalf: Round[];
  secondHalf: Round[];
  halfPoint: number;
  mainPlayerTeam: number;
  mainPlayerSteamId: string;
  selectedRound: number | null;
  onSelectRound: (roundNumber: number) => void;
}

function RoundTimeline({
  firstHalf,
  secondHalf,
  mainPlayerTeam,
  mainPlayerSteamId,
  selectedRound,
  onSelectRound,
}: RoundTimelineProps) {
  return (
    <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cs2-accent" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Premiere moitie */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">
            {mainPlayerTeam === 2 ? 'CT Side' : 'T Side'}
          </div>
          <RoundButtons
            rounds={firstHalf}
            mainPlayerTeam={mainPlayerTeam}
            mainPlayerSteamId={mainPlayerSteamId}
            selectedRound={selectedRound}
            onSelectRound={onSelectRound}
          />
        </div>

        {/* Separateur */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-gray-700" />
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
            Changement de cote
          </span>
          <div className="flex-1 border-t border-gray-700" />
        </div>

        {/* Deuxieme moitie */}
        <div>
          <div className="text-xs text-gray-500 mb-2">
            {mainPlayerTeam === 2 ? 'T Side' : 'CT Side'}
          </div>
          <RoundButtons
            rounds={secondHalf}
            mainPlayerTeam={mainPlayerTeam}
            mainPlayerSteamId={mainPlayerSteamId}
            selectedRound={selectedRound}
            onSelectRound={onSelectRound}
          />
        </div>

        {/* Legende */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
          <LegendItem color="green" label="Round gagne" />
          <LegendItem color="red" label="Round perdu" />
          <LegendItem color="accent" label="Selectionne" />
        </div>
      </CardContent>
    </Card>
  );
}

interface RoundButtonsProps {
  rounds: Round[];
  mainPlayerTeam: number;
  mainPlayerSteamId: string;
  selectedRound: number | null;
  onSelectRound: (roundNumber: number) => void;
}

function RoundButtons({
  rounds,
  mainPlayerTeam,
  mainPlayerSteamId,
  selectedRound,
  onSelectRound,
}: RoundButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {rounds.map((round) => {
        const stats = getPlayerRoundStats(round, mainPlayerSteamId);
        const isWin = isRoundWin(round, mainPlayerTeam);
        const isSelected = selectedRound === round.roundNumber;

        return (
          <button
            key={round.roundNumber}
            onClick={() => onSelectRound(round.roundNumber)}
            className={`
              relative w-10 h-12 rounded-lg flex flex-col items-center justify-center
              transition-all duration-200 border
              ${
                isSelected
                  ? 'border-cs2-accent bg-cs2-accent/20 scale-105'
                  : isWin
                  ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                  : 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
              }
            `}
          >
            <span className="text-xs font-bold text-gray-400">
              {round.roundNumber}
            </span>
            <span
              className={`text-sm font-bold ${
                isWin ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {stats.kills > 0 ? `${stats.kills}K` : stats.deaths > 0 ? '\u2620' : '-'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LegendItem({ color, label }: { color: 'green' | 'red' | 'accent'; label: string }) {
  const colorClasses = {
    green: 'bg-green-500/30 border-green-500/50',
    red: 'bg-red-500/30 border-red-500/50',
    accent: 'bg-cs2-accent/30 border-cs2-accent',
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-3 h-3 rounded border ${colorClasses[color]}`} />
      <span className="text-gray-400">{label}</span>
    </div>
  );
}

interface RoundDetailProps {
  round: Round;
  mainPlayerTeam: number;
  mainPlayerSteamId: string;
}

function RoundDetail({ round, mainPlayerTeam, mainPlayerSteamId }: RoundDetailProps) {
  const stats = getPlayerRoundStats(round, mainPlayerSteamId);
  const isWin = isRoundWin(round, mainPlayerTeam);

  return (
    <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <span className="text-cs2-accent">Round {round.roundNumber}</span>
          </CardTitle>
          <GranularityBadge level="round" />
        </div>
        <span
          className={`
            px-3 py-1 rounded-full text-sm font-bold
            ${isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
          `}
        >
          {isWin ? 'Victoire' : 'Defaite'}
        </span>
      </CardHeader>
      <CardContent>
        {/* Infos du round */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard
            icon={Target}
            label="Raison"
            value={WIN_REASON_LABELS[round.winReason] || round.winReason}
          />
          <InfoCard
            icon={Clock}
            label="Duree"
            value={formatRoundDuration(round.duration)}
          />
          <InfoCard
            icon={DollarSign}
            label="Votre equipe"
            value={`$${(mainPlayerTeam === 1 ? round.team1Money : round.team2Money).toLocaleString()}`}
            valueColor="text-green-400"
          />
          <InfoCard
            icon={DollarSign}
            label="Adversaires"
            value={`$${(mainPlayerTeam === 1 ? round.team2Money : round.team1Money).toLocaleString()}`}
            valueColor="text-red-400"
          />
        </div>

        {/* Performance du joueur */}
        <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-800/50 mb-6">
          <div className="text-sm text-gray-400 mb-3">Votre performance</div>
          <div className="flex items-center gap-6">
            <StatDisplay icon={Crosshair} value={stats.kills} label="kills" color="text-green-400" />
            <StatDisplay icon={Skull} value={stats.deaths} label="mort" color="text-red-400" />
            <StatDisplay icon={Zap} value={stats.assists} label="assists" color="text-yellow-400" />
          </div>
        </div>

        {/* Timeline des evenements */}
        <RoundEvents
          events={round.events}
          mainPlayerSteamId={mainPlayerSteamId}
        />
      </CardContent>
    </Card>
  );
}

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}

function InfoCard({ icon: Icon, label, value, valueColor = 'text-white' }: InfoCardProps) {
  return (
    <div className="p-3 bg-gray-900/50 rounded-lg">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className={`font-medium ${valueColor}`}>{value}</div>
    </div>
  );
}

interface StatDisplayProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
}

function StatDisplay({ icon: Icon, value, label, color }: StatDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

interface RoundEventsProps {
  events: Round['events'];
  mainPlayerSteamId: string;
}

function RoundEvents({ events, mainPlayerSteamId }: RoundEventsProps) {
  const killEvents = events.filter((e) => e.type === 'kill');

  return (
    <div>
      <div className="text-sm text-gray-400 mb-3">Evenements du round</div>
      {killEvents.length > 0 ? (
        <div className="space-y-2">
          {killEvents.map((event, index) => {
            const isPlayerKill = event.attackerSteamId === mainPlayerSteamId;
            const isPlayerDeath = event.victimSteamId === mainPlayerSteamId;

            return (
              <div
                key={index}
                className={`
                  flex items-center gap-3 p-3 rounded-lg
                  ${isPlayerKill ? 'bg-green-500/10 border border-green-500/20' : ''}
                  ${isPlayerDeath ? 'bg-red-500/10 border border-red-500/20' : ''}
                  ${!isPlayerKill && !isPlayerDeath ? 'bg-gray-900/30' : ''}
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isPlayerKill ? 'bg-green-500/20' : ''}
                    ${isPlayerDeath ? 'bg-red-500/20' : ''}
                    ${!isPlayerKill && !isPlayerDeath ? 'bg-gray-800' : ''}
                  `}
                >
                  {event.headshot ? (
                    <Target
                      className={`w-4 h-4 ${
                        isPlayerKill
                          ? 'text-green-400'
                          : isPlayerDeath
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    />
                  ) : (
                    <Crosshair
                      className={`w-4 h-4 ${
                        isPlayerKill
                          ? 'text-green-400'
                          : isPlayerDeath
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={isPlayerKill ? 'text-green-400 font-medium' : 'text-white'}
                  >
                    {event.attacker || 'Joueur'}
                  </span>
                  <span className="text-gray-500 mx-2">{'\u2192'}</span>
                  <span
                    className={isPlayerDeath ? 'text-red-400 font-medium' : 'text-white'}
                  >
                    {event.victim || 'Joueur'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {event.headshot && (
                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400">
                      HS
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{event.weapon}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Pas d&apos;evenements enregistres pour ce round
        </div>
      )}
    </div>
  );
}

interface ProblematicRoundsCardProps {
  rounds: Round[];
  onSelectRound: (roundNumber: number) => void;
}

function ProblematicRoundsCard({ rounds, onSelectRound }: ProblematicRoundsCardProps) {
  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-900/10 to-gray-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          <AlertTriangle className="w-5 h-5" />
          Rounds a analyser
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rounds.slice(0, 5).map((round) => (
            <button
              key={round.roundNumber}
              onClick={() => onSelectRound(round.roundNumber)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                {round.roundNumber}
              </div>
              <div className="flex-1">
                <div className="text-white">Mort sans impact</div>
                <div className="text-xs text-gray-500">
                  {WIN_REASON_LABELS[round.winReason] || round.winReason}
                </div>
              </div>
              <span className="text-sm text-gray-400">Cliquez pour analyser</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
