import { KillEvent, PositionSnapshot, Position3D } from '@/lib/demo-parser/types';
import { PositioningAnalysis } from '../types';

// Map zone definitions for common competitive maps
const MAP_ZONES: Record<string, { name: string; bounds: { minX: number; maxX: number; minY: number; maxY: number } }[]> = {
  de_dust2: [
    { name: 'A Site', bounds: { minX: 1200, maxX: 1800, minY: 2400, maxY: 3000 } },
    { name: 'B Site', bounds: { minX: -1600, maxX: -1000, minY: 2400, maxY: 2900 } },
    { name: 'Mid', bounds: { minX: -400, maxX: 200, minY: 1600, maxY: 2400 } },
    { name: 'Long A', bounds: { minX: 1000, maxX: 1600, minY: 800, maxY: 1600 } },
    { name: 'Short A', bounds: { minX: 400, maxX: 1200, minY: 2000, maxY: 2600 } },
    { name: 'Tunnels', bounds: { minX: -1800, maxX: -800, minY: 1000, maxY: 1800 } },
  ],
  de_mirage: [
    { name: 'A Site', bounds: { minX: -800, maxX: 400, minY: -2000, maxY: -1200 } },
    { name: 'B Site', bounds: { minX: -2400, maxX: -1600, minY: -400, maxY: 400 } },
    { name: 'Mid', bounds: { minX: -800, maxX: 0, minY: -800, maxY: 200 } },
    { name: 'Palace', bounds: { minX: 400, maxX: 1200, minY: -1800, maxY: -1200 } },
    { name: 'Apartments', bounds: { minX: -2800, maxX: -2000, minY: -800, maxY: 0 } },
  ],
  de_inferno: [
    { name: 'A Site', bounds: { minX: 1800, maxX: 2600, minY: 400, maxY: 1200 } },
    { name: 'B Site', bounds: { minX: 200, maxX: 1000, minY: 2800, maxY: 3600 } },
    { name: 'Mid', bounds: { minX: 400, maxX: 1200, minY: 1200, maxY: 2000 } },
    { name: 'Banana', bounds: { minX: 200, maxX: 600, minY: 2000, maxY: 2800 } },
    { name: 'Apartments', bounds: { minX: 1800, maxX: 2600, minY: -400, maxY: 400 } },
  ],
  de_nuke: [
    { name: 'A Site', bounds: { minX: -600, maxX: 200, minY: -800, maxY: 0 } },
    { name: 'B Site', bounds: { minX: -600, maxX: 200, minY: -800, maxY: 0 } }, // Below A
    { name: 'Outside', bounds: { minX: 600, maxX: 1800, minY: -1200, maxY: 400 } },
    { name: 'Ramp', bounds: { minX: -200, maxX: 600, minY: 400, maxY: 1200 } },
  ],
  de_ancient: [
    { name: 'A Site', bounds: { minX: -1400, maxX: -600, minY: -1600, maxY: -800 } },
    { name: 'B Site', bounds: { minX: 400, maxX: 1200, minY: -1000, maxY: -200 } },
    { name: 'Mid', bounds: { minX: -400, maxX: 400, minY: -800, maxY: 0 } },
  ],
  de_anubis: [
    { name: 'A Site', bounds: { minX: -1200, maxX: -400, minY: 800, maxY: 1600 } },
    { name: 'B Site', bounds: { minX: 800, maxX: 1600, minY: 400, maxY: 1200 } },
    { name: 'Mid', bounds: { minX: -400, maxX: 400, minY: 0, maxY: 800 } },
  ],
};

interface DeathCluster {
  x: number;
  y: number;
  count: number;
  isBadPosition: boolean;
  zone: string;
  deathTypes: {
    throughSmoke: number;
    wallbang: number;
    blindKiller: number;
    normal: number;
  };
}

interface RotationData {
  rotations: number;
  avgSpeed: number;
  fastRotations: number;
  slowRotations: number;
  avgDistance: number;
}

