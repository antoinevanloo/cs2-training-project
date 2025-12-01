'use client';

import { useState, useMemo } from 'react';
import type {
  TeamAnalysis,
  TeamMember,
  TeamSynergy,
  PositionConflict,
  RoundStrategy,
  TeamRecommendation,
  CS2Role,
} from '@/lib/analysis/team';

// ============================================
// STYLES ET CONSTANTES
// ============================================

const ROLE_STYLES: Record<CS2Role, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  entry: {
    label: 'Entry Fragger',
    icon: 'E',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'First player to enter sites and take opening duels',
  },
  support: {
    label: 'Support',
    icon: 'S',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Provides utility and trades for teammates',
  },
  awp: {
    label: 'AWPer',
    icon: 'A',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    description: 'Primary sniper, holds long angles',
  },
  lurker: {
    label: 'Lurker',
    icon: 'L',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Plays alone to gather info and catch rotations',
  },
  igl: {
    label: 'IGL',
    icon: 'I',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'In-game leader, calls strategies',
  },
  anchor: {
    label: 'Anchor',
    icon: 'X',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    description: 'Holds site alone on CT side',
  },
  flex: {
    label: 'Flex',
    icon: 'F',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    description: 'Adapts role based on team needs',
  },
};

const RECOMMENDATION_STYLES: Record<TeamRecommendation['type'], {
  icon: string;
  color: string;
  bgColor: string;
}> = {
  role_adjustment: { icon: 'R', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  synergy_improvement: { icon: 'S', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  strategy_suggestion: { icon: 'T', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  utility_coordination: { icon: 'U', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  position_fix: { icon: 'P', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface TeamMemberCardProps {
  member: TeamMember;
  onClick?: (member: TeamMember) => void;
}

function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  const roleStyle = ROLE_STYLES[member.detectedRole.role];

  return (
    <div
      onClick={() => onClick?.(member)}
      className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 cursor-pointer transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            <span className="text-xl font-bold text-gray-400">{member.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white">{member.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs ${roleStyle.color} ${roleStyle.bgColor}`}>
              {roleStyle.label}
            </span>
            <span className="text-xs text-gray-500">{member.detectedRole.confidence}% conf.</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-white">{member.stats.rating.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Rating</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {member.stats.kills}/{member.stats.deaths}
          </div>
          <div className="text-xs text-gray-500">K/D</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{member.stats.adr.toFixed(0)}</div>
          <div className="text-xs text-gray-500">ADR</div>
        </div>
      </div>

      {/* Role indicators */}
      <div className="space-y-1">
        {member.detectedRole.indicators.slice(0, 2).map((indicator, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{indicator.description}</span>
            <span className={indicator.value > 50 ? 'text-green-400' : 'text-gray-500'}>
              {indicator.value.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SynergyCardProps {
  synergy: TeamSynergy;
}

function SynergyCard({ synergy }: SynergyCardProps) {
  const scoreColor =
    synergy.synergyScore >= 80 ? 'text-green-400' :
    synergy.synergyScore >= 60 ? 'text-yellow-400' :
    synergy.synergyScore >= 40 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
      {/* Players */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{synergy.player1Name}</span>
          <span className="text-gray-500">&</span>
          <span className="font-medium text-white">{synergy.player2Name}</span>
        </div>
        <div className={`text-2xl font-bold ${scoreColor}`}>{synergy.synergyScore}</div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded bg-gray-800/50">
          <div className="text-sm font-medium text-white">{(synergy.metrics.tradeRate * 100).toFixed(0)}%</div>
          <div className="text-xs text-gray-500">Trade Rate</div>
        </div>
        <div className="p-2 rounded bg-gray-800/50">
          <div className="text-sm font-medium text-white">{synergy.metrics.avgTradeTime.toFixed(1)}s</div>
          <div className="text-xs text-gray-500">Avg Trade Time</div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="space-y-2">
        {synergy.strengths.slice(0, 2).map((strength, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-green-400">+</span>
            <span className="text-gray-300">{strength}</span>
          </div>
        ))}
        {synergy.weaknesses.slice(0, 1).map((weakness, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-red-400">-</span>
            <span className="text-gray-400">{weakness}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ConflictCardProps {
  conflict: PositionConflict;
}

function ConflictCard({ conflict }: ConflictCardProps) {
  const severityColors = {
    low: 'border-yellow-500/30 bg-yellow-500/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    high: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[conflict.severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Round {conflict.round}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          conflict.severity === 'high' ? 'bg-red-500/20 text-red-400' :
          conflict.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {conflict.severity}
        </span>
      </div>
      <p className="text-sm text-white mb-1">{conflict.description}</p>
      <p className="text-xs text-gray-400">{conflict.suggestion}</p>
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
        <span>Players:</span>
        {conflict.players.map((p, i) => (
          <span key={i} className="text-gray-400">{p}</span>
        ))}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: TeamRecommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = RECOMMENDATION_STYLES[recommendation.type];

  return (
    <div className={`rounded-xl overflow-hidden border ${
      recommendation.priority === 'high' ? 'border-red-500/30' :
      recommendation.priority === 'medium' ? 'border-yellow-500/30' :
      'border-gray-700/50'
    }`}>
      {/* Priority bar */}
      <div className={`h-1 ${
        recommendation.priority === 'high' ? 'bg-red-500' :
        recommendation.priority === 'medium' ? 'bg-yellow-500' :
        'bg-gray-600'
      }`} />

      <div className="p-4 bg-gray-800/30">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={`font-bold ${style.color}`}>{style.icon}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white">{recommendation.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{recommendation.description}</p>
          </div>
        </div>

        {/* Affected players */}
        {recommendation.affectedPlayers.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Affects:</span>
            {recommendation.affectedPlayers.map((player, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-300">
                {player}
              </span>
            ))}
          </div>
        )}

        {/* Action items (expandable) */}
        {recommendation.actionItems.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-xs text-cs2-accent hover:underline flex items-center gap-1"
            >
              {expanded ? 'Hide' : 'Show'} action items ({recommendation.actionItems.length})
            </button>
            {expanded && (
              <div className="mt-2 space-y-1 p-3 rounded-lg bg-gray-900/50">
                {recommendation.actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-cs2-accent">{i + 1}.</span>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Expected impact */}
        {recommendation.expectedImpact && (
          <div className="mt-3 p-2 rounded bg-green-500/10 border border-green-500/20">
            <span className="text-xs text-green-400">Expected Impact: </span>
            <span className="text-xs text-gray-300">{recommendation.expectedImpact}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface TeamAnalysisViewProps {
  analysis: TeamAnalysis;
  onMemberClick?: (member: TeamMember) => void;
  className?: string;
}

export function TeamAnalysisView({
  analysis,
  onMemberClick,
  className = '',
}: TeamAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'synergies' | 'strategies' | 'recommendations'>('overview');

  // Sort synergies by score
  const sortedSynergies = useMemo(() =>
    [...analysis.synergies].sort((a, b) => b.synergyScore - a.synergyScore),
    [analysis.synergies]
  );

  // Sort recommendations by priority
  const sortedRecommendations = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...analysis.recommendations].sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }, [analysis.recommendations]);

  // High priority conflicts
  const highPriorityConflicts = analysis.conflicts.filter(c => c.severity === 'high');

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Analysis</h2>
          <p className="text-gray-400 mt-1">
            {analysis.map} - {analysis.score.team} : {analysis.score.opponent} ({analysis.matchResult})
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-cs2-accent">{analysis.teamScore}</div>
          <div className="text-xs text-gray-500">Team Score</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-gray-800/50">
        {(['overview', 'roles', 'synergies', 'strategies', 'recommendations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cs2-accent text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Team stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-white">
                {analysis.teamStats.roundsWon}/{analysis.teamStats.roundsPlayed}
              </div>
              <div className="text-xs text-gray-500">Rounds Won</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-green-400">
                {(analysis.teamStats.entryWinRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Entry Win Rate</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(analysis.teamStats.teamTradeRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Trade Rate</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {(analysis.teamStats.clutchWinRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Clutch Win Rate</div>
            </div>
          </div>

          {/* Side stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <h4 className="font-medium text-orange-400 mb-2">T Side</h4>
              <div className="text-2xl font-bold text-white">
                {analysis.teamStats.tRoundsWon}/{analysis.teamStats.tRoundsPlayed}
              </div>
              <div className="text-xs text-gray-500">
                {((analysis.teamStats.tRoundsWon / analysis.teamStats.tRoundsPlayed) * 100).toFixed(0)}% win rate
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <h4 className="font-medium text-blue-400 mb-2">CT Side</h4>
              <div className="text-2xl font-bold text-white">
                {analysis.teamStats.ctRoundsWon}/{analysis.teamStats.ctRoundsPlayed}
              </div>
              <div className="text-xs text-gray-500">
                {((analysis.teamStats.ctRoundsWon / analysis.teamStats.ctRoundsPlayed) * 100).toFixed(0)}% win rate
              </div>
            </div>
          </div>

          {/* Critical issues */}
          {highPriorityConflicts.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <h4 className="font-medium text-red-400 mb-3">Critical Issues</h4>
              <div className="space-y-2">
                {highPriorityConflicts.slice(0, 3).map((conflict, i) => (
                  <ConflictCard key={i} conflict={conflict} />
                ))}
              </div>
            </div>
          )}

          {/* Top recommendation */}
          {sortedRecommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-white mb-3">Top Priority</h4>
              <RecommendationCard recommendation={sortedRecommendations[0]} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Team members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.members.map((member) => (
              <TeamMemberCard
                key={member.steamId}
                member={member}
                onClick={onMemberClick}
              />
            ))}
          </div>

          {/* Role distribution */}
          <div className="p-4 rounded-xl bg-gray-800/30">
            <h4 className="font-medium text-white mb-3">Role Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.members.map((member) => {
                const roleStyle = ROLE_STYLES[member.detectedRole.role];
                return (
                  <div
                    key={member.steamId}
                    className={`px-3 py-2 rounded-lg ${roleStyle.bgColor} border border-gray-700/50`}
                  >
                    <div className={`text-sm font-medium ${roleStyle.color}`}>{roleStyle.label}</div>
                    <div className="text-xs text-gray-400">{member.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'synergies' && (
        <div className="space-y-6">
          {/* Synergy matrix hint */}
          <p className="text-sm text-gray-400">
            Synergy scores measure how well two players work together based on trades, utility coordination, and positioning.
          </p>

          {/* Synergy cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedSynergies.map((synergy, i) => (
              <SynergyCard key={i} synergy={synergy} />
            ))}
          </div>

          {/* Best & Worst */}
          {sortedSynergies.length >= 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <h4 className="font-medium text-green-400 mb-2">Best Synergy</h4>
                <p className="text-white">
                  {sortedSynergies[0].player1Name} & {sortedSynergies[0].player2Name}
                </p>
                <p className="text-2xl font-bold text-green-400">{sortedSynergies[0].synergyScore}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <h4 className="font-medium text-red-400 mb-2">Needs Work</h4>
                <p className="text-white">
                  {sortedSynergies[sortedSynergies.length - 1].player1Name} & {sortedSynergies[sortedSynergies.length - 1].player2Name}
                </p>
                <p className="text-2xl font-bold text-red-400">
                  {sortedSynergies[sortedSynergies.length - 1].synergyScore}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'strategies' && (
        <div className="space-y-6">
          {/* Strategy overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-white">{analysis.roundStrategies.length}</div>
              <div className="text-xs text-gray-500">Total Rounds</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-green-400">
                {(analysis.teamStats.executeSuccessRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Execute Success</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(analysis.teamStats.utilityCoordination * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Utility Coord.</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/30 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {analysis.teamStats.avgFirstKillTime.toFixed(1)}s
              </div>
              <div className="text-xs text-gray-500">Avg FK Time</div>
            </div>
          </div>

          {/* Round strategies list */}
          <div className="space-y-2">
            <h4 className="font-medium text-white">Round by Round</h4>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {analysis.roundStrategies.map((round) => (
                <div
                  key={round.round}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    round.outcome === 'win' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <span className="w-8 text-center text-sm text-gray-400">R{round.round}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    round.side === 'T' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {round.side}
                  </span>
                  <span className="text-sm text-white capitalize">{round.detectedStrategy.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">{round.confidence}% conf.</span>
                  <span className="text-xs text-gray-500">Exec: {round.execution.score}%</span>
                  <span className={`ml-auto text-sm font-medium ${
                    round.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {round.outcome.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {sortedRecommendations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recommendations available</p>
          ) : (
            sortedRecommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// TEAM COMPARISON COMPONENT
// ============================================

interface TeamComparisonViewProps {
  analysis1: TeamAnalysis;
  analysis2: TeamAnalysis;
  className?: string;
}

export function TeamComparisonView({
  analysis1,
  analysis2,
  className = '',
}: TeamComparisonViewProps) {
  const metrics = [
    { label: 'Team Score', v1: analysis1.teamScore, v2: analysis2.teamScore },
    { label: 'Win Rate', v1: (analysis1.teamStats.roundsWon / analysis1.teamStats.roundsPlayed) * 100, v2: (analysis2.teamStats.roundsWon / analysis2.teamStats.roundsPlayed) * 100, suffix: '%' },
    { label: 'Entry Win Rate', v1: analysis1.teamStats.entryWinRate * 100, v2: analysis2.teamStats.entryWinRate * 100, suffix: '%' },
    { label: 'Trade Rate', v1: analysis1.teamStats.teamTradeRate * 100, v2: analysis2.teamStats.teamTradeRate * 100, suffix: '%' },
    { label: 'Utility Coord.', v1: analysis1.teamStats.utilityCoordination * 100, v2: analysis2.teamStats.utilityCoordination * 100, suffix: '%' },
    { label: 'Clutch Win Rate', v1: analysis1.teamStats.clutchWinRate * 100, v2: analysis2.teamStats.clutchWinRate * 100, suffix: '%' },
  ];

  return (
    <div className={`rounded-xl bg-gray-800/30 border border-gray-700/50 overflow-hidden ${className}`}>
      <div className="grid grid-cols-3 p-4 border-b border-gray-700/50">
        <div className="text-center">
          <div className="font-medium text-white">{analysis1.map}</div>
          <div className="text-xs text-gray-500">
            {analysis1.score.team}-{analysis1.score.opponent}
          </div>
        </div>
        <div className="text-center text-gray-500">vs</div>
        <div className="text-center">
          <div className="font-medium text-white">{analysis2.map}</div>
          <div className="text-xs text-gray-500">
            {analysis2.score.team}-{analysis2.score.opponent}
          </div>
        </div>
      </div>

      {metrics.map((metric, i) => {
        const diff = metric.v2 - metric.v1;
        const improved = diff > 0;

        return (
          <div key={i} className="grid grid-cols-3 p-3 border-b border-gray-700/30 last:border-b-0">
            <div className="text-right pr-4">
              <span className="text-white">{metric.v1.toFixed(0)}{metric.suffix || ''}</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-500">{metric.label}</span>
              {diff !== 0 && (
                <span className={`ml-2 text-xs ${improved ? 'text-green-400' : 'text-red-400'}`}>
                  {improved ? '+' : ''}{diff.toFixed(0)}{metric.suffix || ''}
                </span>
              )}
            </div>
            <div className="text-left pl-4">
              <span className="text-white">{metric.v2.toFixed(0)}{metric.suffix || ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
