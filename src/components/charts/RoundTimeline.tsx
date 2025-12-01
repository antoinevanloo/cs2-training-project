'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Crosshair,
  Skull,
  Bomb,
  Shield,
  Flame,
  Wind,
  Sparkles,
  Clock,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Types
export type EventType =
  | 'kill'
  | 'death'
  | 'assist'
  | 'plant'
  | 'defuse'
  | 'flash'
  | 'smoke'
  | 'molotov'
  | 'heGrenade'
  | 'damage'
  | 'trade';

export type RoundPhase = 'freeze' | 'buy' | 'setup' | 'execute' | 'postPlant' | 'end';

export interface RoundEvent {
  id: string;
  type: EventType;
  tick: number;
  timeInRound: number; // Seconds depuis début du round
  player: string;
  playerTeam: 'CT' | 'T';
  target?: string;
  targetTeam?: 'CT' | 'T';
  weapon?: string;
  isHeadshot?: boolean;
  isWallbang?: boolean;
  isNoScope?: boolean;
  isFlashed?: boolean;
  damage?: number;
  flashDuration?: number;
  position?: { x: number; y: number; z: number };
  phase: RoundPhase;
}

export interface RoundData {
  roundNumber: number;
  duration: number; // Durée totale en secondes
  winner: 'CT' | 'T';
  winCondition: 'elimination' | 'bomb_exploded' | 'bomb_defused' | 'time_out';
  events: RoundEvent[];
  ctAlive: number[];  // Nombre de CT vivants à chaque seconde
  tAlive: number[];   // Nombre de T vivants à chaque seconde
  bombPlantTime?: number;
  bombDefuseTime?: number;
  score: { ct: number; t: number };
}

interface RoundTimelineProps {
  round: RoundData;
  playerSteamId?: string;
  playerName?: string;
  variant?: 'full' | 'compact' | 'mini';
  autoPlay?: boolean;
  playbackSpeed?: number;
  showPhases?: boolean;
  showAliveCount?: boolean;
  showEventDetails?: boolean;
  onEventClick?: (event: RoundEvent) => void;
  onTimeChange?: (time: number) => void;
  className?: string;
}

// Constantes
const PHASE_COLORS: Record<RoundPhase, { bg: string; border: string; label: string }> = {
  freeze: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Freeze' },
  buy: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Buy' },
  setup: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Setup' },
  execute: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Execute' },
  postPlant: { bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Post-Plant' },
  end: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'End' },
};

const EVENT_ICONS: Record<EventType, typeof Crosshair> = {
  kill: Crosshair,
  death: Skull,
  assist: Users,
  plant: Bomb,
  defuse: Shield,
  flash: Sparkles,
  smoke: Wind,
  molotov: Flame,
  heGrenade: Zap,
  damage: Zap,
  trade: Crosshair,
};

const EVENT_COLORS: Record<EventType, string> = {
  kill: '#22c55e',
  death: '#ef4444',
  assist: '#a855f7',
  plant: '#f97316',
  defuse: '#3b82f6',
  flash: '#fbbf24',
  smoke: '#9ca3af',
  molotov: '#f97316',
  heGrenade: '#ef4444',
  damage: '#f97316',
  trade: '#06b6d4',
};

const TEAM_COLORS = {
  CT: '#60a5fa',
  T: '#fbbf24',
};

// Formatage du temps
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Composant Event Marker
function EventMarker({
  event,
  position,
  isHighlighted,
  onClick,
  showDetails,
}: {
  event: RoundEvent;
  position: number;
  isHighlighted: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}) {
  const Icon = EVENT_ICONS[event.type];
  const color = EVENT_COLORS[event.type];
  const isPlayerEvent = event.playerTeam === 'CT' || event.playerTeam === 'T';

  return (
    <div
      className={cn(
        'absolute transform -translate-x-1/2 cursor-pointer transition-all duration-200',
        isHighlighted ? 'scale-125 z-20' : 'scale-100 z-10',
        event.playerTeam === 'CT' ? '-top-8' : 'top-4'
      )}
      style={{ left: `${position}%` }}
      onClick={onClick}
    >
      {/* Marker */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          'border-2 transition-all duration-200',
          isHighlighted ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''
        )}
        style={{
          backgroundColor: `${color}30`,
          borderColor: color,
          '--tw-ring-color': color,
        } as React.CSSProperties}
      >
        <Icon className="w-3 h-3" style={{ color }} />
      </div>

      {/* Line connecting to timeline */}
      <div
        className={cn(
          'absolute left-1/2 w-px -translate-x-1/2',
          event.playerTeam === 'CT' ? 'top-6 h-2' : 'bottom-6 h-2'
        )}
        style={{ backgroundColor: color }}
      />

      {/* Tooltip */}
      {isHighlighted && showDetails && (
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 px-2 py-1',
            'bg-gray-800 border border-gray-700 rounded text-xs',
            'whitespace-nowrap shadow-lg z-30',
            event.playerTeam === 'CT' ? '-top-16' : 'top-12'
          )}
        >
          <div className="font-medium text-white">
            {event.player}
            {event.target && (
              <span className="text-gray-400"> {event.type === 'kill' ? 'killed' : 'on'} {event.target}</span>
            )}
          </div>
          <div className="text-gray-500">{formatTime(event.timeInRound)}</div>
          {event.weapon && (
            <div className="text-gray-400">{event.weapon}</div>
          )}
          {event.isHeadshot && <span className="text-yellow-400 ml-1">HS</span>}
        </div>
      )}
    </div>
  );
}