interface TradeAnalysis {
  tradedDeaths: number;
  untradedDeaths: number;
  tradeTime: number[];
}

interface PositionQuality {
  exposedDeaths: number;
  coveredDeaths: number;
  advantageousKills: number;
  disadvantageousKills: number;
}

export class PositioningAnalyzer {
  analyze(
    deaths: KillEvent[],
    positions: PositionSnapshot[],
    mapName: string,
    playerSteamId: string
  ): PositioningAnalysis {
    // Normalize map name
    const normalizedMap = mapName.toLowerCase().replace('workshop/', '').split('/').pop() || mapName;

    // Analyze death positions with clustering
    const deathClusters = this.clusterDeathPositions(deaths, normalizedMap, playerSteamId);

    // Identify positioning mistakes
    const commonMistakes = this.identifyMistakes(deaths, deathClusters, playerSteamId);

    // Calculate map control score using positions
    const mapControlScore = this.calculateMapControlScore(positions, playerSteamId, normalizedMap);

    // Analyze rotations in detail
    const rotationAnalysis = this.analyzeRotations(positions, playerSteamId);

    // Analyze trade situations
    const tradeAnalysis = this.analyzeTradeability(deaths, playerSteamId);

    // Analyze position quality
    const positionQuality = this.analyzePositionQuality(deaths, playerSteamId);

    // Calculate overall positioning score
    const positioningScore = this.calculateOverallScore(
      deathClusters,
      mapControlScore,
      commonMistakes.length,
      tradeAnalysis,
      positionQuality
    );

    // Collect individual death positions for heatmap
    const playerDeaths = deaths.filter(d => d.victimSteamId === playerSteamId);
    const individualDeaths = playerDeaths.map(death => {
      // Check if this death was traded
      const wasTraded = deaths.some(
        d => d.victimSteamId === death.attackerSteamId &&
             d.round === death.round &&
             d.tick > death.tick &&
             d.tick < death.tick + 384 // Within 3 seconds
      );

      return {
        x: death.victimPosition.x,
        y: death.victimPosition.y,
        round: death.round,
        weapon: death.weapon,
        wasTraded,
        wasBlind: death.attackerBlind,
      };
    });

    return {
      mapControl: {
        score: mapControlScore,
        avgAreaControlled: this.calculateAreaControlled(positions, playerSteamId, normalizedMap),
      },
      rotationSpeed: {
        average: rotationAnalysis.avgSpeed,
        optimal: 3.5,
      },
      deathPositions: deathClusters.map(cluster => ({
        x: cluster.x,
        y: cluster.y,
        count: cluster.count,
        isBadPosition: cluster.isBadPosition,
      })),
      individualDeaths,
      commonMistakes,
      metrics: {
        mapControl: mapControlScore,
        positioning: positioningScore,
        rotations: Math.min(100, rotationAnalysis.avgSpeed > 0 ? 70 + (rotationAnalysis.fastRotations / Math.max(1, rotationAnalysis.rotations)) * 30 : 60),
        deathQuality: Math.max(0, 100 - deathClusters.filter((d) => d.isBadPosition).length * 10),
        // Additional metrics
        tradeability: tradeAnalysis.tradedDeaths + tradeAnalysis.untradedDeaths > 0
          ? (tradeAnalysis.tradedDeaths / (tradeAnalysis.tradedDeaths + tradeAnalysis.untradedDeaths)) * 100
          : 50,
        avgRotationSpeed: rotationAnalysis.avgSpeed,
        avgRotationDistance: rotationAnalysis.avgDistance,
        exposedDeathRate: positionQuality.exposedDeaths + positionQuality.coveredDeaths > 0
          ? (positionQuality.exposedDeaths / (positionQuality.exposedDeaths + positionQuality.coveredDeaths)) * 100
          : 50,
      },
    };
  }

