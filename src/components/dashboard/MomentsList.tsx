'use client';

import { useState, useMemo } from 'react';
import type {
  Moment,
  MomentType,
  MomentTag,
  MomentImportance,
  MomentFilter,
  MomentCollection,
} from '@/lib/analysis/moments';

// ============================================
// STYLES ET CONSTANTES
// ============================================

const MOMENT_TYPE_STYLES: Record<MomentType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  ace: { label: 'Ace', icon: '5K', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  clutch_win: { label: 'Clutch Win', icon: '1v', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  clutch_attempt: { label: 'Clutch Attempt', icon: '1v', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  multi_kill: { label: 'Multi-Kill', icon: 'MK', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  eco_win: { label: 'Eco Win', icon: '$', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  entry_kill: { label: 'Entry Kill', icon: 'FK', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  entry_death: { label: 'Entry Death', icon: 'FD', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  trade_kill: { label: 'Trade', icon: 'TR', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  failed_trade: { label: 'Failed Trade', icon: '!T', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  utility_play: { label: 'Utility Play', icon: 'UT', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  flash_assist: { label: 'Flash Assist', icon: 'FA', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' },
  smoke_kill: { label: 'Smoke Kill', icon: 'SK', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  wallbang: { label: 'Wallbang', icon: 'WB', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  noscope: { label: 'No Scope', icon: 'NS', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  jumping_kill: { label: 'Jumping Kill', icon: 'JK', color: 'text-sky-400', bgColor: 'bg-sky-500/20' },
  mistake_peek: { label: 'Bad Peek', icon: '!P', color: 'text-red-500', bgColor: 'bg-red-500/20' },
  mistake_position: { label: 'Bad Position', icon: '!X', color: 'text-red-500', bgColor: 'bg-red-500/20' },
  mistake_utility: { label: 'Wasted Utility', icon: '!U', color: 'text-red-500', bgColor: 'bg-red-500/20' },
  team_execute: { label: 'Team Execute', icon: 'EX', color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  round_mvp: { label: 'MVP', icon: 'M', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
};

const TAG_STYLES: Record<MomentTag, { label: string; color: string }> = {
  highlight: { label: 'Highlight', color: 'bg-purple-500/30 text-purple-300' },
  learning: { label: 'Learning', color: 'bg-blue-500/30 text-blue-300' },
  mistake: { label: 'Mistake', color: 'bg-red-500/30 text-red-300' },
  team: { label: 'Team', color: 'bg-teal-500/30 text-teal-300' },
  funny: { label: 'Funny', color: 'bg-pink-500/30 text-pink-300' },
  close_call: { label: 'Close Call', color: 'bg-orange-500/30 text-orange-300' },
};

const IMPORTANCE_STYLES: Record<MomentImportance, { label: string; border: string }> = {
  low: { label: 'Low', border: 'border-gray-600' },
  medium: { label: 'Medium', border: 'border-blue-500/50' },
  high: { label: 'High', border: 'border-orange-500/50' },
  epic: { label: 'Epic', border: 'border-purple-500 shadow-glow-sm' },
};

// ============================================
// COMPONENTS
// ============================================

interface MomentCardProps {
  moment: Moment;
  onClick?: (moment: Moment) => void;
  compact?: boolean;
}

function MomentCard({ moment, onClick, compact = false }: MomentCardProps) {
  const typeStyle = MOMENT_TYPE_STYLES[moment.type];
  const importanceStyle = IMPORTANCE_STYLES[moment.importance];

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(moment)}
        className={`
          flex items-center gap-3 p-3 rounded-lg cursor-pointer
          bg-gray-800/30 border ${importanceStyle.border}
          hover:bg-gray-800/50 transition-all
        `}
      >
        <div className={`w-10 h-10 rounded-lg ${typeStyle.bgColor} flex items-center justify-center`}>
          <span className={`text-sm font-bold ${typeStyle.color}`}>{typeStyle.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs ${typeStyle.color}`}>{typeStyle.label}</span>
            <span className="text-xs text-gray-500">R{moment.timing.round}</span>
          </div>
          <p className="text-sm text-white truncate">{moment.title}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-white">{moment.interestScore}</span>
          <span className="text-xs text-gray-500 block">score</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(moment)}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer
        bg-gradient-to-br from-gray-800/50 to-gray-900/50
        border ${importanceStyle.border}
        hover:shadow-card-hover transition-all duration-300
      `}
    >
      {/* Importance indicator for epic moments */}
      {moment.importance === 'epic' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${typeStyle.bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={`text-lg font-bold ${typeStyle.color}`}>{typeStyle.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${typeStyle.color}`}>{typeStyle.label}</span>
              <span className="text-xs text-gray-500">Round {moment.timing.round}</span>
              <span className="text-xs text-gray-600">|</span>
              <span className="text-xs text-gray-500">{moment.timing.duration.toFixed(1)}s</span>
            </div>
            <h4 className="text-white font-semibold">{moment.title}</h4>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{moment.description}</p>
          </div>

          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-bold text-white">{moment.interestScore}</div>
            <div className="text-xs text-gray-500">Interest</div>
          </div>
        </div>

        {/* Tags */}
        {moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {moment.tags.map((tag) => (
              <span
                key={tag}
                className={`px-2 py-0.5 rounded-full text-xs ${TAG_STYLES[tag].color}`}
              >
                {TAG_STYLES[tag].label}
              </span>
            ))}
          </div>
        )}

        {/* Context */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{moment.player.name}</span>
          <span>{moment.player.team}</span>
          <span>Score: {moment.context.score.ct}-{moment.context.score.t}</span>
          {moment.context.bombState && (
            <span className={moment.context.bombState === 'planted' ? 'text-red-400' : ''}>
              Bomb: {moment.context.bombState}
            </span>
          )}
        </div>

        {/* Lessons (for learning moments) */}
        {moment.lessons && moment.lessons.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <span className="text-xs font-medium text-blue-400 block mb-1">Lessons</span>
            <ul className="space-y-1">
              {moment.lessons.map((lesson, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400">-</span>
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clip info */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Tick: {moment.timing.startTick} - {moment.timing.endTick}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(moment.clipInfo.demoCommands.gotoTick);
            }}
            className="text-xs text-cs2-accent hover:text-cs2-accent-light transition-colors"
          >
            Copy tick command
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILTER COMPONENT
// ============================================

interface MomentsFilterProps {
  filter: MomentFilter;
  onFilterChange: (filter: MomentFilter) => void;
  stats: {
    total: number;
    byType: Record<MomentType, number>;
    byTag: Record<MomentTag, number>;
  };
}

function MomentsFilter({ filter, onFilterChange, stats }: MomentsFilterProps) {
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  const typeOptions: MomentType[] = [
    'ace', 'clutch_win', 'multi_kill', 'entry_kill', 'trade_kill',
    'noscope', 'wallbang', 'mistake_peek', 'mistake_position'
  ];

  const tagOptions: MomentTag[] = ['highlight', 'learning', 'mistake', 'team', 'funny'];

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {/* Type filter */}
      <div className="relative">
        <button
          onClick={() => setShowTypeFilter(!showTypeFilter)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white hover:border-gray-600 transition-colors flex items-center gap-2"
        >
          <span>Type</span>
          {filter.types && filter.types.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-cs2-accent text-xs">{filter.types.length}</span>
          )}
        </button>
        {showTypeFilter && (
          <div className="absolute top-full left-0 mt-2 p-3 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-10 min-w-[200px]">
            {typeOptions.map((type) => (
              <label key={type} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.types?.includes(type) || false}
                  onChange={(e) => {
                    const types = filter.types || [];
                    onFilterChange({
                      ...filter,
                      types: e.target.checked
                        ? [...types, type]
                        : types.filter((t) => t !== type),
                    });
                  }}
                  className="rounded border-gray-600 bg-gray-700 text-cs2-accent focus:ring-cs2-accent"
                />
                <span className={`text-sm ${MOMENT_TYPE_STYLES[type].color}`}>
                  {MOMENT_TYPE_STYLES[type].label}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  ({stats.byType[type] || 0})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tag filter */}
      <div className="relative">
        <button
          onClick={() => setShowTagFilter(!showTagFilter)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white hover:border-gray-600 transition-colors flex items-center gap-2"
        >
          <span>Tags</span>
          {filter.tags && filter.tags.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-cs2-accent text-xs">{filter.tags.length}</span>
          )}
        </button>
        {showTagFilter && (
          <div className="absolute top-full left-0 mt-2 p-3 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-10 min-w-[200px]">
            {tagOptions.map((tag) => (
              <label key={tag} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.tags?.includes(tag) || false}
                  onChange={(e) => {
                    const tags = filter.tags || [];
                    onFilterChange({
                      ...filter,
                      tags: e.target.checked
                        ? [...tags, tag]
                        : tags.filter((t) => t !== tag),
                    });
                  }}
                  className="rounded border-gray-600 bg-gray-700 text-cs2-accent focus:ring-cs2-accent"
                />
                <span className={`text-sm ${TAG_STYLES[tag].color.split(' ')[1]}`}>
                  {TAG_STYLES[tag].label}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  ({stats.byTag[tag] || 0})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Min importance */}
      <select
        value={filter.minImportance || ''}
        onChange={(e) => onFilterChange({
          ...filter,
          minImportance: e.target.value as MomentImportance || undefined,
        })}
        className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white hover:border-gray-600 transition-colors"
      >
        <option value="">All importance</option>
        <option value="medium">Medium+</option>
        <option value="high">High+</option>
        <option value="epic">Epic only</option>
      </select>

      {/* Min interest score */}
      <input
        type="number"
        placeholder="Min score"
        value={filter.minInterestScore || ''}
        onChange={(e) => onFilterChange({
          ...filter,
          minInterestScore: e.target.value ? Number(e.target.value) : undefined,
        })}
        className="w-24 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 hover:border-gray-600 transition-colors"
      />

      {/* Clear filters */}
      {(filter.types?.length || filter.tags?.length || filter.minImportance || filter.minInterestScore) && (
        <button
          onClick={() => onFilterChange({})}
          className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface MomentsListProps {
  collection: MomentCollection;
  onMomentClick?: (moment: Moment) => void;
  compact?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  maxMoments?: number;
  className?: string;
}

export function MomentsList({
  collection,
  onMomentClick,
  compact = false,
  showFilters = true,
  showStats = true,
  maxMoments,
  className = '',
}: MomentsListProps) {
  const [filter, setFilter] = useState<MomentFilter>({});
  const [sortBy, setSortBy] = useState<'interest' | 'round' | 'importance'>('interest');

  // Calculate stats
  const stats = useMemo(() => {
    const byType: Record<MomentType, number> = {} as Record<MomentType, number>;
    const byTag: Record<MomentTag, number> = {} as Record<MomentTag, number>;

    collection.moments.forEach((m) => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      m.tags.forEach((t) => {
        byTag[t] = (byTag[t] || 0) + 1;
      });
    });

    return {
      total: collection.moments.length,
      byType,
      byTag,
    };
  }, [collection.moments]);

  // Filter and sort moments
  const filteredMoments = useMemo(() => {
    let moments = [...collection.moments];

    // Apply filters
    if (filter.types && filter.types.length > 0) {
      moments = moments.filter((m) => filter.types!.includes(m.type));
    }
    if (filter.tags && filter.tags.length > 0) {
      moments = moments.filter((m) => m.tags.some((t) => filter.tags!.includes(t)));
    }
    if (filter.minImportance) {
      const importanceOrder: MomentImportance[] = ['low', 'medium', 'high', 'epic'];
      const minIndex = importanceOrder.indexOf(filter.minImportance);
      moments = moments.filter((m) => importanceOrder.indexOf(m.importance) >= minIndex);
    }
    if (filter.minInterestScore) {
      moments = moments.filter((m) => m.interestScore >= filter.minInterestScore!);
    }
    if (filter.round) {
      if (typeof filter.round === 'number') {
        moments = moments.filter((m) => m.timing.round === filter.round);
      } else {
        moments = moments.filter(
          (m) =>
            m.timing.round >= (filter.round as { min: number; max: number }).min &&
            m.timing.round <= (filter.round as { min: number; max: number }).max
        );
      }
    }

    // Sort
    switch (sortBy) {
      case 'interest':
        moments.sort((a, b) => b.interestScore - a.interestScore);
        break;
      case 'round':
        moments.sort((a, b) => a.timing.round - b.timing.round);
        break;
      case 'importance':
        const order: MomentImportance[] = ['epic', 'high', 'medium', 'low'];
        moments.sort((a, b) => order.indexOf(a.importance) - order.indexOf(b.importance));
        break;
    }

    // Limit
    if (maxMoments) {
      moments = moments.slice(0, maxMoments);
    }

    return moments;
  }, [collection.moments, filter, sortBy, maxMoments]);

  return (
    <div className={className}>
      {/* Stats summary */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gray-800/30">
            <div className="text-2xl font-bold text-white">{collection.stats.totalMoments}</div>
            <div className="text-xs text-gray-500">Total Moments</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10">
            <div className="text-2xl font-bold text-purple-400">{collection.stats.highlights}</div>
            <div className="text-xs text-gray-500">Highlights</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-400">
              {collection.stats.clutchWins}/{collection.stats.clutchAttempts}
            </div>
            <div className="text-xs text-gray-500">Clutches Won</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-red-400">{collection.stats.mistakes}</div>
            <div className="text-xs text-gray-500">Mistakes</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <MomentsFilter filter={filter} onFilterChange={setFilter} stats={stats} />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white"
            >
              <option value="interest">Interest Score</option>
              <option value="round">Round</option>
              <option value="importance">Importance</option>
            </select>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-3">
        Showing {filteredMoments.length} of {collection.moments.length} moments
      </div>

      {/* Moments list */}
      <div className={compact ? 'space-y-2' : 'space-y-4'}>
        {filteredMoments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No moments match your filters</p>
            <button
              onClick={() => setFilter({})}
              className="mt-2 text-sm text-cs2-accent hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredMoments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onClick={onMomentClick}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// TOP MOMENTS COMPONENT
// ============================================

interface TopMomentsProps {
  moments: Moment[];
  title?: string;
  onMomentClick?: (moment: Moment) => void;
  className?: string;
}

export function TopMoments({
  moments,
  title = 'Top Moments',
  onMomentClick,
  className = '',
}: TopMomentsProps) {
  return (
    <div className={`rounded-xl bg-gray-800/30 border border-gray-700/50 overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-700/50">
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-gray-700/30">
        {moments.slice(0, 5).map((moment, index) => {
          const typeStyle = MOMENT_TYPE_STYLES[moment.type];
          return (
            <div
              key={moment.id}
              onClick={() => onMomentClick?.(moment)}
              className="flex items-center gap-3 p-3 hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
                #{index + 1}
              </div>
              <div className={`w-10 h-10 rounded-lg ${typeStyle.bgColor} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${typeStyle.color}`}>{typeStyle.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{moment.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{typeStyle.label}</span>
                  <span>-</span>
                  <span>R{moment.timing.round}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-cs2-accent">{moment.interestScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// MOMENT TIMELINE COMPONENT
// ============================================

interface MomentTimelineProps {
  moments: Moment[];
  totalRounds: number;
  onMomentClick?: (moment: Moment) => void;
  className?: string;
}

export function MomentTimeline({
  moments,
  totalRounds,
  onMomentClick,
  className = '',
}: MomentTimelineProps) {
  // Group moments by round
  const momentsByRound = useMemo(() => {
    const grouped: Record<number, Moment[]> = {};
    moments.forEach((m) => {
      if (!grouped[m.timing.round]) {
        grouped[m.timing.round] = [];
      }
      grouped[m.timing.round].push(m);
    });
    return grouped;
  }, [moments]);

  return (
    <div className={`rounded-xl bg-gray-800/30 border border-gray-700/50 p-4 ${className}`}>
      <h3 className="font-semibold text-white mb-4">Match Timeline</h3>

      <div className="relative">
        {/* Timeline bar */}
        <div className="h-2 bg-gray-700 rounded-full mb-4" />

        {/* Round markers */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>R1</span>
          <span>R{Math.ceil(totalRounds / 2)}</span>
          <span>R{totalRounds}</span>
        </div>

        {/* Moments on timeline */}
        <div className="relative h-16">
          {Object.entries(momentsByRound).map(([round, roundMoments]) => {
            const position = ((Number(round) - 1) / (totalRounds - 1)) * 100;
            const topMoment = roundMoments.sort((a, b) => b.interestScore - a.interestScore)[0];
            const typeStyle = MOMENT_TYPE_STYLES[topMoment.type];

            return (
              <div
                key={round}
                className="absolute transform -translate-x-1/2 cursor-pointer group"
                style={{ left: `${position}%` }}
                onClick={() => onMomentClick?.(topMoment)}
              >
                <div className={`w-6 h-6 rounded-full ${typeStyle.bgColor} flex items-center justify-center border-2 border-gray-800 transition-transform group-hover:scale-125`}>
                  <span className={`text-xs font-bold ${typeStyle.color}`}>
                    {roundMoments.length > 1 ? roundMoments.length : typeStyle.icon.charAt(0)}
                  </span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="px-2 py-1 rounded bg-gray-900 text-xs text-white whitespace-nowrap">
                    R{round}: {topMoment.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