// Composant Phase Bar
function PhaseBar({ round, width }: { round: RoundData; width: number }) {
  const phases = useMemo(() => {
    const result: { phase: RoundPhase; start: number; end: number }[] = [];
    let currentPhase: RoundPhase = 'freeze';
    let phaseStart = 0;

    // Freeze time (15 seconds standard)
    result.push({ phase: 'freeze', start: 0, end: 15 });

    // Setup phase (jusqu'à plant ou premier contact majeur)
    const plantTime = round.bombPlantTime || round.duration;
    const firstKillTime = round.events.find(e => e.type === 'kill')?.timeInRound || plantTime;
    const setupEnd = Math.min(plantTime, firstKillTime, 45);
    result.push({ phase: 'setup', start: 15, end: setupEnd });

    // Execute phase (après setup, avant ou pendant plant)
    if (setupEnd < plantTime) {
      result.push({ phase: 'execute', start: setupEnd, end: plantTime });
    }

    // Post-plant phase
    if (round.bombPlantTime) {
      result.push({ phase: 'postPlant', start: round.bombPlantTime, end: round.duration });
    } else if (setupEnd < round.duration) {
      result.push({ phase: 'execute', start: setupEnd, end: round.duration });
    }

    return result;
  }, [round]);

  return (
    <div className="absolute inset-x-0 top-0 h-full flex">
      {phases.map((p, i) => {
        const startPercent = (p.start / round.duration) * 100;
        const widthPercent = ((p.end - p.start) / round.duration) * 100;
        const config = PHASE_COLORS[p.phase];

        return (
          <div
            key={i}
            className={cn('h-full border-r', config.bg, config.border)}
            style={{
              position: 'absolute',
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            }}
          >
            <span className="absolute top-1 left-1 text-[10px] text-gray-500 opacity-50">
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Composant Alive Count
function AliveCountGraph({ round, currentTime }: { round: RoundData; currentTime: number }) {
  const height = 40;
  const width = 100;

  // Générer les points pour les deux équipes
  const generatePath = (aliveData: number[], color: string) => {
    if (!aliveData || aliveData.length === 0) return null;

    const points = aliveData.map((alive, i) => {
      const x = (i / round.duration) * width;
      const y = height - (alive / 5) * height;
      return `${x},${y}`;
    }).join(' L ');

    return `M ${points}`;
  };

  const ctPath = generatePath(round.ctAlive, TEAM_COLORS.CT);
  const tPath = generatePath(round.tAlive, TEAM_COLORS.T);

  const currentPosition = (currentTime / round.duration) * width;

  return (
    <div className="h-10 bg-gray-800/30 rounded overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={0}
            y1={height - (i / 5) * height}
            x2={width}
            y2={height - (i / 5) * height}
            stroke="#374151"
            strokeDasharray="2 2"
          />
        ))}

        {/* CT Line */}
        {ctPath && (
          <path
            d={ctPath}
            fill="none"
            stroke={TEAM_COLORS.CT}
            strokeWidth="2"
          />
        )}

        {/* T Line */}
        {tPath && (
          <path
            d={tPath}
            fill="none"
            stroke={TEAM_COLORS.T}
            strokeWidth="2"
          />
        )}

        {/* Current time indicator */}
        <line
          x1={currentPosition}
          y1={0}
          x2={currentPosition}
          y2={height}
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>

      {/* Labels */}
      <div className="absolute top-0 left-1 flex items-center gap-2 text-[10px]">
        <span style={{ color: TEAM_COLORS.CT }}>CT</span>
        <span style={{ color: TEAM_COLORS.T }}>T</span>
      </div>
    </div>
  );
}

// Composant Event List
function EventList({
  events,
  currentTime,
  onEventClick,
}: {
  events: RoundEvent[];
  currentTime: number;
  onEventClick?: (event: RoundEvent) => void;
}) {
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {events.map((event) => {
        const Icon = EVENT_ICONS[event.type];
        const color = EVENT_COLORS[event.type];
        const isPast = event.timeInRound <= currentTime;

        return (
          <div
            key={event.id}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all',
              'hover:bg-gray-700/50',
              isPast ? 'opacity-100' : 'opacity-40'
            )}
            onClick={() => onEventClick?.(event)}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}30` }}
            >
              <Icon className="w-3 h-3" style={{ color }} />
            </div>
            <span className="text-gray-500 text-xs w-10 flex-shrink-0">
              {formatTime(event.timeInRound)}
            </span>
            <span
              className="text-sm flex-grow truncate"
              style={{ color: TEAM_COLORS[event.playerTeam] }}
            >
              {event.player}
            </span>
            {event.target && (
              <>
                <span className="text-gray-600">→</span>
                <span
                  className="text-sm truncate"
                  style={{ color: event.targetTeam ? TEAM_COLORS[event.targetTeam] : '#9ca3af' }}
                >
                  {event.target}
                </span>
              </>
            )}
            {event.isHeadshot && <span className="text-yellow-400 text-xs">HS</span>}
          </div>
        );
      })}
    </div>
  );
}

// Composant Mini
function MiniTimeline({ round, events }: { round: RoundData; events: RoundEvent[] }) {
  return (
    <div className="h-8 bg-gray-800/30 rounded relative">
      {/* Phase colors */}
      <PhaseBar round={round} width={100} />

      {/* Event dots */}
      {events.slice(0, 10).map((event) => {
        const position = (event.timeInRound / round.duration) * 100;
        const color = EVENT_COLORS[event.type];

        return (
          <div
            key={event.id}
            className="absolute top-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${position}%`,
              backgroundColor: color,
            }}
          />
        );
      })}

      {/* Score */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
        <span style={{ color: TEAM_COLORS.CT }}>{round.score.ct}</span>
        <span className="text-gray-500 mx-1">-</span>
        <span style={{ color: TEAM_COLORS.T }}>{round.score.t}</span>
      </div>
    </div>
  );
}