  private clusterDeathPositions(
    deaths: KillEvent[],
    mapName: string,
    playerSteamId: string
  ): DeathCluster[] {
    const playerDeaths = deaths.filter(d => d.victimSteamId === playerSteamId);
    const zones = MAP_ZONES[mapName] || [];

    // Group deaths by approximate position (grid of 150 units)
    const positionMap: Record<string, DeathCluster> = {};

    for (const death of playerDeaths) {
      const { x, y } = death.victimPosition;
      const gridX = Math.round(x / 150) * 150;
      const gridY = Math.round(y / 150) * 150;
      const key = `${gridX},${gridY}`;

      if (!positionMap[key]) {
        const zone = this.getZoneName({ x: gridX, y: gridY, z: 0 }, zones);
        positionMap[key] = {
          x: gridX,
          y: gridY,
          count: 0,
          isBadPosition: false,
          zone,
          deathTypes: { throughSmoke: 0, wallbang: 0, blindKiller: 0, normal: 0 },
        };
      }

      positionMap[key].count++;

      // Categorize death type
      if (death.throughSmoke) {
        positionMap[key].deathTypes.throughSmoke++;
      } else if (death.penetrated) {
        positionMap[key].deathTypes.wallbang++;
      } else if (death.attackerBlind) {
        positionMap[key].deathTypes.blindKiller++;
      } else {
        positionMap[key].deathTypes.normal++;
      }
    }

    // Mark bad positions based on criteria
    return Object.values(positionMap).map((cluster) => {
      // Bad position if: died 3+ times OR high rate of smoke/wallbang deaths
      const totalSpecialDeaths = cluster.deathTypes.throughSmoke + cluster.deathTypes.wallbang;
      const specialDeathRate = cluster.count > 0 ? totalSpecialDeaths / cluster.count : 0;

      cluster.isBadPosition = cluster.count >= 3 || specialDeathRate > 0.5;
      return cluster;
    });
  }

  private getZoneName(
    position: Position3D,
    zones: { name: string; bounds: { minX: number; maxX: number; minY: number; maxY: number } }[]
  ): string {
    for (const zone of zones) {
      if (
        position.x >= zone.bounds.minX &&
        position.x <= zone.bounds.maxX &&
        position.y >= zone.bounds.minY &&
        position.y <= zone.bounds.maxY
      ) {
        return zone.name;
      }
    }
    return 'Unknown';
  }

  private identifyMistakes(
    deaths: KillEvent[],
    deathClusters: DeathCluster[],
    playerSteamId: string
  ): string[] {
    const playerDeaths = deaths.filter(d => d.victimSteamId === playerSteamId);
    const mistakes: string[] = [];

    // Check for repeated death positions
    const badPositions = deathClusters.filter((p) => p.isBadPosition);
    if (badPositions.length > 0) {
      mistakes.push('repeated_death_positions');

      // Add specific zone info
      const zones = [...new Set(badPositions.map(p => p.zone).filter(z => z !== 'Unknown'))];
      if (zones.length > 0) {
        mistakes.push(`bad_positions_in_${zones.join('_')}`);
      }
    }

    // Check for through-smoke deaths (overpeek indicator)
    const smokeDeaths = playerDeaths.filter((d) => d.throughSmoke);
    if (smokeDeaths.length > playerDeaths.length * 0.2) {
      mistakes.push('dying_through_smoke');
    }

    // Check for wallbang deaths (predictable positions)
    const wallbangDeaths = playerDeaths.filter((d) => d.penetrated);
    if (wallbangDeaths.length > playerDeaths.length * 0.15) {
      mistakes.push('predictable_positions');
    }

    // Check for blind deaths (bad timing/positioning)
    const blindDeaths = playerDeaths.filter((d) => d.attackerBlind);
    if (blindDeaths.length > 0) {
      mistakes.push('dying_to_blind_players');
    }

    // Check for clustered deaths in same zone
    const deathsByZone: Record<string, number> = {};
    for (const cluster of deathClusters) {
      if (cluster.zone !== 'Unknown') {
        deathsByZone[cluster.zone] = (deathsByZone[cluster.zone] || 0) + cluster.count;
      }
    }

    // If more than 40% of deaths in one zone, might indicate predictability
    const totalDeaths = playerDeaths.length;
    for (const [zone, count] of Object.entries(deathsByZone)) {
      if (count > totalDeaths * 0.4 && totalDeaths >= 5) {
        mistakes.push(`predictable_in_${zone.toLowerCase().replace(' ', '_')}`);
      }
    }

    return mistakes;
  }

  private calculateMapControlScore(
    positions: PositionSnapshot[],
    playerSteamId: string,
    mapName: string
  ): number {
    if (positions.length === 0) return 60;

    const zones = MAP_ZONES[mapName] || [];
    const playerPositions = positions
      .map((p) => p.players.find((pl) => pl.steamId === playerSteamId))
      .filter((p) => p !== undefined);

    if (playerPositions.length < 10) return 60;

    // Calculate zone coverage
    const visitedZones = new Set<string>();
    for (const pos of playerPositions) {
      const zone = this.getZoneName({ x: pos!.x, y: pos!.y, z: pos!.z }, zones);
      if (zone !== 'Unknown') {
        visitedZones.add(zone);
      }
    }

    // Zone diversity score
    const zoneDiversityScore = zones.length > 0
      ? (visitedZones.size / zones.length) * 40
      : 20;

    // Position variance score
    const xPositions = playerPositions.map((p) => p!.x);
    const yPositions = playerPositions.map((p) => p!.y);
    const xVariance = this.calculateVariance(xPositions);
    const yVariance = this.calculateVariance(yPositions);
    const totalVariance = Math.sqrt(xVariance + yVariance);
    const varianceScore = Math.min(40, (totalVariance / 1500) * 40);

    // Aggression score (how far forward on average)
    const aggressionScore = this.calculateAggressionScore(playerPositions, mapName);

    return Math.round(Math.min(100, zoneDiversityScore + varianceScore + aggressionScore));
  }

  private calculateAreaControlled(
    positions: PositionSnapshot[],
    playerSteamId: string,
    mapName: string
  ): number {
    const zones = MAP_ZONES[mapName] || [];
    if (zones.length === 0) return 0.35;

    const playerPositions = positions
      .map((p) => p.players.find((pl) => pl.steamId === playerSteamId))
      .filter((p) => p !== undefined);

    const visitedZones = new Set<string>();
    for (const pos of playerPositions) {
      const zone = this.getZoneName({ x: pos!.x, y: pos!.y, z: pos!.z }, zones);
      if (zone !== 'Unknown') {
        visitedZones.add(zone);
      }
    }

    return zones.length > 0 ? visitedZones.size / zones.length : 0.35;
  }

  private analyzeRotations(
    positions: PositionSnapshot[],
    playerSteamId: string
  ): RotationData {
    const data: RotationData = {
      rotations: 0,
      avgSpeed: 0,
      fastRotations: 0,
      slowRotations: 0,
      avgDistance: 0,
    };

    if (positions.length < 20) return data;

    const playerPositions = positions
      .map((p, index) => ({
        tick: p.tick,
        pos: p.players.find((pl) => pl.steamId === playerSteamId),
        index,
      }))
      .filter((p) => p.pos !== undefined)
      .sort((a, b) => a.tick - b.tick);

    if (playerPositions.length < 10) return data;

    const speeds: number[] = [];
    const distances: number[] = [];
    let rotationCount = 0;

    // Detect significant movements (>500 units in short time)
    for (let i = 1; i < playerPositions.length; i++) {
      const prev = playerPositions[i - 1];
      const curr = playerPositions[i];

      const dx = curr.pos!.x - prev.pos!.x;
      const dy = curr.pos!.y - prev.pos!.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const tickDiff = curr.tick - prev.tick;

      if (tickDiff > 0 && distance > 100) {
        const speed = distance / (tickDiff / 128); // units per second

        if (distance > 500) {
          rotationCount++;
          distances.push(distance);
          speeds.push(speed);

          if (speed > 250) {
            data.fastRotations++;
          } else if (speed < 150) {
            data.slowRotations++;
          }
        }
      }
    }

    data.rotations = rotationCount;
    data.avgSpeed = speeds.length > 0
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length
      : 200;
    data.avgDistance = distances.length > 0
      ? distances.reduce((a, b) => a + b, 0) / distances.length
      : 0;

    return data;
  }