// Composant Compact
function CompactTimeline({
  round,
  events,
  onEventClick,
}: {
  round: RoundData;
  events: RoundEvent[];
  onEventClick?: (event: RoundEvent) => void;
}) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Round {round.roundNumber}</span>
        <div className="flex items-center gap-2">
          <span style={{ color: TEAM_COLORS.CT }}>{round.score.ct}</span>
          <span className="text-gray-500">-</span>
          <span style={{ color: TEAM_COLORS.T }}>{round.score.t}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative h-16 bg-gray-800/30 rounded">
        <PhaseBar round={round} width={100} />

        {/* Timeline bar */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-700 rounded" />

        {/* Events */}
        {events.map((event) => {
          const position = (event.timeInRound / round.duration) * 100;

          return (
            <EventMarker
              key={event.id}
              event={event}
              position={position}
              isHighlighted={hoveredEvent === event.id}
              onClick={() => {
                setHoveredEvent(event.id);
                onEventClick?.(event);
              }}
              showDetails={hoveredEvent === event.id}
            />
          );
        })}
      </div>

      {/* Time markers */}
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>0:00</span>
        <span>{formatTime(round.duration / 2)}</span>
        <span>{formatTime(round.duration)}</span>
      </div>
    </div>
  );
}

// Composant Principal
export function RoundTimeline({
  round,
  playerSteamId,
  playerName,
  variant = 'full',
  autoPlay = false,
  playbackSpeed = 1,
  showPhases = true,
  showAliveCount = true,
  showEventDetails = true,
  onEventClick,
  onTimeChange,
  className,
}: RoundTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Filtrer les événements du joueur si spécifié
  const filteredEvents = useMemo(() => {
    if (!playerName) return round.events;
    return round.events.filter(
      e => e.player === playerName || e.target === playerName
    );
  }, [round.events, playerName]);

  // Playback effect
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000 * playbackSpeed;
      lastTimeRef.current = timestamp;

      setCurrentTime(prev => {
        const newTime = prev + delta;
        if (newTime >= round.duration) {
          setIsPlaying(false);
          return round.duration;
        }
        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, round.duration]);

  // Sync time change callback
  useEffect(() => {
    onTimeChange?.(currentTime);
  }, [currentTime, onTimeChange]);

  // Reset last time when play state changes
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
    }
  }, [isPlaying]);

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * round.duration;

    setCurrentTime(Math.max(0, Math.min(newTime, round.duration)));
  };

  // Controls
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleSkipBack = () => setCurrentTime(0);
  const handleSkipForward = () => setCurrentTime(round.duration);

  // Mini variant
  if (variant === 'mini') {
    return <MiniTimeline round={round} events={filteredEvents} />;
  }

  // Compact variant
  if (variant === 'compact') {
    return <CompactTimeline round={round} events={filteredEvents} onEventClick={onEventClick} />;
  }

  // Full variant
  return (
    <div className={cn('bg-gray-900/50 rounded-lg border border-gray-800', className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-white">
            Round {round.roundNumber} - Timeline
          </h3>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              round.winner === 'CT' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
            )}
          >
            {round.winner} Win
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: TEAM_COLORS.CT }}>{round.score.ct}</span>
            <span className="text-gray-500">-</span>
            <span style={{ color: TEAM_COLORS.T }}>{round.score.t}</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              className="p-2 rounded hover:bg-gray-700 transition-colors"
              onClick={handleSkipBack}
            >
              <SkipBack className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            <button
              className="p-2 rounded hover:bg-gray-700 transition-colors"
              onClick={handleSkipForward}
            >
              <SkipForward className="w-4 h-4 text-gray-400" />
            </button>
            <span className="ml-4 text-sm text-gray-400 font-mono">
              {formatTime(currentTime)} / {formatTime(round.duration)}
            </span>
          </div>

          {/* Alive count graph */}
          {showAliveCount && round.ctAlive && round.tAlive && (
            <div className="relative">
              <AliveCountGraph round={round} currentTime={currentTime} />
            </div>
          )}

          {/* Main timeline */}
          <div className="relative">
            <div
              ref={timelineRef}
              className="relative h-20 bg-gray-800/30 rounded cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Phase backgrounds */}
              {showPhases && <PhaseBar round={round} width={100} />}

              {/* Timeline bar */}
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-700 rounded" />

              {/* Progress bar */}
              <div
                className="absolute left-0 top-1/2 h-1 bg-blue-500 rounded"
                style={{ width: `${(currentTime / round.duration) * 100}%` }}
              />

              {/* Bomb plant marker */}
              {round.bombPlantTime && (
                <div
                  className="absolute top-1/2 w-1 h-4 bg-orange-500 rounded transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(round.bombPlantTime / round.duration) * 100}%` }}
                >
                  <Bomb className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 text-orange-500" />
                </div>
              )}

              {/* Event markers */}
              {filteredEvents.map((event) => {
                const position = (event.timeInRound / round.duration) * 100;

                return (
                  <EventMarker
                    key={event.id}
                    event={event}
                    position={position}
                    isHighlighted={hoveredEvent === event.id || event.timeInRound <= currentTime && event.timeInRound > currentTime - 1}
                    onClick={() => {
                      setHoveredEvent(event.id);
                      setCurrentTime(event.timeInRound);
                      onEventClick?.(event);
                    }}
                    showDetails={showEventDetails && hoveredEvent === event.id}
                  />
                );
              })}

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/80 transform -translate-x-1/2 pointer-events-none"
                style={{ left: `${(currentTime / round.duration) * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0:00</span>
              <span>{formatTime(round.duration / 4)}</span>
              <span>{formatTime(round.duration / 2)}</span>
              <span>{formatTime((round.duration * 3) / 4)}</span>
              <span>{formatTime(round.duration)}</span>
            </div>
          </div>

          {/* Event list */}
          {showEventDetails && (
            <div className="border-t border-gray-800 pt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Events</h4>
              <EventList
                events={filteredEvents}
                currentTime={currentTime}
                onEventClick={(event) => {
                  setCurrentTime(event.timeInRound);
                  onEventClick?.(event);
                }}
              />
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs border-t border-gray-800 pt-4">
            {Object.entries(EVENT_ICONS).slice(0, 6).map(([type, Icon]) => (
              <div key={type} className="flex items-center gap-1">
                <Icon className="w-3 h-3" style={{ color: EVENT_COLORS[type as EventType] }} />
                <span className="text-gray-500 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export types
export type { RoundTimelineProps };