  private analyzeTradeability(deaths: KillEvent[], playerSteamId: string): TradeAnalysis {
    const analysis: TradeAnalysis = {
      tradedDeaths: 0,
      untradedDeaths: 0,
      tradeTime: [],
    };

    const playerDeaths = deaths.filter(d => d.victimSteamId === playerSteamId);

    for (const death of playerDeaths) {
      // Check if the killer died shortly after (within 3 seconds = ~384 ticks at 128)
      const killerDiedAfter = deaths.find(
        d => d.victimSteamId === death.attackerSteamId &&
             d.round === death.round &&
             d.tick > death.tick &&
             d.tick < death.tick + 384
      );

      if (killerDiedAfter) {
        analysis.tradedDeaths++;
        analysis.tradeTime.push(killerDiedAfter.tick - death.tick);
      } else {
        analysis.untradedDeaths++;
      }
    }

    return analysis;
  }

  private analyzePositionQuality(deaths: KillEvent[], playerSteamId: string): PositionQuality {
    const quality: PositionQuality = {
      exposedDeaths: 0,
      coveredDeaths: 0,
      advantageousKills: 0,
      disadvantageousKills: 0,
    };

    for (const event of deaths) {
      if (event.victimSteamId === playerSteamId) {
        // Death analysis
        if (event.throughSmoke || event.penetrated || event.attackerBlind) {
          quality.exposedDeaths++; // These often indicate poor positioning
        } else {
          quality.coveredDeaths++;
        }
      } else if (event.attackerSteamId === playerSteamId) {
        // Kill analysis
        if (event.throughSmoke || event.noScope) {
          quality.advantageousKills++; // Skillful/advantageous kills
        } else if (event.attackerBlind) {
          quality.disadvantageousKills++;
        } else {
          quality.advantageousKills++;
        }
      }
    }

    return quality;
  }

  private calculateAggressionScore(
    playerPositions: Array<{ x: number; y: number; z: number } | undefined>,
    _mapName: string
  ): number {
    // Calculate average position relative to map center
    // Higher values for more aggressive positioning
    const validPositions = playerPositions.filter(p => p !== undefined) as Array<{ x: number; y: number; z: number }>;
    if (validPositions.length === 0) return 10;

    const avgY = validPositions.reduce((sum, p) => sum + p.y, 0) / validPositions.length;

    // For most maps, higher Y = more aggressive (T side pushing)
    // Normalize to 0-20 range
    return Math.min(20, Math.max(0, (avgY + 2000) / 200));
  }

  private calculateOverallScore(
    deathClusters: DeathCluster[],
    mapControlScore: number,
    mistakeCount: number,
    tradeAnalysis: TradeAnalysis,
    positionQuality: PositionQuality
  ): number {
    let score = mapControlScore * 0.4; // Map control is 40%

    // Death position penalty (up to -20)
    const badPositionCount = deathClusters.filter((d) => d.isBadPosition).length;
    score -= badPositionCount * 5;

    // Mistake penalty (up to -15)
    score -= Math.min(15, mistakeCount * 3);

    // Trade score bonus (up to +20)
    const totalDeaths = tradeAnalysis.tradedDeaths + tradeAnalysis.untradedDeaths;
    if (totalDeaths > 0) {
      const tradeRate = tradeAnalysis.tradedDeaths / totalDeaths;
      score += tradeRate * 20;
    }

    // Position quality bonus (up to +20)
    const totalKills = positionQuality.advantageousKills + positionQuality.disadvantageousKills;
    if (totalKills > 0) {
      const advantageRate = positionQuality.advantageousKills / totalKills;
      score += advantageRate * 20;
    }

    // Ensure minimum of 40% base
    return Math.max(0, Math.min(100, Math.round(score + 40)));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}